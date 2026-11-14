"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { BagSummary } from "@/components/bag-summary";
import { EditorialImage } from "@/components/editorial-image";
import { Button } from "@/components/ui/button";
import { syncCart } from "@/lib/client-cart";
import { loginHref } from "@/lib/login-redirect";
import { useSessionStore } from "@/store/session-store";
import { formatMeters, MEASUREMENT_KEYS } from "@/lib/measurements";
import { formatMoney } from "@/lib/prices";
import { useCartStore } from "@/store/cart-store";
import type { CartItem, StoreSettingsDTO } from "@/types/commerce";

export function CartView({
  currency,
  settings,
  authenticated,
}: {
  currency: string;
  settings: StoreSettingsDTO;
  authenticated: boolean;
}) {
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const signedIn = authenticated || Boolean(useSessionStore((state) => state.user));
  const [pending, setPending] = useState(false);

  async function persist(next: CartItem[]) {
    if (pending) return;
    setPending(true);
    const result = await syncCart(next, authenticated);
    setPending(false);
    if (!result.ok) {
      toast.error(result.message);
      if ("restricted" in result && result.restricted) window.location.href = "/login?restricted=1";
    }
  }

  if (!hydrated) {
    return (
      <div className="space-y-4">
        <div className="shimmer h-28" />
        <div className="shimmer h-28" />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="max-w-lg">
        <p className="text-sm leading-7 text-muted">Your bag is empty. The new cloth is waiting in the shop.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">Continue through the shop</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <ul className="divide-y divide-line border-y border-line">
        {items.map((item) => (
          <li key={`${item.productId}-${item.sizeLabel}`} className="flex gap-4 py-6">
            <Link href={`/product/${item.slug}`} className="relative block h-32 w-24 shrink-0 bg-linen">
              <EditorialImage src={item.image} alt={item.title} sizes="96px" />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/product/${item.slug}`} className="font-serif text-2xl leading-tight hover:text-sage">
                {item.title}
              </Link>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted">Size {item.sizeLabel}</p>
              <p className="mt-1 text-xs text-muted">
                Chest {formatMeters(item.sizeMeasurementsMeters.chest)} · Length{" "}
                {formatMeters(item.sizeMeasurementsMeters[MEASUREMENT_KEYS[3]])}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <label className="sr-only" htmlFor={`qty-${item.productId}-${item.sizeLabel}`}>
                  Quantity for {item.title}
                </label>
                <input
                  id={`qty-${item.productId}-${item.sizeLabel}`}
                  type="number"
                  min={1}
                  max={10}
                  value={item.quantity}
                  disabled={pending}
                  onChange={(event) => {
                    const quantity = Math.max(1, Math.min(10, Number(event.target.value) || 1));
                    void persist(
                      items.map((line) =>
                        line.productId === item.productId && line.sizeLabel === item.sizeLabel
                          ? { ...line, quantity }
                          : line,
                      ),
                    );
                  }}
                  className="h-10 w-16 border border-line bg-background px-2 text-sm outline-none focus:border-sage"
                />
                <button
                  type="button"
                  className="text-xs uppercase tracking-[0.16em] text-muted transition hover:text-terracotta"
                  onClick={() =>
                    void persist(
                      items.filter(
                        (line) => !(line.productId === item.productId && line.sizeLabel === item.sizeLabel),
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </div>
            <div className="shrink-0 text-right text-sm">
              {item.discountApplied > 0 ? (
                <p className="text-xs text-muted line-through">
                  {formatMoney((item.unitPrice + item.discountApplied) * item.quantity, currency)}
                </p>
              ) : null}
              <p>{formatMoney(item.unitPrice * item.quantity, currency)}</p>
            </div>
          </li>
        ))}
      </ul>
      <aside className="h-fit border border-line p-6">
        <h2 className="font-serif text-3xl">The bag</h2>
        <div className="mt-6">
          <BagSummary items={items} currency={currency} settings={settings} />
        </div>
        <p className="mt-4 text-sm leading-6 text-muted">Payment is cash on delivery. The total is confirmed by the house at checkout.</p>
        <Button asChild className="mt-6 w-full">
          <Link href={signedIn ? "/checkout" : loginHref("/checkout")}>Continue to checkout</Link>
        </Button>
      </aside>
    </div>
  );
}
