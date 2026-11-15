import { NextResponse } from "next/server";
import { adminGate, writeError } from "@/lib/admin-http";
import { saveLookbook } from "@/lib/lookbook";
import { connectDB } from "@/lib/db";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta } from "@/lib/security";
import { Lookbook } from "@/models/Lookbook";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: Context) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  try {
    const saved = await saveLookbook(await readJson(request), id);
    if (!saved) return NextResponse.json({ message: "That look was not found." }, { status: 404 });
    recordAudit({
      adminId: auth.user.id,
      action: "UPDATE_LOOKBOOK",
      targetType: "Lookbook",
      targetId: id,
      ...requestMeta(request),
      diff: { title: saved.title },
    });
    return NextResponse.json({ message: "The look has been updated.", look: saved });
  } catch (error) {
    return writeError(error);
  }
}

export async function DELETE(request: Request, context: Context) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  await connectDB();
  const removed = await Lookbook.findByIdAndDelete(id).select("_id").lean();
  if (!removed) return NextResponse.json({ message: "Not found." }, { status: 404 });
  recordAudit({
    adminId: auth.user.id,
    action: "DELETE_LOOKBOOK",
    targetType: "Lookbook",
    targetId: id,
    ...requestMeta(request),
    diff: {},
  });
  return NextResponse.json({ message: "The look has been removed." });
}
