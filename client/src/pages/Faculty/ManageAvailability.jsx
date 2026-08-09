import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading } from "../../components/UI";

const emptyForm = {
  date: "",
  startTime: "",
  endTime: "",
  mode: "Face-to-Face",
  location: "",
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
  const [availability, setAvailability] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
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
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId("");
    setFormError("");
  };

  const save = async (event) => {
    event.preventDefault();
    setMessage("");
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
            location:
              form.location.trim() ||
              (form.mode === "Online" ? "Online consultation" : ""),
          }),
        },
      );
      await load();
      resetForm();
      setMessage(data.message);
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const edit = (item) => {
    const start = localParts(item.startAt);
    const end = localParts(item.endAt);
    setEditingId(item._id);
    setForm({
      date: start.date,
      startTime: start.time,
      endTime: end.time,
      mode: item.mode || "Online",
      location: item.location || "",
    });
    setMessage("");
    setFormError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggle = async (item) => {
    try {
      const data = await api(`/availability/${item._id}`, {
        method: "PUT",
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      setMessage(data.message);
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Remove this consultation availability?")) return;
    try {
      const data = await api(`/availability/${id}`, { method: "DELETE" });
      setMessage(data.message);
      await load();
    } catch (requestError) {
      setFormError(requestError.message);
    }
  };

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!availability) return <Loading />;

  const locationLabel =
    form.mode === "Online" ? "Meeting Platform / Link" : "Location";
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-maroon-900">
          Manage Consultation Availability
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Publish the schedules Students can select when booking.
        </p>
        {message && (
          <p className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            {message}
          </p>
        )}
        {formError && (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            {formError}
          </p>
        )}
        <form
          onSubmit={save}
          className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
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
          <Field label="Consultation Mode">
            <select
              className="field mt-2"
              value={form.mode}
              onChange={(event) =>
                setForm({ ...form, mode: event.target.value })
              }
            >
              <option value="Face-to-Face">Face-to-Face</option>
              <option value="Online">Online</option>
            </select>
          </Field>
          <Field label={locationLabel}>
            <input
              className="field mt-2"
              required={form.mode === "Face-to-Face"}
              placeholder={
                form.mode === "Online"
                  ? "Google Meet / Microsoft Teams"
                  : "SJH Building - Room 204"
              }
              value={form.location}
              onChange={(event) =>
                setForm({ ...form, location: event.target.value })
              }
            />
          </Field>
          <div className="flex items-end gap-3 md:col-span-2 xl:col-span-3">
            <button
              disabled={saving}
              className="btn-primary min-w-48 disabled:cursor-not-allowed disabled:opacity-60"
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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="font-bold text-maroon-900">
        {new Date(item.startAt).toLocaleDateString(undefined, dateOptions)}
      </p>
      <p className="mt-1 text-sm font-semibold text-slate-700">
        Available Time:{" "}
        {new Date(item.startAt).toLocaleTimeString([], timeOptions)} –{" "}
        {new Date(item.endAt).toLocaleTimeString([], timeOptions)}
      </p>
      <p className="mt-3 text-sm text-slate-600">{item.mode || "Online"}</p>
      <p className="mt-1 break-words text-sm text-slate-500">{item.location}</p>
      <p
        className={`mt-3 text-xs font-bold ${item.isActive ? "text-green-700" : "text-slate-500"}`}
      >
        Status: {item.isActive ? "Active" : "Inactive"}
      </p>
      <div className="mt-4 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={() => onEdit(item)}
          className="text-sm font-bold text-blue-700"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onToggle(item)}
          className="text-sm font-bold text-maroon-800"
        >
          {item.isActive ? "Deactivate" : "Activate"}
        </button>
        <button
          type="button"
          onClick={() => onRemove(item._id)}
          className="text-sm font-bold text-red-700"
        >
          Remove
        </button>
      </div>
    </article>
  );
}

function Field({ label, children }) {
  return (
    <label className="block text-sm font-semibold text-slate-700">
      {label}
      {children}
    </label>
  );
}
