import { summarizeBag } from "@/lib/bag";
import { formatMoney } from "@/lib/prices";
import type { CartItem, StoreSettingsDTO } from "@/types/commerce";

export function BagSummary({
  items,
  currency,
  settings,
}: {
  items: CartItem[];
  currency: string;
  settings: Pick<StoreSettingsDTO, "standardShippingRate" | "freeShippingThreshold" | "taxPercentage">;
}) {
  const summary = summarizeBag(items, settings);

  return (
    <div>
      <dl className="space-y-3 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Original subtotal</dt>
          <dd>{formatMoney(summary.originalSubtotal, currency)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Discount / off savings</dt>
          <dd className={summary.savings > 0 ? "text-terracotta" : undefined}>
            {summary.savings > 0 ? `−${formatMoney(summary.savings, currency)}` : formatMoney(0, currency)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-muted">Shipping</dt>
          <dd>{summary.shippingFee === 0 ? "Complimentary" : formatMoney(summary.shippingFee, currency)}</dd>
        </div>
        {summary.taxAmount > 0 ? (
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Tax</dt>
            <dd>{formatMoney(summary.taxAmount, currency)}</dd>
          </div>
        ) : null}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-base">
          <dt>Payable</dt>
          <dd>{formatMoney(summary.payable, currency)}</dd>
        </div>
      </dl>
      <p className="mt-4 text-sm leading-6 text-muted">
        {summary.untilFreeShipping > 0
          ? `Spend ${formatMoney(summary.untilFreeShipping, currency)} more for complimentary delivery.`
          : "Complimentary delivery is included."}{" "}
        The house rate is {formatMoney(settings.standardShippingRate, currency)} below{" "}
        {formatMoney(settings.freeShippingThreshold, currency)}.
      </p>
    </div>
  );
}
