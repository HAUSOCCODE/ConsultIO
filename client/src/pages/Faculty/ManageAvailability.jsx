import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import {
  EmptyState,
  ErrorState,
  Loading,
  StatusBadge,
} from "../../components/UI";
import { useToast } from "../../context/ToastContext";

const emptyForm = {
  date: "",
  startTime: "",
  endTime: "",
  mode: "Face-to-Face",
  location: "",
  meetingPlatform: "Google Meet",
  customMeetingPlatform: "",
  meetingLink: "",
};

const meetingPlatforms = ["Google Meet", "Microsoft Teams", "Zoom", "Other"];

const validMeetingLink = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const localParts = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` };
};

const toTimestamp = (date, time) =>
  new Date(`${date}T${time}:00`).toISOString();

export default function ManageAvailability() {
  const toast = useToast();
  const showRequestError = (error, fallback) => {
    const message = error?.message || fallback;
    if (/overlap|conflict|cannot be removed|active consultation/i.test(message))
      toast.warning(message);
    else toast.error(message);
  };
  const [availability, setAvailability] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [formError, setFormError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const data = await api("/availability/mine");
      setAvailability(
        Array.isArray(data?.availability) ? data.availability : [],
      );
      setLoadError("");
    } catch {
      setLoadError("Unable to load availability. Please try again.");
    }
  };

  useEffect(() => {
    void load();
    const refresh = () => void load();
    const interval = window.setInterval(refresh, 20000);
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setFormError("");
    const start = new Date(`${form.date}T${form.startTime}:00`);
    const end = new Date(`${form.date}T${form.endTime}:00`);
    if (
      !form.date ||
      !form.startTime ||
      !form.endTime ||
      !Number.isFinite(start.getTime()) ||
      !Number.isFinite(end.getTime())
    ) {
      setFormError(
        "Select a valid availability date, start time, and end time.",
      );
      return;
    }
    if (end <= start) {
      setFormError("End time must be later than start time.");
      return;
    }
    if (start <= new Date()) {
      setFormError("Start time must be later than the current time.");
      return;
    }
    const meetingPlatform =
      form.meetingPlatform === "Other"
        ? form.customMeetingPlatform.trim()
        : form.meetingPlatform;
    if (form.mode === "Face-to-Face" && !form.location.trim()) {
      setFormError("Location is required for face-to-face availability.");
      return;
    }
    if (form.mode === "Online" && !meetingPlatform) {
      setFormError("Meeting platform is required for online availability.");
      return;
    }
    if (
      form.mode === "Online" &&
      form.meetingLink.trim() &&
      !validMeetingLink(form.meetingLink.trim())
    ) {
      setFormError("Please enter a valid meeting link.");
      return;
    }
    setSaving(true);
    try {
      const data = await api(
        editingId ? `/availability/${editingId}` : "/availability",
        {
          method: editingId ? "PUT" : "POST",
          body: JSON.stringify({
            startAt: toTimestamp(form.date, form.startTime),
            endAt: toTimestamp(form.date, form.endTime),
            mode: form.mode,
            location: form.mode === "Face-to-Face" ? form.location.trim() : "",
            meetingPlatform: form.mode === "Online" ? meetingPlatform : "",
            meetingLink: form.mode === "Online" ? form.meetingLink.trim() : "",
          }),
        },
      );
      await load();
      resetForm();
      toast.success(data.message);
    } catch (requestError) {
      showRequestError(requestError, "Unable to save availability.");
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    const start = localParts(item.startAt);
    const end = localParts(item.endAt);
    setEditingId(item._id);
    const platform = item.meetingPlatform || "";
    const knownPlatform = meetingPlatforms.includes(platform);
    setForm({
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      mode: item.mode || "Online",
      location: item.location || "",
      meetingPlatform: knownPlatform
        ? platform
        : platform
          ? "Other"
          : "Google Meet",
      customMeetingPlatform: knownPlatform ? "" : platform,
      meetingLink: item.meetingLink || "",
    });
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (item) => {
    try {
      const data = await api(`/availability/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      toast.success(data.message);
      await load();
    } catch (requestError) {
      showRequestError(requestError, "Unable to update availability.");
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this consultation availability?")) return;
    try {
      const data = await api(`/availability/${id}`, { method: "DELETE" });
      toast.success(data.message);
      await load();
    } catch (requestError) {
      showRequestError(requestError, "Unable to remove availability.");
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!availability) return <Loading />;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <section className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:p-6">
        <h1 className="text-xl font-bold text-maroon-900">
          Manage Consultation Availability
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Publish the schedules Students can select when booking.
        </p>
        {formError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        )}
        <form onSubmit={save} className="mt-6 min-w-0 max-w-full space-y-4">
          <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Availability Date">
              <input
                className="field mt-2"
                type="date"
                required
                value={form.date}
                onChange={(event) =>
                  setForm({ ...form, date: event.target.value })
                }
              />
            </Field>
            <Field label="Start Time">
              <input
                className="field mt-2"
                type="time"
                step="60"
                required
                value={form.startTime}
                onChange={(event) =>
                  setForm({ ...form, startTime: event.target.value })
                }
              />
            </Field>
            <Field label="End Time">
              <input
                className="field mt-2"
                type="time"
                step="60"
                required
                value={form.endTime}
                onChange={(event) =>
                  setForm({ ...form, endTime: event.target.value })
                }
              />
            </Field>
          </div>
          <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Consultation Mode">
              <select
                className="field mt-2"
                value={form.mode}
                onChange={(event) => {
                  const mode = event.target.value;
                  setForm({
                    ...form,
                    mode,
                    location: mode === "Face-to-Face" ? form.location : "",
                    meetingPlatform:
                      mode === "Online"
                        ? form.meetingPlatform || "Google Meet"
                        : "Google Meet",
                    customMeetingPlatform:
                      mode === "Online" ? form.customMeetingPlatform : "",
                    meetingLink: mode === "Online" ? form.meetingLink : "",
                  });
                  setFormError("");
                }}
              >
                <option value="Face-to-Face">Face-to-Face</option>
                <option value="Online">Online</option>
              </select>
            </Field>
            {form.mode === "Face-to-Face" ? (
              <Field label="Location">
                <input
                  className="field mt-2"
                  required
                  placeholder="SJH Building - Room 104"
                  value={form.location}
                  onChange={(event) =>
                    setForm({ ...form, location: event.target.value })
                  }
                />
              </Field>
            ) : (
              <>
                <Field label="Meeting Platform">
                  <select
                    className="field mt-2"
                    required
                    value={form.meetingPlatform}
                    onChange={(event) => {
                      setForm({
                        ...form,
                        meetingPlatform: event.target.value,
                        customMeetingPlatform:
                          event.target.value === "Other"
                            ? form.customMeetingPlatform
                            : "",
                      });
                      setFormError("");
                    }}
                  >
                    {meetingPlatforms.map((platform) => (
                      <option key={platform} value={platform}>
                        {platform}
                      </option>
                    ))}
                  </select>
                </Field>
                {form.meetingPlatform === "Other" && (
                  <Field label="Platform Name">
                    <input
                      className="field mt-2"
                      required
                      placeholder="Enter meeting platform"
                      value={form.customMeetingPlatform}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          customMeetingPlatform: event.target.value,
                        })
                      }
                    />
                  </Field>
                )}
                <Field label="Meeting Link">
                  <input
                    className="field mt-2"
                    type="url"
                    placeholder="https://meet.google.com/abc-defg-hij"
                    value={form.meetingLink}
                    onChange={(event) =>
                      setForm({ ...form, meetingLink: event.target.value })
                    }
                  />
                </Field>
              </>
            )}
          </div>
          <div className="flex min-w-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <button
              disabled={saving}
              className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-48"
            >
              {saving
                ? "Saving..."
                : editingId
                  ? "Update Availability"
                  : "Add Availability"}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn-secondary"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-bold">Published Schedules</h2>
        {availability.length === 0 ? (
          <EmptyState
            title="No availability published"
            text="Add your first consultation availability using the form above."
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,28rem),1fr))] gap-4">
            {availability.map((item) => (
              <ScheduleCard
                key={item._id}
                item={item}
                onEdit={edit}
                onToggle={toggle}
                onRemove={remove}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function ScheduleCard({ item, onEdit, onToggle, onRemove }) {
  const dateOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  const timeOptions = { hour: "numeric", minute: "2-digit" };
  const expired = item.status === "expired";
  const statusLabel = expired
    ? "Expired"
    : item.isActive
      ? "Active"
      : "Inactive";
  return (
    <article className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="font-bold text-maroon-900">
        {new Date(item.startAt).toLocaleDateString(undefined, dateOptions)}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">
        Available Time:{" "}
        {new Date(item.startAt).toLocaleTimeString([], timeOptions)} –{" "}
        {new Date(item.endAt).toLocaleTimeString([], timeOptions)}
      </p>
      <p className="mt-3 text-sm text-slate-600">{item.mode || "Online"}</p>
      <p className="mt-1 break-words text-sm text-slate-500">
        {item.mode === "Online"
          ? item.meetingPlatform || "Meeting platform not provided"
          : item.location || "Location not provided"}
      </p>
      <div className="mt-3 flex items-center gap-2">
        <span className="text-xs font-bold text-slate-500">Status:</span>
        <StatusBadge status={statusLabel} />
      </div>
      <div className="mt-4 flex min-w-0 flex-wrap gap-2">
        {!expired && (
          <>
            <button
              type="button"
              onClick={() => onEdit(item)}
              className="btn-action-sm"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => onToggle(item)}
              className="btn-action-sm"
            >
              {item.isActive ? "Deactivate" : "Activate"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onRemove(item._id)}
          className="btn-danger-action-sm"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="block w-full min-w-0 max-w-full text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
