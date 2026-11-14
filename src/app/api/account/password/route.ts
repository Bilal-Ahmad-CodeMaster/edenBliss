import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { hashPassword, verifyPassword } from "@/lib/passwords";
import { readJson } from "@/lib/sanitize";
import { passwordChangeSchema } from "@/lib/validators";
import { User } from "@/models/User";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const parsed = passwordChangeSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the passwords and try again." },
      { status: 400 },
    );
  }

  await connectDB();
  const user = await User.findOne({ _id: auth.user.id, isBlocked: false }).select("+passwordHash");
  if (!user) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  const matches = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!matches) return NextResponse.json({ message: "The current password does not match." }, { status: 401 });

  user.passwordHash = await hashPassword(parsed.data.nextPassword);
  await user.save();
  return NextResponse.json({ message: "Your password has been changed." });
}
