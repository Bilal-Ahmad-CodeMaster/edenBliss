import mongoose, { Schema, model, models, type InferSchemaType, type Types } from "mongoose";

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
    colorName: { type: String, trim: true, default: "" },
    colorSlug: { type: String, trim: true, default: "" },
    hexCode: { type: String, trim: true, default: "" },
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
    passwordResetHash: { type: String, select: false, default: "" },
    passwordResetExpires: { type: Date, select: false, default: null },
    passwordResetAttempts: { type: Number, select: false, default: 0, min: 0 },
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
        Reflect.deleteProperty(safe, "passwordResetHash");
        Reflect.deleteProperty(safe, "passwordResetExpires");
        Reflect.deleteProperty(safe, "passwordResetAttempts");
        return safe;
      },
    },
  },
);

userSchema.index({ isOnline: 1, lastActiveAt: -1 });

if (models.User && !models.User.schema.path("passwordResetHash")) {
  mongoose.deleteModel("User");
}

export type UserDocument = InferSchemaType<typeof userSchema> & {
  _id: Types.ObjectId;
};

export const User = models.User || model("User", userSchema);
