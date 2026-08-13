import { CheckCircle2, FileText, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import ProfileImagePreview from "../../components/profile/ProfileImagePreview";
import { useLocation, useNavigate } from "react-router-dom";
import { formatPersonName } from "../../utils/formatPersonName";

const YEAR_LEVELS = [
  "1st Year",
  "2nd Year",
  "3rd Year",
  "4th Year",
  "5th Year",
];
const initialForm = (yearLevel = "") => ({
  subject: "",
  reason: "",
  yearLevel: YEAR_LEVELS.includes(yearLevel) ? yearLevel : "",
  documents: [],
  estimatedDurationMinutes: "10",
  customEstimatedDuration: "",
});
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_TOTAL_SIZE = 25 * 1024 * 1024;
const allowedExtensions = new Set([
  "jpg",
  "jpeg",
  "png",
  "webp",
  "gif",
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "ppt",
  "pptx",
  "txt",
  "csv",
  "mp4",
  "webm",
]);
const formatSize = (bytes) =>
  bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
const time = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

export default function BookPage() {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const reschedule = location.state?.rescheduleAppointment || null;
  const availabilityRequest = useRef(0);
  const scheduleCache = useRef(new Map());
  const rescheduleInitialized = useRef(false);
  const [faculty, setFaculty] = useState(null);
  const [selected, setSelected] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const [chosenSchedule, setChosenSchedule] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(() => initialForm(user.yearLevel));
  const [formError, setFormError] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadFaculty = () => {
    setError("");
    return api("/availability/faculty")
      .then((data) =>
        setFaculty(Array.isArray(data?.faculty) ? data.faculty : []),
      )
      .catch(() =>
        setError("Unable to load consultation information. Please try again."),
      );
  };
  useEffect(() => {
    void loadFaculty();
    const refresh = () => void loadFaculty();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  useEffect(() => {
    if (!chosenSchedule && !availabilityOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key !== "Escape") return;
      if (chosenSchedule) setChosenSchedule(null);
      else setAvailabilityOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [availabilityOpen, chosenSchedule]);

  const viewAvailability = async (member) => {
    const requestId = ++availabilityRequest.current;
    setSelected(member);
    setAvailabilityOpen(true);
    setFormError("");
    const cached = scheduleCache.current.get(String(member._id));
    if (cached) {
      setSchedules(cached);
      setScheduleLoading(false);
      return;
    }
    setSchedules([]);
    setScheduleLoading(true);
    try {
      const data = await api(`/availability/faculty/${member._id}`);
      if (requestId === availabilityRequest.current) {
        const loaded = Array.isArray(data?.schedules) ? data.schedules : [];
        const validSchedules = reschedule
          ? loaded.filter(
              (slot) =>
                String(slot.availabilityId || slot._id) !==
                String(reschedule.currentAvailabilityId),
            )
          : loaded;
        scheduleCache.current.set(String(member._id), validSchedules);
        setSchedules(validSchedules);
      }
    } catch {
      if (requestId === availabilityRequest.current)
        toast.error("Unable to load available schedules. Please try again.");
    } finally {
      if (requestId === availabilityRequest.current) setScheduleLoading(false);
    }
  };

  useEffect(() => {
    if (!reschedule || !faculty || rescheduleInitialized.current) return;
    const originalFaculty = faculty.find(
      (member) => String(member._id) === String(reschedule.facultyId),
    );
    if (!originalFaculty) return;
    rescheduleInitialized.current = true;
    const estimate = Number(reschedule.estimatedDurationMinutes) || 10;
    const standardEstimate = [10, 15, 20, 30, 45, 60].includes(estimate);
    setForm({
      ...initialForm(reschedule.yearLevel || user.yearLevel),
      subject: reschedule.subject || "",
      reason: reschedule.reason || "",
      estimatedDurationMinutes: standardEstimate ? String(estimate) : "custom",
      customEstimatedDuration: standardEstimate ? "" : String(estimate),
    });
    void viewAvailability(originalFaculty);
  }, [faculty, reschedule, user.yearLevel]);

  const visibleFaculty = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (faculty || []).filter((member) =>
      [member.name, member.position, member.specialization].some((value) =>
        value?.toLowerCase().includes(term),
      ),
    );
  }, [faculty, search]);

  const attach = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const combined = [...form.documents, ...incoming];
    if (combined.length > 5)
      return setFormError("You can upload up to 5 supporting files.");
    if (incoming.some((file) => file.size > MAX_FILE_SIZE))
      return setFormError("Each supporting file must be 10 MB or smaller.");
    if (
      incoming.some(
        (file) =>
          !allowedExtensions.has(file.name.split(".").pop()?.toLowerCase()),
      )
    )
      return setFormError("This file type is not supported.");
    if (combined.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE)
      return setFormError(
        "Supporting documents must not exceed 25 MB in total.",
      );
    setFormError("");
    setForm({ ...form, documents: combined });
  };

  const removeDocument = (index) =>
    setForm({
      ...form,
      documents: form.documents.filter((_, itemIndex) => itemIndex !== index),
    });

  const submit = async (event) => {
    event.preventDefault();
    if (!selected || !chosenSchedule) return;
    if (!YEAR_LEVELS.includes(form.yearLevel)) {
      setFormError("Please select your year level.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const request = new FormData();
      request.append("subject", form.subject);
      request.append("reason", form.reason);
      request.append("yearLevel", form.yearLevel);
      request.append("availabilityId", chosenSchedule.availabilityId);
      const estimatedDuration =
        form.estimatedDurationMinutes === "custom"
          ? form.customEstimatedDuration
          : form.estimatedDurationMinutes;
      request.append("estimatedDurationMinutes", estimatedDuration);
      form.documents.forEach((file) => request.append("documents", file));
      const data = reschedule
        ? await api(`/appointments/${reschedule.appointmentId}/reschedule`, {
            method: "PUT",
            body: JSON.stringify({
              availabilityId: chosenSchedule.availabilityId,
            }),
          })
        : await api("/appointments", { method: "POST", body: request });
      if (reschedule) {
        toast.success(data.message || "New schedule submitted successfully.");
        navigate("/student/appointments", { replace: true, state: {} });
        return;
      }
      setChosenSchedule(null);
      setForm(initialForm(user.yearLevel));
      scheduleCache.current.delete(String(selected._id));
      await loadFaculty();
      toast.success(
        data.message || "Consultation request submitted successfully.",
      );
    } catch (requestError) {
      if (
        requestError.message ===
        "You already have an active consultation request for this faculty schedule."
      ) {
        setChosenSchedule(null);
        scheduleCache.current.delete(String(selected._id));
        await viewAvailability(selected);
      }
      toast.error(
        requestError.message ||
          (reschedule
            ? "Unable to submit the new schedule. Please try again."
            : "Unable to book the consultation. Please try again."),
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (error) return <ErrorState message={error} onRetry={loadFaculty} />;
  const availabilityMinutes = chosenSchedule
    ? Math.round(
        (new Date(chosenSchedule.endAt) - new Date(chosenSchedule.startAt)) /
          60000,
      )
    : 0;
  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">
          {reschedule ? "Choose a New Schedule" : "Book Consultation"}
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          {reschedule
            ? "Select a new schedule for your existing consultation."
            : "Select a faculty member to view their consultation availability."}
        </p>
        {reschedule && (
          <button
            type="button"
            onClick={() => navigate("/student/appointments")}
            className="mt-3 text-sm font-bold text-maroon-800 hover:underline"
          >
            Back to My Appointments
          </button>
        )}
      </div>
      <label className="relative block w-full min-w-0 max-w-xl">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
        <input
          className="field pl-11"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search faculty name, position, or specialization"
        />
      </label>
      {faculty === null ? (
        <p className="py-12 text-center font-semibold text-maroon-800">
          Loading faculty members...
        </p>
      ) : visibleFaculty.length === 0 ? (
        <EmptyState title="No approved faculty members are currently available." />
      ) : (
        <div className="space-y-3">
          {visibleFaculty.map((member) => (
            <article
              key={member._id}
              role="button"
              tabIndex={0}
              aria-pressed={selected?._id === member._id}
              onClick={() => void viewAvailability(member)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  void viewAvailability(member);
                }
              }}
              className={`w-full min-w-0 cursor-pointer rounded-2xl border p-4 shadow-sm transition hover:border-maroon-300 hover:bg-maroon-50/30 focus:outline-none focus:ring-2 focus:ring-maroon-400 sm:flex sm:items-center sm:gap-4 ${selected?._id === member._id ? "border-maroon-500 bg-maroon-50/60" : "border-slate-200 bg-white"}`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
                <span
                  className="shrink-0"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <ProfileImagePreview
                    user={member}
                    className="h-12 w-12 rounded-full bg-maroon-800 text-lg font-bold text-white sm:h-14 sm:w-14"
                    buttonClassName="rounded-full"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="break-words font-bold text-slate-900">
                      {formatPersonName(member.name)}
                    </h2>
                    {selected?._id === member._id && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-maroon-800">
                        <CheckCircle2 size={15} /> Selected
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {member.position || "Position not provided"}
                  </p>
                  {member.specialization && (
                    <p className="mt-1 break-words text-sm text-slate-600">
                      {member.specialization}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-3 flex min-w-0 items-center justify-between gap-3 sm:mt-0 sm:shrink-0 sm:justify-end">
                <p className="text-sm font-semibold text-maroon-800">
                  {member.availableScheduleCount || 0} available{" "}
                  {(member.availableScheduleCount || 0) === 1
                    ? "schedule"
                    : "schedules"}
                </p>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void viewAvailability(member);
                  }}
                  className="btn-secondary shrink-0 py-2"
                >
                  View Schedule
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selected &&
        availabilityOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/50 p-3 sm:p-4"
            onMouseDown={(event) =>
              event.target === event.currentTarget && setAvailabilityOpen(false)
            }
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="faculty-availability-title"
              onMouseDown={(event) => event.stopPropagation()}
              className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl"
            >
              <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <ProfileImagePreview
                    user={selected}
                    className="h-12 w-12 shrink-0 rounded-full bg-maroon-800 text-lg font-bold text-white sm:h-14 sm:w-14"
                    buttonClassName="shrink-0 rounded-full"
                  />
                  <div className="min-w-0">
                    <h2
                      id="faculty-availability-title"
                      className="text-xl font-bold text-maroon-900"
                    >
                      Available Schedules
                    </h2>
                    <p className="mt-1 break-words font-bold text-slate-900">
                      {formatPersonName(selected.name)}
                    </p>
                    <p className="break-words text-sm text-slate-600">
                      {selected.position || "Position not provided"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  aria-label="Close faculty availability"
                  onClick={() => setAvailabilityOpen(false)}
                  autoFocus
                  className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X />
                </button>
              </header>
              <div className="px-5 py-5 sm:px-6">
                <p className="mb-5 text-sm text-slate-600">
                  Select an available consultation schedule.
                </p>
                {(selected.specialization ||
                  selected.office ||
                  selected.consultationModes?.length) && (
                  <dl className="mb-6 grid gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm sm:grid-cols-2">
                    {selected.specialization && (
                      <div>
                        <dt className="font-semibold text-slate-500">
                          Specialization
                        </dt>
                        <dd className="mt-1 text-slate-800">
                          {selected.specialization}
                        </dd>
                      </div>
                    )}
                    {selected.office && (
                      <div>
                        <dt className="font-semibold text-slate-500">Office</dt>
                        <dd className="mt-1 text-slate-800">
                          {selected.office}
                        </dd>
                      </div>
                    )}
                    {selected.consultationModes?.length > 0 && (
                      <div>
                        <dt className="font-semibold text-slate-500">
                          Consultation Mode
                        </dt>
                        <dd className="mt-1 text-slate-800">
                          {selected.consultationModes.join(", ")}
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                {scheduleLoading ? (
                  <p className="py-10 text-center text-sm font-semibold text-maroon-800">
                    Loading consultation schedules...
                  </p>
                ) : schedules.length === 0 ? (
                  <EmptyState
                    title="No available consultation schedules."
                    text="This Faculty member has not published an available schedule yet."
                  />
                ) : (
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {schedules.map((schedule) => (
                      <article
                        key={schedule._id}
                        className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                      >
                        <p className="font-bold">
                          {new Date(schedule.startAt).toLocaleDateString(
                            undefined,
                            {
                              weekday: "long",
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                            },
                          )}
                        </p>
                        <p className="mt-1 text-sm">
                          {time(schedule.startAt)} – {time(schedule.endAt)}
                        </p>
                        <p className="mt-2 text-sm text-slate-600">
                          {schedule.mode} ·{" "}
                          {schedule.mode === "Online"
                            ? schedule.meetingPlatform ||
                              "Meeting platform not provided"
                            : schedule.location || "Location not provided"}
                        </p>
                        {schedule.hasActiveRequest ? (
                          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-3 text-center">
                            <p className="font-bold text-green-800">
                              {schedule.requestStatus === "Approved"
                                ? "✓ Consultation Approved"
                                : schedule.requestStatus === "Rescheduled"
                                  ? "✓ Consultation Rescheduled"
                                  : "✓ Request Already Sent"}
                            </p>
                            <p className="mt-1 text-sm text-green-700">
                              Status: {schedule.requestStatus}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setAvailabilityOpen(false);
                              setChosenSchedule(schedule);
                              const windowMinutes = Math.round(
                                (new Date(schedule.endAt) -
                                  new Date(schedule.startAt)) /
                                  60000,
                              );
                              const defaultEstimate = [
                                10, 15, 20, 30, 45, 60,
                              ].find((minutes) => minutes <= windowMinutes);
                              setForm({
                                ...initialForm(user.yearLevel),
                                estimatedDurationMinutes: defaultEstimate
                                  ? String(defaultEstimate)
                                  : "custom",
                                customEstimatedDuration: defaultEstimate
                                  ? ""
                                  : "5",
                              });
                            }}
                            className="btn-primary mt-4 w-full py-2"
                          >
                            Select Schedule
                          </button>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          </div>,
          document.body,
        )}
      {chosenSchedule &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center overflow-hidden bg-black/50 p-4"
            onMouseDown={(event) =>
              event.target === event.currentTarget && setChosenSchedule(null)
            }
          >
            <form
              onSubmit={submit}
              role="dialog"
              aria-modal="true"
              aria-labelledby="booking-modal-title"
              onMouseDown={(event) => event.stopPropagation()}
              className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
                <div>
                  <h2
                    id="booking-modal-title"
                    className="text-xl font-bold text-maroon-900"
                  >
                    {reschedule ? "Choose a New Schedule" : "Book Consultation"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Faculty: {formatPersonName(selected.name)}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setChosenSchedule(null)}
                  autoFocus
                  className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                >
                  <X />
                </button>
              </header>
              <div className="px-5 py-4 sm:px-6">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">
                    {new Date(chosenSchedule.startAt).toLocaleDateString(
                      undefined,
                      {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      },
                    )}
                  </p>
                  <p>
                    {time(chosenSchedule.startAt)} –{" "}
                    {time(chosenSchedule.endAt)}
                  </p>
                  <p className="mt-1">
                    {chosenSchedule.mode} ·{" "}
                    {chosenSchedule.mode === "Online"
                      ? chosenSchedule.meetingPlatform ||
                        "Meeting platform not provided"
                      : chosenSchedule.location || "Location not provided"}
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold">
                    Subject / Topic
                    <input
                      className="field mt-2"
                      required
                      disabled={Boolean(reschedule)}
                      maxLength="150"
                      value={form.subject}
                      onChange={(event) =>
                        setForm({ ...form, subject: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Year Level
                    <select
                      className="field mt-2 w-full"
                      required
                      disabled={Boolean(reschedule)}
                      value={form.yearLevel}
                      onChange={(event) =>
                        setForm({ ...form, yearLevel: event.target.value })
                      }
                    >
                      <option value="">Select year level</option>
                      {YEAR_LEVELS.map((yearLevel) => (
                        <option key={yearLevel} value={yearLevel}>
                          {yearLevel}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    Estimated Consultation Time
                    <select
                      className="field mt-2"
                      disabled={Boolean(reschedule)}
                      value={form.estimatedDurationMinutes}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          estimatedDurationMinutes: event.target.value,
                        })
                      }
                    >
                      {[10, 15, 20, 30, 45, 60].map((minutes) => (
                        <option
                          key={minutes}
                          value={minutes}
                          disabled={minutes > availabilityMinutes}
                        >
                          {minutes} minutes
                        </option>
                      ))}
                      <option value="custom">Custom</option>
                    </select>
                  </label>
                  {form.estimatedDurationMinutes === "custom" && (
                    <label className="block text-sm font-semibold">
                      Custom Estimated Time (minutes)
                      <input
                        className="field mt-2"
                        type="number"
                        min="5"
                        max={availabilityMinutes}
                        required
                        disabled={Boolean(reschedule)}
                        value={form.customEstimatedDuration}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            customEstimatedDuration: event.target.value,
                          })
                        }
                      />
                      <span className="mt-1 block text-xs font-normal text-slate-500">
                        Minimum 5 minutes · Maximum {availabilityMinutes}{" "}
                        minutes
                      </span>
                    </label>
                  )}
                  {reschedule && (
                    <p className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                      Existing consultation details and supporting documents
                      will be preserved.
                    </p>
                  )}
                  {!reschedule && (
                    <label className="block text-sm font-semibold">
                      Supporting Documents{" "}
                      <span className="font-normal text-slate-500">
                        Optional · Up to 5 files · Maximum 10 MB per file · 25
                        MB total
                      </span>
                      <input
                        className="field mt-2"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.mp4,.webm"
                        onChange={(event) => {
                          attach(event.target.files);
                          event.target.value = "";
                        }}
                      />
                    </label>
                  )}
                  {formError && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {formError}
                    </p>
                  )}
                  {!reschedule && form.documents.length > 0 && (
                    <div className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 p-3">
                      {form.documents.map((file, index) => (
                        <div
                          key={`${file.name}-${file.lastModified}-${index}`}
                          className="flex items-center gap-3 text-sm"
                        >
                          <FileText
                            size={18}
                            className="shrink-0 text-maroon-700"
                          />
                          <span
                            className="min-w-0 flex-1 truncate"
                            title={file.name}
                          >
                            {file.name}
                          </span>
                          <span className="shrink-0 text-xs text-slate-500">
                            {formatSize(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDocument(index)}
                            aria-label={`Remove ${file.name}`}
                            className="shrink-0 rounded p-1 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      ))}
                      <p className="border-t border-slate-200 pt-2 text-right text-xs font-semibold text-slate-600">
                        Total:{" "}
                        {formatSize(
                          form.documents.reduce(
                            (total, file) => total + file.size,
                            0,
                          ),
                        )}{" "}
                        / 25 MB
                      </p>
                    </div>
                  )}
                  <label className="block text-sm font-semibold">
                    Reason for Consultation
                    <textarea
                      className="field mt-2 min-h-[100px] resize-y"
                      required
                      disabled={Boolean(reschedule)}
                      maxLength="1000"
                      placeholder="Briefly describe why you are requesting this consultation."
                      value={form.reason}
                      onChange={(event) =>
                        setForm({ ...form, reason: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
              <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-4 py-4 [&>button]:w-full sm:flex-row sm:justify-end sm:px-6 sm:[&>button]:w-auto">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setChosenSchedule(null)}
                >
                  Cancel
                </button>
                <button disabled={submitting} className="btn-primary">
                  {submitting
                    ? "Submitting..."
                    : reschedule
                      ? "Submit New Schedule"
                      : "Submit Consultation Request"}
                </button>
              </footer>
            </form>
          </div>,
          document.body,
        )}
    </div>
  );
}
