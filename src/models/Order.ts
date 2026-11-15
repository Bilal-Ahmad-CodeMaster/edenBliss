import { randomBytes } from "crypto";
import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";
import { roundMoney } from "@/lib/prices";

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

const orderItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    sizeLabel: { type: String, required: true, trim: true },
    colorName: { type: String, trim: true, default: "" },
    colorSlug: { type: String, trim: true, default: "" },
    hexCode: { type: String, trim: true, default: "" },
    sizeMeasurementsMeters: { type: measurementSchema, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discountApplied: { type: Number, required: true, min: 0, default: 0 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const shippingSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true, default: "" },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const statusEventSchema = new Schema(
  {
    status: { type: String, required: true },
    updatedAt: { type: Date, required: true, default: Date.now },
    note: { type: String, default: "" },
  },
  { _id: false },
);

const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export function createOrderNumber(date = new Date()) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(4);
  let token = "";
  for (const byte of bytes) token += alphabet[byte % alphabet.length];
  return `EB-${date.getFullYear()}-${token}`;
}

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator(value: unknown[]) {
          return Array.isArray(value) && value.length > 0;
        },
        message: "An order needs at least one piece.",
      },
    },
    shippingDetails: { type: shippingSchema, required: true },
    customFitNotes: { type: String, trim: true, default: "" },
    paymentMethod: { type: String, enum: ["COD"], required: true, default: "COD" },
    subtotal: { type: Number, required: true, min: 0 },
    totalDiscount: { type: Number, required: true, min: 0, default: 0 },
    shippingFee: { type: Number, required: true, min: 0, default: 0 },
    taxAmount: { type: Number, required: true, min: 0, default: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    idempotencyKey: { type: String, unique: true, sparse: true },
    status: { type: String, enum: ORDER_STATUSES, required: true, default: "PENDING" },
    statusHistory: { type: [statusEventSchema], default: [] },
  },
  { timestamps: true },
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.pre("validate", function () {
  if (!this.orderNumber) this.orderNumber = createOrderNumber();
  this.paymentMethod = "COD";

  if (Array.isArray(this.items) && this.items.length > 0) {
    const subtotal = this.items.reduce(
      (sum, item) => sum + (item.unitPrice + item.discountApplied) * item.quantity,
      0,
    );
    const totalDiscount = this.items.reduce(
      (sum, item) => sum + item.discountApplied * item.quantity,
      0,
    );
    this.subtotal = roundMoney(subtotal);
    this.totalDiscount = roundMoney(totalDiscount);
    this.items.forEach((item) => {
      item.lineTotal = roundMoney(item.unitPrice * item.quantity);
    });
    this.grandTotal = roundMoney(
      this.subtotal - this.totalDiscount + (this.shippingFee || 0) + (this.taxAmount || 0),
    );
  }

  if (!this.statusHistory?.length) {
    this.statusHistory.push({
      status: this.status || "PENDING",
      updatedAt: new Date(),
      note: "Order placed with cash on delivery.",
    });
  }
});

export type OrderDocument = InferSchemaType<typeof orderSchema> & {
  _id: Types.ObjectId;
};

export const Order = models.Order || model("Order", orderSchema);
