import "server-only";
import { NextResponse } from "next/server";
import { clientAddress, consumeRateLimit, limitScope, rateLimitKey } from "@/lib/rate-limit";
import { verifySession } from "@/lib/jwt";

export async function enforceRateLimit(request: Request, scope?: "auth" | "public", force = false) {
  if (!force && request.headers.get("x-eden-rated") === "1") return null;
  const pathname = new URL(request.url).pathname;
  const resolved = scope ?? limitScope(pathname);
  let userId = "";
  const cookie = request.headers.get("cookie") ?? "";
  const token = cookie.match(/(?:^|; )eb_session=([^;]+)/)?.[1];
  if (token) {
    try {
      userId = (await verifySession(decodeURIComponent(token))).sub;
    } catch {
      userId = "";
    }
  }
  const result = await consumeRateLimit(rateLimitKey(resolved, clientAddress(request.headers), userId), resolved);
  if (result.ok) return null;
  return NextResponse.json(
    { message: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(result.retryAfter) } },
  );
}
