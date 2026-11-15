import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const hotspotSchema = new Schema(
  {
    xPercent: { type: Number, required: true, min: 0, max: 100 },
    yPercent: { type: Number, required: true, min: 0, max: 100 },
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    defaultColorSlug: { type: String, trim: true, default: "" },
    stylingNote: { type: String, trim: true, maxlength: 240, default: "" },
  },
  { _id: true },
);

const lookbookSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    seasonTag: { type: String, required: true, trim: true, maxlength: 40 },
    editorialStory: { type: String, required: true, trim: true, maxlength: 2000 },
    coverImage: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true },
    hotspots: { type: [hotspotSchema], default: [] },
  },
  { timestamps: true },
);

lookbookSchema.index({ isActive: 1, createdAt: -1 });

export type LookbookDocument = InferSchemaType<typeof lookbookSchema> & { _id: Types.ObjectId };
export const Lookbook = models.Lookbook || model("Lookbook", lookbookSchema);
