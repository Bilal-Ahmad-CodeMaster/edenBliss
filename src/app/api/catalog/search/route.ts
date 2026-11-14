import { NextResponse } from "next/server";
import { z } from "zod";
import { getShopProducts, normalizeShopSort } from "@/lib/catalog";
import { enforceRateLimit } from "@/lib/guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const querySchema = z.object({
  q: z.string().trim().max(80).optional().default(""),
  category: z.string().trim().max(80).optional().default(""),
  subcategory: z.string().trim().max(80).optional().default(""),
  size: z.string().trim().max(8).optional().default(""),
  min: z.coerce.number().min(0).max(10_000_000).optional(),
  max: z.coerce.number().min(0).max(10_000_000).optional(),
  sale: z.enum(["0", "1"]).optional(),
  sort: z.string().trim().max(20).optional(),
  page: z.coerce.number().int().min(1).max(500).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    category: url.searchParams.get("category") ?? "",
    subcategory: url.searchParams.get("subcategory") ?? "",
    size: url.searchParams.get("size") ?? "",
    min: url.searchParams.get("min") ?? undefined,
    max: url.searchParams.get("max") ?? undefined,
    sale: url.searchParams.get("sale") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ message: "The search could not be read." }, { status: 400 });
  }

  const shop = await getShopProducts({
    q: parsed.data.q,
    categorySlug: parsed.data.category || undefined,
    subCategorySlug: parsed.data.subcategory || undefined,
    size: parsed.data.size || undefined,
    minPrice: parsed.data.min,
    maxPrice: parsed.data.max,
    onSale: parsed.data.sale === "1",
    sort: normalizeShopSort(parsed.data.sort),
    page: parsed.data.page,
    limit: parsed.data.limit,
  });
  return NextResponse.json({
    products: shop.products ?? [],
    total: shop.total,
    page: shop.page,
    pages: shop.pages,
  });
}
