import { NextResponse } from "next/server";
import { z } from "zod";
import { productWriteSchema } from "@/lib/admin-schemas";
import { adminGate, writeError } from "@/lib/admin-http";
import { getAdminProduct, removeProduct, saveProduct } from "@/lib/admin-write";
import { connectDB } from "@/lib/db";
import { recordAudit } from "@/lib/job-queue";
import { invalidateCatalogCache } from "@/lib/redis";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, requestMeta } from "@/lib/security";
import { Product } from "@/models/Product";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const toggleSchema = z
  .object({
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine((value) => value.isActive !== undefined || value.isFeatured !== undefined, {
    message: "Nothing to update.",
  });

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const { id } = await context.params;
  const product = await getAdminProduct(id);
  if (!product) return NextResponse.json({ message: "Not found." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  if (!isValidObjectId(id)) return NextResponse.json({ message: "Not found." }, { status: 404 });

  const body = await readJson(request);
  const full = productWriteSchema.safeParse(body);
  if (full.success) {
    try {
      const saved = await saveProduct(full.data, id);
      if (!saved) return NextResponse.json({ message: "Not found." }, { status: 404 });
      recordAudit({
        adminId: auth.user.id,
        action: "UPDATE_PRODUCT",
        targetType: "Product",
        targetId: id,
        ...requestMeta(request),
        diff: { title: full.data.title, slug: full.data.slug, finalPrice: saved.finalPrice },
      });
      return NextResponse.json({ message: "The piece has been updated.", product: saved });
    } catch (error) {
      return writeError(error);
    }
  }

  const toggle = toggleSchema.safeParse(body);
  if (!toggle.success) {
    return NextResponse.json({ message: full.error.issues[0]?.message ?? "Check the piece." }, { status: 400 });
  }

  await connectDB();
  const product = await Product.findByIdAndUpdate(id, { $set: toggle.data }, { returnDocument: "after" })
    .select("isActive isFeatured")
    .lean<{ isActive?: boolean; isFeatured?: boolean } | null>();
  if (!product || Array.isArray(product)) return NextResponse.json({ message: "Not found." }, { status: 404 });
  await invalidateCatalogCache();
  recordAudit({
    adminId: auth.user.id,
    action: "UPDATE_PRODUCT",
    targetType: "Product",
    targetId: id,
    ...requestMeta(request),
    diff: toggle.data,
  });
  return NextResponse.json({
    message: "The piece has been updated.",
    isActive: product.isActive,
    isFeatured: product.isFeatured,
  });
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const opened = await adminGate(request);
  if ("response" in opened && opened.response) return opened.response;
  const auth = opened.auth;
  if (!auth) return NextResponse.json({ message: "Not found." }, { status: 404 });
  const { id } = await context.params;
  const removed = await removeProduct(id);
  if (!removed) return NextResponse.json({ message: "Not found." }, { status: 404 });
  recordAudit({
    adminId: auth.user.id,
    action: "DELETE_PRODUCT",
    targetType: "Product",
    targetId: id,
    ...requestMeta(request),
    diff: { deleted: true },
  });
  return NextResponse.json({ message: "The piece has been removed." });
}
