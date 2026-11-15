import "server-only";
import { z } from "zod";
import { isAllowedMediaUrl } from "@/lib/admin-http";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { isValidObjectId, stripHtml } from "@/lib/security";
import { Lookbook } from "@/models/Lookbook";
import { Product } from "@/models/Product";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";
import type { ProductSizeOption } from "@/types/commerce";

const hotspotSchema = z.object({
  id: z.string().trim().optional(),
  xPercent: z.coerce.number().min(0).max(100),
  yPercent: z.coerce.number().min(0).max(100),
  productId: z.string().trim().min(1),
  defaultColorSlug: z.string().trim().max(40).default(""),
  stylingNote: z.string().trim().max(240).default(""),
});

export const lookbookWriteSchema = z.object({
  title: z.string().trim().min(2).max(120),
  seasonTag: z.string().trim().min(2).max(40),
  editorialStory: z.string().trim().min(10).max(2000),
  coverImage: z.string().trim().min(1).max(800),
  isActive: z.boolean().default(true),
  hotspots: z.array(hotspotSchema).max(12).default([]),
});

export async function saveLookbook(raw: unknown, id?: string) {
  const parsed = lookbookWriteSchema.parse(raw);
  if (!isAllowedMediaUrl(parsed.coverImage)) {
    throw Object.assign(new Error("The scene must be an uploaded image."), { status: 400 });
  }
  if (parsed.hotspots.some((pin) => !isValidObjectId(pin.productId))) {
    throw Object.assign(new Error("Each pin needs a piece from the rail."), { status: 400 });
  }
  await connectDB();
  const productIds = [...new Set(parsed.hotspots.map((pin) => pin.productId))];
  const found = await Product.countDocuments({ _id: { $in: productIds }, isActive: true });
  if (found !== productIds.length) {
    throw Object.assign(new Error("One of the pinned pieces is no longer on the rail."), { status: 400 });
  }
  const next = {
    title: stripHtml(parsed.title),
    seasonTag: stripHtml(parsed.seasonTag),
    editorialStory: stripHtml(parsed.editorialStory),
    coverImage: parsed.coverImage,
    isActive: parsed.isActive,
    hotspots: parsed.hotspots.map((pin) => ({
      ...(pin.id && isValidObjectId(pin.id) ? { _id: pin.id } : {}),
      xPercent: pin.xPercent,
      yPercent: pin.yPercent,
      product: pin.productId,
      defaultColorSlug: pin.defaultColorSlug,
      stylingNote: stripHtml(pin.stylingNote),
    })),
  };
  if (id) {
    if (!isValidObjectId(id)) return null;
    const updated = await Lookbook.findByIdAndUpdate(id, { $set: next }, { returnDocument: "after" }).select("_id title");
    return updated ? { id: String(updated._id), title: updated.title } : null;
  }
  const created = await Lookbook.create(next);
  return { id: String(created._id), title: created.title };
}

type SizeLean = { _id: { toString(): string }; label: string; sortOrder: number; measurementsInMeters: GarmentMeasurements };

function mapSizes(rows: { sizeId: SizeLean | { toString(): string }; sizeLabel: string; stock: number }[] | undefined): ProductSizeOption[] {
  return (rows ?? [])
    .map((row) => {
      if (!row.sizeId || typeof row.sizeId !== "object" || !("measurementsInMeters" in row.sizeId)) return null;
      const converted = convertMeasurements(row.sizeId.measurementsInMeters);
      return {
        sizeId: String(row.sizeId._id),
        sizeLabel: row.sizeLabel,
        stock: row.stock,
        measurementsInMeters: converted.meters,
        measurementsInCm: converted.centimeters,
        measurementsInInches: converted.inches,
      };
    })
    .filter((size): size is ProductSizeOption => Boolean(size));
}

