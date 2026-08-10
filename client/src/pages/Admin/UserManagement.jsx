import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { api } from "../../api/apiClient";
import { EmptyState, ErrorState, StatusBadge } from "../../components/UI";
import { useToast } from "../../context/ToastContext";

const tabs = [
  "All Users",
  "Students",
  "Faculty",
  "Pending Registrations",
  "Active",
  "Inactive",
];
const passwordRule =
  "Password must be at least 8 characters and include one uppercase letter and one number. Spaces are not allowed.";

export default function UserManagement({ initialTab = "All Users" }) {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(initialTab);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [resetTarget, setResetTarget] = useState(null);

  const load = () => {
    setError("");
    setLoading(true);
    return Promise.all([
      api("/admin/users"),
      api("/admin/registrations?status=Pending"),
    ])
      .then(([accountsResponse, registrationsResponse]) => {
        const accounts = Array.isArray(accountsResponse?.users)
          ? accountsResponse.users
          : [];
        const registrations = Array.isArray(
          registrationsResponse?.registrations,
        )
          ? registrationsResponse.registrations
          : [];
        setUsers([
          ...accounts,
          ...registrations.filter(
            (pending) =>
              !accounts.some((account) => account._id === pending._id),
          ),
        ]);
      })
      .catch(() => setError("Unable to load users. Please try again."))
      .finally(() => setLoading(false));
  };
  useEffect(() => {
    void load();
  }, []);

  const view = async (user) => {
    setSelected(user);
    setDetailLoading(true);
    try {
      const data = await api(`/admin/users/${user._id}`);
      setSelected(data.user);
    } catch (requestError) {
      toast.error(requestError.message || "Unable to load user details.");
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const action = async (user, type) => {
    try {
      const data =
        type === "approve" || type === "reject"
          ? await api(`/admin/registrations/${user._id}/${type}`, {
              method: "PUT",
              body: "{}",
            })
          : await api(`/admin/users/${user._id}/status`, {
              method: "PUT",
              body: JSON.stringify({ accountStatus: type }),
            });
      toast.success(data.message || "User account updated.");
      setSelected(null);
      await load();
    } catch (requestError) {
      toast.error(requestError.message || "Unable to update the user account.");
    }
  };

  if (error) return <ErrorState message={error} onRetry={load} />;
  if (loading)
    return (
      <div className="grid min-h-48 place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-maroon-800">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-maroon-200 border-t-maroon-800" />
          Loading users...
        </div>
      </div>
    );

  const shown = users.filter(
    (user) =>
      tab === "All Users" ||
      (tab === "Students" && user.role === "student") ||
      (tab === "Faculty" && user.role === "faculty") ||
      (tab === "Pending Registrations" &&
        user.registrationStatus === "Pending") ||
      (tab === "Active" && user.accountStatus === "Active") ||
      (tab === "Inactive" && user.accountStatus === "Inactive"),
  );
  return (
    <div className="min-w-0 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-maroon-900">User Management</h1>
        <p className="mt-2 text-sm text-slate-500">
          Review registrations and manage Student and Faculty accounts.
        </p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((name) => (
          <button
            key={name}
            onClick={() => setTab(name)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${tab === name ? "bg-maroon-800 text-white" : "border border-slate-200 bg-white"}`}
          >
            {name}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState
          title={
            tab === "Pending Registrations"
              ? "No pending registrations."
              : "No users found."
          }
        />
      ) : (
        <>
          <div className="grid gap-4 lg:hidden">
            {shown.map((user) => (
              <article
                key={user._id}
                className="w-full min-w-0 max-w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
              >
                <div className="flex flex-col items-start gap-3 min-[380px]:flex-row min-[380px]:justify-between">
                  <div className="min-w-0">
                    <p
                      className="break-words font-bold text-slate-900"
                      title={user.name}
                    >
                      {user.name || "Unnamed user"}
                    </p>
                    <p className="mt-1 break-all text-sm lowercase text-slate-600">
                      {user.email?.toLowerCase()}
                    </p>
                    <p className="mt-1 text-sm capitalize text-slate-500">
                      {user.role}
                    </p>
                  </div>
                  <StatusBadge status={user.registrationStatus} />
                </div>
                <div className="mt-3">
                  <StatusBadge status={user.accountStatus} />
                </div>
                <UserActions
                  user={user}
                  onView={view}
                  onReset={setResetTarget}
                  onAction={action}
                />
              </article>
            ))}
          </div>
          <div className="hidden max-w-full overflow-x-auto rounded-2xl border border-slate-200 bg-white lg:block">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm">
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[23%]" />
                <col className="w-[8%]" />
                <col className="w-[12%]" />
                <col className="w-[14%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
              </colgroup>
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {[
                    "Name",
                    "Email",
                    "Role",
                    "Registered",
                    "Registration",
                    "Account",
                    "Actions",
                  ].map((heading) => (
                    <th key={heading} className="px-3 py-4 font-bold">
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((user) => (
                  <tr
                    key={user._id}
                    className="border-t border-slate-200 align-top"
                  >
                    <td className="px-3 py-4">
                      <p className="truncate font-semibold" title={user.name}>
                        {user.name || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <p
                        className="truncate lowercase"
                        title={user.email?.toLowerCase()}
                      >
                        {user.email?.toLowerCase() || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-4 capitalize">{user.role}</td>
                    <td className="px-3 py-4 text-xs">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={user.registrationStatus} />
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={user.accountStatus} />
                    </td>
                    <td className="px-3 py-3">
                      <UserActions
                        user={user}
                        onView={view}
                        onReset={setResetTarget}
                        onAction={action}
                        compact
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
      {selected && (
        <UserDetails
          user={selected}
          loading={detailLoading}
          onClose={() => setSelected(null)}
          onReset={(user) => {
            setSelected(null);
            setResetTarget(user);
          }}
          onAction={action}
        />
      )}
      {resetTarget && (
        <ResetPassword
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onSuccess={(successMessage) => {
            setResetTarget(null);
            toast.success(successMessage || "Password reset successfully.");
          }}
        />
      )}
    </div>
  );
}

function UserActions({ user, onView, onReset, onAction, compact = false }) {
  return (
    <div
      className={`mt-4 flex flex-wrap gap-x-3 gap-y-2 ${compact ? "lg:mt-0 lg:flex-col lg:items-start lg:gap-1" : ""}`}
    >
      <button
        type="button"
        onClick={() => onView(user)}
        className="text-xs font-bold text-blue-700"
      >
        View
      </button>
      <button
        type="button"
        onClick={() => onReset(user)}
        className="text-xs font-bold text-maroon-800"
      >
        Reset Password
      </button>
      {user.registrationStatus === "Pending" ? (
        <>
          <button
            type="button"
            onClick={() => onAction(user, "approve")}
            className="text-xs font-bold text-green-700"
          >
            Approve
          </button>
          <button
            type="button"
            onClick={() => onAction(user, "reject")}
            className="text-xs font-bold text-red-700"
          >
            Reject
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() =>
            onAction(
              user,
              user.accountStatus === "Active" ? "Inactive" : "Active",
            )
          }
          className="text-xs font-bold text-slate-700"
        >
          {user.accountStatus === "Active" ? "Deactivate" : "Activate"}
        </button>
      )}
    </div>
  );
}

function UserDetails({ user, loading, onClose, onReset, onAction }) {
  const account = [
    ["Full Name", user.name],
    [
      user.role === "student"
        ? "Official HAU Student Email"
        : "Official HAU Faculty Email",
      user.email?.toLowerCase(),
      "email",
    ],
    ["Role", user.role],
    ["Registration Status", user.registrationStatus],
    ["Account Status", user.accountStatus],
    [
      "Date Registered",
      user.createdAt ? new Date(user.createdAt).toLocaleString() : null,
    ],
    [
      "Last Login",
      user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : null,
    ],
  ];
  const profile =
    user.role === "student"
      ? [
          ["Student ID", user.studentId],
          ["Program", user.program],
          ["Year Level", user.yearLevel],
          ["Section", user.section],
          ["Contact Number", user.contactNumber],
        ]
      : [
          ["Employee ID", user.employeeId],
          ["Department", user.department],
          ["Designation / Position", user.designation],
          ["Specialization", user.specialization],
          ["Office Location", user.office],
          ["Contact Number", user.contactNumber],
        ];
  return (
    <Modal title="User Details" onClose={onClose}>
      {loading ? (
        <p className="py-10 text-center font-semibold text-maroon-800">
          Loading account details...
        </p>
      ) : (
        <>
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt=""
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-maroon-800 text-2xl font-bold text-white">
                {user.name?.[0] || "U"}
              </span>
            )}
            <div className="min-w-0">
              <p className="font-bold text-slate-900">{user.name}</p>
              <p className="break-all text-sm lowercase text-slate-600">
                {user.email?.toLowerCase()}
              </p>
            </div>
          </div>
          <Details title="Account Information" values={account} />
          <Details
            title={
              user.role === "student"
                ? "Student Information"
                : "Faculty Information"
            }
            values={profile}
          />
          <div className="mt-6 border-t border-slate-200 pt-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-gold-600">
              Account Actions
            </p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="btn-secondary py-2"
                onClick={() =>
                  onAction(
                    user,
                    user.accountStatus === "Active" ? "Inactive" : "Active",
                  )
                }
              >
                {user.accountStatus === "Active"
                  ? "Deactivate Account"
                  : "Activate Account"}
              </button>
              <button
                type="button"
                className="btn-primary py-2"
                onClick={() => onReset(user)}
              >
                Reset Password
              </button>
              <button
                type="button"
                className="btn-secondary py-2"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}
    </Modal>
  );
}

function Details({ title, values }) {
  return (
    <section className="mt-6">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gold-600">
        {title}
      </h3>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        {values.map(([label, value, format]) => (
          <div key={label} className="min-w-0 rounded-lg bg-slate-50 p-3">
            <dt className="text-xs font-semibold text-slate-500">{label}</dt>
            <dd
              className={`mt-1 text-sm font-medium text-slate-800 ${format === "email" ? "break-all lowercase" : "break-words capitalize"}`}
            >
              {value || "Not available"}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function ResetPassword({ user, onClose, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ newPassword: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.newPassword !== form.confirmPassword)
      return setError("Passwords do not match.");
    if (!/^(?=.*[A-Z])(?=.*[0-9])\S{8,}$/.test(form.newPassword))
      return setError(passwordRule);
    setBusy(true);
    try {
      const data = await api(`/admin/users/${user._id}/reset-password`, {
        method: "PUT",
        body: JSON.stringify(form),
      });
      onSuccess(data.message);
    } catch (requestError) {
      toast.error(requestError.message || "Unable to reset the password.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal
      title="Reset Password"
      subtitle={`Set a new password for ${user.name}. The existing password cannot be viewed.`}
      onClose={onClose}
      compact
    >
      {error && (
        <p className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <form onSubmit={submit}>
        <div className="space-y-5 py-5">
          <label className="block text-sm font-semibold">
            New Password
            <input
              className="field mt-2 w-full"
              type="password"
              required
              value={form.newPassword}
              onChange={(event) =>
                setForm({
                  ...form,
                  newPassword: event.target.value.replace(/\s/g, ""),
                })
              }
            />
          </label>
          <label className="block text-sm font-semibold">
            Confirm New Password
            <input
              className="field mt-2 w-full"
              type="password"
              required
              value={form.confirmPassword}
              onChange={(event) =>
                setForm({
                  ...form,
                  confirmPassword: event.target.value.replace(/\s/g, ""),
                })
              }
            />
          </label>
          <p className="rounded-lg bg-slate-50 p-3 text-xs leading-5 text-slate-600">
            {passwordRule}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button disabled={busy} className="btn-primary">
            {busy ? "Resetting..." : "Reset Password"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Modal({ title, subtitle, onClose, children, compact = false }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        className={`max-h-[calc(100dvh-1.5rem)] w-full min-w-0 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:max-h-[90vh] sm:p-6 ${compact ? "max-w-lg" : "max-w-2xl"}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-maroon-900">{title}</h2>
            {subtitle && (
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {subtitle}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-slate-500"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
