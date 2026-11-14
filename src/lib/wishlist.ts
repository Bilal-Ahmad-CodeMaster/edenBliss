import "server-only";
import { isObjectId } from "@/lib/utils";
import { Product } from "@/models/Product";
import { User } from "@/models/User";

export function mergeWishlistIds(saved: string[], guest: string[]) {
  return [...new Set([...saved, ...guest].filter((id) => isObjectId(id)))];
}

export async function filterActiveProductIds(ids: string[]) {
  const valid = ids.filter((id) => isObjectId(id));
  if (!valid.length) return [];
  const existing = await Product.find({ _id: { $in: valid }, isActive: true }).distinct("_id");
  const allowed = new Set(existing.map((id) => String(id)));
  return valid.filter((id) => allowed.has(id));
}

export async function saveUserWishlist(userId: string, ids: string[]) {
  const wishlist = await filterActiveProductIds(ids);
  await User.updateOne({ _id: userId }, { $set: { wishlist } });
  return wishlist;
}
