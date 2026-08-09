import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "../UI";
import SupportingDocumentViewer from "./SupportingDocumentViewer";
import OnlineMeetingDetails from "./OnlineMeetingDetails";

const safeDate = (value, options) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleString(undefined, options)
    : "Not provided";
};
const clock = (value) =>
  safeDate(value, { hour: "numeric", minute: "2-digit" });

export default function FacultyAppointmentDetailsModal({
  appointment,
  onClose,
  onComplete,
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  const canComplete = ["Approved", "Rescheduled"].includes(appointment.status);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="faculty-appointment-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2
              id="faculty-appointment-title"
              className="text-xl font-bold text-maroon-900"
            >
              Consultation Details
            </h2>
            <p className="mt-1 break-words font-semibold text-slate-800">
              {appointment.subject || "Consultation"}
            </p>
            <div className="mt-2">
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Close appointment details"
            className="shrink-0 rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Section title="Student Information">
              <Detail
                label="Student Full Name"
                value={appointment.student?.name}
              />
              <Detail
                label="Student ID"
                value={appointment.student?.studentId}
              />
              <Detail label="Program" value={appointment.student?.program} />
              <Detail
                label="Year Level"
                value={appointment.yearLevel || appointment.student?.yearLevel}
              />
              <Detail
                label="Official Student Email"
                value={appointment.student?.email}
                wide
              />
            </Section>

            <Section title="Consultation Information">
              <Detail label="Subject / Topic" value={appointment.subject} />
              <Detail
                label="Estimated Consultation Time"
                value={
                  appointment.estimatedDurationMinutes
                    ? `${appointment.estimatedDurationMinutes} minutes`
                    : "Not provided"
                }
              />
              <Detail
                label="Reason for Consultation"
                value={appointment.reason}
                wide
              />
              <Detail label="Status" value={appointment.status} />
              <Detail
                label="Date Request Was Submitted"
                value={safeDate(appointment.createdAt)}
              />
            </Section>
          </div>

          <Section title="Schedule Information">
            <Detail
              label="Consultation Date"
              value={safeDate(appointment.startAt, {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            />
            <Detail
              label="Faculty Availability Window"
              value={`${clock(appointment.startAt)} – ${clock(appointment.endAt)}`}
            />
            <Detail
              label="Consultation Mode"
              value={appointment.consultationMode}
            />
            {appointment.consultationMode === "Face-to-Face" && (
              <Detail label="Location" value={appointment.location} />
            )}
          </Section>

          <OnlineMeetingDetails
            appointment={appointment}
            allowLink
            emptyLinkText="Meeting link not provided."
          />

          {appointment.responseNote && (
            <Section title="Status Information">
              <Detail
                label="Faculty Response"
                value={appointment.responseNote}
                wide
              />
            </Section>
          )}

          <Section title="Supporting Documents">
            <div className="sm:col-span-2">
              <SupportingDocumentViewer appointment={appointment} />
            </div>
          </Section>
        </div>

        <footer className="sticky bottom-0 flex flex-col-reverse gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          {canComplete && (
            <button type="button" onClick={onComplete} className="btn-primary">
              Complete Consultation
            </button>
          )}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-slate-200 p-4">
      <h3 className="mb-4 font-bold text-maroon-900">{title}</h3>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Detail({ label, value, wide = false }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 break-words text-sm text-slate-800">
        {value || "Not provided"}
      </p>
    </div>
  );
}
