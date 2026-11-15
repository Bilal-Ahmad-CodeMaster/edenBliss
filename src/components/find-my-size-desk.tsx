"use client";

import { SizeFinderModal } from "@/components/size-finder-modal";
import type { ProductSizeOption } from "@/types/commerce";

export function FindMySizeDesk({ whatsappNumber, sizes }: { whatsappNumber: string; sizes: ProductSizeOption[] }) {
  if (!sizes.length) {
    return <p className="text-sm leading-7 text-muted">The size book is not available just now. Please try again in a moment.</p>;
  }

  return <SizeFinderModal embedded open onClose={() => undefined} sizes={sizes} whatsappNumber={whatsappNumber} />;
}
