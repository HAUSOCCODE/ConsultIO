import { CalendarDays, GraduationCap, Users, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/apiClient";
import { EmptyState, Loading, StatusBadge } from "../../components/UI";
import { useAuth } from "../../context/AuthContext";
import { formatPersonName } from "../../utils/formatPersonName";

const appointmentStatuses = [
  ["Pending", "pendingAppointments", "bg-amber-500"],
  ["Approved", "approvedAppointments", "bg-green-600"],
  ["Rescheduled", "rescheduledAppointments", "bg-blue-600"],
  ["Completed", "completedConsultations", "bg-teal-600"],
  ["Cancelled", "cancelledAppointments", "bg-slate-500"],
  ["Rejected", "rejectedAppointments", "bg-red-600"],
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = () =>
      api("/dashboard/admin")
        .then((response) => {
          if (active) {
            setData(response);
            setError("");
          }
        })
        .catch((requestError) => active && setError(requestError.message));
    void load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  if (error && !data)
    return (
      <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
        Unable to load dashboard. {error}
      </p>
    );
  if (!data) return <Loading />;

  const stats = data.stats || {};
  const displayName = formatPersonName(
    user.name === "ConsultIO Administrator"
      ? "SOCConsult Administrator"
      : user.name,
  );
  const summaries = [
    ["Total Users", stats.totalUsers, Users],
    ["Total Students", stats.totalStudents, GraduationCap],
    ["Total Faculty", stats.totalFaculty, UserRound],
    ["Total Appointments", stats.totalAppointments, CalendarDays],
  ];

  return (
    <div className="w-full min-w-0 space-y-5">
      <section className="rounded-2xl bg-[#72182A] p-5 text-white shadow-sm sm:p-7">
        <p className="eyebrow !text-gold-300">Welcome back</p>
        <h1 className="mt-2 max-w-full whitespace-normal break-normal font-sans text-[2rem] font-bold leading-[1.1] tracking-[-0.02em] sm:text-[2.5rem] lg:text-[2.875rem]">
          Hello, {displayName}
        </h1>
        <p className="mt-2 text-sm text-slate-100">
          Here is the latest activity from your SOCConsult workspace.
        </p>
      </section>

      <section
        aria-label="Dashboard totals"
        className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 xl:grid-cols-4"
      >
        {summaries.map(([label, value, Icon]) => (
          <article
            key={label}
            className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-maroon-50 text-maroon-800">
              <Icon size={19} />
            </span>
            <div className="min-w-0">
              <p className="text-2xl font-extrabold text-maroon-900">
                {value || 0}
              </p>
              <p className="break-words text-xs font-semibold text-slate-600 sm:text-sm">
                {label}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid min-w-0 items-stretch gap-4 lg:grid-cols-2">
        <UserDistribution
          students={stats.totalStudents || 0}
          faculty={stats.totalFaculty || 0}
          totalUsers={stats.totalUsers || 0}
        />
        <AppointmentStatusChart stats={stats} />
      </section>

      <section className="min-w-0 space-y-5">
        <article className="flex h-auto min-w-0 flex-wrap items-center justify-between gap-x-2 gap-y-3 self-start rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="min-w-0 text-sm font-semibold text-slate-600">
            Pending Registrations
          </p>
          <p
            className={`shrink-0 text-2xl font-extrabold ${stats.pendingRegistrations ? "text-amber-700" : "text-maroon-900"}`}
          >
            {stats.pendingRegistrations || 0}
          </p>
          <Link
            to="/admin/registrations"
            className="btn-secondary inline-flex shrink-0 py-2"
          >
            Review Users
          </Link>
        </article>
        <RecentRegistrations registrations={data.recentRegistrations || []} />
      </section>
    </div>
  );
}

function UserDistribution({ students, faculty, totalUsers }) {
  const percentage = (count) =>
    totalUsers > 0 ? (count / totalUsers) * 100 : 0;
  const studentPercent = percentage(students);
  const facultyPercent = percentage(faculty);
  const facultyEnd = Math.min(100, studentPercent + facultyPercent);
  const gradient =
    totalUsers > 0
      ? `conic-gradient(#72182A 0 ${studentPercent}%, #D4A72C ${studentPercent}% ${facultyEnd}%, #e2e8f0 ${facultyEnd}% 100%)`
      : "conic-gradient(#e2e8f0 0 100%)";
  return (
    <article className="flex h-full min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-maroon-900">User Distribution</h2>
      {totalUsers === 0 ? (
        <p className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-500">
          No user data yet.
        </p>
      ) : (
        <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-5 sm:flex-row">
          <div
            role="img"
            aria-label={`${students} Students, ${faculty} Faculty`}
            title={`Students ${formatPercent(studentPercent)} · Faculty ${formatPercent(facultyPercent)}`}
            className="relative h-32 w-32 shrink-0 rounded-full"
            style={{ background: gradient }}
          >
            <div className="absolute inset-6 grid place-items-center rounded-full bg-white text-center">
              <span>
                <strong className="block text-2xl text-maroon-900">
                  {totalUsers}
                </strong>
                <small className="text-slate-500">Users</small>
              </span>
            </div>
          </div>
          <dl className="w-full max-w-xs space-y-3">
            <Legend
              color="bg-maroon-800"
              label="Students"
              count={students}
              percent={studentPercent}
            />
            <Legend
              color="bg-gold-500"
              label="Faculty"
              count={faculty}
              percent={facultyPercent}
            />
          </dl>
        </div>
      )}
    </article>
  );
}

function Legend({ color, label, count, percent }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${color}`} />
      <dt className="min-w-0 flex-1 font-semibold text-slate-700">{label}</dt>
      <dd className="shrink-0 text-right">
        <strong>{count}</strong>
        <span className="mx-1.5 text-slate-400">·</span>
        <span className="text-xs text-slate-500">{formatPercent(percent)}</span>
      </dd>
    </div>
  );
}

function formatPercent(value) {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
}

function AppointmentStatusChart({ stats }) {
  const values = useMemo(
    () =>
      appointmentStatuses.map(([label, key, color]) => ({
        label,
        color,
        value: Number(stats[key]) || 0,
      })),
    [stats],
  );
  const max = Math.max(...values.map((item) => item.value), 0);
  return (
    <article className="h-full min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-bold text-maroon-900">
        Appointment Status Overview
      </h2>
      {max === 0 ? (
        <p className="py-12 text-center text-sm text-slate-500">
          No appointment data yet.
        </p>
      ) : (
        <div
          role="img"
          aria-label={values
            .map((item) => `${item.label}: ${item.value}`)
            .join(", ")}
          className="mt-5 space-y-3"
        >
          {values.map((item) => (
            <div
              key={item.label}
              title={`${item.label}: ${item.value} appointment${item.value === 1 ? "" : "s"}`}
              className="grid min-w-0 grid-cols-[5.5rem_minmax(0,1fr)_2rem] items-center gap-2 text-sm sm:grid-cols-[6.5rem_minmax(0,1fr)_2.5rem]"
            >
              <span className="truncate font-semibold text-slate-600">
                {item.label}
              </span>
              <div className="h-6 min-w-0 overflow-hidden rounded-md bg-slate-100">
                <div
                  className={`h-full min-w-[2px] rounded-md transition-all ${item.color}`}
                  style={{ width: `${(item.value / max) * 100}%` }}
                />
              </div>
              <strong className="text-right text-slate-800">
                {item.value}
              </strong>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}

function RecentRegistrations({ registrations }) {
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">
          Recent Registration Requests
        </h2>
        <Link
          to="/admin/registrations"
          className="text-sm font-bold text-maroon-800"
        >
          View all
        </Link>
      </div>
      {registrations.length === 0 ? (
        <div className="mt-4">
          <EmptyState title="No recent activity" />
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {registrations.map((item) => (
            <div
              key={item._id}
              className="flex min-w-0 flex-col gap-2 rounded-xl bg-slate-50 p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="break-words font-semibold">
                  {formatPersonName(item.name)}
                </p>
                <p className="[overflow-wrap:anywhere] text-sm text-slate-500">{item.email}</p>
              </div>
              <StatusBadge status={item.status || "Pending"} />
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
