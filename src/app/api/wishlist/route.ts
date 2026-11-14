import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { readJson } from "@/lib/sanitize";
import { isObjectId } from "@/lib/utils";
import { wishlistToggleSchema } from "@/lib/validators";
import { saveUserWishlist } from "@/lib/wishlist";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }
  return NextResponse.json({ wishlist: auth.user.wishlist });
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const parsed = wishlistToggleSchema.safeParse(await readJson(request));
  if (!parsed.success || !isObjectId(parsed.data.productId)) {
    return NextResponse.json({ message: "Choose a piece from the shop." }, { status: 400 });
  }

  const user = await User.findById(auth.user.id).select("wishlist");
  const current = (user?.wishlist ?? []).map((id: { toString(): string }) => String(id));
  const productId = parsed.data.productId;
  const next = current.includes(productId)
    ? current.filter((id: string) => id !== productId)
    : [...current, productId];

  const wishlist = await saveUserWishlist(auth.user.id, next);
  return NextResponse.json({ wishlist, saved: wishlist.includes(productId) });
}
