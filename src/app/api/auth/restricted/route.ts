import { NextResponse } from "next/server";
import { markOffline, readSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/constants";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await readSession();
  if (session.status === "active") await markOffline(session.user.id);
  if (session.status === "blocked") await markOffline(session.userId);

  const response = NextResponse.redirect(new URL("/login?restricted=1", request.url));
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
