"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type WishlistState = {
  ids: string[];
  hydrated: boolean;
  setHydrated: () => void;
  setIds: (ids: string[]) => void;
  toggle: (productId: string) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set) => ({
      ids: [],
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      setIds: (ids) => set({ ids }),
      toggle: (productId) =>
        set((state) => ({
          ids: state.ids.includes(productId)
            ? state.ids.filter((id) => id !== productId)
            : [...state.ids, productId],
        })),
      clear: () => set({ ids: [] }),
    }),
    {
      name: "eden-bliss-wishlist",
      partialize: (state) => ({ ids: state.ids }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

export function useWishlistCount() {
  const count = useWishlistStore((state) => state.ids.length);
  const hydrated = useWishlistStore((state) => state.hydrated);
  return hydrated ? count : 0;
}
