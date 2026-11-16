import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/guard";
import { resetPasswordWithOtp } from "@/lib/password-reset";
import { readJson } from "@/lib/sanitize";
import { resetPasswordSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;

  const parsed = resetPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Check the code and the new password." },
      { status: 400 },
    );
  }

  const result = await resetPasswordWithOtp(parsed.data.email, parsed.data.code, parsed.data.password);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });
  return NextResponse.json({ message: "Your password has been updated. Sign in with the new one." });
}
