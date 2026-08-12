import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Clock3, Users } from "lucide-react";
import { api } from "../../api/apiClient";
import { EmptyState, Loading, StatusBadge } from "../UI";
import { useAuth } from "../../context/AuthContext";
import { getAppointmentDisplayStatus } from "../../utils/appointmentStatus";
const titles = {
  totalStudents: "Total Students",
  totalFaculty: "Total Faculty",
  totalUsers: "Total Users",
  totalAppointments: "Total Appointments",
  pendingRegistrations: "Pending Registrations",
  pendingAppointments: "Pending Appointments",
  approvedAppointments: "Approved Appointments",
  rescheduledAppointments: "Rescheduled Appointments",
  completedConsultations: "Completed Consultations",
  cancelledAppointments: "Cancelled Appointments",
  rejectedAppointments: "Rejected Appointments",
  upcomingAppointments: "Upcoming Appointments",
  assignedTasks: "Assigned Tasks",
  unreadNotifications: "Unread Notifications",
  todayAppointments: "Today's Appointments",
  pendingRequests: "Pending Requests",
  weeklyConsultations: "This Week's Consultations",
  availableSchedules: "Available Schedules",
};
export default function DashboardOverview({
  endpoint,
  recentKey,
  recentTitle,
  recentLink,
  statLinks = {},
  primaryAction,
  excludedStats = [],
  statGrid = "default",
}) {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = () =>
      api(endpoint)
        .then((d) => active && setData(d))
        .catch((e) => active && setError(e.message));
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [endpoint]);
  if (error)
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        Unable to load dashboard. {error}
      </div>
    );
  if (!data) return <Loading />;
  const recent = Array.isArray(data?.[recentKey]) ? data[recentKey] : [];
  return (
    <div className="w-full min-w-0 space-y-7">
      <section className="w-full min-w-0 rounded-2xl bg-[#72182A] p-5 text-white shadow-sm sm:p-8">
        <p className="eyebrow !text-gold-300">Welcome back</p>
        <h1 className="mt-2 break-words font-display text-2xl font-bold sm:text-4xl">
          Hello, {user.name}
        </h1>
        <p className="mt-2 text-sm text-slate-100">
          Here is the latest activity from your SOCConsult workspace.
        </p>
        {primaryAction && (
          <Link
            to={primaryAction.to}
            className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-gold-400 px-5 py-3 text-center text-sm font-bold text-maroon-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-gold-300 sm:w-auto"
          >
            {primaryAction.label}
          </Link>
        )}
      </section>
      <section className={`grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 ${statGrid === "faculty" ? "xl:grid-cols-5" : statGrid === "student" ? "xl:grid-cols-4" : "xl:grid-cols-3 2xl:grid-cols-4"}`}>
        {Object.entries(data.stats || {})
          .filter(([key]) => !excludedStats.includes(key))
          .map(([key, value]) => (
            <Link
              key={key}
              to={statLinks[key] || "#"}
              className="group flex h-full w-full min-w-0 cursor-pointer flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-maroon-300 hover:shadow-card focus:outline-none focus:ring-2 focus:ring-maroon-400 focus:ring-offset-2 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-maroon-50 text-maroon-800 transition group-hover:bg-maroon-800 group-hover:text-gold-300">
                  {key.includes("pending") ? (
                    <Clock3 size={20} />
                  ) : key.includes("total") ? (
                    <Users size={20} />
                  ) : key.includes("completed") ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <CalendarCheck size={20} />
                  )}
                </span>
                <strong className="text-3xl font-extrabold tracking-tight text-maroon-900">
                  {value}
                </strong>
              </div>
              <p className="mt-4 break-words text-sm font-semibold leading-5 text-slate-600">
                {titles[key] || key}
              </p>
            </Link>
          ))}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="break-words text-lg font-bold text-slate-900">{recentTitle}</h2>
          {recentLink && (
            <Link
              className="text-sm font-bold text-maroon-800"
              to={recentLink.to}
            >
              {recentLink.label || "View all"}
            </Link>
          )}
        </div>
        {recent.length === 0 ? (
          <EmptyState title="No recent activity" />
        ) : (
          <div className="space-y-3">
            {recent.map((item) => (
              <div
                key={item._id}
                className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-maroon-200 hover:bg-maroon-50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {item.name || item.student?.name || item.subject}
                  </p>
                  <p className="[overflow-wrap:anywhere] text-sm text-slate-500">
                    {item.email || item.faculty?.name || item.student?.email}
                  </p>
                </div>
                <StatusBadge
                  status={
                    user.role === "student"
                      ? getAppointmentDisplayStatus(item)
                      : item.status || "Pending"
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
