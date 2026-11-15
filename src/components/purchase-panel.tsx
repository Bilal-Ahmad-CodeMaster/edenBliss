"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-fetch";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { redirectToLogin } from "@/lib/login-redirect";
import {
  formatCentimeters,
  formatInches,
  formatMeters,
  MEASUREMENT_KEYS,
} from "@/lib/measurements";
import { formatMoney } from "@/lib/prices";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { CartItem, ProductDetail } from "@/types/commerce";

const labels: Record<(typeof MEASUREMENT_KEYS)[number], string> = {
  chest: "Chest",
  waist: "Waist",
  shoulder: "Shoulder",
  length: "Length",
  sleeve: "Sleeve",
};

export function PurchasePanel({
  product,
  currency,
  authenticated,
}: {
  product: ProductDetail;
  currency: string;
  authenticated: boolean;
}) {
  const [sizeLabel, setSizeLabel] = useState(product.sizes.find((size) => size.stock > 0)?.sizeLabel ?? "");
  const [quantity, setQuantity] = useState(1);
  const [pending, setPending] = useState(false);
  const [unit, setUnit] = useState<"m" | "cm" | "in">("m");
  const saved = useWishlistStore((state) => state.ids.includes(product.id));
  const selected = product.sizes.find((size) => size.sizeLabel === sizeLabel) ?? null;
  const onSale = product.discountPercentage > 0;

  async function saveWishlist() {
    const signedIn = authenticated || Boolean(useSessionStore.getState().user);
    if (!signedIn) {
      redirectToLogin();
      return;
    }

    const previous = useWishlistStore.getState().ids;
    useWishlistStore.getState().toggle(product.id);
    try {
      const response = await clientFetch("/api/wishlist", {
        method: "POST",
  useEffect(() => {
    setSizeLabel(product.sizes.find((size) => size.stock > 0)?.sizeLabel ?? "");
  }, [product.sizes, colorSlug]);

  useEffect(() => {
    function onPick(event: Event) {
      const detail = (event as CustomEvent<{ sizeLabel?: string; waistMeters?: number }>).detail;
      if (!detail?.sizeLabel) return;
      if (product.sizes.some((size) => size.sizeLabel === detail.sizeLabel && size.stock > 0)) {
        setSizeLabel(detail.sizeLabel);
      }
      if (detail.waistMeters) {
        sessionStorage.setItem("eden-fit-note", `Waist ${detail.waistMeters.toFixed(2)} m`);
      }
    }
    window.addEventListener("eden:select-size", onPick);
    return () => window.removeEventListener("eden:select-size", onPick);
  }, [product.sizes]);

        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: product.id }),
      });
      const data = (await response.json()) as { message?: string; wishlist?: string[]; saved?: boolean };
      if (response.status === 403) {
        useWishlistStore.getState().setIds(previous);
        toast.error(data.message ?? RESTRICTED_MESSAGE);
        window.location.href = "/login?restricted=1";
        return;
      }
      if (!response.ok || !data.wishlist) {
        useWishlistStore.getState().setIds(previous);
        toast.error(data.message ?? "The wishlist could not be updated.");
        return;
      }
      useWishlistStore.getState().setIds(data.wishlist);
      toast.success(data.saved ? "Saved to your wishlist." : "Removed from your wishlist.");
    } catch {
      useWishlistStore.getState().setIds(previous);
      toast.error("The wishlist could not be updated.");
    }
  }

  async function addToBag() {
    if (!selected || selected.stock < 1) {
      toast.error("Choose a size that is still on the rail.");
      return;
    }

    const draft: CartItem = {
      productId: product.id,
      title: product.title,
      slug: product.slug,
      image: product.image,
      sizeLabel: selected.sizeLabel,
      sizeMeasurementsMeters: selected.measurementsInMeters,
      quantity: Math.min(quantity, selected.stock),
      unitPrice: product.finalPrice,
      discountApplied: Math.max(0, product.basePrice - product.finalPrice),
    };

    const current = useCartStore.getState().items;
    const existing = current.find(
      (item) => item.productId === draft.productId && item.sizeLabel === draft.sizeLabel,
    );
    const next = existing
      ? current.map((item) =>
          item === existing
            ? { ...item, quantity: Math.min(selected.stock, item.quantity + draft.quantity) }
      colorName,
      colorSlug,
      hexCode,
      sizeLabel: selected.sizeLabel,
      sizeMeasurementsMeters: selected.measurementsInMeters,
      quantity: Math.min(quantity, selected.stock),
      unitPrice: product.finalPrice,
      discountApplied: Math.max(0, product.basePrice - product.finalPrice),
    };

    const current = useCartStore.getState().items;
    const existing = current.find(
      (item) => item.productId === draft.productId && item.sizeLabel === draft.sizeLabel && item.colorSlug === draft.colorSlug,
    }

    setPending(true);
    try {
      const response = await clientFetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: next.map((item) => ({
            productId: item.productId,
            sizeLabel: item.sizeLabel,
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await response.json()) as { message?: string; items?: CartItem[] };
      if (response.status === 403) {
        useCartStore.getState().replace(previous);
        toast.error(data.message ?? RESTRICTED_MESSAGE);
        window.location.href = "/login?restricted=1";
        return;
      }
      if (!response.ok || !data.items) {
        useCartStore.getState().replace(previous);
        toast.error(data.message ?? "The bag could not be updated.");
        return;
            colorSlug: item.colorSlug,
      }
      useCartStore.getState().replace(data.items);
      toast.success("Added to your bag.");
    } catch {
      useCartStore.getState().replace(previous);
      toast.error("The bag could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">
        {product.subCategoryName || product.categoryName}
      </p>
      <h1 className="mt-3 font-serif text-4xl leading-none sm:text-6xl">{product.title}</h1>
      <div className="mt-6 flex items-end gap-3">
        <p className="font-serif text-3xl">{formatMoney(product.finalPrice, currency)}</p>
        {onSale ? (
          <>
            <p className="text-sm text-muted line-through">{formatMoney(product.basePrice, currency)}</p>
            <span className="bg-terracotta px-2 py-1 text-[10px] tracking-[0.16em] text-alabaster">
              −{Math.round(product.discountPercentage)}% OFF
            </span>
          </>
        ) : null}
      </div>
      <p className="mt-6 max-w-xl text-sm leading-7 text-muted">{product.storyDescription}</p>

      <div className="mt-8">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Size</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((size) => {
            const active = size.sizeLabel === sizeLabel;
            return (
              <button
                key={size.sizeId}
                type="button"
                disabled={size.stock < 1}
                onClick={() => setSizeLabel(size.sizeLabel)}
                className={`h-11 min-w-11 border px-3 text-sm transition duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
                  active ? "border-sage bg-sage text-alabaster" : "border-line hover:border-sage"
                }`}
      {colors.length ? (
        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{colorName || "Colour"}</p>
          <div className="mt-3">
            <ColorSwatches colors={colors} active={colorSlug} onChange={(slug) => onColor?.(slug)} />
          </div>
        </div>
      ) : null}

      <div className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Size</p>
          <button
            type="button"
            className="text-[11px] uppercase tracking-[0.14em] text-sage"
            onClick={() =>
              openSizeFinder({
                sizes: product.sizes,
                productTitle: product.title,
                colorName,
                canSelect: true,
              })
            }
          >
            Find my size
          </button>
        </div>
            );
          })}
        </div>
      </div>

      {selected ? (
        <div className="mt-6 border border-line p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Size {selected.sizeLabel}</p>
            <div className="flex gap-2">
              {(
                [
                  ["m", "Metres"],
                  ["cm", "Centimetres"],
                  ["in", "Inches"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setUnit(value)}
                  className={`h-8 px-2 text-[10px] uppercase tracking-[0.14em] ${unit === value ? "bg-sage text-alabaster" : "text-muted"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm leading-7">
            {MEASUREMENT_KEYS.map((key, index) => {
              const source =
                unit === "cm" ? selected.measurementsInCm : unit === "in" ? selected.measurementsInInches : selected.measurementsInMeters;
              const text = unit === "cm" ? formatCentimeters(source[key]) : unit === "in" ? formatInches(source[key]) : formatMeters(source[key]);
              return (
                <span key={key}>
                  {index > 0 ? " | " : ""}
                  {labels[key]}: {text}
                </span>
              );
            })}
          </p>
          <p className="mt-3 text-xs text-muted">{selected.stock > 0 ? `${selected.stock} on the rail` : "Sold out"}</p>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted">Every size of this piece has left the rail.</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <label className="text-[11px] uppercase tracking-[0.18em] text-muted" htmlFor="quantity">
          Quantity
        </label>
        <input
          id="quantity"
          type="number"
          min={1}
          max={selected?.stock ?? 1}
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
          className="h-11 w-20 border border-line bg-background px-3 text-sm outline-none focus:border-sage"
        />
        <p className="text-xs text-muted">{selected ? `${selected.stock} on the rail` : ""}</p>
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="w-full sm:w-auto" onClick={addToBag} disabled={pending || !selected}>
          {pending ? "Adding" : "Add to bag"}
        </Button>
        <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={saveWishlist}>
          {saved ? "Saved to favorites" : "Save to favorites"}
        </Button>
      </div>
    </div>
  );
}
