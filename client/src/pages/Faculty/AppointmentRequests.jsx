import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState } from "../../components/UI";
import FacultyScheduleDetailsModal from "../../components/appointments/FacultyScheduleDetailsModal";
import { useToast } from "../../context/ToastContext";

const date = (value) => new Date(value).toLocaleDateString(undefined, {
  weekday: "long", year: "numeric", month: "long", day: "numeric",
});
const time = (value) => new Date(value).toLocaleTimeString([], {
  hour: "numeric", minute: "2-digit",
});

export default function AppointmentRequests() {
  const toast = useToast();
  const [schedules, setSchedules] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const refreshFailureShown = useRef(false);

  const loadSchedules = useCallback(async ({ background = false } = {}) => {
    try {
      const data = await api("/availability/request-schedules");
      setSchedules(Array.isArray(data?.schedules) ? data.schedules : []);
      refreshFailureShown.current = false;
    } catch {
      setSchedules((current) => current || []);
      if (!refreshFailureShown.current) {
        toast.error("Unable to refresh appointment requests.");
        refreshFailureShown.current = true;
      }
    }
  }, [toast]);

  const loadDetails = useCallback(async (id, { background = false } = {}) => {
    if (!background) setDetailsLoading(true);
    setDetailsError("");
    try {
      const data = await api(`/availability/${id}/details`);
      setDetails(data);
    } catch (error) {
      setDetailsError(error.message || "Unable to load requests for this schedule.");
    } finally {
      if (!background) setDetailsLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    await loadSchedules({ background: true });
    if (selectedId) await loadDetails(selectedId, { background: true });
  }, [loadDetails, loadSchedules, selectedId]);

  useEffect(() => {
    void loadSchedules();
    const interval = window.setInterval(() => void refresh(), 20000);
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadSchedules, refresh]);

  const update = async (appointment, status, extra = {}) => {
    try {
      const data = await api(`/appointments/${appointment._id}/status`, {
        method: "PUT", body: JSON.stringify({ status, ...extra }),
      });
      status === "Rejected" ? toast.info("Appointment request rejected.") : toast.success(status === "Approved" ? "Appointment approved successfully." : data.message);
      const minutes = appointment.estimatedDurationMinutes || 0;
      setDetails((current) => current ? {
        ...current,
        pendingRequests: (current.pendingRequests || []).filter((item) => item._id !== appointment._id),
        approvedStudents: status === "Approved" ? [...(current.approvedStudents || []), { ...appointment, ...data.appointment, status }] : current.approvedStudents || [],
        rejectedRequests: status === "Rejected" ? [...(current.rejectedRequests || []), { ...appointment, ...data.appointment, status }] : current.rejectedRequests || [],
      } : current);
      setSchedules((current) => current?.map((schedule) => schedule._id === selectedId ? {
        ...schedule,
        pendingCount: Math.max(0, (schedule.pendingCount || 0) - 1),
        approvedCount: (schedule.approvedCount || 0) + (status === "Approved" ? 1 : 0),
        rejectedCount: (schedule.rejectedCount || 0) + (status === "Rejected" ? 1 : 0),
        pendingEstimatedMinutes: Math.max(0, (schedule.pendingEstimatedMinutes || 0) - minutes),
        approvedEstimatedMinutes: (schedule.approvedEstimatedMinutes || 0) + (status === "Approved" ? minutes : 0),
        totalEstimatedMinutes: Math.max(0, (schedule.totalEstimatedMinutes || 0) - (status === "Rejected" ? minutes : 0)),
      } : schedule));
      void refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Unable to update the appointment.");
      return false;
    }
  };

  const reschedule = async (appointment) => {
    try {
      const data = await api(`/availability/${selectedId}/appointments/${appointment._id}/request-reschedule`, {
        method: "PUT", body: JSON.stringify({}),
      });
      toast.success(data.message);
      await refresh();
      return true;
    } catch (error) {
      toast.error(error.message || "Unable to reschedule appointment.");
      return false;
    }
  };

  const openSchedule = (schedule) => {
    setSelectedId(schedule._id);
    setDetails(null);
    void loadDetails(schedule._id);
  };

  return (
    <div className="w-full min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">Appointment Requests</h1>
        <p className="mt-2 text-sm text-slate-500">Select a published schedule to manage its student requests.</p>
      </div>
      {schedules === null ? (
        <p className="py-10 text-center text-sm font-semibold text-maroon-800">Loading schedules...</p>
      ) : schedules.length === 0 ? (
        <EmptyState title="No published schedules" text="Schedules created in Manage Availability will appear here, even before students submit requests." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {schedules.map((schedule) => (
            <article
              key={schedule._id}
              role="button"
              tabIndex={0}
              aria-label={`View requests for ${date(schedule.startAt)}`}
              onClick={() => openSchedule(schedule)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  openSchedule(schedule);
                }
              }}
              className="flex w-full min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-maroon-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-maroon-400"
            >
              <p className="font-bold text-maroon-900">{date(schedule.startAt)}</p>
              <p className="mt-1 text-sm font-semibold text-slate-700">{time(schedule.startAt)} – {time(schedule.endAt)}</p>
              <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-center text-sm">
                <Count label="Pending" value={schedule.pendingCount || 0} color="text-amber-700" />
                <Count label="Approved" value={schedule.approvedCount || 0} color="text-green-700" />
                <Count label="Rejected" value={schedule.rejectedCount || 0} color="text-red-700" />
              </dl>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Capacity" value={`${schedule.capacityMinutes || 0} min`} />
                <Metric label="Pending Estimated" value={`${schedule.pendingEstimatedMinutes || 0} min`} />
                <Metric label="Approved Estimated" value={`${schedule.approvedEstimatedMinutes || 0} min`} />
                <Metric label="Total Estimated" value={`${schedule.totalEstimatedMinutes || 0} min`} />
              </dl>
              <div className="mt-auto flex justify-center pt-5">
                <button type="button" onClick={(event) => { event.stopPropagation(); openSchedule(schedule); }} className="inline-flex h-10 min-w-[8.5rem] items-center justify-center rounded-xl bg-maroon-800 px-5 text-sm font-semibold text-white transition hover:bg-maroon-700 focus:outline-none focus:ring-2 focus:ring-maroon-400 focus:ring-offset-2">View Requests</button>
              </div>
            </article>
          ))}
        </div>
      )}
      {selectedId && (
        <FacultyScheduleDetailsModal
          details={details} loading={detailsLoading} error={detailsError}
          onRetry={() => loadDetails(selectedId)} onApprove={(item) => update(item, "Approved")}
          onReject={(item, note) => update(item, "Rejected", { note })}
          onReschedule={reschedule}
          onClose={() => { setSelectedId(""); setDetails(null); setDetailsError(""); }}
        />
      )}
    </div>
  );
}

function Metric({ label, value, wide = false }) {
  return <div className={wide ? "col-span-2" : ""}><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-bold text-slate-900">{value}</dd></div>;
}

function Count({ label, value, color }) {
  return <div className="min-w-0"><dt className="break-words text-[0.68rem] font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className={`mt-1 text-xl font-extrabold ${color}`}>{value}</dd></div>;
}
