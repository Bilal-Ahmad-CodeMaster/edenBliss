import { NextResponse } from "next/server";
import { profileSchema } from "@/lib/admin-schemas";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { isAllowedMediaUrl } from "@/lib/admin-http";
import { recordAudit } from "@/lib/job-queue";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { readJson, stripHtml } from "@/lib/sanitize";
import { requestMeta } from "@/lib/security";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });
  await connectDB();
  const user = await User.findById(auth.user.id).select("name email avatarUrl phone").lean<{
    name: string;
    email: string;
    avatarUrl?: string;
    phone?: string;
  } | null>();
  if (!user || Array.isArray(user)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return NextResponse.json({
    profile: {
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl ?? "",
      phone: user.phone ?? "",
    },
  });
}

export async function PATCH(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });

  const parsed = profileSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the profile." }, { status: 400 });
  }
  if (parsed.data.avatarUrl && !isAllowedMediaUrl(parsed.data.avatarUrl)) {
    return NextResponse.json({ message: "Upload the portrait through the house archive." }, { status: 400 });
  }

  await connectDB();
  const current = await User.findById(auth.user.id).select("+passwordHash email");
  if (!current) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const email = parsed.data.email.toLowerCase();
  if (email !== current.email) {
    const taken = await User.exists({ email, _id: { $ne: current._id } });
    if (taken) return NextResponse.json({ message: "That email already belongs to the house." }, { status: 409 });
  }

  const nextPassword = parsed.data.nextPassword.trim();
  if (nextPassword) {
    const limitedAuth = await enforceRateLimit(request, "auth", true);
    if (limitedAuth) return limitedAuth;
    if (nextPassword.length < 8) {
      return NextResponse.json({ message: "Use at least 8 characters for the new password." }, { status: 400 });
    }
    if (!(await verifyPassword(parsed.data.currentPassword, current.passwordHash))) {
      return NextResponse.json({ message: "The current password does not match." }, { status: 403 });
    }
    current.passwordHash = await hashPassword(nextPassword);
  }

  current.name = stripHtml(parsed.data.name);
  current.email = email;
  current.avatarUrl = parsed.data.avatarUrl ?? "";
  current.phone = stripHtml(parsed.data.phone ?? "");
  await current.save();

  recordAudit({
    adminId: auth.user.id,
    action: nextPassword ? "UPDATE_ADMIN_PASSWORD" : "UPDATE_ADMIN_PROFILE",
    targetType: "User",
    targetId: auth.user.id,
    ...requestMeta(request),
    diff: nextPassword ? { passwordChanged: true, email } : { name: current.name, email },
  });

  return NextResponse.json({
    message: nextPassword ? "Your password has been changed." : "Your profile has been saved.",
    profile: { name: current.name, email: current.email, avatarUrl: current.avatarUrl, phone: current.phone },
  });
}
