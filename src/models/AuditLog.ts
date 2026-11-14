import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const auditLogSchema = new Schema(
  {
    adminId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    action: { type: String, required: true, trim: true, maxlength: 80 },
    targetType: { type: String, required: true, trim: true, maxlength: 40 },
    targetId: { type: String, required: true, trim: true, maxlength: 80 },
    ipAddress: { type: String, default: "", maxlength: 80 },
    userAgent: { type: String, default: "", maxlength: 300 },
    diff: { type: Schema.Types.Mixed, default: {} },
    integrity: { type: String, default: "" },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ adminId: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1 });

function rejectMutation() {
  throw new Error("Audit logs are immutable.");
}

auditLogSchema.pre("updateOne", rejectMutation);
auditLogSchema.pre("updateMany", rejectMutation);
auditLogSchema.pre("findOneAndUpdate", rejectMutation);
auditLogSchema.pre("deleteOne", rejectMutation);
auditLogSchema.pre("deleteMany", rejectMutation);
auditLogSchema.pre("findOneAndDelete", rejectMutation);

export type AuditLogDocument = InferSchemaType<typeof auditLogSchema> & {
  _id: Types.ObjectId;
};

export const AuditLog = models.AuditLog || model("AuditLog", auditLogSchema);
