"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import { Alert } from "@/components/ui/alert";
import { mergeCartLine, syncCart } from "@/lib/client-cart";
import { clientFetch } from "@/lib/client-fetch";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { CartItem, WishlistPiece } from "@/types/commerce";

export function WishlistBoard({
  products,
  currency,
  authenticated,
}: {
  products: WishlistPiece[];
  currency: string;
  authenticated: boolean;
}) {
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");
  const ids = useWishlistStore((state) => state.ids);
  const sessionReady = useSessionStore((state) => state.ready);
  const visible = authenticated && !sessionReady ? products : products.filter((product) => ids.includes(product.id));

  async function drop(productId: string, quiet: boolean) {
    const signedIn = authenticated || Boolean(useSessionStore.getState().user);
    const previous = useWishlistStore.getState().ids;
    if (!previous.includes(productId)) return true;
    useWishlistStore.getState().toggle(productId);
    if (!signedIn) {
      if (!quiet) toast.success("Removed from your wishlist.");
      return true;
    }
    try {
      const response = await clientFetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      const data = (await response.json()) as { message?: string; wishlist?: string[] };
      if (!response.ok || !data.wishlist) {
        useWishlistStore.getState().setIds(previous);
        const message = data.message ?? "The wishlist could not be updated.";
        setError(message);
        toast.error(message);
        return false;
      }
      useWishlistStore.getState().setIds(data.wishlist);
      if (!quiet) toast.success("Removed from your wishlist.");
      return true;
    } catch {
      useWishlistStore.getState().setIds(previous);
      setError("The wishlist could not be updated.");
      toast.error("The wishlist could not be updated.");
      return false;
    }
  }

  async function remove(productId: string) {
    if (pendingId) return;
    setPendingId(productId);
    setError("");
    await drop(productId, false);
    setPendingId("");
  }

  async function move(product: WishlistPiece) {
    if (pendingId) return;
    if (!product.offerSize) {
      const message = "This piece is not on the rail in any size.";
      setError(message);
      toast.error(message);
      return;
    }
    const draft: CartItem = {
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: product.image,
      sizeLabel: product.offerSize.sizeLabel,
      sizeMeasurementsMeters: product.offerSize.measurementsInMeters,
      quantity: 1,
      unitPrice: product.finalPrice,
      discountApplied: Math.max(0, product.basePrice - product.finalPrice),
    };
    setPendingId(product.id);
    setError("");
    const result = await syncCart(mergeCartLine(useCartStore.getState().items, draft, product.offerSize.stock), authenticated);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      setPendingId("");
      if ("restricted" in result && result.restricted) window.location.href = "/login?restricted=1";
      return;
    }
    const dropped = await drop(product.id, true);
    if (dropped) toast.success(`Moved ${product.title} in size ${product.offerSize.sizeLabel} to your bag.`);
    setPendingId("");
  }

  if (!visible.length) {
    return <p className="max-w-md text-sm leading-7 text-muted">Your wishlist is waiting for its first piece.</p>;
  }

  return (
    <div>
      {error ? <Alert className="mb-6">{error}</Alert> : null}
      <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((product) => (
          <div key={product.id} className="min-w-0">
            <ProductCard product={product} currency={currency} authenticated={authenticated} />
            <div className="mt-3 flex flex-wrap gap-3">
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.14em] hover:text-sage disabled:opacity-50"
                disabled={pendingId === product.id}
                onClick={() => void move(product)}
              >
                Move to bag
              </button>
              <button
                type="button"
                className="text-[11px] uppercase tracking-[0.14em] text-muted hover:text-terracotta disabled:opacity-50"
                disabled={pendingId === product.id}
                onClick={() => void remove(product.id)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
