import {
  Bell,
  CalendarCheck,
  CheckSquare,
  Clock3,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState } from "../UI";

const iconFor = (notification) => {
  if (notification.type === "task") return CheckSquare;
  if (/rejected|cancelled/i.test(notification.title || "")) return XCircle;
  if (/approved|completed/i.test(notification.title || ""))
    return CalendarCheck;
  if (/pending|rescheduled|request/i.test(notification.title || ""))
    return Clock3;
  return Bell;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    return api("/notifications")
      .then((data) => {
        setNotifications(
          Array.isArray(data?.notifications) ? data.notifications : [],
        );
        setUnreadCount(Number(data?.unreadCount) || 0);
      })
      .catch(() => setError("Unable to load notifications. Please try again."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void load();
  }, []);

  const refreshBadge = () =>
    window.dispatchEvent(new Event("notifications:updated"));
  const read = async (id) => {
    try {
      await api(`/notifications/${id}/read`, { method: "PUT" });
      setNotifications((current) =>
        current.map((item) =>
          item._id === id
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
      refreshBadge();
    } catch {
      setError("Unable to update this notification. Please try again.");
    }
  };
  const readAll = async () => {
    try {
      await api("/notifications/read-all", { method: "PUT" });
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt || new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
      refreshBadge();
    } catch {
      setError("Unable to update notifications. Please try again.");
    }
  };

  if (error && notifications.length === 0)
    return <ErrorState message={error} onRetry={load} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="mt-2 text-sm text-slate-600">
            Stay updated with your consultation activities.
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={readAll}
            className="btn-secondary py-2"
          >
            Mark All as Read
          </button>
        )}
      </div>
      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}
      {loading ? (
        <p className="py-12 text-center font-semibold text-maroon-800">
          Loading notifications...
        </p>
      ) : notifications.length === 0 ? (
        <EmptyState
          title="No notifications yet."
          text="Updates about your consultations and assigned tasks will appear here."
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = iconFor(notification);
            const createdAt = new Date(notification.createdAt);
            return (
              <article
                key={notification._id}
                className={`rounded-2xl border p-5 shadow-sm ${notification.isRead ? "border-slate-200 bg-white" : "border-gold-300 bg-gold-50"}`}
              >
                <div className="flex gap-4">
                  <span
                    className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${notification.isRead ? "bg-slate-100 text-slate-600" : "bg-maroon-800 text-gold-300"}`}
                  >
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h2
                        className={`${notification.isRead ? "font-semibold" : "font-bold"} text-slate-900`}
                      >
                        {notification.title || "ConsultIO Notification"}
                      </h2>
                      {!notification.isRead && (
                        <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-gold-500" />
                      )}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {notification.message ||
                        "A ConsultIO activity was updated."}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {Number.isNaN(createdAt.getTime())
                        ? "Date unavailable"
                        : createdAt.toLocaleString()}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-4">
                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={() => read(notification._id)}
                          className="text-sm font-bold text-maroon-800"
                        >
                          Mark as Read
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
