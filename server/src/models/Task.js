import mongoose from "mongoose";
const schema = new mongoose.Schema(
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
    },
    appointment: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment" },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    dueAt: Date,
  },
  { timestamps: true },
);
export default mongoose.model("Task", schema);
