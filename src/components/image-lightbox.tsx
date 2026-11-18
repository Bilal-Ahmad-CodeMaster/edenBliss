"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { EditorialImage } from "@/components/editorial-image";

export function ImageLightbox({
  src,
  images,
  index = 0,
  alt,
  open,
  onClose,
}: {
  src?: string;
  images?: string[];
  index?: number;
  alt: string;
  open: boolean;
  onClose: () => void;
}) {
  const gallery = images?.length ? images : src ? [src] : [];
  const current = gallery[index] ?? gallery[0] ?? "";
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !current || !mounted) return null;

  return createPortal(
    <div data-lenis-prevent className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4 sm:p-8" role="dialog" aria-modal="true" aria-label={alt}>
      <button type="button" className="absolute inset-0 cursor-default" aria-label="Close the image" onClick={onClose} />
      <div className="relative z-10 h-[min(88dvh,calc(100dvh-2rem))] w-full max-w-6xl">
        <EditorialImage src={current} alt={alt} sizes="100vw" priority />
      </div>
      <button type="button" className="absolute right-4 top-4 z-20 text-[11px] uppercase tracking-[0.16em] text-alabaster" onClick={onClose}>
        Close
      </button>
    </div>,
    document.body,
  );
}
