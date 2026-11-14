import { clientFetch } from "@/lib/client-fetch";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import type { CartItem } from "@/types/commerce";

export function mergeCartLine(items: CartItem[], draft: CartItem, stock: number) {
  const existing = items.find((item) => item.productId === draft.productId && item.sizeLabel === draft.sizeLabel);
  if (!existing) return [...items, draft];
  return items.map((item) =>
    item === existing ? { ...item, quantity: Math.min(stock, item.quantity + draft.quantity) } : item,
  );
}

export async function syncCart(next: CartItem[], authenticated: boolean) {
  const previous = useCartStore.getState().items;
  useCartStore.getState().replace(next);
  const signedIn = authenticated || Boolean(useSessionStore.getState().user);
  if (!signedIn) return { ok: true as const, items: next };

  try {
    const response = await clientFetch("/api/cart", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: next.map((item) => ({
          productId: item.productId,
          sizeLabel: item.sizeLabel,
          quantity: item.quantity,
        })),
      }),
    });
    const data = (await response.json()) as { message?: string; items?: CartItem[] };
    if (response.status === 403) {
      useCartStore.getState().replace(previous);
      return { ok: false as const, message: data.message ?? RESTRICTED_MESSAGE, restricted: true };
    }
    if (!response.ok || !data.items) {
      useCartStore.getState().replace(previous);
      return { ok: false as const, message: data.message ?? "The bag could not be updated." };
    }
    useCartStore.getState().replace(data.items);
    return { ok: true as const, items: data.items };
  } catch {
    useCartStore.getState().replace(previous);
    return { ok: false as const, message: "The bag could not be updated." };
  }
}
