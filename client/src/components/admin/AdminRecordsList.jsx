import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading, StatusBadge } from "../UI";
import { useToast } from "../../context/ToastContext";
export default function DataPage({ type, title }) {
  const toast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const load = () => {
    const path =
      type === "users"
        ? "/admin/users"
        : type === "adminAppointments"
          ? "/admin/appointments"
          : null;
    if (!path) {
      setData([]);
      return;
    }
    api(path)
      .then((d) => setData(d.users || d.appointments || []))
      .catch(() =>
        setError(`Unable to load ${title.toLowerCase()}. Please try again.`),
      );
  };
  useEffect(load, [type, title]);
  if (error)
    return (
      <ErrorState
        message={error}
        onRetry={() => {
          setError("");
          setData(null);
          load();
        }}
      />
    );
  if (data === null) return <Loading />;
  const toggle = async (item) => {
    try {
      const status = item.accountStatus === "Active" ? "Inactive" : "Active";
      const response = await api(`/admin/users/${item._id}/status`, {
        method: "PUT",
        body: JSON.stringify({ accountStatus: status }),
      });
      setData(
        data.map((x) =>
          x._id === item._id ? { ...x, accountStatus: status } : x,
        ),
      );
      toast.success(response.message || `Account ${status.toLowerCase()}.`);
    } catch (e) {
      toast.error(e.message || "Unable to update the account.");
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-500">
          {data.length
            ? "Current records from MongoDB."
            : "This module is ready for data as activity is created."}
        </p>
      </div>
      {data.length === 0 ? (
        <EmptyState
          title={
            type === "adminAppointments"
              ? "No appointments found."
              : `No ${title.toLowerCase()} available`
          }
        />
      ) : (
        <div className="space-y-3">
          {data.map((x) => (
            <article key={x._id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="truncate font-bold">
                    {x.name || x.subject || x.action}
                  </p>
                  <p className="mt-1 truncate text-sm text-slate-500">
                    {x.email ||
                      `${x.student?.name || ""} ${x.faculty?.name ? "→ " + x.faculty.name : ""}` ||
                      new Date(x.createdAt).toLocaleString()}
                  </p>
                  {type === "adminAppointments" && (
                    <div className="mt-2 space-y-1 text-sm text-slate-600">
                      <p>
                        Faculty availability:{" "}
                        {x.startAt
                          ? new Date(x.startAt).toLocaleString()
                          : "Date unavailable"}{" "}
                        –{" "}
                        {x.endAt
                          ? new Date(x.endAt).toLocaleTimeString([], {
                              hour: "numeric",
                              minute: "2-digit",
                            })
                          : "End time unavailable"}
                      </p>
                      <p>
                        Estimated duration:{" "}
                        {x.estimatedDurationMinutes
                          ? `${x.estimatedDurationMinutes} minutes`
                          : "Not provided"}{" "}
                        · {x.consultationMode || "Online"} ·{" "}
                        {x.location || "Location to be confirmed"}
                      </p>
                    </div>
                  )}
                  {type === "adminAppointments" && x.reason && (
                    <p className="mt-2 text-sm text-slate-600">
                      Reason: {x.reason}
                    </p>
                  )}
                  {type === "adminAppointments" && (
                    <p className="mt-1 text-xs text-slate-500">
                      Created{" "}
                      {x.createdAt
                        ? new Date(x.createdAt).toLocaleString()
                        : "—"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {(x.accountStatus || x.status) && (
                    <StatusBadge status={x.accountStatus || x.status} />
                  )}{" "}
                  {type === "users" && (
                    <button
                      onClick={() => toggle(x)}
                      className="rounded-lg border px-3 py-2 text-sm font-bold"
                    >
                      {x.accountStatus === "Active" ? "Deactivate" : "Activate"}
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
