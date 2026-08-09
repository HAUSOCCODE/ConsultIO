import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../api/apiClient";
export default function ProfilePage() {
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
    </div>
  );
}
