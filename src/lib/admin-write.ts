import "server-only";
import type { z } from "zod";
import { categoryWriteSchema, productWriteSchema, sizeWriteSchema } from "@/lib/admin-schemas";
import { isAllowedMediaUrl } from "@/lib/admin-http";
import { connectDB } from "@/lib/db";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";
import { resolvePricing } from "@/lib/prices";
import { invalidateCatalogCache } from "@/lib/redis";
import { stripHtml } from "@/lib/sanitize";
import { isValidObjectId } from "@/lib/security";
import { slugify } from "@/lib/utils";
import { Category } from "@/models/Category";
import { Order } from "@/models/Order";
import { Product } from "@/models/Product";
import { Size } from "@/models/Size";
import { User } from "@/models/User";

type CategoryInput = z.infer<typeof categoryWriteSchema>;
type SizeInput = z.infer<typeof sizeWriteSchema>;
type ProductInput = z.infer<typeof productWriteSchema>;

function mediaOrThrow(urls: string[]) {
  if (urls.some((url) => !isAllowedMediaUrl(url))) {
    throw Object.assign(new Error("Images must be uploaded to the house archive."), { status: 400 });
  }
}

export async function saveCategory(raw: CategoryInput, id?: string) {
  const parsed = categoryWriteSchema.parse(raw);
  if (parsed.imageUrl && !isAllowedMediaUrl(parsed.imageUrl)) {
    throw Object.assign(new Error("Upload the cover through the house archive."), { status: 400 });
  }
  await connectDB();

  let parent: string | null = null;
  if (parsed.parentCategory) {
    if (!isValidObjectId(parsed.parentCategory)) {
      throw Object.assign(new Error("Choose a real parent category."), { status: 400 });
    }
    if (id && parsed.parentCategory === id) {
      throw Object.assign(new Error("A category cannot sit inside itself."), { status: 400 });
    }
    const parentDoc = await Category.findById(parsed.parentCategory).select("parentCategory").lean<{ parentCategory?: unknown } | null>();
    if (!parentDoc || Array.isArray(parentDoc)) {
      throw Object.assign(new Error("Choose a real parent category."), { status: 400 });
    }
    if (parentDoc.parentCategory) {
      throw Object.assign(new Error("Subcategories stay one level deep."), { status: 400 });
    }
    parent = parsed.parentCategory;
  }

  const next = {
    name: stripHtml(parsed.name),
    slug: slugify(parsed.slug),
    description: stripHtml(parsed.description),
    imageUrl: parsed.imageUrl ?? "",
    parentCategory: parent,
    isActive: parsed.isActive,
  };

  if (id) {
    if (!isValidObjectId(id)) return null;
    const child = await Category.exists({ parentCategory: id });
    if (child && parent) {
      throw Object.assign(new Error("Move its subcategories before nesting this category."), { status: 400 });
    }
    const updated = await Category.findByIdAndUpdate(id, { $set: next }, { returnDocument: "after", runValidators: true })
      .select("name slug")
      .lean<{ name: string; slug: string } | null>();
    if (!updated || Array.isArray(updated)) return null;
    await invalidateCatalogCache();
    return { id, name: updated.name, slug: updated.slug };
  }

  const created = await Category.create(next);
  await invalidateCatalogCache();
  return { id: String(created._id), name: created.name, slug: created.slug };
}

export async function removeCategory(id: string) {
  if (!isValidObjectId(id)) return { ok: false as const, message: "Not found." };
  await connectDB();
  const [children, products] = await Promise.all([
    Category.countDocuments({ parentCategory: id }),
    Product.countDocuments({ $or: [{ category: id }, { subCategory: id }] }),
  ]);
  if (children > 0) return { ok: false as const, message: "Move or remove its subcategories first." };
  if (products > 0) return { ok: false as const, message: "Pieces still use this category." };
  const removed = await Category.findByIdAndDelete(id).select("_id").lean();
  if (!removed) return { ok: false as const, message: "Not found." };
  await invalidateCatalogCache();
  return { ok: true as const };
}

export async function saveSize(raw: SizeInput, id?: string) {
  const parsed = sizeWriteSchema.parse(raw);
  await connectDB();
  const next = {
    label: parsed.label.trim().toUpperCase(),
    code: slugify(parsed.code),
    sortOrder: parsed.sortOrder,
    measurementsInMeters: parsed.measurementsInMeters,
  };
  if (id) {
    if (!isValidObjectId(id)) return null;
    const updated = await Size.findByIdAndUpdate(id, { $set: next }, { returnDocument: "after", runValidators: true })
      .select("label")
      .lean<{ label: string } | null>();
    if (!updated || Array.isArray(updated)) return null;
    await Product.updateMany({ "sizes.sizeId": id }, { $set: { "sizes.$[row].sizeLabel": next.label } }, { arrayFilters: [{ "row.sizeId": id }] });
    await invalidateCatalogCache();
    return { id, label: updated.label };
  }
  const created = await Size.create(next);
  await invalidateCatalogCache();
  return { id: String(created._id), label: created.label };
}

