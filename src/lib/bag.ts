import { roundMoney } from "@/lib/prices";

type PricedLine = {
  unitPrice: number;
  discountApplied?: number;
  quantity: number;
};

type ShippingRules = {
  standardShippingRate: number;
  freeShippingThreshold: number;
  taxPercentage: number;
};

export function summarizeBag(items: PricedLine[], settings: ShippingRules) {
  const originalSubtotal = roundMoney(
    items.reduce((sum, item) => sum + (item.unitPrice + (item.discountApplied || 0)) * item.quantity, 0),
  );
  const savings = roundMoney(items.reduce((sum, item) => sum + (item.discountApplied || 0) * item.quantity, 0));
  const merchandise = roundMoney(originalSubtotal - savings);
  const shippingFee =
    merchandise <= 0 || merchandise >= settings.freeShippingThreshold ? 0 : roundMoney(settings.standardShippingRate);
  const untilFreeShipping =
    merchandise <= 0
      ? roundMoney(settings.freeShippingThreshold)
      : roundMoney(Math.max(0, settings.freeShippingThreshold - merchandise));
  const taxAmount = roundMoney((merchandise * (settings.taxPercentage || 0)) / 100);
  const payable = roundMoney(merchandise + shippingFee + taxAmount);

  return { originalSubtotal, savings, merchandise, shippingFee, untilFreeShipping, taxAmount, payable };
}
