import { NextResponse } from "next/server";
import { countOnlineUsers, requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) {
    return NextResponse.json({ message: auth.message }, { status: auth.status });
  }

  const online = await countOnlineUsers();
  return NextResponse.json({ online });
}
