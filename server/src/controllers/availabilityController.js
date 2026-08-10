import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { logActivity, notify } from "../services/activityService.js";

const validateSchedule = ({ startAt, endAt }) => {
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()))
    return "Select a valid availability date, start time, and end time.";
  if (endAt <= startAt) return "End time must be later than start time.";
  if (startAt <= new Date())
    return "Start time must be later than the current time.";
  return "";
};

const validMeetingLink = (value) => {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && Boolean(url.hostname);
  } catch {
    return false;
  }
};

const legacyPlatform = (availability) => {
  if (availability.meetingPlatform) return availability.meetingPlatform;
  return "Meeting platform not provided";
};

const validateModeFields = ({
  mode,
  location,
  meetingPlatform,
  meetingLink,
}) => {
  if (mode === "Face-to-Face" && !location?.trim())
    return "Location is required for face-to-face availability.";
  if (mode === "Online" && !meetingPlatform?.trim())
    return "Meeting platform is required for online availability.";
  if (
    mode === "Online" &&
    meetingLink?.trim() &&
    !validMeetingLink(meetingLink.trim())
  )
    return "Please enter a valid meeting link.";
  return "";
};

const scheduleShape = (availability) => ({
  _id: availability.id,
  availabilityId: availability.id,
  startAt: availability.startAt,
  endAt: availability.endAt,
  mode: availability.mode || "Online",
  location:
    availability.mode === "Face-to-Face" ? availability.location : undefined,
  meetingPlatform:
    availability.mode === "Online" ? legacyPlatform(availability) : undefined,
});

export const getAvailableFaculty = async (_req, res) => {
  const faculty = await User.find({
    role: "faculty",
    registrationStatus: "Approved",
    accountStatus: "Active",
  }).select(
    "name email employeeId department specialization office designation",
  );
  const ids = faculty.map((item) => item.id);
  const availability = await Availability.find({
    faculty: { $in: ids },
    isActive: true,
    endAt: { $gt: new Date() },
  });
  const counts = Object.fromEntries(faculty.map((item) => [item.id, 0]));
  const modes = Object.fromEntries(faculty.map((item) => [item.id, new Set()]));
  availability.forEach((item) => {
    counts[item.faculty] += 1;
    modes[item.faculty].add(item.mode || "Online");
  });
  res.json({
    faculty: faculty.map((item) => ({
      ...item.toObject(),
      availableScheduleCount: counts[item.id],
      consultationModes: [...modes[item.id]],
    })),
  });
};

export const getFacultyAvailability = async (req, res) => {
  const schedules = await Availability.find({
    faculty: req.params.facultyId,
    isActive: true,
    endAt: { $gt: new Date() },
  }).sort({ startAt: 1 });
  const activeRequests =
    req.user.role === "student"
      ? await Appointment.find({
          student: req.user.id,
          availability: { $in: schedules.map((schedule) => schedule.id) },
          status: { $in: ["Pending", "Approved", "Rescheduled"] },
        }).select("availability status")
      : [];
  const requestByAvailability = new Map(
    activeRequests.map((appointment) => [
      String(appointment.availability),
      appointment,
    ]),
  );
  res.json({
    schedules: schedules.map((schedule) => {
      const activeRequest = requestByAvailability.get(schedule.id);
      return {
        ...scheduleShape(schedule),
        hasActiveRequest: Boolean(activeRequest),
        requestStatus: activeRequest?.status || null,
        appointmentId: activeRequest?.id || null,
      };
    }),
  });
};

export const getMyAvailability = async (req, res) =>
  res.json({
    availability: await Availability.find({ faculty: req.user.id })
      .select("+meetingLink")
      .sort({ startAt: 1 }),
  });

export const getAvailabilityDetails = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id))
    return res.status(400).json({ message: "Invalid availability ID." });
  const schedule = await Availability.findOne({
    _id: req.params.id,
    faculty: req.user.id,
  }).select("+meetingLink");
  if (!schedule)
    return res.status(404).json({ message: "Availability not found." });
  const approvedStudents = await Appointment.find({
    availability: schedule.id,
    faculty: req.user.id,
    status: { $in: ["Approved", "Rescheduled"] },
  })
    .populate("student", "name email studentId program yearLevel")
    .populate("supportingDocuments", "originalName mimeType size createdAt")
    .sort({ startAt: 1, createdAt: 1 });
  res.json({ schedule, approvedStudents });
};

export const requestFacultyReschedule = async (req, res) => {
  if (
    !mongoose.isValidObjectId(req.params.id) ||
    !mongoose.isValidObjectId(req.params.appointmentId)
  )
    return res.status(400).json({ message: "Invalid schedule or appointment ID." });
  const schedule = await Availability.findOne({
    _id: req.params.id,
    faculty: req.user.id,
  });
  if (!schedule)
    return res.status(404).json({ message: "Availability not found." });
  const appointment = await Appointment.findOne({
    _id: req.params.appointmentId,
    availability: schedule.id,
    faculty: req.user.id,
  });
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found for this schedule." });
  if (!["Approved", "Rescheduled"].includes(appointment.status))
    return res.status(400).json({
      message: "Only an approved or scheduled appointment can be rescheduled.",
    });
  appointment.status = "Needs Reschedule";
  appointment.responseNote = (req.body.note || "").trim();
  appointment.rescheduleRequested = false;
  appointment.rescheduleRequestNote = "";
  await appointment.save();
  await Promise.all([
    logActivity(
      "appointment_reschedule_required",
      req.user.id,
      "Appointment",
      appointment.id,
      { availabilityId: schedule.id },
    ),
    notify(
      appointment.student,
      "appointment",
      "Consultation Reschedule Required",
      "Your faculty member has requested that your consultation be rescheduled. Please select another available schedule.",
      appointment.id,
    ),
  ]);
  res.json({
    message: "The student was removed from this schedule and notified to choose a new schedule.",
    appointment,
  });
};

