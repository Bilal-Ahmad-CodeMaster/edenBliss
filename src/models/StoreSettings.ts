import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const storeSettingsSchema = new Schema(
  {
    singletonKey: { type: String, required: true, unique: true, default: "eden-bliss", immutable: true },
    storeName: { type: String, required: true, trim: true, default: "Eden Bliss" },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    adminEmail: { type: String, trim: true, lowercase: true, default: "" },
    supportPhone: { type: String, required: true, trim: true },
    whatsappNumber: { type: String, trim: true, default: "" },
    currencySymbol: { type: String, required: true, trim: true, default: "Rs." },
    standardShippingRate: { type: Number, required: true, min: 0, default: 450 },
    freeShippingThreshold: { type: Number, required: true, min: 0, default: 15000 },
    taxPercentage: { type: Number, required: true, min: 0, max: 40, default: 0 },
    announcementBarText: { type: String, required: true, trim: true, maxlength: 240 },
    themeMode: {
      type: String,
      enum: ["warm-linen", "dark-editorial", "sage-minimal"],
      default: "warm-linen",
      required: true,
    },
  },
  { timestamps: true },
);

export type StoreSettingsDocument = InferSchemaType<typeof storeSettingsSchema> & {
  _id: Types.ObjectId;
};

export const StoreSettings = models.StoreSettings || model("StoreSettings", storeSettingsSchema);
