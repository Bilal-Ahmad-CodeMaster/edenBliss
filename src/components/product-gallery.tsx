"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { EditorialImage } from "@/components/editorial-image";

const ImageLightbox = dynamic(() => import("@/components/image-lightbox").then((mod) => mod.ImageLightbox), {
  ssr: false,
});

export function ProductGallery({ images, title }: { images: string[]; title: string }) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState("50% 50%");
  const [hovering, setHovering] = useState(false);
  const [pinch, setPinch] = useState(1);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchStart = useRef(0);
  const current = images[active] ?? images[0] ?? "";
  const scale = pinch > 1 ? pinch : hovering && !reduce ? 1.8 : 1;

  function pinchDistance() {
    const points = [...pointers.current.values()];
    if (points.length < 2) return 0;
    return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
  }

  return (
    <div className="min-w-0">
      <button
        type="button"
        className="relative block aspect-[3/4] w-full touch-none overflow-hidden bg-linen"
        onClick={() => setOpen(true)}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => {
          setHovering(false);
          if (pointers.current.size < 2) setPinch(1);
        }}
        onMouseMove={(event) => {
          if (reduce) return;
          const rect = event.currentTarget.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          setOrigin(`${x}% ${y}%`);
        }}
        onPointerDown={(event) => {
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) pinchStart.current = pinchDistance();
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size < 2 || pinchStart.current <= 0) return;
          const next = pinchDistance() / pinchStart.current;
          setPinch(Math.min(2.8, Math.max(1, next)));
        }}
        onPointerUp={(event) => {
          pointers.current.delete(event.pointerId);
          if (pointers.current.size < 2) {
            pinchStart.current = 0;
            if (!event.currentTarget.matches(":hover")) setPinch(1);
          }
        }}
        aria-label={`Open ${title} full screen`}
      >
        <span
          className="absolute inset-0 transition-transform duration-300"
          style={{ transform: reduce ? undefined : `scale(${scale})`, transformOrigin: origin }}
        >
          <EditorialImage src={current} alt={title} sizes="(max-width: 1024px) 100vw, 48vw" priority />
        </span>
      </button>
      <ImageLightbox images={images} index={active} alt={title} open={open} onClose={() => setOpen(false)} />
      {images.length > 1 ? (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {images.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              aria-label={`Show image ${index + 1} of ${title}`}
              className={`relative aspect-[3/4] overflow-hidden bg-linen ${index === active ? "ring-1 ring-sage" : ""}`}
            >
              <EditorialImage src={image} alt="" sizes="20vw" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
