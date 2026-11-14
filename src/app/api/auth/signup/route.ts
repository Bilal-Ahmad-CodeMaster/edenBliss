import { NextResponse } from "next/server";
import { toPublicUser } from "@/lib/auth";
import { mergeCartLines, resolveCartItems, saveUserCart } from "@/lib/cart";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { hashPassword } from "@/lib/passwords";
import { readJson } from "@/lib/sanitize";
import { attachSession } from "@/lib/session-cookie";
import { mergeWishlistIds, saveUserWishlist } from "@/lib/wishlist";
import { signupRequestSchema } from "@/lib/validators";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;
  const parsed = signupRequestSchema.safeParse(await readJson(request));
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

  const existing = await User.findOne({ email: parsed.data.email }).select("_id");
  if (existing) {
    return NextResponse.json(
      { message: "An account with this email already exists. Sign in to continue." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email,
    passwordHash,
    phone: parsed.data.phone || "",
    role: "USER",
    isOnline: true,
    lastActiveAt: new Date(),
  });

  const userId = String(user._id);
  const wishlist = await saveUserWishlist(userId, mergeWishlistIds([], parsed.data.wishlist));
  const cart = await resolveCartItems(mergeCartLines([], parsed.data.cart));
  await saveUserCart(userId, cart);
  await attachSession(userId, "USER");

  return NextResponse.json({
    message: "Welcome to Eden Bliss. You are signed in.",
    user: { ...toPublicUser(user), wishlist },
    cart,
    wishlist,
  });
}
