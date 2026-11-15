import "server-only";
import { cache } from "react";
import { Types } from "mongoose";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { SIZE_PRESETS, defaultStoreSettings } from "@/lib/defaults";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";
import { pageCount, parsePageLimit } from "@/lib/pagination";
import { calculateFinalPrice, roundMoney } from "@/lib/prices";
import { cacheGetOrSet, catalogCacheVersion, versionedKey } from "@/lib/redis";
import { traceSpan } from "@/lib/telemetry";
import { isObjectId } from "@/lib/utils";
import { Category } from "@/models/Category";
import { Product } from "@/models/Product";
import { Review } from "@/models/Review";
import { Size } from "@/models/Size";
import { StoreSettings } from "@/models/StoreSettings";
import type {
  NavCategory,
  ProductCardData,
  ProductDetail,
  ProductSizeOption,
  StoreSettingsDTO,
  WishlistPiece,
} from "@/types/commerce";

type RefLean = { _id: Types.ObjectId; name: string; slug: string };
type SizeLean = {
  _id: Types.ObjectId;
  label: string;
  sortOrder: number;
  measurementsInMeters: GarmentMeasurements;
};

type ProductLean = {
  _id: Types.ObjectId;
  title: string;
  slug: string;
  storyDescription: string;
  fabricAndCare?: string;
  images: string[];
  outfitLookImages?: string[];
  colorVariants?: Array<{
    colorName: string;
    colorSlug: string;
    hexCode: string;
    images: string[];
    outfitLookImages?: string[];
    sizes?: { sizeId: SizeLean | Types.ObjectId; sizeLabel: string; stock: number }[];
  }>;
  category?: RefLean | Types.ObjectId | null;
  subCategory?: RefLean | Types.ObjectId | null;
  sizes?: { sizeId: SizeLean | Types.ObjectId; sizeLabel: string; stock: number }[];
  basePrice: number;
  discountPercentage?: number;
  finalPrice?: number;
  isFeatured?: boolean;
  averageRating?: number;
  reviewCount?: number;
};

const CARD_SELECT = "title slug storyDescription images basePrice discountPercentage finalPrice category";
const cacheTtl = () => Number(process.env.CACHE_DEFAULT_TTL_SECONDS) || 300;

async function ready() {
  if (!isDatabaseConfigured()) return false;
  try {
    await connectDB();
    return true;
  } catch (error) {
    console.error("The atelier archive is unreachable.", error);
    return false;
  }
}

function asRef(value: ProductLean["category"]): RefLean | null {
  if (value && typeof value === "object" && "slug" in value && "name" in value) return value;
  return null;
}

function isSize(value: SizeLean | Types.ObjectId): value is SizeLean {
  return Boolean(value) && typeof value === "object" && "measurementsInMeters" in value;
}

function toCard(product: ProductLean): ProductCardData {
  const category = asRef(product.category);
  const discount = product.discountPercentage ?? 0;
  return {
    id: String(product._id),
    title: product.title,
    slug: product.slug,
    storyDescription: product.storyDescription,
    image: product.images[0] ?? "",
    images: product.images ?? [],
    basePrice: product.basePrice,
    discountPercentage: discount,
    finalPrice:
      typeof product.finalPrice === "number"
        ? roundMoney(product.finalPrice)
        : calculateFinalPrice(product.basePrice, discount),
    categoryName: category?.name ?? "Atelier",
    categorySlug: category?.slug ?? "shop",
  };
}