type PopulatedProduct = {
  _id?: { toString(): string };
  title?: string;
  slug?: string;
  images?: string[];
  finalPrice?: number;
  basePrice?: number;
  discountPercentage?: number;
  isActive?: boolean;
  colorVariants?: Array<{
    colorName: string;
    colorSlug: string;
    hexCode: string;
    images: string[];
    sizes?: { sizeId: SizeLean; sizeLabel: string; stock: number }[];
  }>;
  sizes?: { sizeId: SizeLean; sizeLabel: string; stock: number }[];
};

type PublicLookRow = {
  _id: { toString(): string };
  title: string;
  seasonTag: string;
  editorialStory: string;
  coverImage: string;
  hotspots?: Array<{
    _id?: { toString(): string };
    xPercent: number;
    yPercent: number;
    defaultColorSlug?: string;
    stylingNote?: string;
    product: PopulatedProduct | null;
  }>;
};

type AdminLookRow = {
  _id: { toString(): string };
  title: string;
  seasonTag: string;
  editorialStory: string;
  coverImage: string;
  isActive?: boolean;
  hotspots?: Array<{
    _id?: { toString(): string };
    xPercent: number;
    yPercent: number;
    product?: { toString(): string };
    defaultColorSlug?: string;
    stylingNote?: string;
  }>;
};

export async function listPublicLooks() {
  if (!isDatabaseConfigured()) return [];
  try {
    await connectDB();
  } catch {
    return [];
  }
  const rows = await Lookbook.find({ isActive: true })
    .sort({ createdAt: -1 })
    .limit(12)
    .populate({
      path: "hotspots.product",
      select: "title slug images finalPrice basePrice discountPercentage colorVariants sizes isActive",
      populate: { path: "colorVariants.sizes.sizeId sizes.sizeId", select: "label sortOrder measurementsInMeters" },
    })
    .lean<PublicLookRow[]>();

  return rows.map((look) => ({
    id: String(look._id),
    title: look.title,
    seasonTag: look.seasonTag,
    editorialStory: look.editorialStory,
    coverImage: look.coverImage,
    hotspots: (look.hotspots ?? [])
      .map((pin) => {
        const product = pin.product;
        if (!product || typeof product !== "object" || !product.title || product.isActive === false) return null;
        const colors = (product.colorVariants ?? []).map((variant) => ({
          colorName: variant.colorName,
          colorSlug: variant.colorSlug,
          hexCode: variant.hexCode,
          images: variant.images,
          outfitLookImages: [],
          sizes: mapSizes(variant.sizes),
        }));
        return {
          id: String(pin._id),
          xPercent: pin.xPercent,
          yPercent: pin.yPercent,
          defaultColorSlug: pin.defaultColorSlug ?? "",
          stylingNote: pin.stylingNote ?? "",
          product: {
            id: String(product._id),
            title: product.title,
            slug: product.slug ?? "",
            image: product.images?.[0] ?? "",
            finalPrice: product.finalPrice ?? 0,
            basePrice: product.basePrice ?? 0,
            discountPercentage: product.discountPercentage ?? 0,
            colors,
            sizes: colors[0]?.sizes?.length ? colors[0].sizes : mapSizes(product.sizes),
          },
        };
      })
      .filter((pin): pin is NonNullable<typeof pin> => Boolean(pin)),
  }));
}

export async function listAdminLooks() {
  await connectDB();
  const rows = await Lookbook.find()
    .sort({ createdAt: -1 })
    .limit(50)
    .select("title seasonTag editorialStory coverImage isActive hotspots")
    .lean<AdminLookRow[]>();
  return rows.map((look) => ({
    id: String(look._id),
    title: look.title,
    seasonTag: look.seasonTag,
    editorialStory: look.editorialStory,
    coverImage: look.coverImage,
    isActive: look.isActive !== false,
    hotspots: (look.hotspots ?? []).map((pin) => ({
      id: String(pin._id),
      xPercent: pin.xPercent,
      yPercent: pin.yPercent,
      productId: String(pin.product),
      defaultColorSlug: pin.defaultColorSlug ?? "",
      stylingNote: pin.stylingNote ?? "",
    })),
  }));
}
