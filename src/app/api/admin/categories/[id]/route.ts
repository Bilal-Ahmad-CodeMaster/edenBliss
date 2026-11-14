import { NextResponse } from "next/server";
import { categoryWriteSchema } from "@/lib/admin-schemas";
import { adminGate, writeError } from "@/lib/admin-http";
import { removeCategory, saveCategory } from "@/lib/admin-write";
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

  const parsed = categoryWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the category." }, { status: 400 });
  }

  try {
    const saved = await saveCategory(parsed.data, id);
    if (!saved) return NextResponse.json({ message: "Not found." }, { status: 404 });
    recordAudit({
      adminId: auth.user.id,
      action: "UPDATE_CATEGORY",
      targetType: "Category",
      targetId: id,
      ...requestMeta(request),
      diff: { name: parsed.data.name, slug: parsed.data.slug, isActive: parsed.data.isActive },
    });
    return NextResponse.json({ message: "The category has been updated.", category: saved });
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
  const result = await removeCategory(id);
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.message === "Not found." ? 404 : 400 });
  recordAudit({
    adminId: auth.user.id,
    action: "DELETE_CATEGORY",
    targetType: "Category",
    targetId: id,
    ...requestMeta(request),
    diff: { deleted: true },
  });
  return NextResponse.json({ message: "The category has been removed." });
}
