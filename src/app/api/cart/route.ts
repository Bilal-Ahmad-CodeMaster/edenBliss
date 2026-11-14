import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { readStoredCart, resolveCartItems, saveUserCart } from "@/lib/cart";
import { readJson } from "@/lib/sanitize";
import { cartReplaceSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const items = await readStoredCart(auth.user.id);
  return NextResponse.json({ items });
}

export async function PUT(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const parsed = cartReplaceSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "The bag could not be read." },
      { status: 400 },
    );
  }

  const items = await resolveCartItems(parsed.data.items);
  await saveUserCart(auth.user.id, items);
  return NextResponse.json({ items });
}
