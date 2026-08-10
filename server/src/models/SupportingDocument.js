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
    url: { type: String, trim: true },
    publicId: { type: String, trim: true, select: false },
    resourceType: {
      type: String,
      enum: ["image", "video", "raw"],
      select: false,
    },
    data: { type: Buffer, select: false },
  },
  { timestamps: true },
);

supportingDocumentSchema.pre("validate", function validateStorage(next) {
  if (!this.url && !this.data)
    this.invalidate("url", "A stored file reference is required.");
  if (this.url && (!this.publicId || !this.resourceType))
    this.invalidate("publicId", "Cloud storage metadata is incomplete.");
  next();
});

export default mongoose.model("SupportingDocument", supportingDocumentSchema);
