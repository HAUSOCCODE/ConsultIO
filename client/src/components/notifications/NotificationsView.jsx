import {
  Bell,
  CalendarCheck,
  CheckSquare,
  Clock3,
  X,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState } from "../UI";
import Pagination from "../Pagination";
import { useToast } from "../../context/ToastContext";

const ITEMS_PER_PAGE = 6;

const iconFor = (notification) => {
  if (notification.type === "task") return CheckSquare;
  if (/rejected|cancelled/i.test(notification.title || "")) return XCircle;
  if (/approved|completed/i.test(notification.title || ""))
    return CalendarCheck;
  if (/pending|rescheduled|request/i.test(notification.title || ""))
    return Clock3;
  return Bell;
};

export default function NotificationsPage({ compact = false }) {
  const toast = useToast();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [selected, setSelected] = useState(null);

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
      toast.error("Unable to update this notification. Please try again.");
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
      toast.error("Unable to update notifications. Please try again.");
    }
  };

  if (error && notifications.length === 0)
    return <ErrorState message={error} onRetry={load} />;
  if (compact)
    return (
      <CompactNotifications
        notifications={notifications}
        unreadCount={unreadCount}
        loading={loading}
        error={error}
        filter={filter}
        setFilter={setFilter}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        selected={selected}
        setSelected={setSelected}
        read={read}
        readAll={readAll}
      />
    );
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
          text="Updates about your consultations will appear here."
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

