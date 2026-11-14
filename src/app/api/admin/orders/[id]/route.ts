import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { getAdminOrder } from "@/lib/admin-write";
import { updateOrderStatus } from "@/lib/orders";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta, stripHtml } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });
  const { id } = await context.params;
  const order = await getAdminOrder(id);
  if (!order) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return NextResponse.json({ order });
}

const statusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().trim().max(240).optional().default(""),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });

  const parsed = statusSchema.safeParse(await readJson(request));
  if (!parsed.success) return NextResponse.json({ message: "Choose a valid order status." }, { status: 400 });

  const order = await updateOrderStatus(id, parsed.data.status, stripHtml(parsed.data.note));
  if (!order || Array.isArray(order)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  recordAudit({
    adminId: auth.user.id,
    action: "UPDATE_ORDER_STATUS",
    targetType: "Order",
    targetId: id,
    ...requestMeta(request),
    diff: { status: parsed.data.status },
  });
  return NextResponse.json({ message: "The order status has been updated.", status: order.status });
}
