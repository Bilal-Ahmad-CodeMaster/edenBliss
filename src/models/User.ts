import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

const measurementSchema = new Schema(
  {
    chest: { type: Number, required: true, min: 0 },
    waist: { type: Number, required: true, min: 0 },
    shoulder: { type: Number, required: true, min: 0 },
    length: { type: Number, required: true, min: 0 },
    sleeve: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const addressSchema = new Schema(
  {
    street: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "" },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, trim: true, default: "" },
    country: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const cartItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    sizeLabel: { type: String, required: true, trim: true },
    sizeMeasurementsMeters: { type: measurementSchema, required: true },
    quantity: { type: Number, required: true, min: 1, max: 10 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, required: true, min: 0, default: 0 },
  },
  { _id: false },
);

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 120,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["USER", "ADMIN"], default: "USER", required: true },
    avatarUrl: { type: String, default: "" },
    phone: { type: String, trim: true, default: "" },
    shippingAddress: { type: addressSchema, default: undefined },
    isBlocked: { type: Boolean, default: false, index: true },
    isOnline: { type: Boolean, default: false },
    lastActiveAt: { type: Date, default: null },
    wishlist: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    cart: { type: [cartItemSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        const safe = { ...ret };
        Reflect.deleteProperty(safe, "passwordHash");
        return safe;
      },
    },
  },
);

userSchema.index({ isOnline: 1, lastActiveAt: -1 });

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const User = models.User || model("User", userSchema);
