import { NextResponse } from "next/server";
import { adminGate, writeError } from "@/lib/admin-http";
import { listAdminLooks, saveLookbook } from "@/lib/lookbook";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  return NextResponse.json({ looks: await listAdminLooks() });
}

export async function POST(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  try {
    const saved = await saveLookbook(await readJson(request));
    recordAudit({
      adminId: auth.user.id,
      action: "CREATE_LOOKBOOK",
      targetType: "Lookbook",
      targetId: saved?.id ?? "",
      ...requestMeta(request),
      diff: { title: saved?.title ?? "" },
    });
    return NextResponse.json({ message: "The look is on the rail.", look: saved });
  } catch (error) {
    return writeError(error);
  }
}
