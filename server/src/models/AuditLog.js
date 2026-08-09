import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true, index: true },
    targetType: String,
    targetId: mongoose.Schema.Types.ObjectId,
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);
schema.index({ createdAt: -1 });
export default mongoose.model("AuditLog", schema);
