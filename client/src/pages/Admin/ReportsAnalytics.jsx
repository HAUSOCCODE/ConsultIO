import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading } from "../../components/UI";
export default function ReportsAnalytics() {
  const [items, setItems] = useState(null);
  const [error, setError] = useState("");
  const load = () => {
    setError("");
    setItems(null);
    api("/admin/appointments")
      .then((d) =>
        setItems(Array.isArray(d?.appointments) ? d.appointments : []),
      )
      .catch(() => setError("Unable to generate reports. Please try again."));
  };
  useEffect(load, []);
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!items) return <Loading />;
  const completed = items.filter((x) => x.status === "Completed");
  const exportCsv = () => {
    const rows = [
      ["Student", "Faculty", "Subject", "Date", "Status"],
      ...items.map((x) => [
        x.student?.name,
        x.faculty?.name,
        x.subject,
        new Date(x.startAt).toLocaleString(),
        x.status,
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((r) =>
            r
              .map((v) => `"${String(v || "").replaceAll('"', '""')}"`)
              .join(","),
          )
          .join("\n"),
      ],
      { type: "text/csv" },
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "consultio-report.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-maroon-900">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Generate consultation reports from live system data.
          </p>
        </div>
        <button onClick={exportCsv} className="btn-primary w-full sm:w-auto">
          Export CSV Report
        </button>
      </div>
      {items.length === 0 && <EmptyState title="No reports generated yet." />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Total consultations</p>
          <strong className="mt-2 block text-3xl text-maroon-900">
            {items.length}
          </strong>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Completed</p>
          <strong className="mt-2 block text-3xl text-maroon-900">
            {completed.length}
          </strong>
        </div>
        <div className="rounded-2xl border bg-white p-5">
          <p className="text-sm text-slate-500">Completion rate</p>
          <strong className="mt-2 block text-3xl text-maroon-900">
            {items.length
              ? Math.round((completed.length / items.length) * 100)
              : 0}
            %
          </strong>
        </div>
      </div>
      <section className="rounded-2xl border bg-white p-4 sm:p-6">
        <h2 className="font-bold">AI-Assisted Report Summary</h2>
        <p className="mt-2 text-sm text-slate-500">
          AI summaries are reserved for a future configured AI service.
          Appointment decisions remain entirely human-controlled.
        </p>
      </section>
    </div>
  );
}
