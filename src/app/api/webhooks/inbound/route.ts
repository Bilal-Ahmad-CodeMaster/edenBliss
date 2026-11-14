import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/guard";
import { verifyWebhookSignature } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  const rawBody = await request.text();
  const signature = request.headers.get("x-eden-signature");
  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ message: "The signature could not be verified." }, { status: 401 });
  }

  return NextResponse.json({ received: true });
}
