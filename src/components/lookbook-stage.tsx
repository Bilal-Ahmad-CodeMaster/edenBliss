"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { EditorialImage } from "@/components/editorial-image";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-fetch";
import { formatMoney } from "@/lib/prices";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import type { CartItem, ProductSizeOption } from "@/types/commerce";

type LookPin = {
  id: string;
  xPercent: number;
  yPercent: number;
  defaultColorSlug: string;
  stylingNote: string;
  product: {
    id: string;
    title: string;
    slug: string;
    image: string;
    finalPrice: number;
    basePrice: number;
    discountPercentage: number;
    colors: Array<{ colorName: string; colorSlug: string; hexCode: string; images: string[]; sizes: ProductSizeOption[] }>;
    sizes: ProductSizeOption[];
  };
};

export type LookScene = {
  id: string;
  title: string;
  seasonTag: string;
  editorialStory: string;
  coverImage: string;
  hotspots: LookPin[];
};

export function LookbookStage({ looks, currency }: { looks: LookScene[]; currency: string }) {
  const [openId, setOpenId] = useState("");
  if (!looks.length) {
    return <p className="text-sm leading-7 text-muted">The seasonal lookbook is being dressed. Please return shortly.</p>;
  }

  return (
    <div className="space-y-16">
      {looks.map((look) => (
        <article key={look.id} className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-sage">{look.seasonTag}</p>
          <h2 className="mt-2 font-serif text-4xl sm:text-6xl">{look.title}</h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{look.editorialStory}</p>
          <div className="relative mt-8 aspect-[3/4] w-full bg-linen sm:aspect-[16/9]">
            <div className="absolute inset-0 overflow-hidden">
              <EditorialImage src={look.coverImage} alt={look.title} sizes="100vw" className="object-cover" />
            </div>
            {look.hotspots.map((pin) => (
              <Hotspot key={pin.id} pin={pin} open={openId === pin.id} currency={currency} onOpen={() => setOpenId(pin.id)} onClose={() => setOpenId("")} />
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}

function Hotspot({
  pin,
  open,
  currency,
  onOpen,
  onClose,
}: {
  pin: LookPin;
  open: boolean;
  currency: string;
  onOpen: () => void;
  onClose: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [spot, setSpot] = useState<{ left: number; top: number; width: number } | null>(null);

  useEffect(() => {
    if (!open) return;
    function place() {
      const node = buttonRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const width = Math.min(256, window.innerWidth - 32);
      const left = Math.min(Math.max(16, rect.left), Math.max(16, window.innerWidth - width - 16));
      const height = Math.min(460, window.innerHeight - 32);
      const top = Math.min(Math.max(16, rect.bottom + 10), Math.max(16, window.innerHeight - height - 16));
      setSpot({ left, top, width });
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  return (
    <div className="absolute" style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Shop ${pin.product.title}`}
        aria-expanded={open}
        onMouseEnter={onOpen}
        onFocus={onOpen}
        onClick={() => (open ? onClose() : onOpen())}
        className="relative -translate-x-1/2 -translate-y-1/2"
      >
        <span className="absolute inset-0 h-8 w-8 -translate-x-1/4 -translate-y-1/4 animate-ping rounded-full bg-sage/40" />
        <span className="relative block h-4 w-4 rounded-full border-2 border-alabaster bg-sage" />
      </button>
      {open && spot && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed z-[80] max-h-[min(28rem,calc(100dvh-2rem))] overflow-y-auto border border-line bg-background p-3 shadow-editorial"
              style={{ left: spot.left, top: spot.top, width: spot.width }}
            >
              <PinCard pin={pin} currency={currency} onDone={onClose} />
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function PinCard({ pin, currency, onDone }: { pin: LookPin; currency: string; onDone: () => void }) {
  const colors = pin.product.colors;
  const initial = colors.find((color) => color.colorSlug === pin.defaultColorSlug) ?? colors[0];
  const [colorSlug, setColorSlug] = useState(initial?.colorSlug ?? "");
  const color = colors.find((entry) => entry.colorSlug === colorSlug) ?? initial;
  const sizes = color?.sizes?.length ? color.sizes : pin.product.sizes;
  const [sizeLabel, setSizeLabel] = useState(sizes.find((size) => size.stock > 0)?.sizeLabel ?? "");
  const [pending, setPending] = useState(false);
  const image = color?.images[0] || pin.product.image;
  const selected = sizes.find((size) => size.sizeLabel === sizeLabel);

  async function add() {
    if (!selected || selected.stock < 1 || pending) {
      toast.error("Choose a size that is still on the rail.");
      return;
    }
    const draft: CartItem = {
      productId: pin.product.id,
      title: pin.product.title,
      slug: pin.product.slug,
      image,
      colorName: color?.colorName ?? "",
      colorSlug: color?.colorSlug ?? "",
      hexCode: color?.hexCode ?? "",
      sizeLabel: selected.sizeLabel,
      sizeMeasurementsMeters: selected.measurementsInMeters,
      quantity: 1,
      unitPrice: pin.product.finalPrice,
      discountApplied: Math.max(0, pin.product.basePrice - pin.product.finalPrice),
    };
    const current = useCartStore.getState().items;
    const existing = current.find(
      (item) => item.productId === draft.productId && item.sizeLabel === draft.sizeLabel && (item.colorSlug ?? "") === draft.colorSlug,
    );
    const next = existing
      ? current.map((item) => (item === existing ? { ...item, quantity: Math.min(selected.stock, item.quantity + 1) } : item))
      : [...current, draft];
    const previous = current;
    useCartStore.getState().replace(next);
    const signedIn = Boolean(useSessionStore.getState().user);
    if (!signedIn) {
      toast.success("Added to your bag.");
      onDone();
      return;
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
            colorSlug: item.colorSlug ?? "",
            quantity: item.quantity,
          })),
        }),
      });
      const data = (await response.json()) as { items?: CartItem[]; message?: string };
      if (!response.ok || !data.items) {
        useCartStore.getState().replace(previous);
        toast.error(data.message ?? "The bag could not be updated.");
        return;
      }
      useCartStore.getState().replace(data.items);
      toast.success("Added to your bag.");
      onDone();
    } catch {
      useCartStore.getState().replace(previous);
      toast.error("The bag could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="min-w-0">
      <div className="relative mb-3 aspect-[3/4] overflow-hidden bg-linen">
        <EditorialImage src={image} alt={pin.product.title} sizes="240px" />
      </div>
      <p className="font-serif text-xl leading-tight">{pin.product.title}</p>
      <p className="mt-1 text-sm">{formatMoney(pin.product.finalPrice, currency)}</p>
      {pin.stylingNote ? <p className="mt-2 text-xs leading-5 text-muted">{pin.stylingNote}</p> : null}
      {colors.length > 1 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {colors.map((entry) => (
            <button
              key={entry.colorSlug}
              type="button"
              title={entry.colorName}
              aria-label={entry.colorName}
              onClick={() => setColorSlug(entry.colorSlug)}
              className={`h-5 w-5 rounded-full ${entry.colorSlug === color?.colorSlug ? "ring-2 ring-sage ring-offset-2" : ""}`}
              style={{ backgroundColor: entry.hexCode }}
            />
          ))}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-1">
        {sizes.map((size) => (
          <button
            key={size.sizeId}
            type="button"
            disabled={size.stock < 1}
            onClick={() => setSizeLabel(size.sizeLabel)}
            className={`h-8 min-w-8 border px-2 text-xs disabled:opacity-40 ${size.sizeLabel === sizeLabel ? "border-sage bg-sage text-alabaster" : "border-line"}`}
          >
            {size.sizeLabel}
          </button>
        ))}
      </div>
      <Button type="button" className="mt-3 w-full" onClick={() => void add()} disabled={pending}>
        {pending ? "Adding" : "Add to bag"}
      </Button>
    </div>
  );
}
