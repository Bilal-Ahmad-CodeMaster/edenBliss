import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/job-queue";
import { storeVerifiedImage } from "@/lib/media-store";
import { clientAddress, consumeCountedLimit } from "@/lib/rate-limit";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });
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
    return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
  }

  try {
    const saved = await storeVerifiedImage(file);
    recordAudit({
      adminId: auth.user.id,
      action: "UPLOAD_IMAGE",
      targetType: "Media",
      targetId: "product",
      ...requestMeta(request),
      diff: { bytes: saved.bytes, mime: saved.mime, host: saved.host },
    });
    return NextResponse.json({ url: saved.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
