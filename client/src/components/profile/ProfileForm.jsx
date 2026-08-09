import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/apiClient";
export default function ProfilePage({ showSecurity = false }) {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: user.name || "",
    program: user.program || "",
    department: user.department || "",
    yearLevel: user.yearLevel || "",
    office: user.office || "",
    specialization: user.specialization || "",
    contactNumber: user.contactNumber || "",
  });
  const [message, setMessage] = useState("");
  const save = async (e) => {
    e.preventDefault();
    try {
      const data = await api("/auth/me", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      updateUser(data.user);
      setMessage(data.message);
    } catch (error) {
      setMessage(error.message);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Account</p>
        <h1 className="page-title mt-1">My Profile</h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your ConsultIO account information.
        </p>
      </div>
      {message && (
        <div className="rounded-xl bg-maroon-50 p-4 text-sm text-maroon-800">
          {message}
        </div>
      )}
      <form onSubmit={save} className="panel">
        <div className="mb-6 flex items-center gap-4">
          <span className="grid h-20 w-20 place-items-center rounded-2xl bg-maroon-800 text-3xl font-bold text-gold-300 shadow-lg ring-4 ring-maroon-100">
            {user.name?.[0]}
          </span>
          <div>
            <h2 className="font-bold">{user.name}</h2>
            <p className="text-sm text-slate-500">
              {user.email || user.username}
            </p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          {[
            ["name", "Full Name"],
            ["program", "Program"],
            ["yearLevel", "Year Level"],
            ["department", "Department"],
            ["office", "Office"],
            ["specialization", "Specialization"],
            ["contactNumber", "Contact Number"],
          ]
            .filter(([key]) => {
              if (key === "name" || key === "contactNumber") return true;
              return user.role === "student"
                ? ["program", "yearLevel"].includes(key)
                : ["department", "office", "specialization"].includes(key);
            })
            .map(([key, label]) => (
              <label key={key} className="text-sm font-semibold">
                {label}
                <input
                  className="field mt-2"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                />
              </label>
            ))}
          <label className="text-sm font-semibold">
            Official HAU Email
            <input
              className="field mt-2 bg-slate-100"
              value={user.email || ""}
              disabled
            />
          </label>
          <label className="text-sm font-semibold">
            {user.role === "student" ? "Student ID" : "Employee ID"}
            <input
              className="field mt-2 bg-slate-100"
              value={user.studentId || user.employeeId || ""}
              disabled
            />
          </label>
        </div>
        <button className="btn-primary mt-6">Save Profile</button>
      </form>
      {showSecurity && <SecuritySettings />}
    </div>
  );
}

function SecuritySettings() {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [passwords, setPasswords] = useState(empty);
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const change = (key, value) =>
    setPasswords((current) => ({ ...current, [key]: value }));
  const clear = () => {
    setPasswords(empty);
    setVisible({
      currentPassword: false,
      newPassword: false,
      confirmPassword: false,
    });
  };
  const submit = async (event) => {
    event.preventDefault();
    setMessage("");
    setIsError(false);
    if (passwords.newPassword !== passwords.confirmPassword) {
      setIsError(true);
      setMessage("New password and confirmation do not match.");
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setIsError(true);
      setMessage("New password must be different from your current password.");
      return;
    }
    setSubmitting(true);
    try {
      const data = await api("/auth/change-password", {
        method: "PUT",
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
          confirmNewPassword: passwords.confirmPassword,
        }),
      });
      clear();
      setMessage(data.message || "Password changed successfully.");
    } catch (error) {
      setIsError(true);
      setMessage(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section aria-labelledby="security-settings-title" className="space-y-4">
      <div>
        <h2
          id="security-settings-title"
          className="text-xl font-bold text-maroon-900"
        >
          Security Settings
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account password and security.
        </p>
      </div>
      <form onSubmit={submit} className="panel">
        <h3 className="text-lg font-bold text-maroon-900">Change Password</h3>
        <p className="mt-1 text-sm text-slate-500">
          Use at least 8 characters, one uppercase letter, and one number.
          Spaces are not allowed.
        </p>
        {message && (
          <p
            role="status"
            className={`mt-5 rounded-xl border p-3 text-sm ${isError ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-800"}`}
          >
            {message}
          </p>
        )}
        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {[
            ["currentPassword", "Current Password"],
            ["newPassword", "New Password"],
            ["confirmPassword", "Confirm New Password"],
          ].map(([key, label]) => (
            <label key={key} className="text-sm font-semibold">
              {label}
              <span className="relative mt-2 block">
                <input
                  required
                  type={visible[key] ? "text" : "password"}
                  autoComplete={
                    key === "currentPassword"
                      ? "current-password"
                      : "new-password"
                  }
                  className="field pr-11"
                  value={passwords[key]}
                  onChange={(event) => change(key, event.target.value)}
                />
                <button
                  type="button"
                  onClick={() =>
                    setVisible((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                  aria-label={`${visible[key] ? "Hide" : "Show"} ${label.toLowerCase()}`}
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500"
                >
                  {visible[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </span>
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              clear();
              setMessage("");
              setIsError(false);
            }}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </form>
    </section>
  );
}
