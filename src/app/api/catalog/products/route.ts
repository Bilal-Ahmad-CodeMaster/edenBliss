import { NextResponse } from "next/server";
import { getWishlistPieces } from "@/lib/catalog";
import { enforceRateLimit } from "@/lib/guard";
import { readJson } from "@/lib/sanitize";
import { catalogIdsSchema } from "@/lib/validators";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  const parsed = catalogIdsSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ message: "The wishlist could not be read." }, { status: 400 });
  }

  const products = await getWishlistPieces(parsed.data.ids);
  return NextResponse.json({ products });
}
