import { NextResponse } from "next/server";
import { saveProfileAvatar } from "@/lib/account";
import { requireUser } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/guard";
import { verifyAndSavePrivateUpload } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "Choose a portrait to upload." }, { status: 400 });
  }

  try {
    const saved = await verifyAndSavePrivateUpload(file);
    const prefix = process.env.PUBLIC_MEDIA_CDN_PREFIX || "/api/media";
    const profile = await saveProfileAvatar(auth.user.id, `${prefix}/${saved.filename}`);
    if (!profile) return NextResponse.json({ message: "The portrait could not be saved." }, { status: 404 });
    return NextResponse.json({ message: "Portrait updated.", profile });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The portrait could not be saved.";
    return NextResponse.json({ message }, { status: 400 });
  }
}
