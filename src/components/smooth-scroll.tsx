"use client";

import { useEffect } from "react";

export function SmoothScroll({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    let cancelled = false;
    let destroy: () => void = () => undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    import("lenis").then(({ default: Lenis }) => {
      if (cancelled) return;
      const lenis = new Lenis({ autoRaf: true });
      destroy = () => lenis.destroy();
    });

    return () => {
      cancelled = true;
      destroy();
    };
  }, []);

  return <>{children}</>;
}
