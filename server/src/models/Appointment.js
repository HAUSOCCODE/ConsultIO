import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    availability: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Availability",
      required: true,
    },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    estimatedDurationMinutes: { type: Number, min: 5, max: 1440 },
    subject: { type: String, required: true, trim: true, maxlength: 150 },
    yearLevel: {
      type: String,
      enum: ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"],
    },
    reason: { type: String, required: true, trim: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 1000 },
    consultationMode: {
      type: String,
      enum: ["Face-to-Face", "Online"],
      default: "Online",
    },
    location: { type: String, trim: true, maxlength: 150 },
    supportingDocument: {
      name: { type: String, trim: true, maxlength: 200 },
      mimeType: { type: String, trim: true, maxlength: 100 },
      size: { type: Number, min: 0 },
      data: { type: String, select: false },
    },
    // Legacy entries can be ObjectIds. New uploads are embedded Cloudinary metadata.
    supportingDocuments: [mongoose.Schema.Types.Mixed],
    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Needs Reschedule",
        "Rescheduled",
        "Completed",
        "No Show",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },
    responseNote: { type: String, trim: true, maxlength: 500 },
    rescheduleRequested: { type: Boolean, default: false },
    rescheduleRequestNote: { type: String, trim: true, maxlength: 500 },
    rescheduleRequestStatus: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
    },
    rescheduleRequestedAt: Date,
    rescheduleReviewedAt: Date,
    rescheduleReviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rescheduleDecisionNote: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

appointmentSchema.index({ faculty: 1, startAt: 1, status: 1 });
appointmentSchema.index({ faculty: 1, availability: 1, status: 1 });
appointmentSchema.index({ student: 1, startAt: 1, status: 1 });
export default mongoose.model("Appointment", appointmentSchema);
