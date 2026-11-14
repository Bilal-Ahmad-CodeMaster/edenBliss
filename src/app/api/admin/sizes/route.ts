import { NextResponse } from "next/server";
import { sizeWriteSchema } from "@/lib/admin-schemas";
import { listAdminSizes } from "@/lib/admin-data";
import { adminGate, writeError } from "@/lib/admin-http";
import { saveSize } from "@/lib/admin-write";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const rows = await listAdminSizes();
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const parsed = sizeWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the measurements." }, { status: 400 });
  }

  try {
    const saved = await saveSize(parsed.data);
    recordAudit({
      adminId: auth.user.id,
      action: "CREATE_SIZE",
      targetType: "Size",
      targetId: saved?.id ?? "",
      ...requestMeta(request),
      diff: { label: parsed.data.label, measurementsInMeters: parsed.data.measurementsInMeters },
    });
    return NextResponse.json({ message: "The size is in the book.", size: saved });
  } catch (error) {
    return writeError(error);
  }
}
