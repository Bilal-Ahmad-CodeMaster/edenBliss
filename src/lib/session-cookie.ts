import "server-only";
import { cookies } from "next/headers";
import { REFRESH_COOKIE, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/constants";
import { signRefresh, signSession, type SessionRole } from "@/lib/jwt";

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function attachSession(userId: string, role: SessionRole) {
  const payload = { sub: userId, role };
  const [access, refresh] = await Promise.all([signSession(payload), signRefresh(payload)]);
  const jar = await cookies();
  jar.set(SESSION_COOKIE, access, cookieOptions(SESSION_MAX_AGE_SECONDS));
  jar.set(REFRESH_COOKIE, refresh, cookieOptions(SESSION_MAX_AGE_SECONDS));
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, "", cookieOptions(0));
  jar.set(REFRESH_COOKIE, "", cookieOptions(0));
}
