import "dotenv/config";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import Appointment from "../src/models/Appointment.js";
import Availability from "../src/models/Availability.js";
import Notification from "../src/models/Notification.js";
import User from "../src/models/User.js";
import {
  availabilityStatus,
  processExpiredAvailability,
} from "../src/services/availabilityExpirationService.js";

const stamp = Date.now();
const createdUsers = [];
const check = (condition, label) => {
  if (!condition) throw new Error(`FAILED: ${label}`);
  console.log(`PASS: ${label}`);
};

try {
  await mongoose.connect(process.env.MONGODB_URI);
  const password = await bcrypt.hash("Expiration-QA-2026!", 12);
  const [faculty, student] = await User.create([
    {
      name: "Expiration QA Faculty",
      email: `expiration.faculty.${stamp}@hau.edu.ph`,
      password,
      role: "faculty",
      employeeId: `EXP-F-${stamp}`,
      position: "Professor",
      registrationStatus: "Approved",
      accountStatus: "Active",
    },
    {
      name: "Expiration QA Student",
      email: `expiration.student.${stamp}@student.hau.edu.ph`,
      password,
      role: "student",
      studentId: `EXP-S-${stamp}`,
      program: "Bachelor of Science in Information Technology",
      registrationStatus: "Approved",
      accountStatus: "Active",
    },
  ]);
  createdUsers.push(faculty.id, student.id);

  const expiredEnd = new Date(Date.now() - 1000);
  const expiredStart = new Date(expiredEnd.getTime() - 60 * 60 * 1000);
  const futureEnd = new Date(Date.now() + 60 * 60 * 1000);
  const futureStart = new Date(Date.now() - 10 * 60 * 1000);
  const [expiredSchedule, activeSchedule] = await Availability.create([
    {
      faculty: faculty.id,
      startAt: expiredStart,
      endAt: expiredEnd,
      mode: "Online",
      meetingPlatform: "Google Meet",
      isActive: true,
    },
    {
      faculty: faculty.id,
      startAt: futureStart,
      endAt: futureEnd,
      mode: "Online",
      meetingPlatform: "Google Meet",
      isActive: true,
    },
  ]);
  const [pending, approved] = await Appointment.create([
    {
      student: student.id,
      faculty: faculty.id,
      availability: expiredSchedule.id,
      startAt: expiredStart,
      endAt: expiredEnd,
      estimatedDurationMinutes: 10,
      subject: "Pending Expiration Check",
      reason: "Verify pending expiration processing.",
      status: "Pending",
    },
    {
      student: student.id,
      faculty: faculty.id,
      availability: expiredSchedule.id,
      startAt: expiredStart,
      endAt: expiredEnd,
      estimatedDurationMinutes: 10,
      subject: "Approved Expiration Check",
      reason: "Verify approved status preservation.",
      status: "Approved",
    },
  ]);

  check(
    availabilityStatus(activeSchedule) === "active" &&
      availabilityStatus(expiredSchedule) === "expired",
    "status is derived from the exact end timestamp",
  );
  await processExpiredAvailability({ facultyId: faculty.id });
  check(
    (await Appointment.findById(pending.id)).status === "Needs Reschedule",
    "Pending appointment becomes Needs Reschedule",
  );
  check(
    (await Appointment.findById(approved.id)).status === "Approved",
    "Approved appointment remains Approved",
  );
  check(
    (await Availability.countDocuments({
      faculty: faculty.id,
      isActive: true,
      endAt: { $gt: new Date() },
    })) === 1,
    "bookable and dashboard counts exclude the expired schedule",
  );
  check(
    (await Notification.countDocuments({
      recipient: student.id,
      relatedEntityId: pending.id,
      title: "Consultation Reschedule Required",
    })) === 1,
    "affected Student receives one reschedule notification",
  );
  await processExpiredAvailability({ facultyId: faculty.id });
  check(
    (await Notification.countDocuments({
      recipient: faculty.id,
      relatedEntityId: expiredSchedule.id,
      title: "Consultation Schedule Expired",
    })) === 1,
    "Faculty expiration notification remains idempotent",
  );
  console.log("EXPIRATION_E2E_RESULT=PASS");
} finally {
  if (createdUsers.length) {
    await Promise.all([
      Appointment.deleteMany({
        $or: [
          { student: { $in: createdUsers } },
          { faculty: { $in: createdUsers } },
        ],
      }),
      Availability.deleteMany({ faculty: { $in: createdUsers } }),
      Notification.deleteMany({ recipient: { $in: createdUsers } }),
      User.deleteMany({ _id: { $in: createdUsers } }),
    ]);
  }
  await mongoose.disconnect();
}
