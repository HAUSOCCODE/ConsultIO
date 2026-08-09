import { Router } from "express";
import Appointment from "../models/Appointment.js";
import Availability from "../models/Availability.js";
import User from "../models/User.js";
import SupportingDocument from "../models/SupportingDocument.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { supportingDocumentUpload } from "../middleware/supportingDocumentUpload.js";
import { logActivity, notify } from "../services/activityService.js";
const router = Router();
router.use(authenticate);

const documentSize = (data = "") => {
  const encoded = data.split(",")[1] || "";
  return Buffer.from(encoded, "base64").length;
};

const capacitySummary = async (facultyId) => {
  const appointments = await Appointment.find({
    faculty: facultyId,
    status: { $in: ["Pending", "Approved", "Rescheduled"] },
  }).select("availability status estimatedDurationMinutes");
  const availabilityIds = [
    ...new Set(appointments.map((item) => String(item.availability))),
  ];
  const schedules = await Availability.find({
    _id: { $in: availabilityIds },
  }).select("startAt endAt");
  return schedules.map((schedule) => {
    const related = appointments.filter(
      (item) => String(item.availability) === schedule.id,
    );
    const pending = related.filter((item) => item.status === "Pending");
    const approved = related.filter((item) =>
      ["Approved", "Rescheduled"].includes(item.status),
    );
    const sum = (items) =>
      items.reduce(
        (total, item) => total + (item.estimatedDurationMinutes || 0),
        0,
      );
    return {
      availabilityId: schedule.id,
      startAt: schedule.startAt,
      endAt: schedule.endAt,
      capacityMinutes: Math.round((schedule.endAt - schedule.startAt) / 60000),
      pendingCount: pending.length,
      pendingEstimatedMinutes: sum(pending),
      approvedEstimatedMinutes: sum(approved),
      totalEstimatedMinutes: sum(related),
    };
  });
};

router.get("/mine", authorize("student", "faculty"), async (req, res) => {
  const query =
    req.user.role === "student"
      ? { student: req.user.id }
      : { faculty: req.user.id };
  const appointments = await Appointment.find(query)
    .populate("student", "name email studentId program yearLevel")
    .populate(
      "faculty",
      "name email department specialization office designation",
    )
    .populate("supportingDocuments", "originalName mimeType size createdAt")
    .populate("availability", "startAt endAt mode location")
    .sort({ startAt: -1 });
  res.json({
    appointments,
    ...(req.user.role === "faculty" && {
      availabilityCapacity: await capacitySummary(req.user.id),
    }),
  });
});
router.post(
  "/",
  authorize("student"),
  supportingDocumentUpload,
  async (req, res) => {
    const slot = await Availability.findOne({
      _id: req.body.availabilityId,
      isActive: true,
    });
    const requestedStart = slot?.startAt;
    const requestedEnd = slot?.endAt;
    const estimatedDurationMinutes = Number(req.body.estimatedDurationMinutes);
    const windowMinutes = slot
      ? Math.round((slot.endAt - slot.startAt) / 60000)
      : 0;
    if (!slot || slot.endAt <= new Date())
      return res.status(400).json({
        message: "This faculty availability is unavailable or in the past.",
      });
    if (
      !Number.isInteger(estimatedDurationMinutes) ||
      estimatedDurationMinutes < 5 ||
      estimatedDurationMinutes > windowMinutes
    )
      return res.status(400).json({
        message: `Estimated consultation time must be between 5 and ${windowMinutes} minutes.`,
      });
    const facultyIsAvailable = await User.exists({
      _id: slot.faculty,
      role: "faculty",
      registrationStatus: "Approved",
      accountStatus: "Active",
    });
    if (!facultyIsAvailable)
      return res.status(400).json({
        message: "This faculty member is not currently available for booking.",
      });
    const existingActiveRequest = await Appointment.exists({
      student: req.user.id,
      availability: slot.id,
      status: { $in: ["Pending", "Approved", "Rescheduled"] },
    });
    if (existingActiveRequest)
      return res.status(409).json({
        message:
          "You already have an active consultation request for this faculty schedule.",
      });
    const subject = (req.body.subject || "").trim();
    const reason = (req.body.reason || "").trim();
    if (!subject || !reason)
      return res
        .status(400)
        .json({ message: "Subject and reason are required." });
    const appointment = await Appointment.create({
      student: req.user.id,
      faculty: slot.faculty,
      availability: slot.id,
      startAt: requestedStart,
      endAt: requestedEnd,
      estimatedDurationMinutes,
      subject,
      reason,
      notes: req.body.notes,
      consultationMode: slot.mode || "Online",
      location: slot.location,
    });
    try {
      if (req.files?.length) {
        const documents = await SupportingDocument.insertMany(
          req.files.map((file) => ({
            appointment: appointment.id,
            uploadedBy: req.user.id,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            data: file.buffer,
          })),
        );
        appointment.supportingDocuments = documents.map(
          (document) => document.id,
        );
        await appointment.save();
      }
    } catch (documentError) {
      await Promise.all([
        SupportingDocument.deleteMany({ appointment: appointment.id }),
        Appointment.deleteOne({ _id: appointment.id }),
      ]);
      throw documentError;
    }
    await Promise.all([
      logActivity(
        "appointment_created",
        req.user.id,
        "Appointment",
        appointment.id,
      ),
      notify(
        slot.faculty,
        "appointment",
        "New Consultation Request",
        `${req.user.name} submitted a consultation request.`,
        appointment.id,
      ),
      notify(
        req.user.id,
        "appointment",
        "Consultation Request Submitted",
        "Your consultation request was submitted and is awaiting the faculty member's decision.",
        appointment.id,
      ),
    ]);
    res.status(201).json({
      message: "Consultation request submitted successfully.",
      appointment,
    });
  },
);

