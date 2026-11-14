import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { invalidateCatalogCache } from "@/lib/redis";
import { readJson } from "@/lib/sanitize";
import { isValidObjectId, stripHtml } from "@/lib/security";
import { reviewFormSchema } from "@/lib/validators";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth");
  if (limited) return limited;
  const auth = await requireUser();
  if (!auth.ok) return NextResponse.json({ message: auth.message }, { status: auth.status });

  const parsed = reviewFormSchema.safeParse(await readJson(request));
  if (!parsed.success || !isValidObjectId(parsed.data.productId)) {
    return NextResponse.json(
      { message: parsed.success ? "Choose a piece from the shop." : parsed.error.issues[0]?.message },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const product = await Product.findOne({ _id: parsed.data.productId, isActive: true }).select("_id");
    if (!product) return NextResponse.json({ message: "That piece is no longer on the rail." }, { status: 404 });

    const created = await Review.create({
      product: parsed.data.productId,
      user: auth.user.id,
      rating: parsed.data.rating,
      comment: stripHtml(parsed.data.comment),
    });

    const [stats] = await Review.aggregate<{ _id: string; averageRating: number; reviewCount: number }>([
      { $match: { product: product._id } },
      { $group: { _id: "$product", averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } },
    ]);
    await Product.updateOne(
      { _id: product._id },
      {
        $set: {
          averageRating: Math.round((stats?.averageRating ?? 0) * 10) / 10,
          reviewCount: stats?.reviewCount ?? 0,
        },
      },
    );
    await invalidateCatalogCache();
    return NextResponse.json({
      message: "Your note has been kept.",
      review: {
        id: String(created._id),
        rating: created.rating,
        comment: created.comment,
        createdAt: created.createdAt ? new Date(created.createdAt).toISOString() : new Date().toISOString(),
        author: auth.user.name,
      },
      averageRating: Math.round((stats?.averageRating ?? parsed.data.rating) * 10) / 10,
      reviewCount: stats?.reviewCount ?? 1,
    });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && error.code === 11000) {
      return NextResponse.json({ message: "You have already left a note for this piece." }, { status: 409 });
    }
    console.error(error);
    return NextResponse.json({ message: "The note could not be saved." }, { status: 500 });
  }
}
