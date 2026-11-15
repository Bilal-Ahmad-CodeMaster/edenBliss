import { NextResponse } from "next/server";
import { saveProfileAvatar } from "@/lib/account";
import { requireAuth } from "@/lib/auth";
import { storeVerifiedImage } from "@/lib/media-store";
import { clientAddress, consumeCountedLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });
  const limit = await consumeCountedLimit(`upload:${auth.user.id}:${clientAddress(request.headers)}`, 10);
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Too many uploads. Please wait a moment and try again." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a portrait to upload." }, { status: 400 });
  }

  try {
    const saved = await storeVerifiedImage(file);
    const profile = await saveProfileAvatar(auth.user.id, saved.url);
    if (!profile) return NextResponse.json({ message: "The portrait could not be saved." }, { status: 404 });
    return NextResponse.json({ message: "Portrait updated.", profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The portrait could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
