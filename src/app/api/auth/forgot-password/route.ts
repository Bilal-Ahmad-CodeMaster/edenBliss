import { NextResponse } from "next/server";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { enforceRateLimit } from "@/lib/guard";
import { requestPasswordOtp } from "@/lib/password-reset";
import { readJson } from "@/lib/sanitize";
import { forgotPasswordSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SENT = "A 6-digit code is on its way.";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;

  const parsed = forgotPasswordSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.issues[0]?.message ?? "Enter a valid email address." },
      { status: 400 },
    );
  }

  const result = await requestPasswordOtp(parsed.data.email);
  if (result === "missing") {
    return NextResponse.json({ message: "User not found." }, { status: 404 });
  }
  if (result === "blocked") {
    return NextResponse.json({ message: RESTRICTED_MESSAGE }, { status: 403 });
  }
  if (result === "mail") {
    return NextResponse.json({ message: "The code could not be sent. Try again in a moment." }, { status: 503 });
  }

  return NextResponse.json({ message: SENT });
}
