import { useEffect, useState } from "react";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, Loading, StatusBadge } from "../UI";
export default function TasksPage({ faculty = false }) {
  const [tasks, setTasks] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = () =>
    api("/tasks")
      .then((d) => {
        setTasks(Array.isArray(d?.tasks) ? d.tasks : []);
        setError("");
      })
      .catch(() => setError("Unable to load tasks. Please try again."));
  useEffect(() => {
    void load();
  }, []);
  const complete = async (id) => {
    try {
      await api(`/tasks/${id}/complete`, { method: "PUT" });
      load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!tasks) return <Loading />;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">
          {faculty ? "My Tasks / Follow-ups" : "My Tasks / Action Items"}
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Consultation follow-up work and completion status.
        </p>
      </div>
      {message && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}
      {tasks.length === 0 ? (
        <EmptyState title="No action items" />
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <article key={task._id} className="rounded-2xl border bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold">{task.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {faculty
                      ? `Student: ${task.student?.name}`
                      : `Assigned by: ${task.faculty?.name}`}
                  </p>
                  <p className="mt-2 text-sm">
                    Due:{" "}
                    {task.dueAt
                      ? new Date(task.dueAt).toLocaleDateString()
                      : "No due date"}
                  </p>
                </div>
                <StatusBadge status={task.status} />
              </div>
              {!faculty && task.status === "Pending" && (
                <button
                  onClick={() => complete(task._id)}
                  className="btn-secondary mt-4 py-2"
                >
                  Mark as Completed
                </button>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
