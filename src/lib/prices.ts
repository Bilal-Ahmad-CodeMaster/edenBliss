export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculateFinalPrice(basePrice: number, discountPercentage = 0) {
  const discount = Math.min(90, Math.max(0, discountPercentage || 0));
  if (discount <= 0) return roundMoney(basePrice);
  return roundMoney(basePrice * (1 - discount / 100));
}

export type DiscountMode = "percent" | "flat";

/** Caps every offer at 90% and keeps the stored price identical to the admin preview. */
export function resolvePricing(basePrice: number, mode: DiscountMode, percent = 0, flat = 0) {
  const base = roundMoney(Math.max(0, basePrice || 0));
  const maxOff = roundMoney(base * 0.9);

  if (mode === "flat") {
    const off = roundMoney(Math.min(Math.max(0, flat || 0), maxOff));
    const discountPercentage = base > 0 ? Math.min(90, (off / base) * 100) : 0;
    return {
      basePrice: base,
      discountMode: mode,
      discountPercentage,
      discountAmount: off,
      finalPrice: roundMoney(base - off),
      capped: (flat || 0) > maxOff && maxOff > 0,
    };
  }

  const discountPercentage = Math.min(90, Math.max(0, percent || 0));
  return {
    basePrice: base,
    discountMode: mode,
    discountPercentage,
    discountAmount: 0,
    finalPrice: calculateFinalPrice(base, discountPercentage),
    capped: (percent || 0) > 90,
  };
}

export function formatMoney(amount: number, symbol = "Rs.") {
  const hasFraction = Math.round(amount * 100) % 100 !== 0;
  const formatted = new Intl.NumberFormat("en-US", {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: hasFraction ? 2 : 0,
  }).format(amount);

  return `${symbol} ${formatted}`;
}
