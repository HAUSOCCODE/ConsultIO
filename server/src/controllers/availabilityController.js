import Availability from "../models/Availability.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

const validateSchedule = ({ startAt, endAt }) => {
  if (!Number.isFinite(startAt.getTime()) || !Number.isFinite(endAt.getTime()))
    return "Select a valid availability date, start time, and end time.";
  if (endAt <= startAt) return "End time must be later than start time.";
  if (startAt <= new Date())
    return "Start time must be later than the current time.";
  return "";
};

const scheduleShape = (availability) => ({
  _id: availability.id,
  availabilityId: availability.id,
  startAt: availability.startAt,
  endAt: availability.endAt,
  mode: availability.mode || "Online",
  location: availability.location,
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
    availability: await Availability.find({ faculty: req.user.id }).sort({
      startAt: 1,
    }),
  });

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
  const availability = await Availability.create({
    faculty: req.user.id,
    startAt,
    endAt,
    location: req.body.location,
    mode: req.body.mode,
  });
  res
    .status(201)
    .json({ message: "Availability published successfully.", availability });
};

export const updateAvailability = async (req, res) => {
  const schedule = await Availability.findOne({
    _id: req.params.id,
    faculty: req.user.id,
  });
  if (!schedule)
    return res.status(404).json({ message: "Availability not found." });
  if (req.body.startAt || req.body.endAt) {
    const startAt = new Date(req.body.startAt || schedule.startAt);
    const endAt = new Date(req.body.endAt || schedule.endAt);
    const validationError = validateSchedule({ startAt, endAt });
    if (validationError)
      return res.status(400).json({ message: validationError });
    if (
      await Appointment.exists({
        availability: schedule.id,
        status: { $in: ["Pending", "Approved", "Rescheduled"] },
      })
    )
      return res.status(409).json({
        message:
          "An availability with consultation requests cannot have its time changed.",
      });
    if (
      await Availability.exists({
        _id: { $ne: schedule.id },
        faculty: req.user.id,
        isActive: true,
        startAt: { $lt: endAt },
        endAt: { $gt: startAt },
      })
    )
      return res
        .status(409)
        .json({ message: "This availability overlaps an existing schedule." });
    schedule.startAt = startAt;
    schedule.endAt = endAt;
  }
  if (typeof req.body.isActive === "boolean")
    schedule.isActive = req.body.isActive;
  if (req.body.location !== undefined) schedule.location = req.body.location;
  if (req.body.mode && ["Face-to-Face", "Online"].includes(req.body.mode))
    schedule.mode = req.body.mode;
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