function CompactNotifications({
  notifications,
  unreadCount,
  loading,
  error,
  filter,
  setFilter,
  currentPage,
  setCurrentPage,
  selected,
  setSelected,
  read,
  readAll,
}) {
  const shown = notifications.filter((notification) =>
    filter === "Unread"
      ? !notification.isRead
      : filter === "Read"
        ? notification.isRead
        : true,
  );
  const totalPages = Math.max(1, Math.ceil(shown.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pageNotifications = shown.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );
  const emptyRows = Math.max(0, ITEMS_PER_PAGE - pageNotifications.length);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, setCurrentPage, totalPages]);
  const open = async (notification) => {
    setSelected(notification);
    if (!notification.isRead) await read(notification._id);
  };
  const date = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime())
      ? "Date unavailable"
      : parsed.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
  };
  const typeLabel = (notification) =>
    notification.type
      ? notification.type.charAt(0).toUpperCase() + notification.type.slice(1)
      : "Update";

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
      <div className="flex flex-wrap gap-2">
        {["All", "Unread", "Read"].map((name) => (
          <button
            key={name}
            type="button"
            onClick={() => {
              setFilter(name);
              setCurrentPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${filter === name ? "bg-maroon-800 text-white" : "border border-slate-200 bg-white text-slate-700"}`}
          >
            {name}
          </button>
        ))}
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
      ) : shown.length === 0 ? (
        <NotificationEmptyState />
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full table-fixed text-left text-sm">
              <thead className="bg-maroon-800 text-white">
                <tr>
                  <th className="w-[14%] px-4 py-3">Type</th>
                  <th className="w-[38%] px-4 py-3">Notification</th>
                  <th className="w-[22%] px-4 py-3">Date &amp; Time</th>
                  <th className="w-[12%] px-4 py-3">Status</th>
                  <th className="w-[14%] px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {pageNotifications.map((notification) => (
                  <tr
                    key={notification._id}
                    className={`h-14 ${notification.isRead ? "bg-white" : "bg-gold-50"}`}
                  >
                    <td className="h-14 px-4 py-0 font-semibold text-maroon-800">
                      {typeLabel(notification)}
                    </td>
                    <td className="h-14 px-4 py-0">
                      <div className="flex min-w-0 items-center gap-2">
                        {!notification.isRead && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                        )}
                        <p
                          className={`truncate ${notification.isRead ? "font-medium" : "font-bold"}`}
                          title={notification.title}
                        >
                          {notification.title || "ConsultIO Notification"}
                        </p>
                      </div>
                    </td>
                    <td className="h-14 px-4 py-0 text-slate-600">
                      {date(notification.createdAt)}
                    </td>
                    <td className="h-14 px-4 py-0">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${notification.isRead ? "bg-slate-100 text-slate-600" : "bg-gold-100 text-maroon-900"}`}
                      >
                        {notification.isRead ? "Read" : "Unread"}
                      </span>
                    </td>
                    <td className="h-14 px-4 py-0">
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <button
                          type="button"
                          onClick={() => open(notification)}
                          className="font-bold text-maroon-800 hover:underline"
                        >
                          View
                        </button>
                        {!notification.isRead && (
                          <button
                            type="button"
                            onClick={() => read(notification._id)}
                            className="font-semibold text-slate-600 hover:underline"
                          >
                            Mark Read
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: emptyRows }, (_, index) => (
                  <tr
                    key={`empty-notification-row-${index}`}
                    aria-hidden="true"
                    className="h-14 bg-white"
                  >
                    <td colSpan={5} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {pageNotifications.map((notification) => (
              <article
                key={notification._id}
                className={`min-w-0 rounded-2xl border p-4 shadow-sm ${notification.isRead ? "border-slate-200 bg-white" : "border-gold-300 bg-gold-50"}`}
              >
                <div className="flex items-start gap-2">
                  {!notification.isRead && (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-gold-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate ${notification.isRead ? "font-semibold" : "font-bold"}`}
                    >
                      {notification.title || "ConsultIO Notification"}
                    </p>
                    <p className="mt-1 text-xs font-semibold uppercase text-maroon-700">
                      {typeLabel(notification)} ·{" "}
                      {notification.isRead ? "Read" : "Unread"}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      {date(notification.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <button
                    type="button"
                    onClick={() => open(notification)}
                    className="text-sm font-bold text-maroon-800"
                  >
                    View
                  </button>
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => read(notification._id)}
                      className="text-sm font-semibold text-slate-600"
                    >
                      Mark as Read
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
          <div className="overflow-hidden rounded-b-2xl border border-t-0 border-slate-200">
            <Pagination
              currentPage={safePage}
              totalItems={shown.length}
              onPageChange={setCurrentPage}
              itemLabel="notifications"
              itemsPerPage={ITEMS_PER_PAGE}
            />
          </div>
        </>
      )}
      {selected && (
        <NotificationDetailsModal
          notification={{ ...selected, isRead: true }}
          date={date}
          typeLabel={typeLabel}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function NotificationEmptyState() {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="bg-maroon-800 text-white">
            <tr>
              <th className="w-[14%] px-4 py-3">Type</th>
              <th className="w-[38%] px-4 py-3">Notification</th>
              <th className="w-[22%] px-4 py-3">Date &amp; Time</th>
              <th className="w-[12%] px-4 py-3">Status</th>
              <th className="w-[14%] px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="h-[336px] bg-white">
              <td colSpan={5} className="text-center text-sm text-slate-500">
                No notifications found.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="md:hidden">
        <EmptyState
          title="No notifications found."
          text="Consultation updates will appear here."
        />
      </div>
    </>
  );
}

function NotificationDetailsModal({ notification, date, typeLabel, onClose }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    const escape = (event) => event.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", escape);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", escape);
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
        aria-labelledby="notification-details-title"
        onMouseDown={(event) => event.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2
            id="notification-details-title"
            className="text-xl font-bold text-maroon-900"
          >
            Notification Details
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notification details"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X />
          </button>
        </header>
        <div className="space-y-5 px-5 py-5 sm:px-6">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Type
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {typeLabel(notification)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Title
              </dt>
              <dd className="mt-1 text-sm font-semibold text-slate-800">
                {notification.title || "ConsultIO Notification"}
              </dd>
            </div>
          </dl>
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Full Message
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-800">
              {notification.message || "A ConsultIO activity was updated."}
            </p>
          </div>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Date &amp; Time
              </dt>
              <dd className="mt-1 text-sm text-slate-800">
                {date(notification.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase text-slate-500">
                Status
              </dt>
              <dd className="mt-1 text-sm text-slate-800">Read</dd>
            </div>
          </dl>
        </div>
        <footer className="flex justify-end border-t border-slate-200 px-5 py-4 sm:px-6">
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  );
}
