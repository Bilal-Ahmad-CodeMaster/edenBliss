import { NextResponse } from "next/server";
import { productWriteSchema } from "@/lib/admin-schemas";
import { listAdminProducts } from "@/lib/admin-data";
import { adminGate, writeError } from "@/lib/admin-http";
import { saveProduct } from "@/lib/admin-write";
import { recordAudit } from "@/lib/job-queue";
import { readJson } from "@/lib/sanitize";
import { requestMeta } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const url = new URL(request.url);
  const result = await listAdminProducts({
    page: url.searchParams.get("page"),
    limit: url.searchParams.get("limit"),
    q: url.searchParams.get("q"),
    category: url.searchParams.get("category"),
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const parsed = productWriteSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "Check the piece." }, { status: 400 });
  }

  try {
    const saved = await saveProduct(parsed.data);
    recordAudit({
      adminId: auth.user.id,
      action: "CREATE_PRODUCT",
      targetType: "Product",
      targetId: saved?.id ?? "",
      ...requestMeta(request),
      diff: { title: parsed.data.title, slug: parsed.data.slug, finalPrice: saved?.finalPrice },
    });
    return NextResponse.json({ message: "The piece is on the rail.", product: saved });
  } catch (error) {
    return writeError(error);
  }
}
