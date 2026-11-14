import { NextResponse } from "next/server";
import { categoryWriteSchema } from "@/lib/admin-schemas";
import { adminGate, writeError } from "@/lib/admin-http";
import { listAdminCategories } from "@/lib/admin-data";
import { saveCategory } from "@/lib/admin-write";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const rows = await listAdminCategories();
  return NextResponse.json({ rows });
}

export async function POST(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const parsed = categoryWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the category." }, { status: 400 });
  }

  try {
    const saved = await saveCategory(parsed.data);
    recordAudit({
      adminId: auth.user.id,
      action: "CREATE_CATEGORY",
      targetType: "Category",
      targetId: saved?.id ?? "",
      ...requestMeta(request),
      diff: { name: parsed.data.name, slug: parsed.data.slug },
    });
    return NextResponse.json({ message: "The category is on the rail.", category: saved });
  } catch (error) {
    return writeError(error);
  }
}
