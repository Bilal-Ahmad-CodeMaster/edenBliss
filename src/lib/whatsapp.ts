import type { CustomerOrder } from "@/types/commerce";

export function whatsAppHref(number: string, text: string) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text.slice(0, 1600))}`;
}

export function orderWhatsAppText(order: CustomerOrder) {
  const lines = order.items
    .map((item) => {
      const color = item.colorName ? ` · ${item.colorName}` : "";
      return `- ${item.title}${color} · Size ${item.sizeLabel} · Qty ${item.quantity}`;
    })
    .join("\n");
  const address = [order.shipping.address, order.shipping.city, order.shipping.state, order.shipping.postalCode]
    .filter(Boolean)
    .join(", ");
  const notes = order.customFitNotes.trim() ? `\nFit notes: ${order.customFitNotes.trim()}` : "";
  return [
    "Eden Bliss cash on delivery",
    `Order: ${order.orderNumber}`,
    `Name: ${order.shipping.fullName}`,
    lines,
    `Address: ${address}`,
    `COD total: ${order.grandTotal}`,
    notes,
    "Please confirm this order.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function stylistWhatsAppText(input: { title: string; colorName?: string; sizeLabel?: string }) {
  const color = input.colorName ? ` in ${input.colorName}` : "";
  const size = input.sizeLabel ? `, size ${input.sizeLabel}` : "";
  return `Hello Eden Bliss, I would like help choosing ${input.title}${color}${size}.`;
}
