import { NextResponse } from "next/server";
import { requireUser, touchPresence } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  await touchPresence(auth.user.id);
  return NextResponse.json({ ok: true });
}
