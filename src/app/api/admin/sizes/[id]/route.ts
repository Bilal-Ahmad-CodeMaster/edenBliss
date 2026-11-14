import { NextResponse } from "next/server";
import { sizeWriteSchema } from "@/lib/admin-schemas";
import { adminGate, writeError } from "@/lib/admin-http";
import { removeSize, saveSize } from "@/lib/admin-write";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const parsed = sizeWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the measurements." }, { status: 400 });
  }

  try {
    const saved = await saveSize(parsed.data, id);
    if (!saved) return NextResponse.json({ message: "Not found." }, { status: 404 });
    recordAudit({
      adminId: auth.user.id,
      action: "UPDATE_SIZE",
      targetType: "Size",
      targetId: id,
      ...requestMeta(request),
      diff: { label: parsed.data.label, measurementsInMeters: parsed.data.measurementsInMeters },
    });
    return NextResponse.json({ message: "The size has been updated.", size: saved });
  } catch (error) {
    return writeError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  const result = await removeSize(id);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.message === "Not found." ? 404 : 400 });
  recordAudit({
    adminId: auth.user.id,
    action: "DELETE_SIZE",
    targetType: "Size",
    targetId: id,
    ...requestMeta(request),
    diff: { deleted: true },
  });
  return NextResponse.json({ message: "The size has been removed." });
}
