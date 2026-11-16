import { NextResponse, type NextRequest } from "next/server";
import { CSRF_COOKIE, isValidCsrfToken, issueCsrfToken } from "@/lib/csrf";
import { applySecurityHeaders } from "@/lib/http-headers";
import { verifySession } from "@/lib/jwt";
import { clientAddress, consumeRateLimit, limitScope, rateLimitKey } from "@/lib/rate-limit";
import { SESSION_COOKIE } from "@/lib/constants";

const API_GUARDS = ["/api/auth/me", "/api/auth/heartbeat", "/api/wishlist", "/api/cart", "/api/checkout", "/api/account", "/api/reviews"];

function isGuardedApi(pathname: string) {
  return API_GUARDS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function allowedOrigins() {
  return (process.env.ALLOWED_CORS_ORIGINS || process.env.APP_BASE_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function hostOf(value: string) {
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    return url.host.toLowerCase();
  } catch {
    return "";
  }
}

function originAllowed(request: NextRequest, origin: string | null) {
  if (!origin) return true;
  const originHost = hostOf(origin);
  if (!originHost) return false;
  const siteHosts = [request.nextUrl.host, request.headers.get("host") ?? "", request.headers.get("x-forwarded-host") ?? ""]
    .flatMap((value) => value.split(","))
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (siteHosts.includes(originHost)) return true;
  return allowedOrigins().some((allowed) => hostOf(allowed) === originHost);
}

function finish(response: NextResponse, csrf: string) {
  applySecurityHeaders(response.headers);
  response.cookies.set(CSRF_COOKIE, csrf, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return response;
}

function hidden(request: NextRequest, csrf: string) {
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return finish(NextResponse.json({ message: "Not found." }, { status: 404 }), csrf);
  }
  const url = request.nextUrl.clone();
  url.pathname = "/__missing";
  return finish(NextResponse.rewrite(url), csrf);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-eden-rated");
  requestHeaders.set("x-pathname", pathname);

  const existingCsrf = request.cookies.get(CSRF_COOKIE)?.value;
  const csrf = existingCsrf && (await isValidCsrfToken(existingCsrf)) ? existingCsrf : await issueCsrfToken();
  const mutating = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method);
  const origin = request.headers.get("origin");
  const fetchSite = request.headers.get("sec-fetch-site");

  if (mutating) {
    if (!originAllowed(request, origin)) {
      return finish(NextResponse.json({ message: "This origin is not allowed." }, { status: 403 }), csrf);
    }
    if (fetchSite === "cross-site") {
      return finish(NextResponse.json({ message: "Cross-site requests are blocked." }, { status: 403 }), csrf);
    }
  }

  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 204 });
    if (originAllowed(request, origin) && origin) {
      response.headers.set("Access-Control-Allow-Origin", origin);
      response.headers.set("Access-Control-Allow-Credentials", "true");
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, x-csrf-token, x-eden-signature");
      response.headers.set("Vary", "Origin");
    }
    return finish(response, csrf);
  }

  if (originAllowed(request, origin) && origin) {
    requestHeaders.set("x-allowed-origin", origin);
  }

  const scope = limitScope(pathname);
  let userId = "";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (token) {
    try {
      userId = (await verifySession(token)).sub;
    } catch {
      userId = "";
    }
  }
  const limit = await consumeRateLimit(rateLimitKey(scope, clientAddress(request.headers), userId), scope);
  if (!limit.ok) {
    return finish(
      NextResponse.json(
        { message: "Too many requests. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      ),
      csrf,
    );
  }
  requestHeaders.set("x-eden-rated", "1");

  if (mutating && pathname.startsWith("/api/") && !pathname.startsWith("/api/webhooks")) {
    const header = request.headers.get("x-csrf-token");
    if (!header || header !== csrf || !(await isValidCsrfToken(header))) {
      return finish(NextResponse.json({ message: "The request could not be verified." }, { status: 403 }), csrf);
    }
  }

  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!token) return hidden(request, csrf);
    try {
      const session = await verifySession(token);
      if (session.role !== "ADMIN") return hidden(request, csrf);
    } catch {
      return hidden(request, csrf);
    }
  }

  const publicReviewRead = request.method === "GET" && pathname.startsWith("/api/reviews");
  const needsSession =
    pathname.startsWith("/account") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/wishlist") ||
    pathname.startsWith("/order-success") ||
    (isGuardedApi(pathname) && !publicReviewRead);
  if (!token) {
    if (!needsSession) {
      const response = NextResponse.next({ request: { headers: requestHeaders } });
      return withCors(request, response, origin, csrf);
    }
    if (pathname.startsWith("/api/")) {
      return finish(NextResponse.json({ message: "Sign in to continue." }, { status: 401 }), csrf);
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return finish(NextResponse.redirect(url), csrf);
  }

  try {
    await verifySession(token);
    const response = NextResponse.next({ request: { headers: requestHeaders } });
    return withCors(request, response, origin, csrf);
  } catch {
    if (pathname.startsWith("/api/")) {
      const response = NextResponse.json({ message: "Your session has expired. Sign in again." }, { status: 401 });
      response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
      return finish(response, csrf);
    }
    const url = request.nextUrl.clone();
    url.pathname = needsSession ? "/login" : pathname;
    const response = needsSession ? NextResponse.redirect(url) : NextResponse.next({ request: { headers: requestHeaders } });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
    return finish(response, csrf);
  }
}

function withCors(request: NextRequest, response: NextResponse, origin: string | null, csrf: string) {
  if (originAllowed(request, origin) && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    response.headers.set("Vary", "Origin");
  }
  return finish(response, csrf);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|avif)$).*)"],
};
