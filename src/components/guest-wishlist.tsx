"use client";

import { useEffect, useState } from "react";
import { WishlistBoard } from "@/components/wishlist-board";
import { SkeletonGrid } from "@/components/skeleton-grid";
import { clientFetch } from "@/lib/client-fetch";
import { useWishlistStore } from "@/store/wishlist-store";
import type { WishlistPiece } from "@/types/commerce";

export function GuestWishlist({ currency }: { currency: string }) {
  const ids = useWishlistStore((state) => state.ids);
  const hydrated = useWishlistStore((state) => state.hydrated);
  const [products, setProducts] = useState<WishlistPiece[] | null>(null);

  useEffect(() => {
    if (!hydrated) return;
    if (!ids.length) {
      setProducts([]);
      return;
    }
    const controller = new AbortController();
    clientFetch("/api/catalog/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return [];
        const data = (await response.json()) as { products?: WishlistPiece[] };
        return data.products ?? [];
      })
      .then((next) => {
        if (!controller.signal.aborted) setProducts(next);
      })
      .catch(() => {
        if (!controller.signal.aborted) setProducts([]);
      });
    return () => controller.abort();
  }, [hydrated, ids]);

  if (!hydrated || products === null) return <SkeletonGrid />;

  return <WishlistBoard products={products} currency={currency} authenticated={false} />;
}
