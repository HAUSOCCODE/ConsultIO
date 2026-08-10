import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/apiClient";
import { useToast } from "../../context/ToastContext";
import ProfilePictureEditor from "./ProfilePictureEditor";
export default function ProfilePage({ showSecurity = false }) {
  const { user, updateUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({
    name: user.name || "",
    program: user.program || "",
    department: user.department || "",
    yearLevel: user.yearLevel || "",
    office: user.office || "",
    specialization: user.specialization || "",
    contactNumber: user.contactNumber || "",
  });
  const save = async (e) => {
    e.preventDefault();
    try {
      const data = await api("/auth/me", {
        method: "PUT",
        body: JSON.stringify(form),
      });
      updateUser(data.user);
      toast.success(data.message || "Profile updated successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to update profile.");
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
      <form onSubmit={save} className="panel">
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <ProfilePictureEditor />
          <div className="min-w-0">
            <h2 className="font-bold">{user.name}</h2>
            <p className="break-all text-sm text-slate-500">
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
  const toast = useToast();
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [passwords, setPasswords] = useState(empty);
  const [visible, setVisible] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [validationError, setValidationError] = useState("");
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
    setValidationError("");
    if (passwords.newPassword !== passwords.confirmPassword) {
      setValidationError("New password and confirmation do not match.");
      return;
    }
    if (passwords.currentPassword === passwords.newPassword) {
      setValidationError("New password must be different from your current password.");
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
      toast.success(data.message || "Password changed successfully.");
    } catch (error) {
      toast.error(error.message || "Unable to change password.");
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
        {validationError && (
          <p
            role="alert"
            className="mt-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {validationError}
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
              setValidationError("");
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
