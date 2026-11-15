"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { memo, useCallback, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { ColorSwatches } from "@/components/color-swatches";
import { EditorialImage } from "@/components/editorial-image";
import { clientFetch } from "@/lib/client-fetch";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { redirectToLogin } from "@/lib/login-redirect";
import { formatMoney } from "@/lib/prices";
import { useSessionStore } from "@/store/session-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { ProductCardData } from "@/types/commerce";

export const ProductCard = memo(function ProductCard({
  product,
  currency,
  authenticated,
}: {
  product: ProductCardData;
  currency: string;
  authenticated: boolean;
}) {
  const saved = useWishlistStore((state) => state.ids.includes(product.id));
  const [pending, setPending] = useState(false);
  const reduce = useReducedMotion();
  const onSale = product.discountPercentage > 0;
  const colors = product.colors ?? [];
  const [colorSlug, setColorSlug] = useState(colors[0]?.colorSlug ?? "");
  const color = colors.find((entry) => entry.colorSlug === colorSlug) ?? colors[0];
  const image = color?.images?.[0] || product.image;
  const secondary = (color?.images ?? product.images).find((entry) => entry && entry !== image) ?? "";
  const href = color ? `/product/${product.slug}?color=${color.colorSlug}` : `/product/${product.slug}`;
  const offLabel = `−${Math.round(product.discountPercentage)}% OFF`;

  const toggleWishlist = useCallback(async () => {
    if (pending) return;
    const guest = !authenticated && !useSessionStore.getState().user;
    if (guest) {
      redirectToLogin();
      return;
    }

    const previous = useWishlistStore.getState().ids;
    useWishlistStore.getState().toggle(product.id);
    setPending(true);
    try {
      const response = await clientFetch("/api/wishlist", {
        method: "POST",
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
    } finally {
      setPending(false);
    }
  }, [authenticated, pending, product.id, saved]);

  return (
    <article className="group min-w-0">
      <div className="relative aspect-[3/4] overflow-hidden bg-linen">
        <Link href={href} className="absolute inset-0 block">
          <div className="absolute inset-0 transition duration-700 group-hover:scale-[1.03]">
            <AnimatePresence mode="wait">
              <motion.div key={image} className="absolute inset-0" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduce ? undefined : { opacity: 0 }}>
            <EditorialImage
              src={image}
              alt={product.title}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={secondary ? "transition duration-700 group-hover:opacity-0" : ""}
            />
            {secondary ? (
              <EditorialImage
                src={secondary}
                alt=""
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="opacity-0 transition duration-700 group-hover:opacity-100"
              />
            ) : null}
              </motion.div>
            </AnimatePresence>
          </div>
        </Link>
        {onSale ? (
          <span className="absolute left-3 top-3 bg-terracotta px-2 py-1 text-[10px] tracking-[0.14em] text-alabaster">
            {offLabel}
          </span>
        ) : null}
        <motion.button
          type="button"
          onClick={toggleWishlist}
          disabled={pending}
          aria-label={saved ? `Remove ${product.title} from wishlist` : `Save ${product.title}`}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center bg-background/90 text-foreground transition hover:text-sage"
          animate={reduce ? undefined : { scale: saved ? [1, 1.18, 1] : 1 }}
          transition={{ duration: 0.28 }}
        >
          <Heart className={`h-4 w-4 ${saved ? "fill-sage text-sage" : ""}`} />
        </motion.button>
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{product.categoryName}</p>
          <Link href={href} className="mt-1 block font-serif text-2xl leading-tight hover:text-sage">
            {product.title}
          </Link>
          {colors.length > 1 ? (
            <div className="mt-3">
              <ColorSwatches colors={colors} active={color?.colorSlug ?? ""} onChange={setColorSlug} />
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-right text-sm">
          <p>{formatMoney(product.finalPrice, currency)}</p>
          {onSale ? <p className="text-xs text-muted line-through">{formatMoney(product.basePrice, currency)}</p> : null}
        </div>
      </div>
    </article>
  );
});