export async function removeSize(id: string) {
  if (!isValidObjectId(id)) return { ok: false as const, message: "Not found." };
  await connectDB();
  const used = await Product.countDocuments({ "sizes.sizeId": id });
  if (used > 0) return { ok: false as const, message: "Pieces still use this size." };
  const removed = await Size.findByIdAndDelete(id).select("_id").lean();
  if (!removed) return { ok: false as const, message: "Not found." };
  await invalidateCatalogCache();
  return { ok: true as const };
}

export async function getAdminProduct(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const product = await Product.findById(id)
    .select(
      "title slug storyDescription fabricAndCare images outfitLookImages colorVariants category subCategory sizes basePrice discountPercentage discountAmount finalPrice isFeatured isActive",
    )
    .lean<{
      _id: { toString(): string };
      title: string;
      slug: string;
      storyDescription: string;
      fabricAndCare: string;
      images: string[];
      outfitLookImages?: string[];
      colorVariants?: Array<{
        colorName: string;
        colorSlug: string;
        hexCode: string;
        images: string[];
        outfitLookImages?: string[];
        sizes: { sizeId: { toString(): string }; sizeLabel: string; stock: number }[];
      }>;
      category: { toString(): string };
      subCategory?: { toString(): string } | null;
      sizes: { sizeId: { toString(): string }; sizeLabel: string; stock: number }[];
      basePrice: number;
      discountPercentage: number;
      discountAmount?: number;
      finalPrice: number;
      isFeatured?: boolean;
      isActive?: boolean;
    } | null>();
  if (!product || Array.isArray(product)) return null;
  return {
    id: String(product._id),
    title: product.title,
    slug: product.slug,
    storyDescription: product.storyDescription,
    fabricAndCare: product.fabricAndCare,
    images: product.images,
    outfitLookImages: product.outfitLookImages ?? [],
    colorVariants: (product.colorVariants ?? []).map((variant) => ({
      colorName: variant.colorName,
      colorSlug: variant.colorSlug,
      hexCode: variant.hexCode,
      images: variant.images,
      outfitLookImages: variant.outfitLookImages ?? [],
      sizes: variant.sizes.map((size) => ({
        sizeId: String(size.sizeId),
        stock: size.stock,
      })),
    })),
    categoryId: String(product.category),
    subCategoryId: product.subCategory ? String(product.subCategory) : "",
    sizes: product.sizes.map((size) => ({
      sizeId: String(size.sizeId),
      sizeLabel: size.sizeLabel,
      stock: size.stock,
    })),
    basePrice: product.basePrice,
    discountPercentage: product.discountPercentage ?? 0,
    discountAmount: product.discountAmount ?? 0,
    finalPrice: product.finalPrice,
    discountMode: (product.discountAmount ?? 0) > 0 ? "flat" : "percent",
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
  };
}

