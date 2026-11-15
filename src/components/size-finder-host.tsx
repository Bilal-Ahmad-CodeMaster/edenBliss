"use client";

import { useEffect, useState } from "react";
import { SizeFinderModal } from "@/components/size-finder-modal";
import { clientFetch } from "@/lib/client-fetch";
import type { ProductSizeOption } from "@/types/commerce";

type OpenDetail = {
  sizes?: ProductSizeOption[];
  productTitle?: string;
  colorName?: string;
  canSelect?: boolean;
};

export function SizeFinderHost({ whatsappNumber }: { whatsappNumber: string }) {
  const [open, setOpen] = useState(false);
  const [sizes, setSizes] = useState<ProductSizeOption[]>([]);
  const [detail, setDetail] = useState<OpenDetail>({});

  useEffect(() => {
    function onOpen(event: Event) {
      const next = ((event as CustomEvent<OpenDetail>).detail ?? {}) as OpenDetail;
      setDetail(next);
      if (next.sizes?.length) setSizes(next.sizes);
      else {
        setSizes([]);
        const controller = new AbortController();
        clientFetch("/api/sizes", { signal: controller.signal })
          .then(async (response) => (response.ok ? ((await response.json()) as { sizes?: ProductSizeOption[] }) : null))
          .then((data) => {
            if (data?.sizes) setSizes(data.sizes);
          })
          .catch(() => undefined);
      }
      setOpen(true);
    }
    window.addEventListener("eden:open-size-finder", onOpen);
    return () => window.removeEventListener("eden:open-size-finder", onOpen);
  }, []);

  return (
    <SizeFinderModal
      open={open}
      onClose={() => setOpen(false)}
      sizes={sizes}
      productTitle={detail.productTitle}
      colorName={detail.colorName}
      whatsappNumber={whatsappNumber}
      onSelect={
        detail.canSelect
          ? (sizeLabel, waistMeters) => {
              window.dispatchEvent(new CustomEvent("eden:select-size", { detail: { sizeLabel, waistMeters } }));
            }
          : undefined
      }
    />
  );
}

export function FindMySizeButton({ className, children }: { className?: string; children: string }) {
  return (
    <button type="button" className={className} onClick={() => openSizeFinder()}>
      {children}
    </button>
  );
}

export function openSizeFinder(detail?: OpenDetail) {
  window.dispatchEvent(new CustomEvent("eden:open-size-finder", { detail }));
}
