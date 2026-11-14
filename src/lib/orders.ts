import "server-only";
import mongoose from "mongoose";
import { summarizeBag } from "@/lib/bag";
import { resolveCartItems, toIncomingCart } from "@/lib/cart";
import { getStoreSettings } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { invalidateCatalogCache } from "@/lib/redis";
import { parsePageLimit, pageCount } from "@/lib/pagination";
import { roundMoney } from "@/lib/prices";
import { enforceRLS, isValidObjectId, stripHtml, type SecuritySession } from "@/lib/security";
import { traceSpan } from "@/lib/telemetry";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { User } from "@/models/User";
import type { CustomerOrder } from "@/types/commerce";

type ShippingInput = {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  country?: string;
};

function cleanShipping(input: ShippingInput): ShippingInput {
  return {
    fullName: stripHtml(input.fullName),
    phone: stripHtml(input.phone),
    email: stripHtml(input.email).toLowerCase(),
    address: stripHtml(input.address),
    city: stripHtml(input.city),
    state: stripHtml(input.state ?? ""),
    postalCode: stripHtml(input.postalCode),
    country: stripHtml(input.country ?? ""),
  };
}

export async function placeCodOrder(userId: string, shipping: ShippingInput, notes: string, idempotencyKey: string) {
  await connectDB();
  const existing = await Order.findOne({ idempotencyKey, user: userId })
    .select("orderNumber grandTotal status")
    .lean<{ orderNumber: string; grandTotal: number; status: string } | null>();
  if (existing && !Array.isArray(existing)) {
    return {
      orderNumber: existing.orderNumber,
      grandTotal: existing.grandTotal,
      status: existing.status,
      replayed: true,
    };
  }

  const user = await User.findById(userId).select("cart").lean<{
    cart?: Parameters<typeof toIncomingCart>[0];
  } | null>();
  const lines = await resolveCartItems(toIncomingCart(user?.cart ?? []));
  if (!lines.length) {
    const error = new Error("Your bag is empty.");
    (error as Error & { status?: number }).status = 400;
    throw error;
  }

  const settings = await getStoreSettings();
  const summary = summarizeBag(lines, settings);
  const shippingFee = summary.shippingFee;
  const taxAmount = summary.taxAmount;
  const items = lines.map((line) => ({
    product: line.productId,
    title: line.title,
    image: line.image,
    sizeLabel: line.sizeLabel,
    sizeMeasurementsMeters: line.sizeMeasurementsMeters,
    quantity: line.quantity,
    unitPrice: line.unitPrice,
    discountApplied: line.discountApplied,
    lineTotal: roundMoney(line.unitPrice * line.quantity),
  }));

  const document = {
    user: userId,
    items,
    shippingDetails: cleanShipping(shipping),
    customFitNotes: stripHtml(notes).slice(0, 1000),
    paymentMethod: "COD" as const,
    shippingFee,
    taxAmount,
    subtotal: 0,
    totalDiscount: 0,
    grandTotal: 0,
    idempotencyKey,
    status: "PENDING" as const,
  };

  async function write(session?: mongoose.ClientSession) {
    const options = session ? { session } : undefined;
    const stock = await Product.bulkWrite(
      lines.map((line) => ({
        updateOne: {
          filter: {
            _id: line.productId,
            isActive: true,
            sizes: { $elemMatch: { sizeLabel: line.sizeLabel, stock: { $gte: line.quantity } } },
          },
          update: { $inc: { "sizes.$.stock": -line.quantity } },
        },
      })),
      options,
    );
    if (stock.modifiedCount !== lines.length) {
      const error = new Error("A piece in your bag is no longer available in that size.");
      (error as Error & { status?: number }).status = 409;
      throw error;
    }
    const created = await Order.create([document], options);
    await User.updateOne({ _id: userId }, { $set: { cart: [] } }, options);
    return created[0];
  }

  const session = await mongoose.startSession();
  try {
    let order;
    session.startTransaction();
    order = await write(session);
    await session.commitTransaction();
    await invalidateCatalogCache();
    return {
      orderNumber: order.orderNumber,
      grandTotal: order.grandTotal,
      status: order.status,
      replayed: false,
    };
  } finally {
    await session.endSession();
  }
}

