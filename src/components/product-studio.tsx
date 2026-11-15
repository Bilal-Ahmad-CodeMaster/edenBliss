"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState } from "react";
import { OutfitLooks } from "@/components/outfit-looks";
import { ProductGallery } from "@/components/product-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import type { ProductCardData, ProductDetail } from "@/types/commerce";

export function ProductStudio({
  product,
  currency,
  authenticated,
  initialColor,
  whatsappNumber,
  related,
}: {
  product: ProductDetail;
  currency: string;
  authenticated: boolean;
  initialColor?: string;
  whatsappNumber: string;
  related: ProductCardData[];
}) {
  const reduce = useReducedMotion();
  const palette = product.colorsDetailed.length ? product.colorsDetailed : [];
  const starting = palette.find((color) => color.colorSlug === initialColor) ?? palette[0];
  const [colorSlug, setColorSlug] = useState(starting?.colorSlug ?? "");
  const active = palette.find((color) => color.colorSlug === colorSlug) ?? starting;
  const view: ProductDetail = active
    ? {
        ...product,
        image: active.images[0] ?? product.image,
        images: active.images,
        outfitLookImages: active.outfitLookImages,
        sizes: active.sizes,
      }
    : product;

  function choose(slug: string) {
    setColorSlug(slug);
    const url = new URL(window.location.href);
    url.searchParams.set("color", slug);
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }

  return (
    <>
      <div className="mt-8 grid min-w-0 gap-10 lg:grid-cols-2 lg:gap-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={active?.colorSlug ?? "cloth"}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : 0.28 }}
            className="min-w-0"
          >
            <ProductGallery images={view.images} title={product.title} />
          </motion.div>
        </AnimatePresence>
        <PurchasePanel
          product={view}
          currency={currency}
          authenticated={authenticated}
          colorName={active?.colorName ?? ""}
          colorSlug={active?.colorSlug ?? ""}
          hexCode={active?.hexCode ?? ""}
          colors={palette}
          onColor={choose}
          whatsappNumber={whatsappNumber}
        />
      </div>
      <OutfitLooks images={view.outfitLookImages} title={product.title} related={related} currency={currency} />
    </>
  );
}
