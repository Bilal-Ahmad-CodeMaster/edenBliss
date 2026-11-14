import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export type SessionRole = "USER" | "ADMIN";

export type SessionPayload = {
  sub: string;
  role: SessionRole;
};

function accessSecret() {
  const value = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_ACCESS_SECRET is not defined.");
  return new TextEncoder().encode(value);
}

function refreshSecret() {
  const value = process.env.JWT_REFRESH_SECRET || process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
  if (!value) throw new Error("JWT_REFRESH_SECRET is not defined.");
  return new TextEncoder().encode(value);
}

function expiresIn() {
  return process.env.JWT_EXPIRES_IN || "7d";
}

async function sign(payload: SessionPayload, secret: Uint8Array) {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(expiresIn())
    .sign(secret);
}

export function signSession(payload: SessionPayload) {
  return sign(payload, accessSecret());
}

export function signRefresh(payload: SessionPayload) {
  return sign(payload, refreshSecret());
}

async function read(token: string, secret: Uint8Array): Promise<SessionPayload> {
  const { payload } = await jwtVerify(token, secret);
  const role = payload.role === "ADMIN" ? "ADMIN" : "USER";
  const sub = typeof payload.sub === "string" ? payload.sub : "";
  if (!sub) throw new Error("Invalid session.");
  return { sub, role };
}

export function verifySession(token: string) {
  return read(token, accessSecret());
}

export function verifyRefresh(token: string) {
  return read(token, refreshSecret());
}