type OrderLean = {
  _id: { toString(): string };
  orderNumber: string;
  status: string;
  createdAt?: Date;
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  customFitNotes?: string;
  paymentMethod: "COD";
  statusHistory?: { status: string; updatedAt?: Date; note?: string }[];
  items: CustomerOrder["items"];
  shippingDetails: CustomerOrder["shipping"];
};

const ORDER_DETAIL =
  "orderNumber status createdAt subtotal totalDiscount shippingFee taxAmount grandTotal customFitNotes paymentMethod statusHistory items shippingDetails";

function toCustomerOrder(order: OrderLean): CustomerOrder {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
    subtotal: order.subtotal,
    totalDiscount: order.totalDiscount,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount,
    grandTotal: order.grandTotal,
    customFitNotes: order.customFitNotes ?? "",
    paymentMethod: "COD",
    statusHistory: (order.statusHistory ?? []).map((event) => ({
      status: event.status,
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : "",
      note: event.note ?? "",
    })),
    items: order.items ?? [],
    shipping: {
      fullName: order.shippingDetails?.fullName ?? "",
      phone: order.shippingDetails?.phone ?? "",
      email: order.shippingDetails?.email ?? "",
      address: order.shippingDetails?.address ?? "",
      city: order.shippingDetails?.city ?? "",
      state: order.shippingDetails?.state ?? "",
      postalCode: order.shippingDetails?.postalCode ?? "",
      country: order.shippingDetails?.country ?? "",
    },
  };
}

export async function listOwnedOrders(userId: string, pageValue?: unknown) {
  await connectDB();
  const paging = parsePageLimit(pageValue, 10);
  const filter = { user: userId };
  return traceSpan("db.ownedOrders", async () => {
    const [rows, total] = await Promise.all([
      Order.find(filter).select(ORDER_DETAIL).sort({ createdAt: -1 }).skip(paging.skip).limit(paging.limit).lean<OrderLean[]>(),
      Order.countDocuments(filter),
    ]);
    return {
      orders: rows.map(toCustomerOrder),
      page: paging.page,
      pages: pageCount(total, paging.limit),
      total,
    };
  });
}

export async function getOwnedOrder(userId: string, orderNumber: string) {
  if (!/^EB-\d{4}-[A-Z0-9]{4}$/.test(orderNumber)) return null;
  await connectDB();
  const order = await Order.findOne({ user: userId, orderNumber }).select(ORDER_DETAIL).lean<OrderLean | null>();
  return order ? toCustomerOrder(order) : null;
}

export async function listOrders(sessionUser: SecuritySession, pageValue?: unknown, limitValue?: unknown) {
  await connectDB();
  const paging = parsePageLimit(pageValue, limitValue);
  const filter = enforceRLS(sessionUser, {});
  return traceSpan("db.orders", async () => {
    const [rows, total] = await Promise.all([
      Order.find(filter)
        .select("orderNumber status grandTotal createdAt shippingDetails.fullName")
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean(),
      Order.countDocuments(filter),
    ]);
    return {
      orders: rows.map((order) => ({
        id: String(order._id),
        orderNumber: order.orderNumber,
        status: order.status,
        grandTotal: order.grandTotal,
        createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
        fullName: order.shippingDetails?.fullName ?? "",
      })),
      page: paging.page,
      limit: paging.limit,
      total,
      pages: pageCount(total, paging.limit),
    };
  });
}

export async function updateOrderStatus(orderId: string, status: string, note: string) {
  if (!isValidObjectId(orderId)) return null;
  await connectDB();
  return Order.findByIdAndUpdate(
    orderId,
    {
      $set: { status },
      $push: { statusHistory: { status, updatedAt: new Date(), note: stripHtml(note).slice(0, 240) } },
    },
    { returnDocument: "after" },
  )
    .select("orderNumber status")
    .lean<{ orderNumber: string; status: string } | null>();
}
