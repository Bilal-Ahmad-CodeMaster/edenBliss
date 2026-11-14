import "server-only";
import { calculateFinalPrice, roundMoney } from "@/lib/prices";
import { isObjectId } from "@/lib/utils";
import { Product } from "@/models/Product";
import { Size } from "@/models/Size";
import { User } from "@/models/User";
import type { CartItem } from "@/types/commerce";
import type { GarmentMeasurements } from "@/lib/measurements";

export type IncomingCartLine = {
  productId: string;
  sizeLabel: string;
  quantity: number;
};

type ProductSizeRow = {
  sizeId: { toString(): string };
  sizeLabel: string;
  stock: number;
};

type ProductLean = {
  _id: { toString(): string };
  title: string;
  slug: string;
  images: string[];
  basePrice: number;
  discountPercentage: number;
  finalPrice?: number;
  isActive: boolean;
  sizes: ProductSizeRow[];
};

type SizeLean = {
  _id: { toString(): string };
  measurementsInMeters: GarmentMeasurements;
};

function lineKey(productId: string, sizeLabel: string) {
  return `${productId}:${sizeLabel.toUpperCase()}`;
}

export function collapseCartLines(items: IncomingCartLine[]) {
  const map = new Map<string, IncomingCartLine>();

  for (const item of items) {
    if (!isObjectId(item.productId)) continue;
    const key = lineKey(item.productId, item.sizeLabel);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        productId: item.productId,
        sizeLabel: item.sizeLabel.toUpperCase(),
        quantity: item.quantity,
      });
    } else {
      existing.quantity = Math.min(10, existing.quantity + item.quantity);
    }
  }

  return [...map.values()];
}

/** When the same piece exists in the account and the guest bag, keep the greater quantity. */
export function mergeCartLines(saved: IncomingCartLine[], guest: IncomingCartLine[]) {
  const map = new Map<string, IncomingCartLine>();

  for (const item of collapseCartLines(saved)) {
    map.set(lineKey(item.productId, item.sizeLabel), item);
  }

  for (const item of collapseCartLines(guest)) {
    const key = lineKey(item.productId, item.sizeLabel);
    const existing = map.get(key);
    if (!existing) map.set(key, item);
    else existing.quantity = Math.max(existing.quantity, item.quantity);
  }

  return [...map.values()];
}

export async function resolveCartItems(items: IncomingCartLine[]): Promise<CartItem[]> {
  const collapsed = collapseCartLines(items);
  if (!collapsed.length) return [];

  const productIds = [...new Set(collapsed.map((item) => item.productId))];
  const [products, sizes] = await Promise.all([
    Product.find({ _id: { $in: productIds }, isActive: true })
      .select("title slug images basePrice discountPercentage finalPrice isActive sizes")
      .lean<ProductLean[]>(),
    Size.find().select("measurementsInMeters").lean<SizeLean[]>(),
  ]);

  const productMap = new Map(products.map((product) => [String(product._id), product]));
  const sizeMap = new Map(sizes.map((size) => [String(size._id), size]));
  const resolved: CartItem[] = [];

  for (const item of collapsed) {
    const product = productMap.get(item.productId);
    if (!product) continue;

    const sizeRow = product.sizes.find(
      (row) => row.sizeLabel.toUpperCase() === item.sizeLabel.toUpperCase(),
    );
    if (!sizeRow || sizeRow.stock < 1) continue;

    const size = sizeMap.get(String(sizeRow.sizeId));
    if (!size?.measurementsInMeters) continue;

    const unitPrice =
      typeof product.finalPrice === "number"
        ? roundMoney(product.finalPrice)
        : calculateFinalPrice(product.basePrice, product.discountPercentage);
    resolved.push({
      productId: String(product._id),
      title: product.title,
      slug: product.slug,
      image: product.images[0],
      sizeLabel: sizeRow.sizeLabel,
      sizeMeasurementsMeters: size.measurementsInMeters,
      quantity: Math.min(item.quantity, sizeRow.stock, 10),
      unitPrice,
      discountApplied: roundMoney(Math.max(0, product.basePrice - unitPrice)),
    });
  }

  return resolved;
}

export function toIncomingCart(
  items: Array<{ product: { toString(): string }; sizeLabel: string; quantity: number }>,
): IncomingCartLine[] {
  return items.map((item) => ({
    productId: String(item.product),
    sizeLabel: item.sizeLabel,
    quantity: item.quantity,
  }));
}

export function serializeCart(items: CartItem[]) {
  return items.map((item) => ({
    product: item.productId,
    title: item.title,
    slug: item.slug,
    image: item.image,
    sizeLabel: item.sizeLabel,
    sizeMeasurementsMeters: item.sizeMeasurementsMeters,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountApplied: item.discountApplied,
  }));
}

export async function saveUserCart(userId: string, items: CartItem[]) {
  await User.updateOne({ _id: userId }, { $set: { cart: serializeCart(items) } });
  return items;
}

export async function readStoredCart(userId: string): Promise<CartItem[]> {
  const user = await User.findById(userId).select("cart").lean<{
    cart?: Array<{
      product: { toString(): string };
      title: string;
      slug: string;
      image: string;
      sizeLabel: string;
      sizeMeasurementsMeters: GarmentMeasurements;
      quantity: number;
      unitPrice: number;
      discountApplied: number;
    }>;
  } | null>();
  if (!user?.cart?.length) return [];

  return user.cart.map((item) => ({
    productId: String(item.product),
    title: item.title,
    slug: item.slug,
    image: item.image,
    sizeLabel: item.sizeLabel,
    sizeMeasurementsMeters: item.sizeMeasurementsMeters,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    discountApplied: item.discountApplied,
  }));
}
