export const StatusBadge = ({ status }) => {
  const colors = {
    Pending: "bg-amber-100 text-amber-800",
    Approved: "bg-green-100 text-green-800",
    Active: "bg-green-100 text-green-800",
    Completed: "bg-blue-100 text-blue-800",
    Rejected: "bg-red-100 text-red-700",
    Inactive: "bg-slate-200 text-slate-700",
    Cancelled: "bg-slate-200 text-slate-700",
    Rescheduled: "bg-purple-100 text-purple-800",
    "Needs Reschedule": "bg-amber-100 text-amber-800",
    "Awaiting Faculty Update": "bg-orange-100 text-orange-800",
    "No Show": "bg-rose-100 text-rose-800",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs font-bold ${colors[status] || "bg-slate-100 text-slate-700"}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {status}
    </span>
  );
};
export const EmptyState = ({
  title = "Nothing here yet",
  text = "New records will appear here.",
}) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm">
    <span className="mx-auto mb-4 block h-12 w-12 rounded-2xl bg-maroon-100 ring-4 ring-maroon-50" />
    <p className="font-bold text-slate-700">{title}</p>
    <p className="mt-1 text-sm text-slate-500">{text}</p>
  </div>
);
export const Loading = () => (
  <div className="grid min-h-48 place-items-center">
    <div className="flex items-center gap-3 text-sm font-semibold text-maroon-800">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon-200 border-t-maroon-800" />
      Loading current data...
    </div>
  </div>
);
export const ErrorState = ({ message, onRetry }) => (
  <div className="rounded-2xl border border-red-200 bg-white px-6 py-10 text-center shadow-sm">
    <p className="font-bold text-red-700">{message}</p>
    {onRetry && (
      <button type="button" onClick={onRetry} className="btn-secondary mt-5">
        Try again
      </button>
    )}
  </div>
);
export function Modal({ title, children, onClose, actions }) {
  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-slate-950/55 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-maroon-900">{title}</h2>
        <div className="mt-4 text-sm text-slate-600">{children}</div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          {actions}
        </div>
      </div>
    </div>
  );
}