export async function saveProduct(raw: ProductInput, id?: string) {
  const parsed = productWriteSchema.parse(raw);
  const variantMedia = parsed.colorVariants.flatMap((variant) => [...variant.images, ...variant.outfitLookImages]);
  mediaOrThrow([...parsed.images, ...parsed.outfitLookImages, ...variantMedia]);
  if (!isValidObjectId(parsed.categoryId)) {
    throw Object.assign(new Error("Choose a category."), { status: 400 });
  }
  const sizeIds = [
    ...parsed.sizes.map((size) => size.sizeId),
    ...parsed.colorVariants.flatMap((variant) => variant.sizes.map((size) => size.sizeId)),
  ];
  if (sizeIds.some((sizeId) => !isValidObjectId(sizeId))) {
    throw Object.assign(new Error("Choose sizes from the size book."), { status: 400 });
  }
  if (parsed.subCategoryId && !isValidObjectId(parsed.subCategoryId)) {
    throw Object.assign(new Error("Choose a subcategory."), { status: 400 });
  }

  await connectDB();
  const [category, subCategory, sizes] = await Promise.all([
    Category.findById(parsed.categoryId).select("name parentCategory").lean<{ parentCategory?: unknown } | null>(),
    parsed.subCategoryId
      ? Category.findById(parsed.subCategoryId).select("parentCategory").lean<{ parentCategory?: { toString(): string } } | null>()
      : Promise.resolve(null),
    Size.find({ _id: { $in: sizeIds } }).select("label").lean<Array<{ _id: { toString(): string }; label: string }>>(),
  ]);

  if (!category || Array.isArray(category)) throw Object.assign(new Error("Choose a category."), { status: 400 });
  if (parsed.subCategoryId) {
    if (!subCategory || Array.isArray(subCategory) || String(subCategory.parentCategory ?? "") !== parsed.categoryId) {
      throw Object.assign(new Error("That subcategory does not belong to the chosen category."), { status: 400 });
    }
  }

  const sizeMap = new Map(sizes.map((size) => [String(size._id), size.label]));
  if (sizeMap.size !== new Set(sizeIds).size) {
    throw Object.assign(new Error("Choose sizes from the size book."), { status: 400 });
  }

  const priced = resolvePricing(parsed.basePrice, parsed.discountMode, parsed.discountPercentage, parsed.discountAmount);
  const colorVariants = parsed.colorVariants.map((variant) => ({
    colorName: stripHtml(variant.colorName),
    colorSlug: slugify(variant.colorSlug),
    hexCode: variant.hexCode.toUpperCase(),
    images: variant.images,
    outfitLookImages: variant.outfitLookImages,
    sizes: variant.sizes.map((size) => ({
      sizeId: size.sizeId,
      sizeLabel: sizeMap.get(size.sizeId) ?? "",
      stock: size.stock,
    })),
  }));
  const lead = colorVariants[0];
  const next = {
    title: stripHtml(parsed.title),
    slug: slugify(parsed.slug),
    storyDescription: stripHtml(parsed.storyDescription),
    fabricAndCare: stripHtml(parsed.fabricAndCare),
    images: lead?.images?.length ? lead.images : parsed.images,
    outfitLookImages: lead ? lead.outfitLookImages : parsed.outfitLookImages,
    category: parsed.categoryId,
    subCategory: parsed.subCategoryId || null,
    sizes: lead?.sizes?.length
      ? lead.sizes
      : parsed.sizes.map((size) => ({
          sizeId: size.sizeId,
          sizeLabel: sizeMap.get(size.sizeId) ?? "",
          stock: size.stock,
        })),
    colorVariants,
    basePrice: priced.basePrice,
    discountPercentage: priced.discountPercentage,
    discountAmount: priced.discountAmount,
    finalPrice: priced.finalPrice,
    isFeatured: parsed.isFeatured,
    isActive: parsed.isActive,
  };

  if (id) {
    if (!isValidObjectId(id)) return null;
    const updated = await Product.findByIdAndUpdate(id, { $set: next }, { returnDocument: "after", runValidators: true })
      .select("title slug finalPrice")
      .lean<{ title: string; slug: string; finalPrice: number } | null>();
    if (!updated || Array.isArray(updated)) return null;
    await invalidateCatalogCache();
    return { id, title: updated.title, slug: updated.slug, finalPrice: updated.finalPrice };
  }

  const created = await Product.create(next);
  await invalidateCatalogCache();
  return { id: String(created._id), title: created.title, slug: created.slug, finalPrice: created.finalPrice };
}

export async function removeProduct(id: string) {
  if (!isValidObjectId(id)) return false;
  await connectDB();
  const removed = await Product.findByIdAndDelete(id).select("_id").lean();
  if (!removed) return false;
  await User.updateMany({ wishlist: id }, { $pull: { wishlist: id } });
  await invalidateCatalogCache();
  return true;
}

export async function getAdminOrder(id: string) {
  if (!isValidObjectId(id)) return null;
  await connectDB();
  const order = await Order.findById(id)
    .select(
      "orderNumber status statusHistory items shippingDetails customFitNotes paymentMethod subtotal totalDiscount shippingFee taxAmount grandTotal createdAt",
    )
    .lean<{
      _id: { toString(): string };
      orderNumber: string;
      status: string;
      statusHistory?: { status: string; updatedAt?: Date; note?: string }[];
      items: Array<{
        title: string;
        image: string;
        sizeLabel: string;
        colorName?: string;
        hexCode?: string;
        discountApplied: number;
        lineTotal: number;
      }>;
      shippingDetails: {
        fullName: string;
        phone: string;
        email: string;
        address: string;
        city: string;
        postalCode: string;
      };
      customFitNotes?: string;
      paymentMethod: string;
      subtotal: number;
      totalDiscount: number;
      shippingFee: number;
      taxAmount?: number;
      grandTotal: number;
      createdAt?: Date;
    } | null>();
  if (!order || Array.isArray(order)) return null;
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    status: order.status,
    createdAt: order.createdAt ? new Date(order.createdAt).toISOString() : "",
    paymentMethod: order.paymentMethod,
    customFitNotes: order.customFitNotes ?? "",
    shippingDetails: order.shippingDetails,
    subtotal: order.subtotal,
    totalDiscount: order.totalDiscount,
    shippingFee: order.shippingFee,
    taxAmount: order.taxAmount ?? 0,
    grandTotal: order.grandTotal,
    items: order.items.map((item) => ({
      ...item,
      measurements: convertMeasurements(item.sizeMeasurementsMeters),
    })),
    statusHistory: (order.statusHistory ?? []).map((event) => ({
      colorName: item.colorName ?? "",
      hexCode: item.hexCode ?? "",
      status: event.status,
      note: event.note ?? "",
      updatedAt: event.updatedAt ? new Date(event.updatedAt).toISOString() : "",
    })),
  };
}