router.get(
  "/:id/documents/:documentId",
  authorize("student", "faculty", "admin"),
  async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).select(
      "student faculty supportingDocuments",
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });
    const allowed =
      req.user.role === "admin" ||
      String(appointment.student) === req.user.id ||
      String(appointment.faculty) === req.user.id;
    if (!allowed)
      return res
        .status(403)
        .json({ message: "Unauthorized for this document." });
    if (
      !appointment.supportingDocuments.some(
        (id) => String(id) === req.params.documentId,
      )
    )
      return res
        .status(404)
        .json({ message: "Supporting document not found." });
    const document = await SupportingDocument.findOne({
      _id: req.params.documentId,
      appointment: appointment.id,
    }).select("+data");
    if (!document)
      return res
        .status(404)
        .json({ message: "Supporting document not found." });
    res.json({
      supportingDocument: {
        _id: document.id,
        name: document.originalName,
        mimeType: document.mimeType,
        size: document.size,
        data: `data:${document.mimeType};base64,${document.data.toString("base64")}`,
      },
    });
  },
);
router.get(
  "/:id/document",
  authorize("student", "faculty", "admin"),
  async (req, res) => {
    const appointment = await Appointment.findById(req.params.id).select(
      "+supportingDocument.data student faculty",
    );
    if (!appointment)
      return res.status(404).json({ message: "Appointment not found." });
    const allowed =
      req.user.role === "admin" ||
      String(appointment.student) === req.user.id ||
      String(appointment.faculty) === req.user.id;
    if (!allowed)
      return res
        .status(403)
        .json({ message: "Unauthorized for this document." });
    if (!appointment.supportingDocument?.data)
      return res
        .status(404)
        .json({ message: "No supporting document attached." });
    const supportingDocument = appointment.supportingDocument.toObject();
    supportingDocument.size ||= documentSize(supportingDocument.data);
    res.json({ supportingDocument });
  },
);
router.put("/:id/status", authorize("faculty"), async (req, res) => {
  const status = req.body.status;
  if (!["Approved", "Rejected", "Completed", "Rescheduled"].includes(status))
    return res.status(400).json({ message: "Invalid appointment status." });
  const appointment = await Appointment.findOne({
    _id: req.params.id,
    faculty: req.user.id,
  });
  if (!appointment)
    return res.status(404).json({ message: "Appointment not found." });
  if (["Rejected", "Completed"].includes(appointment.status))
    return res
      .status(409)
      .json({ message: "This appointment can no longer be updated." });
  if (status === "Rescheduled") {
    const slot = await Availability.findOne({
      _id: req.body.availabilityId,
      faculty: req.user.id,
      isActive: true,
      endAt: { $gt: new Date() },
    });
    if (!slot)
      return res
        .status(400)
        .json({ message: "Select a valid future availability schedule." });
    const proposedStart = slot.startAt;
    const proposedEnd = slot.endAt;
    const windowMinutes = Math.round((proposedEnd - proposedStart) / 60000);
    if ((appointment.estimatedDurationMinutes || 0) > windowMinutes)
      return res.status(400).json({
        message:
          "The availability window is shorter than the estimated consultation time.",
      });
    appointment.availability = slot.id;
    appointment.startAt = proposedStart;
    appointment.endAt = proposedEnd;
    appointment.consultationMode = slot.mode || "Online";
    appointment.location = slot.location;
  }
  appointment.status = status;
  appointment.responseNote = (req.body.note || "").trim();
  if (status === "Rescheduled") {
    appointment.rescheduleRequested = false;
    appointment.rescheduleRequestNote = "";
  }
  await appointment.save();
  const verb = status.toLowerCase();
  const notificationTitles = {
    Approved: "Consultation Approved",
    Rejected: "Consultation Request Rejected",
    Rescheduled: "Consultation Rescheduled",
    Completed: "Consultation Completed",
  };
  await Promise.all([
    logActivity(
      `appointment_${verb}`,
      req.user.id,
      "Appointment",
      appointment.id,
    ),
    notify(
      appointment.student,
      "appointment",
      notificationTitles[status],
      `Your consultation request is now ${status}.`,
      appointment.id,
    ),
  ]);
  res.json({ message: `Appointment ${verb}.`, appointment });
});
router.put("/:id/cancel", authorize("student"), async (req, res) => {
  const appointment = await Appointment.findOneAndUpdate(
    {
      _id: req.params.id,
      student: req.user.id,
      status: { $in: ["Pending", "Approved", "Rescheduled"] },
      startAt: { $gt: new Date() },
    },
    { status: "Cancelled" },
    { new: true },
  );
  if (!appointment)
    return res
      .status(409)
      .json({ message: "This appointment cannot be cancelled." });
  await Promise.all([
    logActivity(
      "appointment_cancelled",
      req.user.id,
      "Appointment",
      appointment.id,
    ),
    notify(
      appointment.faculty,
      "appointment",
      "Consultation Cancelled",
      `${req.user.name} cancelled a consultation.`,
      appointment.id,
    ),
    notify(
      req.user.id,
      "appointment",
      "Consultation Cancelled",
      "Your consultation was cancelled.",
      appointment.id,
    ),
  ]);
  res.json({ message: "Appointment cancelled.", appointment });
});
router.put(
  "/:id/request-reschedule",
  authorize("student"),
  async (req, res) => {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      student: req.user.id,
      status: { $in: ["Approved", "Rescheduled"] },
      startAt: { $gt: new Date() },
    });
    if (!appointment)
      return res
        .status(409)
        .json({ message: "This appointment cannot be rescheduled." });
    appointment.rescheduleRequested = true;
    appointment.rescheduleRequestNote = (req.body.note || "").trim();
    await appointment.save();
    await notify(
      appointment.faculty,
      "appointment",
      "Reschedule requested",
      `${req.user.name} requested a consultation reschedule.`,
      appointment.id,
    );
    res.json({
      message: "Reschedule request sent to the faculty member.",
      appointment,
    });
  },
);
export default router;
