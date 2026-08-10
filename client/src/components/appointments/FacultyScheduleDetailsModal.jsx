import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { EmptyState, StatusBadge } from "../UI";
import FacultyAppointmentDetailsModal from "./FacultyAppointmentDetailsModal";

const date = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
const time = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

export default function FacultyScheduleDetailsModal({
  details,
  loading,
  error,
  onClose,
  onRetry,
  onReschedule,
}) {
  const [appointmentDetails, setAppointmentDetails] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const previous = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !appointmentDetails && !rescheduleTarget)
        onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [appointmentDetails, onClose, rescheduleTarget]);

  const schedule = details?.schedule;
  const students = details?.approvedStudents || [];
  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex h-[100dvh] w-screen items-center justify-center bg-black/50 p-3 sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="schedule-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2 id="schedule-details-title" className="text-xl font-bold text-maroon-900">
              Schedule Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Review this schedule and its approved students.
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close schedule details" className="rounded-lg p-1 text-slate-500 hover:bg-slate-100">
            <X />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          {loading && <p className="py-10 text-center text-sm font-semibold text-maroon-800">Loading schedule and approved students...</p>}
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{error}</p>
              <button type="button" onClick={onRetry} className="btn-secondary mt-3">Try again</button>
            </div>
          )}
          {schedule && (
            <>
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <Detail label="Date" value={date(schedule.startAt)} />
                  <Detail label="Start Time" value={time(schedule.startAt)} />
                  <Detail label="End Time" value={time(schedule.endAt)} />
                  <Detail label="Consultation Mode" value={schedule.mode} />
                  <Detail
                    label="Location / Meeting Link"
                    value={schedule.mode === "Online" ? schedule.meetingLink || schedule.meetingPlatform : schedule.location}
                    link={schedule.mode === "Online" && schedule.meetingLink}
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Schedule Status</p>
                    <div className="mt-1"><StatusBadge status={schedule.isActive ? "Active" : "Inactive"} /></div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-bold text-maroon-900">Approved Students ({students.length})</h3>
                {students.length === 0 ? (
                  <div className="mt-4">
                    <EmptyState title="No approved students are currently assigned to this schedule." text="Approved appointments for this exact schedule will appear here." />
                  </div>
                ) : (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    {students.map((appointment) => (
                      <article key={appointment._id} className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="break-words font-bold text-slate-900">{appointment.student?.name || "Student"}</h4>
                            <p className="break-all text-sm text-slate-500">{appointment.student?.email || "Email not provided"}</p>
                          </div>
                          <StatusBadge status={appointment.status} />
                        </div>
                        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                          <Detail label="Appointment Date" value={date(appointment.startAt)} />
                          <Detail label="Appointment Time" value={`${time(appointment.startAt)} – ${time(appointment.endAt)}`} />
                          <Detail label="Consultation Mode" value={appointment.consultationMode} />
                          <Detail label="Reason / Purpose" value={appointment.reason} />
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button type="button" onClick={() => setAppointmentDetails(appointment)} className="btn-secondary">View Appointment</button>
                          <button type="button" onClick={() => setRescheduleTarget(appointment)} className="rounded-lg border border-amber-300 px-4 py-2 text-sm font-bold text-amber-800 hover:bg-amber-50">Reschedule</button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <footer className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white px-4 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-secondary w-full sm:w-auto">Close</button>
        </footer>
      </section>

      {appointmentDetails && <FacultyAppointmentDetailsModal appointment={appointmentDetails} onClose={() => setAppointmentDetails(null)} />}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/55 p-4" onMouseDown={(event) => event.target === event.currentTarget && !submitting && setRescheduleTarget(null)}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="faculty-reschedule-title" onMouseDown={(event) => event.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="faculty-reschedule-title" className="text-xl font-bold text-maroon-900">Reschedule Student?</h2>
            <p className="mt-3 break-words text-sm text-slate-600">
              {rescheduleTarget.student?.name || "This student"} will be removed from this schedule and will need to select another available consultation schedule. The appointment record will be preserved.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" disabled={submitting} onClick={() => setRescheduleTarget(null)} className="btn-secondary">Cancel</button>
              <button
                type="button"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  const succeeded = await onReschedule(rescheduleTarget);
                  setSubmitting(false);
                  if (succeeded) setRescheduleTarget(null);
                }}
                className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Rescheduling..." : "Confirm Reschedule"}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>,
    document.body,
  );
}

function Detail({ label, value, link = false }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm text-slate-800">
        {link ? <a href={value} target="_blank" rel="noreferrer" className="break-all font-semibold text-blue-700 hover:underline">{value}</a> : value || "Not provided"}
      </dd>
    </div>
  );
}
