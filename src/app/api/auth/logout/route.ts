import { NextResponse } from "next/server";
import { markOffline, readSession } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { clearSessionCookie } from "@/lib/session-cookie";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const session = await readSession();
  if (session.status === "active") await markOffline(session.user.id);
  if (session.status === "blocked") await markOffline(session.userId);
  await clearSessionCookie();
  return NextResponse.json({ message: "You have signed out." });
}
