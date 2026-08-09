import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { env } from "../config/env.js";
import { STUDENT_PROGRAMS } from "../config/programs.js";

const normalize = (value = "") => value.trim().toLowerCase();
const validEmail = (email, domain) => {
  const normalized = normalize(email);
  return (
    /^[^\s@]+@[^\s@]+$/.test(normalized) && normalized.endsWith(`@${domain}`)
  );
};
const validPassword = (password) =>
  password.length >= 8 &&
  !/\s/.test(password) &&
  /[A-Z]/.test(password) &&
  /[0-9]/.test(password);
const passwordValidationMessage =
  "Password must be at least 8 characters and include one uppercase letter and one number. Spaces are not allowed.";
import { logActivity, notify } from "../services/activityService.js";
const publicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  username: user.username,
  role: user.role,
  studentId: user.studentId,
  employeeId: user.employeeId,
  program: user.program,
  department: user.department,
});
const tokenFor = (user) =>
  jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "8h" });

export async function register(req, res) {
  const role = req.params.role;
  if (!["student", "faculty"].includes(role))
    return res
      .status(404)
      .json({ message: "Registration is unavailable for this role." });
  const name = (req.body.name || "").trim();
  const email = normalize(req.body.email);
  const password = req.body.password || "";
  const domain = role === "student" ? env.studentDomain : env.facultyDomain;
  const roleLabel = role === "student" ? "student" : "faculty";
  if (name.length < 2)
    return res.status(400).json({ message: "Please enter your full name." });
  if (!validEmail(email, domain)) {
    return res.status(400).json({
      message: `Please use your official Holy Angel University ${roleLabel} email (@${domain}).`,
    });
  }
  if (!validPassword(password))
    return res.status(400).json({ message: passwordValidationMessage });
  const existing = await User.findOne({ email });
  if (existing?.registrationStatus === "Pending")
    return res.status(409).json({
      message:
        "An account with this email has already been created and is awaiting administrator approval. You do not need to register again.",
    });
  if (existing?.registrationStatus === "Approved")
    return res.status(409).json({
      message: "An account with this email already exists. Please log in.",
    });
  if (existing)
    return res.status(409).json({
      message:
        "A registration with this email already exists. Please contact the School of Computing administrator.",
    });
  const idField = role === "student" ? "studentId" : "employeeId";
  const idValue = (req.body[idField] || "").trim();
  if (!idValue)
    return res.status(400).json({
      message: `${role === "student" ? "Student" : "Employee"} ID is required.`,
    });
  const program =
    role === "student" ? (req.body.program || "").trim() : undefined;
  if (role === "student" && !STUDENT_PROGRAMS.includes(program))
    return res.status(400).json({ message: "Please select your program." });
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role,
    [idField]: idValue,
    program,
    department:
      role === "faculty" ? (req.body.department || "").trim() : undefined,
    registrationStatus: "Pending",
    accountStatus: "Inactive",
  });
  await logActivity(`${role}_registered`, user.id, "User", user.id, { role });
  const admins = await User.find({
    role: "admin",
    accountStatus: "Active",
  }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      notify(
        admin.id,
        "registration",
        `New ${role} registration`,
        `${name} is awaiting approval.`,
        user.id,
      ),
    ),
  );
  res.status(201).json({
    message: "Registration submitted and awaiting administrator approval.",
    user: publicUser(user),
  });
}

export async function login(req, res) {
  const requestedRole = req.params.role;
  if (!["student", "faculty", "admin"].includes(requestedRole))
    return res.status(404).json({ message: "Unknown role." });
  const password = req.body.password || "";
  if (!validPassword(password))
    return res.status(400).json({ message: passwordValidationMessage });
  const identifier = normalize(
    req.body.identifier || req.body.email || req.body.username,
  );
  const user = await User.findOne(
    requestedRole === "admin"
      ? { username: identifier }
      : { email: identifier },
  ).select("+password");
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials." });
  }
  // The stored database role—not the selected frontend role—is authoritative.
  if (user.role !== requestedRole)
    return res
      .status(403)
      .json({ message: "This account cannot access the selected portal." });
  if (user.role !== "admin" && user.registrationStatus === "Pending")
    return res.status(403).json({
      message:
        "Your account has already been created. Please wait for an administrator to approve your registration before you can access ConsultIO. You do not need to register again.",
    });
  if (user.role !== "admin" && user.registrationStatus === "Rejected")
    return res.status(403).json({
      message:
        "Your registration was not approved. Please contact the system administrator if you believe this requires review.",
    });
  if (user.accountStatus !== "Active")
    return res.status(403).json({
      message:
        "Your account is currently inactive. Please contact the system administrator for assistance.",
    });
  await logActivity("login", user.id, "User", user.id, { role: user.role });
  res.json({ token: tokenFor(user), user: publicUser(user) });
}

export const me = (req, res) => res.json({ user: publicUser(req.user) });

export async function updateProfile(req, res) {
  const allowed = [
    "name",
    "program",
    "yearLevel",
    "department",
    "office",
    "specialization",
    "contactNumber",
  ];
  const updates = Object.fromEntries(
    allowed
      .filter((key) => req.body[key] !== undefined)
      .map((key) => [key, String(req.body[key]).trim()]),
  );
  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  }).select("-password");
  res.json({ message: "Profile updated successfully.", user });
}

export async function ensureAdmin() {
  const existing = await User.findOne({ role: "admin" });
  if (existing) return;
  await User.create({
    name: "ConsultIO Administrator",
    username: env.adminUsername,
    password: await bcrypt.hash(env.adminPassword, 12),
    role: "admin",
    registrationStatus: "Approved",
    accountStatus: "Active",
  });
}
