import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { buildCodSlips, type SlipOrder } from "@/lib/pdf-slip";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta } from "@/lib/security";
import { Order } from "@/models/Order";
import type { GarmentMeasurements } from "@/lib/measurements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  ids: z.array(z.string().trim()).min(1).max(20),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });

  const parsed = bodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: "Choose an order before printing the slip." }, { status: 400 });
  }
  if (parsed.data.ids.some((id) => !isValidObjectId(id))) {
    return NextResponse.json({ message: "Choose a valid order." }, { status: 400 });
  }

  await connectDB();
  const orders = await Order.find({ _id: { $in: parsed.data.ids } })
    .select("orderNumber status createdAt customFitNotes subtotal totalDiscount shippingFee grandTotal shippingDetails items")
    .lean<
      Array<{
        _id: { toString(): string };
        orderNumber: string;
        status: string;
        createdAt?: Date;
        customFitNotes?: string;
        subtotal: number;
        totalDiscount: number;
        shippingFee: number;
        grandTotal: number;
        shippingDetails: SlipOrder["shippingDetails"];
        items: SlipOrder["items"] & Array<{ sizeMeasurementsMeters?: GarmentMeasurements }>;
      }>
    >();

  if (orders.length !== parsed.data.ids.length) {
    return NextResponse.json({ message: "One of those orders was not found." }, { status: 404 });
  }

  const settings = await getStoreSettings();
  const slips: SlipOrder[] = orders.map((order) => ({
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
    customFitNotes: order.customFitNotes ?? "",
    subtotal: order.subtotal,
    totalDiscount: order.totalDiscount,
    shippingFee: order.shippingFee,
    grandTotal: order.grandTotal,
    shippingDetails: order.shippingDetails,
    items: order.items,
  }));
  const pdf = buildCodSlips(slips, { email: settings.supportEmail, phone: settings.supportPhone }, settings.currencySymbol);
  const meta = requestMeta(request);
  for (const order of orders) {
    recordAudit({
      adminId: auth.user.id,
      action: "EXPORT_ORDER_PDF",
      targetType: "Order",
      targetId: String(order._id),
      ...meta,
      diff: { orderNumber: order.orderNumber },
    });
  }

  return new NextResponse(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="eden-bliss-cod-slips.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
