"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-fetch";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import { useWishlistStore } from "@/store/wishlist-store";

export function LogoutButton({
  className,
  variant = "outline",
  onDone,
}: {
  className?: string;
  variant?: "outline" | "ghost";
  onDone?: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    try {
      await clientFetch("/api/auth/logout", { method: "POST" });
      useCartStore.getState().clear();
      useWishlistStore.getState().clear();
      useSessionStore.getState().setUser(null);
      toast.success("You have signed out.");
      onDone?.();
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button type="button" variant={variant} className={className} onClick={logout} disabled={pending}>
      {pending ? "Signing out" : "Sign out"}
    </Button>
  );
}
