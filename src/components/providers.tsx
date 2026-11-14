"use client";

import { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { Heartbeat } from "@/components/heartbeat";
import { SmoothScroll } from "@/components/smooth-scroll";
import { clientFetch } from "@/lib/client-fetch";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import type { CartItem } from "@/types/commerce";

export function Providers({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((state) => state.user);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    clientFetch("/api/cart", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { items?: CartItem[] };
      })
      .then((data) => {
        if (data?.items) useCartStore.getState().replace(data.items);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      });
    return () => controller.abort();
  }, [userId]);

  return (
    <SmoothScroll>
      {children}
      <Toaster />
      <Heartbeat enabled={Boolean(userId)} />
    </SmoothScroll>
  );
}
