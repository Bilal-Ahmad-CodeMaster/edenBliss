import { NextResponse } from "next/server";
import { toPublicUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { verifyPassword } from "@/lib/passwords";
import { mergeCartLines, resolveCartItems, saveUserCart, toIncomingCart } from "@/lib/cart";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { readJson } from "@/lib/sanitize";
import { attachSession } from "@/lib/session-cookie";
import { loginRequestSchema } from "@/lib/validators";
import { mergeWishlistIds, saveUserWishlist } from "@/lib/wishlist";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;
  const parsed = loginRequestSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the form and try again." },
      { status: 400 },
    );
  }

  try {
    await connectDB();
  } catch {
    return NextResponse.json({ message: "The atelier archive is unreachable." }, { status: 503 });
  }

  const user = await User.findOne({ email: parsed.data.email }).select("+passwordHash");
  if (!user) {
    return NextResponse.json(
      { message: "Those details do not match our atelier records." },
      { status: 401 },
    );
  }

  const matches = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!matches) {
    return NextResponse.json(
      { message: "Those details do not match our atelier records." },
      { status: 401 },
    );
  }

  if (user.isBlocked) {
    return NextResponse.json({ message: RESTRICTED_MESSAGE }, { status: 403 });
  }

  const userId = String(user._id);
  const wishlist = await saveUserWishlist(
    userId,
    mergeWishlistIds(
      (user.wishlist ?? []).map((id: { toString(): string }) => String(id)),
      parsed.data.wishlist,
    ),
  );
  const cart = await resolveCartItems(
    mergeCartLines(toIncomingCart(user.cart ?? []), parsed.data.cart),
  );
  await saveUserCart(userId, cart);
  await User.updateOne({ _id: user._id }, { $set: { isOnline: true, lastActiveAt: new Date() } });
  await attachSession(userId, user.role);

  return NextResponse.json({
    message: "Welcome back to Eden Bliss.",
    user: { ...toPublicUser(user), wishlist },
    cart,
    wishlist,
  });
}
