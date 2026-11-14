"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { clientFetch } from "@/lib/client-fetch";
import { HEARTBEAT_INTERVAL_MS, RESTRICTED_MESSAGE } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function Heartbeat({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    let stopped = false;

    async function beat() {
      if (stopped || document.visibilityState === "hidden") return;
      try {
        const response = await clientFetch("/api/auth/heartbeat", { method: "POST" });
        if (response.status === 403) {
          const data = (await response.json().catch(() => null)) as { message?: string } | null;
          useCartStore.getState().clear();
          useWishlistStore.getState().clear();
          toast.error(data?.message ?? RESTRICTED_MESSAGE);
          window.location.href = "/login?restricted=1";
        }
      } catch {
        // The next pulse will try again.
      }
    }

    void beat();
    const timer = window.setInterval(() => void beat(), HEARTBEAT_INTERVAL_MS);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [enabled]);

  return null;
}
