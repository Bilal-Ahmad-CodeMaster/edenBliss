import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta } from "@/lib/security";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const blockSchema = z.object({
  isBlocked: z.boolean(),
});

const resetSchema = z.object({
  adminPassword: z.string().min(1).max(72),
  nextPassword: z.string().min(8).max(72),
});

const deleteSchema = z.object({
  adminPassword: z.string().min(1).max(72),
});

async function gate(request: Request, id: string) {
  const limited = await enforceRateLimit(request);
  if (limited) return { response: limited };
  if (!isValidObjectId(id)) {
    return { response: NextResponse.json({ message: "Not found." }, { status: 404 }) };
  }
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { response: NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 }) };
  }
  return { auth };
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const opened = await gate(request, id);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = await readJson(request);
  const blocked = blockSchema.safeParse(body);
  const reset = resetSchema.safeParse(body);
  await connectDB();
  const meta = requestMeta(request);

  if (reset.success) {
    const limited = await enforceRateLimit(request, "auth", true);
    if (limited) return limited;
    const admin = await User.findById(auth.user.id).select("+passwordHash");
    if (!admin || !(await verifyPassword(reset.data.adminPassword, admin.passwordHash))) {
      return NextResponse.json({ message: "Confirm your own password before changing another." }, { status: 403 });
    }
    const passwordHash = await hashPassword(reset.data.nextPassword);
    await User.updateOne({ _id: id }, { $set: { passwordHash } });
    recordAudit({
      adminId: auth.user.id,
      action: "RESET_PASSWORD",
      targetType: "User",
      targetId: id,
      ...meta,
      diff: { passwordReset: true },
    });
    return NextResponse.json({ message: "The password has been reset." });
  }

  if (!blocked.success) {
    return NextResponse.json({ message: "The account update could not be read." }, { status: 400 });
  }

  await User.updateOne(
    { _id: id },
    { $set: { isBlocked: blocked.data.isBlocked, ...(blocked.data.isBlocked ? { isOnline: false } : {}) } },
  );
  recordAudit({
    adminId: auth.user.id,
    action: blocked.data.isBlocked ? "BLOCK_USER" : "UNBLOCK_USER",
    targetType: "User",
    targetId: id,
    ...meta,
    diff: { isBlocked: blocked.data.isBlocked },
  });
  return NextResponse.json({ message: blocked.data.isBlocked ? "The account is restricted." : "The account is open again." });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const opened = await gate(request, id);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  if (auth.user.id === id) {
    return NextResponse.json({ message: "You cannot delete the account you are using." }, { status: 400 });
  }

  const parsed = deleteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: "Confirm your password before deleting an account." }, { status: 400 });
  }

  await connectDB();
  const admin = await User.findById(auth.user.id).select("+passwordHash");
  if (!admin || !(await verifyPassword(parsed.data.adminPassword, admin.passwordHash))) {
    return NextResponse.json({ message: "Confirm your own password before deleting an account." }, { status: 403 });
  }

  const removed = await User.findOneAndDelete({ _id: id, role: { $ne: "ADMIN" } }).select("_id");
  if (!removed) return NextResponse.json({ message: "That account could not be removed." }, { status: 404 });
  recordAudit({
    adminId: auth.user.id,
    action: "DELETE_USER",
    targetType: "User",
    targetId: id,
    ...requestMeta(request),
    diff: { deleted: true },
  });
  return NextResponse.json({ message: "The account has been removed." });
}
