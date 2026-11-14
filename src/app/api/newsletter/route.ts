import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { readJson } from "@/lib/sanitize";
import { Newsletter } from "@/models/Newsletter";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().trim().email().max(120),
});

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  const parsed = schema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: "Enter a real email address." }, { status: 400 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ message: "The house will write when the archive is connected." }, { status: 503 });
  }

  try {
    await connectDB();
    await Newsletter.create({ email: parsed.data.email.toLowerCase() });
  } catch (error) {
    const duplicate = typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
    if (!duplicate) {
      console.error(error);
      return NextResponse.json({ message: "The list could not be updated." }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "You are on the list. The house will write when the next cloth is cut." });
}
