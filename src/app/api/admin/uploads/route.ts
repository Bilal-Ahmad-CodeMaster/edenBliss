import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { recordAudit } from "@/lib/job-queue";
import { requestMeta, verifyAndSavePrivateUpload } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireAdmin();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status === 401 ? 401 : 404 });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose an image to upload." }, { status: 400 });
  }

  try {
    const saved = await verifyAndSavePrivateUpload(file);
    const prefix = process.env.PUBLIC_MEDIA_CDN_PREFIX || "/api/media";
    recordAudit({
      adminId: auth.user.id,
      action: "UPLOAD_IMAGE",
      targetType: "Media",
      targetId: saved.filename,
      ...requestMeta(request),
      diff: { bytes: saved.bytes, mime: saved.mime },
    });
    return NextResponse.json({ url: `${prefix}/${saved.filename}`, filename: saved.filename });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The image could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
