import { NextResponse } from "next/server";
import { updateCustomerProfile } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { enqueueJob } from "@/lib/job-queue";
import { sendOrderNotice } from "@/lib/mail";
import { placeCodOrder } from "@/lib/orders";
import { readJson } from "@/lib/sanitize";
import { checkoutFormSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;

  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const parsed = checkoutFormSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the delivery details." },
      { status: 400 },
    );
  }

  try {
    const order = await placeCodOrder(
      auth.user.id,
      parsed.data,
      parsed.data.customFitNotes,
      parsed.data.idempotencyKey,
    );
    if (!order.replayed) {
      enqueueJob(async () => {
        const sent = await sendOrderNotice(order.orderNumber);
        if (!sent) console.error("The order notice was not mailed to the atelier.");
      });
    }
    let profileSaved = false;
    if (parsed.data.saveToProfile) {
      const profile = await updateCustomerProfile(auth.user.id, {
        name: parsed.data.fullName,
        phone: parsed.data.phone,
        street: parsed.data.address,
        city: parsed.data.city,
        state: parsed.data.state,
        postalCode: parsed.data.postalCode,
        country: parsed.data.country,
        removeAvatar: false,
      });
      profileSaved = Boolean(profile);
    }
    return NextResponse.json({
      message: order.replayed ? "This order was already placed." : "Your order is confirmed for cash on delivery.",
      orderNumber: order.orderNumber,
      grandTotal: order.grandTotal,
      status: order.status,
      profileSaved,
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
    if (status >= 500) console.error(error);
    const message =
      status >= 500
        ? "The order could not be placed."
        : error instanceof Error
          ? error.message
          : "The order could not be placed.";
    return NextResponse.json({ message }, { status: status || 500 });
  }
}
