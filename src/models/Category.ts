import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const categorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: { type: String, required: true, trim: true, maxlength: 600 },
    imageUrl: { type: String, default: "" },
    parentCategory: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

categorySchema.index({ parentCategory: 1, isActive: 1 });

categorySchema.pre("validate", function () {
  if (this.parentCategory && String(this.parentCategory) === String(this._id)) {
    throw new Error("A category cannot be its own parent.");
  }
});

export type CategoryDocument = InferSchemaType<typeof categorySchema> & {
  _id: Types.ObjectId;
};

export const Category = models.Category || model("Category", categorySchema);
