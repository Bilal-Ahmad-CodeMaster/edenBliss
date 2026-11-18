"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import { EditorialImage } from "@/components/editorial-image";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { formatMoney } from "@/lib/prices";
import type { ProductCardData } from "@/types/commerce";

const ImageLightbox = dynamic(() => import("@/components/image-lightbox").then((mod) => mod.ImageLightbox), {
  ssr: false,
});

export function OutfitLooks({
  images,
  title,
  related,
  currency,
}: {
  images: string[];
  title: string;
  related: ProductCardData[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (!images.length && !related.length) return null;

  return (
    <section className="mt-16 border-t border-line pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-4xl sm:text-5xl">How the outfit looks</h2>
          <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Styled as a complete look, with pieces that sit beside it.</p>
        </div>
        <Button type="button" variant="outline" onClick={() => setOpen(true)}>
          See Full Outfit Look
        </Button>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="w-[min(100%,42rem)] overflow-y-auto overscroll-contain">
          <div data-lenis-prevent className="px-6 pb-12 pt-16">
            <SheetTitle>Full outfit look</SheetTitle>
            <SheetDescription className="mt-2">How {title} sits when it is styled, and what pairs beside it.</SheetDescription>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {images.map((image, index) => (
                <button key={`${image}-${index}`} type="button" className="relative aspect-[3/4] overflow-hidden bg-linen" onClick={() => setLightbox(image)}>
                  <EditorialImage src={image} alt={`${title} styled as a complete outfit`} sizes="(max-width: 640px) 100vw, 20rem" />
                </button>
              ))}
            </div>
            {related.length > 0 ? (
              <div className="mt-10">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Pairing suggestions</p>
                <ul className="mt-4 space-y-4">
                  {related.map((product) => (
                    <li key={product.id}>
                      <Link href={`/product/${product.slug}`} onClick={() => setOpen(false)} className="flex gap-4 hover:text-sage">
                        <span className="relative block h-24 w-16 shrink-0 bg-linen">
                          <EditorialImage src={product.image} alt="" sizes="64px" />
                        </span>
                        <span>
                          <span className="block font-serif text-2xl">{product.title}</span>
                          <span className="text-sm text-muted">{formatMoney(product.finalPrice, currency)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </SheetContent>
      </Sheet>
      <ImageLightbox src={lightbox ?? ""} alt={`${title} styled as a complete outfit`} open={Boolean(lightbox)} onClose={() => setLightbox(null)} />
    </section>
  );
}
