import { FileText, Search, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState } from "../../components/UI";

const initialForm = {
  subject: "",
  reason: "",
  notes: "",
  documents: [],
  estimatedDurationMinutes: "10",
  customEstimatedDuration: "",
};
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
  const [faculty, setFaculty] = useState(null);
  const [selected, setSelected] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [chosenSchedule, setChosenSchedule] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
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
  }, []);

  useEffect(() => {
    if (!chosenSchedule) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setChosenSchedule(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [chosenSchedule]);

  const viewAvailability = async (member) => {
    setSelected(member);
    setSchedules([]);
    setScheduleLoading(true);
    setMessage("");
    try {
      const data = await api(`/availability/faculty/${member._id}`);
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
    } catch {
      setMessage("Unable to load consultation information. Please try again.");
    } finally {
      setScheduleLoading(false);
    }
  };

  const visibleFaculty = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (faculty || []).filter((member) =>
      [member.name, member.department, member.specialization].some((value) =>
        value?.toLowerCase().includes(term),
      ),
    );
  }, [faculty, search]);

  const attach = (fileList) => {
    const incoming = Array.from(fileList || []);
    if (!incoming.length) return;
    const combined = [...form.documents, ...incoming];
    if (combined.length > 5)
      return setMessage("You may upload a maximum of 5 supporting files.");
    if (incoming.some((file) => file.size > MAX_FILE_SIZE))
      return setMessage("Each supporting file must be 10 MB or smaller.");
    if (
      incoming.some(
        (file) =>
          !allowedExtensions.has(file.name.split(".").pop()?.toLowerCase()),
      )
    )
      return setMessage("This file type is not supported.");
    if (combined.reduce((total, file) => total + file.size, 0) > MAX_TOTAL_SIZE)
      return setMessage("Supporting documents must not exceed 25 MB in total.");
    setMessage("");
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
    setSubmitting(true);
    setMessage("");
    try {
      const request = new FormData();
      request.append("subject", form.subject);
      request.append("reason", form.reason);
      request.append("notes", form.notes);
      request.append("availabilityId", chosenSchedule.availabilityId);
      const estimatedDuration =
        form.estimatedDurationMinutes === "custom"
          ? form.customEstimatedDuration
          : form.estimatedDurationMinutes;
      request.append("estimatedDurationMinutes", estimatedDuration);
      form.documents.forEach((file) => request.append("documents", file));
      const data = await api("/appointments", {
        method: "POST",
        body: request,
      });
      setChosenSchedule(null);
      setForm(initialForm);
      await viewAvailability(selected);
      await loadFaculty();
      setMessage(
        data.message || "Consultation request submitted successfully.",
      );
    } catch (requestError) {
      if (
        requestError.message ===
        "You already have an active consultation request for this faculty schedule."
      ) {
        setChosenSchedule(null);
        await viewAvailability(selected);
      }
      setMessage(requestError.message);
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
          Book Consultation
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Select a faculty member to view their consultation availability.
        </p>
      </div>
      {message && (
        <div className="rounded-xl border border-maroon-200 bg-white p-4 text-sm text-maroon-800">
          {message}
        </div>
      )}
      <label className="relative block max-w-xl">
        <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
        <input
          className="field pl-11"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search faculty name or specialization"
        />
      </label>
      {faculty === null ? (
        <p className="py-12 text-center font-semibold text-maroon-800">
          Loading faculty members...
        </p>
      ) : visibleFaculty.length === 0 ? (
        <EmptyState title="No approved faculty members are currently available." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleFaculty.map((member) => (
            <article
              key={member._id}
              className={`rounded-2xl border bg-white p-5 shadow-sm ${selected?._id === member._id ? "border-maroon-500" : "border-slate-200"}`}
            >
              <div className="flex gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-maroon-800 text-xl font-bold text-white">
                  {member.name?.[0] || "F"}
                </span>
                <div className="min-w-0">
                  <h2 className="font-bold text-slate-900">{member.name}</h2>
                  <p className="text-sm text-slate-600">
                    {member.department || "School of Computing"}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {member.designation || "Faculty Member"}
                  </p>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-sm text-slate-600">
                <p>{member.specialization || "General consultation"}</p>
                {member.office && <p>Office: {member.office}</p>}
                <p>
                  Modes:{" "}
                  {member.consultationModes?.join(", ") || "Not specified"}
                </p>
                <p className="font-semibold text-maroon-800">
                  Available consultation schedules:{" "}
                  {member.availableScheduleCount || 0}
                </p>
              </div>
              <button
                type="button"
                onClick={() => viewAvailability(member)}
                className="btn-secondary mt-5 w-full py-2"
              >
                View Availability
              </button>
            </article>
          ))}
        </div>
      )}
      {selected && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold text-maroon-900">{selected.name}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Available Consultation Schedules
          </p>
          {scheduleLoading ? (
            <p className="py-10 text-center text-sm font-semibold text-maroon-800">
              Loading consultation schedules...
            </p>
          ) : schedules.length === 0 ? (
            <EmptyState
              title="No consultation schedules are currently available for this faculty member."
              text="Please check again later."
            />
          ) : (
            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {schedules.map((schedule) => (
                <article
                  key={schedule._id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="font-bold">
                    {new Date(schedule.startAt).toLocaleDateString(undefined, {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm">
                    {time(schedule.startAt)} – {time(schedule.endAt)}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {schedule.mode} · {schedule.location}
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
                        setChosenSchedule(schedule);
                        const windowMinutes = Math.round(
                          (new Date(schedule.endAt) -
                            new Date(schedule.startAt)) /
                            60000,
                        );
                        const defaultEstimate = [10, 15, 20, 30, 45, 60].find(
                          (minutes) => minutes <= windowMinutes,
                        );
                        setForm({
                          ...initialForm,
                          estimatedDurationMinutes: defaultEstimate
                            ? String(defaultEstimate)
                            : "custom",
                          customEstimatedDuration: defaultEstimate ? "" : "5",
                        });
                      }}
                      className="btn-primary mt-4 w-full py-2"
                    >
                      Request Consultation
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
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
                    Book Consultation
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Faculty: {selected.name}
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
                    {chosenSchedule.mode} · {chosenSchedule.location}
                  </p>
                </div>
                <div className="mt-4 space-y-4">
                  <label className="block text-sm font-semibold">
                    Subject / Topic
                    <input
                      className="field mt-2"
                      required
                      maxLength="150"
                      value={form.subject}
                      onChange={(event) =>
                        setForm({ ...form, subject: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Reason for Consultation
                    <textarea
                      className="field mt-2 min-h-[100px] resize-y"
                      required
                      maxLength="1000"
                      value={form.reason}
                      onChange={(event) =>
                        setForm({ ...form, reason: event.target.value })
                      }
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Estimated Consultation Time
                    <select
                      className="field mt-2"
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
                  <label className="block text-sm font-semibold">
                    Supporting Documents{" "}
                    <span className="font-normal text-slate-500">
                      Optional · Up to 5 files · Maximum 10 MB per file · 25 MB
                      total
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
                  {message && (
                    <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                      {message}
                    </p>
                  )}
                  {form.documents.length > 0 && (
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
                    Optional Notes
                    <textarea
                      className="field mt-2 min-h-20 resize-y"
                      maxLength="1000"
                      value={form.notes}
                      onChange={(event) =>
                        setForm({ ...form, notes: event.target.value })
                      }
                    />
                  </label>
                </div>
              </div>
              <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setChosenSchedule(null)}
                >
                  Cancel
                </button>
                <button disabled={submitting} className="btn-primary">
                  {submitting ? "Submitting..." : "Submit Consultation Request"}
                </button>
              </footer>
            </form>
          </div>,
          document.body,
        )}
    </div>
  );
}
