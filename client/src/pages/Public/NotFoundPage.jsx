import { Link } from "react-router-dom";

export default function NotFoundPage({ dashboard = "/" }) {
  return (
    <section className="grid min-h-[55vh] place-items-center rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div>
        <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-gold-600">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold text-maroon-900">
          Page not found
        </h1>
        <p className="mt-3 text-slate-600">
          The requested ConsultIO page does not exist.
        </p>
        <Link to={dashboard} className="btn-primary mt-6">
          Back to Dashboard
        </Link>
      </div>
    </section>
  );
}
