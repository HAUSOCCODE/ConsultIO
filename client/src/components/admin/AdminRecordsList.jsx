import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading, StatusBadge } from "../UI";
import Pagination from "../Pagination";
import FacultyAppointmentDetailsModal from "../appointments/FacultyAppointmentDetailsModal";
import { formatPersonName } from "../../utils/formatPersonName";

const APPOINTMENTS_PER_PAGE = 6;

const dateLabel = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Not available";
};

const timeLabel = (value) => {
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "Not available";
};

export default function AdminRecordsList({ title }) {
  const [appointments, setAppointments] = useState(null);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [details, setDetails] = useState(null);

  const load = () => {
    setError("");
    return api("/admin/appointments")
      .then((data) =>
        setAppointments(
          Array.isArray(data?.appointments) ? data.appointments : [],
        ),
      )
      .catch(() =>
        setError("Unable to load appointments management. Please try again."),
      );
  };

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("focus", refresh);
    const timer = window.setInterval(refresh, 20000);
    return () => {
      window.removeEventListener("focus", refresh);
      window.clearInterval(timer);
    };
  }, []);

  const totalItems = appointments?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / APPOINTMENTS_PER_PAGE));
  const validPage = Math.min(currentPage, totalPages);
  const pageAppointments = (appointments || []).slice(
    (validPage - 1) * APPOINTMENTS_PER_PAGE,
    validPage * APPOINTMENTS_PER_PAGE,
  );
  const blankRows = APPOINTMENTS_PER_PAGE - pageAppointments.length;

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setAppointments(null);
          void load();
        }}
      />
    );
  if (appointments === null) return <Loading />;

  return (
    <div className="w-full min-w-0 max-w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review consultation appointments and their current status.
        </p>
      </div>

      {appointments.length === 0 ? (
        <EmptyState title="No appointments found." />
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {pageAppointments.map((appointment) => (
              <article
                key={appointment._id}
                className="w-full min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="truncate font-bold text-slate-900"
                      title={appointment.subject}
                    >
                      {appointment.subject || "Consultation"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {dateLabel(appointment.startAt)} ·{" "}
                      {timeLabel(appointment.startAt)} –{" "}
                      {timeLabel(appointment.endAt)}
                    </p>
                  </div>
                  <StatusBadge status={appointment.status} />
                </div>
                <dl className="mt-4 grid min-w-0 grid-cols-2 gap-3 text-sm">
                  <MobileDetail
                    label="Student"
                    value={formatPersonName(appointment.student?.name)}
                  />
                  <MobileDetail
                    label="Faculty"
                    value={formatPersonName(appointment.faculty?.name)}
                  />
                  <MobileDetail
                    label="Mode"
                    value={appointment.consultationMode || "Online"}
                  />
                  <MobileDetail
                    label="Estimated Time"
                    value={
                      appointment.estimatedDurationMinutes
                        ? `${appointment.estimatedDurationMinutes} min`
                        : null
                    }
                  />
                </dl>
                <button
                  type="button"
                  onClick={() => setDetails(appointment)}
                  className="mt-4 w-full rounded-lg border border-maroon-200 px-3 py-2 text-sm font-bold text-maroon-800"
                >
                  View Details
                </button>
              </article>
            ))}
          </div>

          <div className="hidden max-w-full overflow-x-auto rounded-t-2xl border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[1120px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[11%]" />
                <col className="w-[16%]" />
                <col className="w-[11%]" />
                <col className="w-[11%]" />
                <col className="w-[16%]" />
                <col className="w-[9%]" />
                <col className="w-[9%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead className="bg-maroon-800 text-xs text-white">
                <tr>
                  {[
                    "Date",
                    "Subject / Topic",
                    "Student",
                    "Faculty",
                    "Time",
                    "Mode",
                    "Estimated Time",
                    "Status",
                    "Action",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-4 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageAppointments.map((appointment) => (
                  <tr
                    key={appointment._id}
                    className="h-[76px] border-t border-slate-200 bg-white"
                  >
                    <td className="px-3 py-3 text-xs">
                      {dateLabel(appointment.startAt)}
                    </td>
                    <td className="px-3 py-3">
                      <p
                        className="truncate font-semibold"
                        title={appointment.subject}
                      >
                        {appointment.subject || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p
                        className="truncate"
                        title={formatPersonName(appointment.student?.name)}
                      >
                        {formatPersonName(appointment.student?.name) ||
                          "Unavailable"}
                      </p>
                    </td>
                    <td className="px-3 py-3">
                      <p
                        className="truncate"
                        title={formatPersonName(appointment.faculty?.name)}
                      >
                        {formatPersonName(appointment.faculty?.name) ||
                          "Unavailable"}
                      </p>
                    </td>
                    <td className="px-3 py-3 text-xs whitespace-nowrap">
                      {timeLabel(appointment.startAt)} –{" "}
                      {timeLabel(appointment.endAt)}
                    </td>
                    <td className="px-3 py-3">
                      {appointment.consultationMode || "Online"}
                    </td>
                    <td className="px-3 py-3">
                      {appointment.estimatedDurationMinutes
                        ? `${appointment.estimatedDurationMinutes} min`
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <StatusBadge status={appointment.status} />
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() => setDetails(appointment)}
                        className="text-xs font-bold text-maroon-800 hover:underline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: blankRows }, (_, index) => (
                  <tr
                    key={`placeholder-${index}`}
                    aria-hidden="true"
                    className="h-[76px] border-t border-slate-200 bg-white"
                  >
                    <td colSpan={9} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200">
            <Pagination
              currentPage={validPage}
              totalItems={appointments.length}
              itemsPerPage={APPOINTMENTS_PER_PAGE}
              itemLabel="appointments"
              onPageChange={setCurrentPage}
            />
          </div>
        </>
      )}

      {details && (
        <FacultyAppointmentDetailsModal
          appointment={details}
          onClose={() => setDetails(null)}
          showFacultyInfo
        />
      )}
    </div>
  );
}

function MobileDetail({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd
        className="mt-1 truncate font-medium text-slate-800"
        title={value || undefined}
      >
        {value || "Not available"}
      </dd>
    </div>
  );
}
