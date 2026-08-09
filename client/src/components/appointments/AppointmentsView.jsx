import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading, StatusBadge } from "../UI";
import Pagination from "../Pagination";
import AppointmentRequestDetailsModal from "./AppointmentRequestDetailsModal";
import StudentAppointmentDetailsModal from "./StudentAppointmentDetailsModal";
import FacultyAppointmentDetailsModal from "./FacultyAppointmentDetailsModal";
const HISTORY_ITEMS_PER_PAGE = 6;
export default function AppointmentsPage({ filter }) {
  const { user } = useAuth();
  const [items, setItems] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [appointmentTab, setAppointmentTab] = useState("Upcoming");
  const [historyTab, setHistoryTab] = useState("All");
  const [historyPage, setHistoryPage] = useState(1);
  const [details, setDetails] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [availabilityCapacity, setAvailabilityCapacity] = useState([]);
  const [approvalWarning, setApprovalWarning] = useState(null);
  const load = () =>
    api("/appointments/mine")
      .then((d) => {
        setItems(Array.isArray(d?.appointments) ? d.appointments : []);
        setAvailabilityCapacity(
          Array.isArray(d?.availabilityCapacity) ? d.availabilityCapacity : [],
        );
        setError("");
      })
      .catch(() => setError("Unable to load appointments. Please try again."));
  useEffect(() => {
    load();
    const id = setInterval(load, 20000);
    return () => clearInterval(id);
  }, []);
  const update = async (id, status, extra = {}) => {
    try {
      const d = await api(`/appointments/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status, ...extra }),
      });
      setMessage(d.message);
      load();
      return true;
    } catch (e) {
      setMessage(e.message);
      return false;
    }
  };
  const beginReschedule = async (appointment) => {
    try {
      const data = await api(`/availability/faculty/${user.id}`);
      setRescheduleSlots(Array.isArray(data?.schedules) ? data.schedules : []);
      setRescheduleTarget(appointment);
    } catch (requestError) {
      setMessage(requestError.message);
    }
  };
  const cancel = async (id) => {
    try {
      const d = await api(`/appointments/${id}/cancel`, { method: "PUT" });
      setMessage(d.message);
      setCancelTarget(null);
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  const document = async (appointment) => {
    try {
      const data = await api(`/appointments/${appointment._id}/document`);
      const link = window.document.createElement("a");
      link.href = data.supportingDocument.data;
      link.download = data.supportingDocument.name || "consultation-document";
      link.click();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  };
  const requestReschedule = async (appointment) => {
    try {
      const data = await api(
        `/appointments/${appointment._id}/request-reschedule`,
        {
          method: "PUT",
          body: JSON.stringify({
            note: window.prompt("Why do you need to reschedule?") || "",
          }),
        },
      );
      setMessage(data.message);
      load();
    } catch (requestError) {
      setMessage(requestError.message);
    }
  };
  const approve = async (appointment) => {
    const availabilityId =
      appointment.availability?._id || appointment.availability;
    const capacity = availabilityCapacity.find(
      (item) => item.availabilityId === String(availabilityId),
    );
    const excess = capacity
      ? capacity.approvedEstimatedMinutes +
        (appointment.estimatedDurationMinutes || 0) -
        capacity.capacityMinutes
      : 0;
    if (excess > 0) {
      setApprovalWarning({ appointment, excess });
      return;
    }
    await update(appointment._id, "Approved");
  };
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <Loading />;
  let shown = items;
  if (user.role === "student" && !filter)
    shown = items.filter((x) =>
      ["Pending", "Approved", "Rescheduled"].includes(x.status),
    );
  if (filter === "requests")
    shown = items.filter((x) => x.status === "Pending");
  if (filter === "history") {
    const historical =
      user.role === "student"
        ? ["Completed", "Approved", "Rejected", "Cancelled"]
        : ["Completed", "Rejected", "Cancelled"];
    shown = items.filter((x) =>
      historyTab === "All"
        ? historical.includes(x.status)
        : x.status === historyTab,
    );
  }
  if (user.role === "faculty" && !filter) {
    const now = new Date();
    const today = now.toDateString();
    shown = items.filter((item) => {
      const start = new Date(item.startAt);
      if (appointmentTab === "Today")
        return (
          ["Approved", "Rescheduled"].includes(item.status) &&
          start.toDateString() === today
        );
      if (appointmentTab === "Upcoming")
        return (
          ["Approved", "Rescheduled"].includes(item.status) && start >= now
        );
      return item.status === appointmentTab;
    });
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">
          {filter === "requests"
            ? "Appointment Requests"
            : filter === "history"
              ? "Consultation History"
              : "My Appointments"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {filter === "history"
            ? "Review your completed, rejected, and cancelled consultation records."
            : user.role === "student" && !filter
              ? "View and manage your current consultation appointments."
              : "Live appointment data from ConsultIO."}
        </p>
      </div>
      {message && (
        <div className="rounded-xl bg-maroon-50 p-4 text-sm text-maroon-800">
          {message}
        </div>
      )}
      {user.role === "faculty" && !filter && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["Today", "Upcoming", "Completed", "Cancelled"].map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setAppointmentTab(name)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${appointmentTab === name ? "bg-maroon-800 text-white" : "border border-slate-200 bg-white"}`}
            >
              {name}
            </button>
          ))}
        </div>
      )}
      {user.role === "student" && filter === "history" && (
        <div className="flex flex-wrap gap-2">
          {["All", "Completed", "Approved", "Rejected", "Cancelled"].map(
            (name) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setHistoryTab(name);
                  setHistoryPage(1);
                }}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${historyTab === name ? "bg-maroon-800 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
              >
                {name}
              </button>
            ),
          )}
        </div>
      )}
      {user.role === "faculty" &&
        filter === "requests" &&
        availabilityCapacity.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availabilityCapacity.map((capacity) => (
              <article
                key={capacity.availabilityId}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <p className="font-bold text-maroon-900">
                  {new Date(capacity.startAt).toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {new Date(capacity.startAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  –{" "}
                  {new Date(capacity.endAt).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Capacity
                    label="Pending Requests"
                    value={capacity.pendingCount}
                  />
                  <Capacity
                    label="Availability Capacity"
                    value={`${capacity.capacityMinutes} min`}
                  />
                  <Capacity
                    label="Pending Estimated"
                    value={`${capacity.pendingEstimatedMinutes} min`}
                  />
                  <Capacity
                    label="Approved Estimated"
                    value={`${capacity.approvedEstimatedMinutes} min`}
                  />
                  <Capacity
                    label="Total Estimated Time"
                    value={`${capacity.totalEstimatedMinutes} min`}
                    wide
                  />
                </dl>
                {capacity.totalEstimatedMinutes > capacity.capacityMinutes && (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                    Consultation requests exceed this availability by{" "}
                    {capacity.totalEstimatedMinutes - capacity.capacityMinutes}{" "}
                    minutes.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      {details && filter === "requests" && (
        <AppointmentRequestDetailsModal
          appointment={details}
          onClose={() => setDetails(null)}
        />
      )}
      {details && user.role === "student" && (
        <StudentAppointmentDetailsModal
          appointment={details}
          onClose={() => setDetails(null)}
        />
      )}
      {details && user.role === "faculty" && filter !== "requests" && (
        <FacultyAppointmentDetailsModal
          appointment={details}
          onClose={() => setDetails(null)}
          onComplete={async () => {
            if (await update(details._id, "Completed")) setDetails(null);
          }}
        />
      )}
      {cancelTarget &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onMouseDown={(event) =>
              event.target === event.currentTarget && setCancelTarget(null)
            }
          >
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="cancel-consultation-title"
              onMouseDown={(event) => event.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2
                id="cancel-consultation-title"
                className="text-xl font-bold text-maroon-900"
              >
                Cancel Consultation?
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Are you sure you want to cancel this consultation request?
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setCancelTarget(null)}
                  className="btn-secondary"
                >
                  Keep Appointment
                </button>
                <button
                  type="button"
                  onClick={() => cancel(cancelTarget._id)}
                  className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
                >
                  Cancel Appointment
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {approvalWarning &&
        createPortal(
          <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 p-4">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="capacity-warning-title"
              className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
            >
              <h2
                id="capacity-warning-title"
                className="text-xl font-bold text-maroon-900"
              >
                Availability Capacity Warning
              </h2>
              <p className="mt-3 text-sm text-slate-600">
                Approving this request will exceed your published consultation
                availability by {approvalWarning.excess} minutes.
              </p>
              <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setApprovalWarning(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const target = approvalWarning.appointment;
                    setApprovalWarning(null);
                    await update(target._id, "Approved");
                  }}
                  className="btn-primary"
                >
                  Approve Anyway
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}
      {rescheduleTarget && (
        <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/60 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-maroon-900">
                  Reschedule Consultation
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Select another valid schedule.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRescheduleTarget(null)}
                className="font-bold text-slate-500"
              >
                Close
              </button>
            </div>
            {rescheduleSlots.length === 0 ? (
              <EmptyState title="No alternative schedules available." />
            ) : (
              <div className="mt-5 max-h-96 space-y-3 overflow-y-auto">
                {rescheduleSlots.map((slot) => (
                  <button
                    key={slot._id}
                    type="button"
                    onClick={async () => {
                      await update(rescheduleTarget._id, "Rescheduled", {
                        availabilityId: slot.availabilityId,
                        startAt: slot.startAt,
                      });
                      setRescheduleTarget(null);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm hover:border-maroon-400"
                  >
                    <span className="block font-bold">
                      {new Date(slot.startAt).toLocaleString()}
                    </span>
                    <span className="mt-1 block text-slate-600">
                      {slot.mode} · {slot.location}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {filter === "history" ? (
        <ConsultationHistoryTable
          appointments={shown}
          currentPage={historyPage}
          onPageChange={setHistoryPage}
          onView={setDetails}
          role={user.role}
          emptyTitle={
            historyTab === "All"
              ? "No consultation records found."
              : `No ${historyTab.toLowerCase()} consultation records found.`
          }
        />
      ) : shown.length === 0 ? (
        <EmptyState title="No current appointments" />
      ) : (
        <div className="grid gap-4">
          {shown.map((x) => (
            <article key={x._id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="font-bold">{x.subject}</h2>
                    <StatusBadge status={x.status} />
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    {user.role === "student"
                      ? `Faculty: ${x.faculty?.name}`
                      : `Student: ${x.student?.name}`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(x.startAt).toLocaleDateString(undefined, {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    Estimated consultation time:{" "}
                    {x.estimatedDurationMinutes || "Not provided"}
                    {x.estimatedDurationMinutes ? " minutes" : ""}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {new Date(x.startAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}{" "}
                    –{" "}
                    {new Date(x.endAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {x.consultationMode || "Online"} ·{" "}
                    {x.location || "Location to be confirmed"}
                  </p>
                  {user.role === "faculty" && x.student?.program && (
                    <p className="mt-1 text-sm text-slate-500">
                      Program: {x.student.program}
                    </p>
                  )}
                  <p className="mt-3 text-sm">{x.reason}</p>
                  {x.notes && (
                    <p className="mt-2 text-sm text-slate-600">
                      Notes: {x.notes}
                    </p>
                  )}
                  {user.role === "faculty" && x.rescheduleRequested && (
                    <p className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">
                      Student requested rescheduling
                      {x.rescheduleRequestNote
                        ? `: ${x.rescheduleRequestNote}`
                        : "."}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setDetails(x)}
                    className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-maroon-800"
                  >
                    View Details
                  </button>
                  {user.role === "faculty" && x.status === "Pending" && (
                    <>
                      <button
                        onClick={() => approve(x)}
                        className="rounded-lg bg-green-700 px-4 py-2 text-sm font-bold text-white"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() =>
                          update(x._id, "Rejected", {
                            note:
                              window.prompt("Optional rejection reason:") || "",
                          })
                        }
                        className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => beginReschedule(x)}
                        className="rounded-lg border border-maroon-200 px-4 py-2 text-sm font-bold text-maroon-800"
                      >
                        Reschedule
                      </button>
                    </>
                  )}
                  {user.role === "faculty" &&
                    ["Approved", "Rescheduled"].includes(x.status) && (
                      <button
                        onClick={() => update(x._id, "Completed")}
                        className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white"
                      >
                        Complete
                      </button>
                    )}
                  {user.role === "student" &&
                    ["Pending", "Approved", "Rescheduled"].includes(x.status) &&
                    new Date(x.startAt) > new Date() && (
                      <button
                        onClick={() => setCancelTarget(x)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-bold text-red-700"
                      >
                        Cancel
                      </button>
                    )}
                  {user.role === "student" &&
                    ["Approved", "Rescheduled"].includes(x.status) &&
                    new Date(x.startAt) > new Date() && (
                      <button
                        type="button"
                        onClick={() => requestReschedule(x)}
                        className="rounded-lg border border-maroon-200 px-4 py-2 text-sm font-bold text-maroon-800"
                      >
                        Request Reschedule
                      </button>
                    )}
                  {x.supportingDocument?.name &&
                    filter !== "requests" &&
                    filter !== "history" &&
                    user.role !== "student" && (
                      <button
                        type="button"
                        onClick={() => document(x)}
                        className="rounded-lg border px-4 py-2 text-sm font-bold text-maroon-800"
                      >
                        View Document
                      </button>
                    )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Capacity({ label, value, wide = false }) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-slate-800">{value}</dd>
    </div>
  );
}

function ConsultationHistoryTable({
  appointments,
  currentPage,
  onPageChange,
  onView,
  role,
  emptyTitle,
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(appointments.length / HISTORY_ITEMS_PER_PAGE),
  );
  const safePage = Math.min(currentPage, totalPages);
  const pageAppointments = appointments.slice(
    (safePage - 1) * HISTORY_ITEMS_PER_PAGE,
    safePage * HISTORY_ITEMS_PER_PAGE,
  );
  const emptyRows = Math.max(
    0,
    HISTORY_ITEMS_PER_PAGE - pageAppointments.length,
  );
  const personLabel = role === "faculty" ? "Student" : "Faculty";
  const personFor = (appointment) =>
    role === "faculty" ? appointment.student : appointment.faculty;
  useEffect(() => {
    if (currentPage > totalPages) onPageChange(totalPages);
  }, [currentPage, onPageChange, totalPages]);
  const date = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "Not provided"
      : parsed.toLocaleDateString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };
  const duration = (appointment) =>
    appointment.estimatedDurationMinutes
      ? `${appointment.estimatedDurationMinutes} min`
      : "Not provided";

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-maroon-800 text-white">
            <tr>
              <th className="w-[13%] px-4 py-3 font-semibold">Date</th>
              <th className="w-[21%] px-4 py-3 font-semibold">
                Subject / Topic
              </th>
              <th className="w-[15%] px-4 py-3 font-semibold">{personLabel}</th>
              <th className="w-[12%] px-4 py-3 font-semibold">Mode</th>
              <th className="w-[13%] px-4 py-3 font-semibold">
                Estimated Time
              </th>
              <th className="w-[12%] px-4 py-3 font-semibold">Status</th>
              <th className="w-[14%] px-4 py-3 font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {appointments.length === 0 ? (
              <tr className="h-[336px] bg-white">
                <td colSpan={7} className="text-center text-sm text-slate-500">
                  {emptyTitle}
                </td>
              </tr>
            ) : (
              pageAppointments.map((appointment) => (
                <tr
                  key={appointment._id}
                  className="h-14 align-middle hover:bg-slate-50"
                >
                  <td className="h-14 px-4 py-0 text-slate-600">
                    {date(appointment.startAt)}
                  </td>
                  <td className="h-14 px-4 py-0">
                    <p
                      className="truncate font-semibold text-slate-900"
                      title={appointment.subject}
                    >
                      {appointment.subject || "Consultation"}
                    </p>
                  </td>
                  <td
                    className="h-14 truncate px-4 py-0 text-slate-700"
                    title={personFor(appointment)?.name}
                  >
                    {personFor(appointment)?.name || "Not provided"}
                  </td>
                  <td className="h-14 px-4 py-0 text-slate-600">
                    {appointment.consultationMode || "Not provided"}
                  </td>
                  <td className="h-14 px-4 py-0 text-slate-600">
                    {duration(appointment)}
                  </td>
                  <td className="h-14 px-4 py-0">
                    <StatusBadge status={appointment.status} />
                  </td>
                  <td className="h-14 px-4 py-0">
                    <button
                      type="button"
                      onClick={() => onView(appointment)}
                      className="text-sm font-bold text-maroon-800 hover:underline"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
            {appointments.length > 0 &&
              Array.from({ length: emptyRows }, (_, index) => (
                <tr
                  key={`empty-consultation-row-${index}`}
                  aria-hidden="true"
                  className="h-14 bg-white"
                >
                  <td colSpan={7} />
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {appointments.length === 0 ? (
          <EmptyState title={emptyTitle} />
        ) : (
          pageAppointments.map((appointment) => (
            <article
              key={appointment._id}
              className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-slate-900">
                    {appointment.subject || "Consultation"}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    {personFor(appointment)?.name ||
                      `${personLabel} not provided`}
                  </p>
                </div>
                <StatusBadge status={appointment.status} />
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Date
                  </dt>
                  <dd className="mt-1">{date(appointment.startAt)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Mode
                  </dt>
                  <dd className="mt-1">
                    {appointment.consultationMode || "Not provided"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-slate-500">
                    Estimated Time
                  </dt>
                  <dd className="mt-1">{duration(appointment)}</dd>
                </div>
              </dl>
              <button
                type="button"
                onClick={() => onView(appointment)}
                className="mt-4 w-full rounded-lg border border-maroon-200 px-4 py-2 text-sm font-bold text-maroon-800"
              >
                View Details
              </button>
            </article>
          ))
        )}
      </div>
      {appointments.length > 0 && (
        <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200">
          <Pagination
            currentPage={safePage}
            totalItems={appointments.length}
            onPageChange={onPageChange}
            itemsPerPage={HISTORY_ITEMS_PER_PAGE}
          />
        </div>
      )}
    </>
  );
}
