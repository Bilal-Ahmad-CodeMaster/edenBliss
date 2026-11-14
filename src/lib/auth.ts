import "server-only";
import { cookies } from "next/headers";
import { SESSION_COOKIE, ONLINE_WINDOW_MS, RESTRICTED_MESSAGE } from "@/lib/constants";
import { connectDB } from "@/lib/db";
import { verifySession } from "@/lib/jwt";
import { clearSessionCookie } from "@/lib/session-cookie";
import { User } from "@/models/User";
import type { PublicUser } from "@/types/commerce";

type UserLike = {
  _id: { toString(): string };
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  avatarUrl?: string | null;
  phone?: string | null;
  isBlocked?: boolean;
  wishlist?: Array<{ toString(): string } | string>;
};

export function toPublicUser(user: UserLike): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl ?? "",
    phone: user.phone ?? "",
    wishlist: (user.wishlist ?? []).map((id) => String(id)),
  };
}

export type SessionResult =
  | { status: "anonymous" }
  | { status: "blocked"; userId: string }
  | { status: "active"; user: PublicUser };

export async function readSession(): Promise<SessionResult> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return { status: "anonymous" };

  let userId = "";
  try {
    const payload = await verifySession(token);
    userId = payload.sub;
  } catch {
    return { status: "anonymous" };
  }

  try {
    await connectDB();
  } catch (error) {
    console.error("Unable to verify the session against the archive.", error);
    return { status: "anonymous" };
  }

  const user = await User.findById(userId)
    .select("name email role avatarUrl phone wishlist isBlocked")
    .lean<UserLike | null>();
  if (!user) return { status: "anonymous" };
  if (user.isBlocked) return { status: "blocked", userId: String(user._id) };

  return { status: "active", user: toPublicUser(user) };
}

export async function requireUser() {
  const session = await readSession();

  if (session.status === "blocked") {
    await User.updateOne({ _id: session.userId }, { $set: { isOnline: false } });
    await clearSessionCookie();
    return { ok: false as const, status: 403, message: RESTRICTED_MESSAGE };
  }

  if (session.status !== "active") {
    return { ok: false as const, status: 401, message: "Sign in to continue." };
  }

  return { ok: true as const, user: session.user };
}

export async function requireAdmin() {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.user.role !== "ADMIN") {
    return { ok: false as const, status: 404, message: "Not found." };
  }
  return auth;
}

export async function touchPresence(userId: string) {
  await connectDB();
  await User.updateOne(
    { _id: userId, isBlocked: false },
    { $set: { isOnline: true, lastActiveAt: new Date() } },
  );
}

export async function markOffline(userId: string) {
  await connectDB();
  await User.updateOne({ _id: userId }, { $set: { isOnline: false } });
}

export async function countOnlineUsers() {
  await connectDB();
  const since = new Date(Date.now() - ONLINE_WINDOW_MS);
  return User.countDocuments({
    isBlocked: false,
    isOnline: true,
    lastActiveAt: { $gte: since },
  });
}

export { RESTRICTED_MESSAGE };
