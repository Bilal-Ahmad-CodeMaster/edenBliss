import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";
import { resolvePricing } from "@/lib/prices";

const productSizeSchema = new Schema(
  {
    sizeId: { type: Schema.Types.ObjectId, ref: "Size", required: true },
    sizeLabel: { type: String, required: true, trim: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const colorVariantSchema = new Schema(
  {
    colorName: { type: String, required: true, trim: true, maxlength: 40 },
    colorSlug: { type: String, required: true, trim: true, lowercase: true, maxlength: 40 },
    hexCode: { type: String, required: true, trim: true, match: /^#[0-9A-Fa-f]{6}$/ },
    images: { type: [String], default: [] },
    outfitLookImages: { type: [String], default: [] },
    sizes: { type: [productSizeSchema], default: [] },
  },
  { _id: false },
);

const productSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 140 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    storyDescription: { type: String, required: true, trim: true, maxlength: 4000 },
    fabricAndCare: { type: String, required: true, trim: true, maxlength: 2000 },
    images: {
      type: [String],
      required: true,
      validate: {
        validator(value: string[]) {
          return Array.isArray(value) && value.length > 0 && value.every((item) => item.trim().length > 0);
        },
        message: "A product needs at least one image.",
      },
    },
    outfitLookImages: { type: [String], default: [] },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    subCategory: { type: Schema.Types.ObjectId, ref: "Category", default: null },
    sizes: { type: [productSizeSchema], default: [] },
    colorVariants: { type: [colorVariantSchema], default: [] },
    basePrice: { type: Number, required: true, min: 0 },
    discountPercentage: { type: Number, required: true, min: 0, max: 90, default: 0 },
    discountAmount: { type: Number, required: true, min: 0, default: 0 },
    finalPrice: { type: Number, required: true, min: 0 },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

productSchema.index({ category: 1, isActive: 1, finalPrice: 1 });
productSchema.index({ subCategory: 1, isActive: 1 });
productSchema.index({ isFeatured: 1, isActive: 1 });
productSchema.index({ title: "text", storyDescription: "text" });

productSchema.pre("validate", function () {
  if (typeof this.basePrice !== "number") return;
  const priced = resolvePricing(
    this.basePrice,
    (this.discountAmount || 0) > 0 ? "flat" : "percent",
    this.discountPercentage || 0,
    this.discountAmount || 0,
  );
  this.basePrice = priced.basePrice;
  this.discountPercentage = priced.discountPercentage;
  this.discountAmount = priced.discountAmount;
  this.finalPrice = priced.finalPrice;
});

export type ProductDocument = InferSchemaType<typeof productSchema> & {
  _id: Types.ObjectId;
};

export const Product = models.Product || model("Product", productSchema);
