"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types/commerce";

type CartState = {
  items: CartItem[];
  hydrated: boolean;
  setHydrated: () => void;
  replace: (items: CartItem[]) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      replace: (items) => set({ items }),
      clear: () => set({ items: [] }),
    }),
    {
      name: "eden-bliss-cart",
      partialize: (state) => ({ items: state.items }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useCartCount() {
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const hydrated = useCartStore((state) => state.hydrated);
  return hydrated ? count : 0;
}
