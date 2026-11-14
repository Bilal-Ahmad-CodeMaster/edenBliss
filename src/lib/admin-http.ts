import "server-only";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";

export function isDuplicateKey(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && (error as { code?: number }).code === 11000;
}

export function isAllowedMediaUrl(value: string) {
  if (!value) return true;
  const prefix = `${process.env.PUBLIC_MEDIA_CDN_PREFIX || "/api/media"}/`;
  if (!value.startsWith(prefix)) return false;
  const name = value.slice(prefix.length);
  return /^[a-zA-Z0-9.-]+$/.test(name) && !name.includes("..");
}

export async function adminGate(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return { response: limited as NextResponse };
  const auth = await requireAdmin();
  if (!auth.ok) {
    return {
      response: NextResponse.json(
        { message: auth.message },
        { status: auth.status === 401 ? 401 : 404 },
      ),
    };
  }
  return { auth };
}

export function writeError(error: unknown) {
  if (isDuplicateKey(error)) {
    return NextResponse.json({ message: "That name or slug is already in the house." }, { status: 409 });
  }
  if (error instanceof ZodError) {
    return NextResponse.json({ message: error.issues[0]?.message ?? "Check the form." }, { status: 400 });
  }
  const status =
    typeof error === "object" && error !== null && "status" in error ? Number((error as { status?: number }).status) : 500;
  const message = error instanceof Error ? error.message : "The desk could not save that.";
  if (status >= 400 && status < 500) return NextResponse.json({ message }, { status });
  console.error(error);
  return NextResponse.json({ message: "The desk could not save that." }, { status: 500 });
}
