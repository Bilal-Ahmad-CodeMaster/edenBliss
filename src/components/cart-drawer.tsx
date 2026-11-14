"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BagSummary } from "@/components/bag-summary";
import { EditorialImage } from "@/components/editorial-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { syncCart } from "@/lib/client-cart";
import { formatMoney } from "@/lib/prices";
import { useCartCount, useCartStore } from "@/store/cart-store";
import type { CartItem, StoreSettingsDTO } from "@/types/commerce";

export function CartDrawer({
  currency,
  authenticated,
  settings,
}: {
  currency: string;
  authenticated: boolean;
  settings: Pick<StoreSettingsDTO, "standardShippingRate" | "freeShippingThreshold" | "taxPercentage">;
}) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const count = useCartCount();
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);

  async function persist(next: CartItem[]) {
    if (pending) return;
    setPending(true);
    const result = await syncCart(next, authenticated);
    setPending(false);
    if (!result.ok) toast.error(result.message);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="relative flex h-10 w-10 items-center justify-center transition hover:text-sage" aria-label={`Bag, ${count} pieces`}>
        <ShoppingBag className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-sage px-1 text-[9px] text-alabaster">
            {count}
          </span>
        ) : null}
      </SheetTrigger>
      <SheetContent className="w-[min(100%,24rem)]">
        <div className="flex h-full flex-col px-6 pb-8 pt-16" data-lenis-prevent>
          <SheetTitle>Your bag</SheetTitle>
          <SheetDescription className="mt-2">{count} {count === 1 ? "piece" : "pieces"}</SheetDescription>
          {!hydrated ? <div className="shimmer mt-8 h-28" /> : null}
          {hydrated && items.length === 0 ? <p className="mt-8 text-sm text-muted">The bag is empty.</p> : null}
          <ul className="mt-6 flex-1 space-y-4 overflow-y-auto">
            {items.map((item) => (
              <li key={`${item.productId}-${item.sizeLabel}`} className="flex gap-3">
                <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)} className="relative h-24 w-16 shrink-0 bg-linen">
                  <EditorialImage src={item.image} alt={item.title} sizes="64px" />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/product/${item.slug}`} onClick={() => setOpen(false)} className="block truncate font-serif text-xl">
                    {item.title}
                  </Link>
                  <p className="text-xs text-muted">
                    {item.sizeLabel} · {formatMoney(item.unitPrice, currency)}
                  </p>
                  <div className="mt-2 flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      disabled={pending}
                      aria-label="Decrease quantity"
                      onClick={() => {
                        const next =
                          item.quantity <= 1
                            ? items.filter((row) => row !== item)
                            : items.map((row) => (row === item ? { ...row, quantity: row.quantity - 1 } : row));
                        void persist(next);
                      }}
                    >
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      type="button"
                      disabled={pending}
                      aria-label="Increase quantity"
                      onClick={() => {
                        void persist(items.map((row) => (row === item ? { ...row, quantity: Math.min(10, row.quantity + 1) } : row)));
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
          {items.length > 0 ? (
            <div className="mt-6 border-t border-line pt-4">
              <BagSummary items={items} currency={currency} settings={settings} />
              <Button asChild className="mt-4 w-full">
                <Link href="/cart" onClick={() => setOpen(false)}>
                  Review the bag
                </Link>
              </Button>
            </div>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
