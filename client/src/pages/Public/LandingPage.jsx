import { useEffect, useState } from "react";
import {
  ArrowRight,
  Bell,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  LockKeyhole,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Footer, Navbar } from "../../components/public/PublicLayout";
import { api } from "../../api/apiClient";
const features = [
  [
    CalendarDays,
    "Easy Consultation Scheduling",
    "Book and manage consultation appointments in a few clear steps.",
  ],
  [
    Clock3,
    "Faculty Availability",
    "View current faculty consultation availability.",
  ],
  [
    CheckCircle2,
    "Appointment Monitoring",
    "Track every request, approval, and update.",
  ],
  [
    LockKeyhole,
    "Secure HAU Access",
    "Institutional account rules protect the university community.",
  ],
  [
    Bell,
    "Timely Notifications",
    "Stay informed about decisions and schedule changes.",
  ],
  [
    FileText,
    "Consultation Records",
    "Maintain accessible academic support records.",
  ],
];
export default function LandingPage() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    api("/public/stats")
      .then(setStats)
      .catch(() =>
        setStats({
          activeRequests: 0,
          completedConsultations: 0,
          facultyCount: 0,
          nextAvailableSlot: null,
        }),
      );
  }, []);
  return (
    <>
      <Navbar />
      <main>
        <section
          id="home"
          className="relative overflow-hidden bg-[#F7F8FA] py-16 sm:py-20 lg:py-28"
        >
          <div className="container-page grid items-center gap-12 lg:grid-cols-[1.1fr_.9fr]">
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-gold-300 bg-white px-4 py-2 text-xs font-bold uppercase tracking-[.14em] text-maroon-800 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-gold-500" />
                Holy Angel University · School of Computing
              </span>
              <h1 className="mt-7 font-display text-5xl font-bold leading-[.92] tracking-tight text-maroon-900 sm:text-6xl lg:text-7xl">
                Consult<span className="text-gold-500">IO</span>
              </h1>
              <p className="mt-5 text-xl font-semibold text-slate-700 sm:text-2xl">
                Faculty-Student Consultation and Appointment Scheduling System
              </p>
              <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
                A centralized platform for consultation schedules, appointments,
                records, and notifications.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/get-started" className="btn-primary gap-2">
                  Get Started <ArrowRight size={18} />
                </Link>
                <a href="#about" className="btn-secondary">
                  Learn More
                </a>
              </div>
            </div>
            <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-[2rem] border border-maroon-700 bg-maroon-900 p-6 text-white shadow-glow sm:p-8">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-gold-400">
                    Live consultation overview
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">
                    Academic support,
                    <br />
                    right on schedule.
                  </h2>
                </div>
                <CalendarDays className="text-gold-400" size={38} />
              </div>
              <div className="relative mt-8 rounded-2xl border border-maroon-600 bg-maroon-800 p-5">
                <p className="text-xs font-medium text-slate-100">
                  Next available consultation schedule
                </p>
                <p className="mt-2 font-semibold">
                  {stats
                    ? stats.nextAvailableSlot
                      ? `${stats.nextAvailableSlot.day} · ${stats.nextAvailableSlot.time}`
                      : "No schedule currently published"
                    : "Loading current availability..."}
                </p>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <Stat
                  icon={Users}
                  value={stats?.activeRequests}
                  label="Active requests"
                />
                <Stat
                  icon={CheckCircle2}
                  value={stats?.completedConsultations}
                  label="Completed"
                  gold
                />
              </div>
              <p className="mt-3 text-xs text-slate-200">
                {stats
                  ? `${stats.facultyCount} participating faculty member${stats.facultyCount === 1 ? "" : "s"}`
                  : "Loading faculty..."}
              </p>
            </div>
          </div>
        </section>
        <section id="features" className="py-16 sm:py-20">
          <div className="container-page">
            <div className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-bold uppercase tracking-widest text-gold-500">
                Built for campus life
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-maroon-900 sm:text-4xl">
                One place for every consultation
              </h2>
            </div>
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(([Icon, title, text]) => (
                <article
                  key={title}
                  className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-maroon-200 hover:shadow-card"
                >
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-maroon-50 text-maroon-800 transition group-hover:bg-maroon-800 group-hover:text-gold-300">
                    <Icon size={23} />
                  </span>
                  <h3 className="mt-5 font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section id="about" className="bg-[#F7F8FA] py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
            <div>
              <p className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.2em] text-gold-600">
                <span className="h-0.5 w-8 bg-gold-500" aria-hidden="true" />
                About ConsultIO
              </p>
              <h2 className="mt-5 max-w-xl font-display text-4xl font-bold leading-tight tracking-tight text-maroon-900 md:text-5xl lg:text-6xl">
                Better access to meaningful academic support.
              </h2>
            </div>
            <p className="max-w-2xl text-base leading-relaxed text-slate-700 md:text-lg md:leading-8">
              ConsultIO serves the School of Computing of Holy Angel University
              by bringing consultation scheduling, faculty availability,
              appointment monitoring, notifications, consultation records, and
              follow-up activities into one secure workspace.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
function Stat({ icon: Icon, value, label, gold }) {
  return (
    <div
      className={`rounded-2xl border p-4 ${gold ? "border-gold-400 bg-gold-400 text-maroon-900" : "border-maroon-600 bg-maroon-800 text-white"}`}
    >
      <Icon size={20} />
      <p className="mt-3 text-2xl font-bold">{value ?? "—"}</p>
      <p className="text-xs">{label}</p>
    </div>
  );
}