function safeSearch(value?: string) {
  return (value ?? "")
    .replace(/[^\p{L}\p{N}\s'-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

async function remember<T>(suffix: string, loader: () => Promise<T>) {
  const version = await catalogCacheVersion();
  return cacheGetOrSet(versionedKey(version, suffix), cacheTtl(), loader);
}

export const getStoreSettings = cache(async (): Promise<StoreSettingsDTO> => {
  if (!(await ready())) return defaultStoreSettings;
  return remember("settings", () =>
    traceSpan("db.settings", async () => {
      const settings = await StoreSettings.findOne()
        .select(
          "storeName supportEmail supportPhone whatsappNumber currencySymbol standardShippingRate freeShippingThreshold taxPercentage announcementBarText themeMode",
        )
        .lean<StoreSettingsDTO | null>();
      if (!settings || Array.isArray(settings)) return defaultStoreSettings;
      return {
        storeName: settings.storeName,
        supportEmail: settings.supportEmail,
        supportPhone: settings.supportPhone,
        whatsappNumber: settings.whatsappNumber || process.env.DEFAULT_WHATSAPP_NUMBER || settings.supportPhone,
        currencySymbol: settings.currencySymbol,
        standardShippingRate: settings.standardShippingRate,
        freeShippingThreshold: settings.freeShippingThreshold,
        taxPercentage: settings.taxPercentage,
        announcementBarText: settings.announcementBarText,
        themeMode: settings.themeMode,
      };
    }),
  );
});

export const getNavCategories = cache(async (): Promise<NavCategory[]> => {
  if (!(await ready())) return [];
  return remember("categories", () =>
    traceSpan("db.categories", async () => {
      const categories = await Category.find({ isActive: true })
        .select("name slug imageUrl parentCategory")
        .sort({ name: 1 })
        .limit(50)
        .lean<Array<{ _id: Types.ObjectId; name: string; slug: string; imageUrl?: string; parentCategory?: Types.ObjectId | null }>>();
      const parents = categories.filter((category) => !category.parentCategory);
      return parents.map((parent) => ({
        name: parent.name,
        slug: parent.slug,
        imageUrl: parent.imageUrl ?? "",
        children: categories
          .filter((category) => String(category.parentCategory) === String(parent._id))
          .map((category) => ({ name: category.name, slug: category.slug })),
      }));
    }),
  );
});

export const getFeaturedProducts = cache(async () => {
  if (!(await ready())) return [];
  return remember("featured", () =>
    traceSpan("db.featured", async () => {
      const products = await Product.find({ isActive: true, isFeatured: true })
        .select(CARD_SELECT)
        .populate({ path: "category", select: "name slug" })
        .sort({ createdAt: -1 })
        .limit(4)
        .lean<ProductLean[]>();
      return products.map(toCard);
    }),
  );
});

export type ShopSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export type ShopQuery = {
  categorySlug?: string;
  subCategorySlug?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  onSale?: boolean;
  sort?: ShopSort;
  q?: string;
  page?: number;
  limit?: number;
};

const SHOP_SORTS = new Set<ShopSort>(["featured", "newest", "price-asc", "price-desc", "rating"]);

export function normalizeShopSort(value: unknown): ShopSort | undefined {
  return typeof value === "string" && SHOP_SORTS.has(value as ShopSort) ? (value as ShopSort) : undefined;
}

function emptyShop(paging: { page: number; limit: number; skip: number }, missing = false) {
  return {
    products: missing ? null : ([] as ProductCardData[]),
    category: null as { name: string; slug: string; description: string } | null,
    page: paging.page,
    limit: paging.limit,
    total: 0,
    pages: 1,
  };
}

export async function getShopProducts(input?: ShopQuery) {
  const paging = parsePageLimit(input?.page, input?.limit);
  const query = safeSearch(input?.q);
  const categorySlug = input?.categorySlug?.trim();
  const subCategorySlug = input?.subCategorySlug?.trim();
  const size = (input?.size ?? "").trim().toUpperCase();
  const safeSize = /^[A-Z0-9]{1,8}$/.test(size) ? size : "";
  const sort = input?.sort;
  const minPrice = Number.isFinite(input?.minPrice) ? Math.max(0, Number(input?.minPrice)) : undefined;
  const maxPrice = Number.isFinite(input?.maxPrice) ? Math.max(0, Number(input?.maxPrice)) : undefined;

  if (!(await ready())) return emptyShop(paging);

  const cacheKey = [
    "shop",
    categorySlug || "all",
    subCategorySlug || "",
    safeSize,
    minPrice ?? "",
    maxPrice ?? "",
    input?.onSale ? "sale" : "",
    sort ?? "",
    query,
    paging.page,
    paging.limit,
  ].join(":");

  return remember(cacheKey, () =>
    traceSpan("db.shop", async () => {
      let category: { name: string; slug: string; description: string } | null = null;
      const filter: Record<string, unknown> = { isActive: true };

      if (subCategorySlug) {
        const sub = await Category.findOne({ slug: subCategorySlug, isActive: true })
          .select("name slug description parentCategory")
          .lean<{
            _id: Types.ObjectId;
            name: string;
            slug: string;
            description: string;
            parentCategory?: Types.ObjectId | null;
          } | null>();
        if (!sub || Array.isArray(sub) || !sub.parentCategory) return emptyShop(paging, true);
        if (categorySlug) {
          const parent = await Category.findOne({ slug: categorySlug, isActive: true }).select("_id").lean<{ _id: Types.ObjectId } | null>();
          if (!parent || Array.isArray(parent) || String(parent._id) !== String(sub.parentCategory)) return emptyShop(paging, true);
        }
        category = { name: sub.name, slug: sub.slug, description: sub.description };
        filter.subCategory = sub._id;
      } else if (categorySlug) {
        const match = await Category.findOne({ slug: categorySlug, isActive: true })
          .select("name slug description parentCategory")
          .lean<{
            _id: Types.ObjectId;
            name: string;
            slug: string;
            description: string;
            parentCategory?: Types.ObjectId | null;
          } | null>();
        if (!match || Array.isArray(match)) return emptyShop(paging, true);
        category = { name: match.name, slug: match.slug, description: match.description };
        if (match.parentCategory) {
          filter.subCategory = match._id;
        } else {
          const childIds = await Category.find({ parentCategory: match._id, isActive: true }).select("_id").limit(50).lean();
          filter.$or = [{ category: match._id }, { subCategory: { $in: childIds.map((child) => child._id) } }];
        }
      }

      if (safeSize) filter.sizes = { $elemMatch: { sizeLabel: safeSize, stock: { $gt: 0 } } };
      if (input?.onSale) filter.discountPercentage = { $gt: 0 };
      if (minPrice !== undefined || maxPrice !== undefined) {
        const range: Record<string, number> = {};
        if (minPrice !== undefined) range.$gte = Math.min(minPrice, maxPrice ?? minPrice);
        if (maxPrice !== undefined) range.$lte = Math.max(maxPrice, minPrice ?? maxPrice);
        filter.finalPrice = range;
      }
      if (query) filter.$text = { $search: query };

      const projection = query
        ? {
            title: 1,
            slug: 1,
            storyDescription: 1,
            images: 1,
            basePrice: 1,
            discountPercentage: 1,
            finalPrice: 1,
            category: 1,
            score: { $meta: "textScore" },
          }
        : CARD_SELECT;

      const listing = Product.find(filter).select(projection).populate({ path: "category", select: "name slug" }).skip(paging.skip).limit(paging.limit);
      if (query && !sort) listing.sort({ score: { $meta: "textScore" } });
      else if (sort === "price-asc") listing.sort({ finalPrice: 1, createdAt: -1 });
      else if (sort === "price-desc") listing.sort({ finalPrice: -1, createdAt: -1 });
      else if (sort === "rating") listing.sort({ averageRating: -1, reviewCount: -1 });
      else if (sort === "featured") listing.sort({ isFeatured: -1, createdAt: -1 });
      else listing.sort({ createdAt: -1 });

      const [products, total] = await Promise.all([listing.lean<ProductLean[]>(), Product.countDocuments(filter)]);

      return {
        products: products.map(toCard),
        category,
        page: paging.page,
        limit: paging.limit,
        total,
        pages: pageCount(total, paging.limit),
      };
    }),
  );
}

export const getCatalogFacets = cache(async () => {
  const fallback = {
    sizes: SIZE_PRESETS.map((size) => size.label),
    minPrice: 0,
    maxPrice: 0,
  };
  if (!(await ready())) return fallback;
  return remember("facets", () =>
    traceSpan("db.facets", async () => {
      const [sizes, bounds] = await Promise.all([
        Size.find().select("label").sort({ sortOrder: 1 }).limit(30).lean<Array<{ label: string }>>(),
        Product.aggregate<{ min: number; max: number }>([
          { $match: { isActive: true } },
          { $group: { _id: null, min: { $min: "$finalPrice" }, max: { $max: "$finalPrice" } } },
        ]),
      ]);
      return {
        sizes: sizes.length ? sizes.map((size) => size.label) : fallback.sizes,
        minPrice: Math.floor(bounds[0]?.min ?? 0),
        maxPrice: Math.ceil(bounds[0]?.max ?? 0),
      };
    }),
  );
});

export async function getRelatedProducts(categorySlug: string, excludeId: string) {
  if (!categorySlug || !isObjectId(excludeId) || !(await ready())) return [];
  return remember(`related:${categorySlug}:${excludeId}`, () =>
    traceSpan("db.related", async () => {
      const category = await Category.findOne({ slug: categorySlug, isActive: true }).select("_id").lean<{ _id: Types.ObjectId } | null>();
      if (!category || Array.isArray(category)) return [];
      const products = await Product.find({ isActive: true, category: category._id, _id: { $ne: excludeId } })
        .select(CARD_SELECT)
        .populate({ path: "category", select: "name slug" })
        .sort({ isFeatured: -1, createdAt: -1 })
        .limit(4)
        .lean<ProductLean[]>();
      return products.map(toCard);
    }),
  );
}

function mapSizeRows(
  rows: { sizeId: SizeLean | Types.ObjectId; sizeLabel: string; stock: number }[] | undefined,
): ProductSizeOption[] {
  return (rows ?? [])
    .map((row) => {
      if (!isSize(row.sizeId)) return null;
      const converted = convertMeasurements(row.sizeId.measurementsInMeters);
      return {
        sizeId: String(row.sizeId._id),
        sizeLabel: row.sizeLabel,
        stock: row.stock,
        measurementsInMeters: converted.meters,
        measurementsInCm: converted.centimeters,
        measurementsInInches: converted.inches,
        sortOrder: row.sizeId.sortOrder,
      };
    })
    .filter((size): size is ProductSizeOption & { sortOrder: number } => Boolean(size))
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map(({ sortOrder: _sort, ...size }) => size);
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  if (!(await ready())) return null;
  return remember(`product:${slug}`, () =>
    traceSpan("db.product", async () => {
      const product = await Product.findOne({ slug, isActive: true })
        .select(
          "title slug storyDescription fabricAndCare images outfitLookImages colorVariants category subCategory sizes basePrice discountPercentage finalPrice averageRating reviewCount",
        )
        .populate({ path: "category", select: "name slug" })
        .populate({ path: "subCategory", select: "name slug" })
        .populate({ path: "sizes.sizeId", select: "label sortOrder measurementsInMeters" })
        .populate({ path: "colorVariants.sizes.sizeId", select: "label sortOrder measurementsInMeters" })
        .lean<ProductLean | null>();

      if (!product) return null;

      const sizes = mapSizeRows(product.sizes);
      const card = toCard(product);
      const subCategory = asRef(product.subCategory);
      const detailed = (product.colorVariants ?? [])
        .map((variant) => ({
          colorName: variant.colorName,
          colorSlug: variant.colorSlug,
          hexCode: variant.hexCode,
          images: variant.images ?? [],
          outfitLookImages: variant.outfitLookImages ?? [],
          sizes: mapSizeRows(variant.sizes),
        }))
        .filter((variant) => variant.images.length && variant.sizes.length);
      const colorsDetailed = detailed.length
        ? detailed
        : [
            {
              colorName: "House cloth",
              colorSlug: "house",
              hexCode: "#E6E1DA",
              images: product.images ?? [],
              outfitLookImages: product.outfitLookImages ?? [],
              sizes,
            },
          ];
      return {
        ...card,
        fabricAndCare: product.fabricAndCare ?? "",
        outfitLookImages: colorsDetailed[0]?.outfitLookImages ?? [],
        subCategoryName: subCategory?.name ?? "",
        subCategorySlug: subCategory?.slug ?? "",
        sizes: colorsDetailed[0]?.sizes ?? sizes,
        averageRating: product.averageRating ?? 0,
        reviewCount: product.reviewCount ?? 0,
        colorsDetailed,
      };
    }),
  );
});

export async function getProductsByIds(ids: string[]) {
  const valid = ids.filter((id) => isObjectId(id)).slice(0, 12);
  if (!valid.length || !(await ready())) return [];

  return traceSpan("db.productsById", async () => {
    const products = await Product.find({ _id: { $in: valid }, isActive: true })
      .select(CARD_SELECT)
      .populate({ path: "category", select: "name slug" })
      .limit(valid.length)
      .lean<ProductLean[]>();
    const order = new Map(valid.map((id, index) => [id, index]));
    return products.map(toCard).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  });
}

export async function getWishlistPieces(ids: string[]): Promise<WishlistPiece[]> {
  const valid = ids.filter((id) => isObjectId(id)).slice(0, 100);
  if (!valid.length || !(await ready())) return [];

  return traceSpan("db.wishlistPieces", async () => {
    const products = await Product.find({ _id: { $in: valid }, isActive: true })
      .select(`${CARD_SELECT} sizes`)
      .populate({ path: "category", select: "name slug" })
      .populate({ path: "sizes.sizeId", select: "measurementsInMeters" })
      .limit(valid.length)
      .lean<ProductLean[]>();
    const order = new Map(valid.map((id, index) => [id, index]));
    return products
      .map((product) => {
        const row = (product.sizes ?? []).find((size) => size.stock > 0 && isSize(size.sizeId));
        return {
          ...toCard(product),
          offerSize:
            row && isSize(row.sizeId)
              ? {
                  sizeLabel: row.sizeLabel,
                  stock: row.stock,
                  measurementsInMeters: row.sizeId.measurementsInMeters,
                }
              : null,
        };
      })
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  });
}

export type PublicReview = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: string;
};

export async function getProductReviews(productId: string, pageValue?: number, limitValue?: number) {
  const paging = parsePageLimit(pageValue, limitValue ?? 12);
  const emptyBreakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  if (!isObjectId(productId) || !(await ready())) {
    return { reviews: [] as PublicReview[], breakdown: emptyBreakdown, ...paging, total: 0, pages: 1 };
  }

  return traceSpan("db.reviews", async () => {
    const filter = { product: productId };
    const [rows, total, buckets] = await Promise.all([
      Review.find(filter)
        .select("rating comment createdAt user")
        .populate({ path: "user", select: "name" })
        .sort({ createdAt: -1 })
        .skip(paging.skip)
        .limit(paging.limit)
        .lean<
          {
            _id: Types.ObjectId;
            rating: number;
            comment: string;
            createdAt?: Date;
            user?: { name?: string } | Types.ObjectId;
          }[]
        >(),
      Review.countDocuments(filter),
      Review.aggregate<{ _id: number; count: number }>([
        { $match: { product: new Types.ObjectId(productId) } },
        { $group: { _id: "$rating", count: { $sum: 1 } } },
      ]),
    ]);

    const breakdown = { ...emptyBreakdown };
    for (const bucket of buckets) {
      if (bucket._id >= 1 && bucket._id <= 5) breakdown[bucket._id as 1 | 2 | 3 | 4 | 5] = bucket.count;
    }

    return {
      breakdown,
      reviews: rows.map((row) => ({
        id: String(row._id),
        rating: row.rating,
        comment: row.comment,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : "",
        author: row.user && typeof row.user === "object" && "name" in row.user ? row.user.name || "Client" : "Client",
      })),
      page: paging.page,
      limit: paging.limit,
      total,
      pages: pageCount(total, paging.limit),
    };
  });
}
