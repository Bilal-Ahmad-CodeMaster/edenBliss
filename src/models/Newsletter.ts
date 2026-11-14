import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const newsletterSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 120 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export type NewsletterDocument = InferSchemaType<typeof newsletterSchema> & {
  _id: Types.ObjectId;
};

export const Newsletter = models.Newsletter || model("Newsletter", newsletterSchema);
