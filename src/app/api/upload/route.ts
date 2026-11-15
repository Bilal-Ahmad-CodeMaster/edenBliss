import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { saveProfileAvatar } from "@/lib/account";
import { clientAddress, consumeCountedLimit } from "@/lib/rate-limit";
import { recordAudit } from "@/lib/job-queue";
import { storeVerifiedImage } from "@/lib/media-store";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_PURPOSES = new Set(["product", "outfit", "category", "lookbook"]);

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
  const purpose = String(form.get("purpose") ?? "product");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
  }

  if (ADMIN_PURPOSES.has(purpose) && auth.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  if (purpose === "avatar" && auth.user.role !== "USER" && auth.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }
  if (!ADMIN_PURPOSES.has(purpose) && purpose !== "avatar") {
    return NextResponse.json({ message: "That upload is not allowed." }, { status: 400 });
  }

  try {
    const saved = await storeVerifiedImage(file);
    if (purpose === "avatar") {
      const profile = await saveProfileAvatar(auth.user.id, saved.url);
      if (!profile) return NextResponse.json({ message: "The portrait could not be saved." }, { status: 404 });
      return NextResponse.json({ url: saved.url, profile, message: "Portrait updated." });
    }

    recordAudit({
      adminId: auth.user.id,
      action: "UPLOAD_IMAGE",
      targetType: "Media",
      targetId: purpose,
      ...requestMeta(request),
      diff: { bytes: saved.bytes, mime: saved.mime, host: saved.host, purpose },
    });
    return NextResponse.json({ url: saved.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
