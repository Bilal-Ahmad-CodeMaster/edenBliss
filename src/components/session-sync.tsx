"use client";

import { useEffect, useLayoutEffect } from "react";
import { toast } from "sonner";
import { clientFetch } from "@/lib/client-fetch";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { useSessionStore } from "@/store/session-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { PublicUser } from "@/types/commerce";

export function SessionSync({ user }: { user: PublicUser | null }) {
  const setUser = useSessionStore((state) => state.setUser);

  useLayoutEffect(() => {
    setUser(user);
    if (user) useWishlistStore.getState().setIds(user.wishlist);
  }, [setUser, user]);

  return null;
}

export function SessionDiscover() {
  const setUser = useSessionStore((state) => state.setUser);

  useEffect(() => {
    const controller = new AbortController();
    clientFetch("/api/auth/me", { signal: controller.signal })
      .then(async (response) => {
        if (response.status === 403) {
          toast.error(RESTRICTED_MESSAGE);
          window.location.href = "/login?restricted=1";
          return null;
        }
        if (!response.ok) return null;
        return (await response.json()) as { user?: PublicUser };
      })
      .then((data) => {
        if (!data) {
          setUser(null);
          return;
        }
        setUser(data.user ?? null);
        if (data.user) useWishlistStore.getState().setIds(data.user.wishlist);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setUser(null);
      });

    return () => controller.abort();
  }, [setUser]);

  return null;
}