export const createAvailability = async (req, res) => {
  const startAt = new Date(req.body.startAt);
  const endAt = new Date(req.body.endAt);
  const validationError = validateSchedule({ startAt, endAt });
  if (validationError)
    return res.status(400).json({ message: validationError });
  if (
    await Availability.exists({
      faculty: req.user.id,
      isActive: true,
      startAt: { $lt: endAt },
      endAt: { $gt: startAt },
    })
  )
    return res
      .status(409)
      .json({ message: "This availability overlaps an existing schedule." });
  if (!["Face-to-Face", "Online"].includes(req.body.mode))
    return res
      .status(400)
      .json({ message: "Select a valid consultation mode." });
  const modeValidation = validateModeFields(req.body);
  if (modeValidation) return res.status(400).json({ message: modeValidation });
  const availability = await Availability.create({
    faculty: req.user.id,
    startAt,
    endAt,
    location: req.body.mode === "Face-to-Face" ? req.body.location.trim() : "",
    mode: req.body.mode,
    meetingPlatform:
      req.body.mode === "Online" ? req.body.meetingPlatform.trim() : "",
    meetingLink: req.body.mode === "Online" ? req.body.meetingLink.trim() : "",
  });
  res
    .status(201)
    .json({ message: "Availability published successfully.", availability });
};

export const updateAvailability = async (req, res) => {
  const schedule = await Availability.findOne({
    _id: req.params.id,
    faculty: req.user.id,
  }).select("+meetingLink");
  if (!schedule)
    return res.status(404).json({ message: "Availability not found." });
  if (req.body.startAt || req.body.endAt) {
    const startAt = new Date(req.body.startAt || schedule.startAt);
    const endAt = new Date(req.body.endAt || schedule.endAt);
    const validationError = validateSchedule({ startAt, endAt });
    if (validationError)
      return res.status(400).json({ message: validationError });
    const changesTime =
      startAt.getTime() !== schedule.startAt.getTime() ||
      endAt.getTime() !== schedule.endAt.getTime();
    if (
      changesTime &&
      (await Appointment.exists({
        availability: schedule.id,
        status: { $in: ["Pending", "Approved", "Rescheduled"] },
      }))
    )
      return res.status(409).json({
        message:
          "An availability with consultation requests cannot have its time changed.",
      });
    if (
      changesTime &&
      (await Availability.exists({
        _id: { $ne: schedule.id },
        faculty: req.user.id,
        isActive: true,
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      }))
    )
      return res
        .status(409)
        .json({ message: "This availability overlaps an existing schedule." });
    schedule.startAt = startAt;
    schedule.endAt = endAt;
  }
  if (typeof req.body.isActive === "boolean")
    schedule.isActive = req.body.isActive;
  const updatesModeFields = [
    "mode",
    "location",
    "meetingPlatform",
    "meetingLink",
  ].some((field) => req.body[field] !== undefined);
  if (updatesModeFields) {
    const mode = req.body.mode || schedule.mode;
    if (!["Face-to-Face", "Online"].includes(mode))
      return res
        .status(400)
        .json({ message: "Select a valid consultation mode." });
    const modeFields = {
      mode,
      location: req.body.location ?? schedule.location,
      meetingPlatform: req.body.meetingPlatform ?? schedule.meetingPlatform,
      meetingLink: req.body.meetingLink ?? schedule.meetingLink,
    };
    const modeValidation = validateModeFields(modeFields);
    if (modeValidation)
      return res.status(400).json({ message: modeValidation });
    schedule.mode = mode;
    schedule.location =
      mode === "Face-to-Face" ? modeFields.location.trim() : "";
    schedule.meetingPlatform =
      mode === "Online" ? modeFields.meetingPlatform.trim() : "";
    schedule.meetingLink =
      mode === "Online" ? modeFields.meetingLink.trim() : "";
  }
  await schedule.save();
  res.json({
    message: req.body.startAt
      ? "Availability updated."
      : `Availability ${schedule.isActive ? "activated" : "deactivated"}.`,
    availability: schedule,
  });
};

export const deleteAvailability = async (req, res) => {
  if (
    await Appointment.exists({
      availability: req.params.id,
      status: { $in: ["Pending", "Approved", "Rescheduled"] },
    })
  )
    return res.status(409).json({
      message:
        "An availability with active consultation requests cannot be removed.",
    });
  const schedule = await Availability.findOneAndDelete({
    _id: req.params.id,
    faculty: req.user.id,
  });
  if (!schedule)
    return res.status(404).json({ message: "Availability not found." });
  res.json({ message: "Availability removed." });
};
