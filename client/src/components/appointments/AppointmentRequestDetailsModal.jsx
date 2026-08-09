import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { StatusBadge } from "../UI";
import SupportingDocumentViewer from "./SupportingDocumentViewer";

const dateTime = (value) => new Date(value).toLocaleString();
const time = (value) =>
  new Date(value).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

export default function AppointmentRequestDetailsModal({
  appointment,
  onClose,
}) {
  useEffect(() => {
    const previousOverflow = window.document.body.style.overflow;
    const closeOnEscape = (event) => event.key === "Escape" && onClose();
    window.document.body.style.overflow = "hidden";
    window.document.addEventListener("keydown", closeOnEscape);
    return () => {
      window.document.body.style.overflow = previousOverflow;
      window.document.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex h-[100dvh] w-screen items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="request-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
      >
        <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
          <div>
            <h2
              id="request-details-title"
              className="text-xl font-bold text-maroon-900"
            >
              Appointment Request Details
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Submitted {dateTime(appointment.createdAt)}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close appointment request details"
            onClick={onClose}
            autoFocus
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X />
          </button>
        </header>

        <div className="space-y-6 px-5 py-5 sm:px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DetailSection title="Student Information">
              <Detail label="Full Name" value={appointment.student?.name} />
              <Detail
                label="Official Student Email"
                value={appointment.student?.email}
              />
              <Detail
                label="Student ID"
                value={appointment.student?.studentId}
              />
              <Detail label="Program" value={appointment.student?.program} />
              <Detail
                label="Year Level"
                value={appointment.student?.yearLevel}
              />
            </DetailSection>
            <DetailSection title="Consultation Information">
              <Detail label="Subject / Topic" value={appointment.subject} />
              <Detail
                label="Requested Date"
                value={new Date(appointment.startAt).toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  },
                )}
              />
              <Detail
                label="Faculty Availability Window"
                value={`${time(appointment.startAt)} – ${time(appointment.endAt)}`}
              />
              <Detail
                label="Estimated Consultation Time"
                value={
                  appointment.estimatedDurationMinutes
                    ? `${appointment.estimatedDurationMinutes} minutes`
                    : "Not provided"
                }
              />
              <Detail label="Mode" value={appointment.consultationMode} />
              <Detail
                label="Location / Platform"
                value={appointment.location}
              />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </p>
                <div className="mt-1">
                  <StatusBadge status={appointment.status} />
                </div>
              </div>
            </DetailSection>
          </div>

          <DetailSection title="Request Information">
            <Detail
              label="Reason for Consultation"
              value={appointment.reason}
              wide
            />
            <Detail
              label="Optional Notes"
              value={appointment.notes || "No optional notes were provided."}
              wide
            />
            <Detail label="Faculty" value={appointment.faculty?.name} />
          </DetailSection>

          <DetailSection title="Supporting Documents">
            <div className="sm:col-span-2">
              <SupportingDocumentViewer appointment={appointment} />
            </div>
          </DetailSection>
        </div>
        <footer className="sticky bottom-0 flex justify-end border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </footer>
      </section>
    </div>,
    window.document.body,
  );
}

function DetailSection({ title, children }) {
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
        {value || "Not available"}
      </p>
    </div>
  );
}
