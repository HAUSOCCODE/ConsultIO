import mongoose from "mongoose";

const supportingDocumentSchema = new mongoose.Schema(
  {
    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      index: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    originalName: { type: String, required: true, trim: true, maxlength: 255 },
    mimeType: { type: String, required: true, trim: true, maxlength: 150 },
    size: { type: Number, required: true, min: 0, max: 10 * 1024 * 1024 },
    data: { type: Buffer, required: true, select: false },
  },
  { timestamps: true },
);

export default mongoose.model("SupportingDocument", supportingDocumentSchema);
