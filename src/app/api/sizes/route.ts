import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/guard";
import { listSizeBook } from "@/lib/size-book";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  return NextResponse.json({ sizes: await listSizeBook() });
}
