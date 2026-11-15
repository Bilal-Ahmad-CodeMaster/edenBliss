import Link from "next/link";
import { EditorialImage } from "@/components/editorial-image";
import { formatMoney } from "@/lib/prices";
import { orderWhatsAppText, whatsAppHref } from "@/lib/whatsapp";
import { telHref } from "@/lib/utils";
import type { CustomerOrder } from "@/types/commerce";

const FLOW = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"] as const;

function stamp(value: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export function OrderHistory({ orders, currency }: { orders: CustomerOrder[]; currency: string }) {
  if (!orders.length) {
    return (
      <p className="max-w-md text-sm leading-7 text-muted">
        No parcels yet. When you place a cash-on-delivery order, its progress will be kept here.
      </p>
    );
  }

  return (
    <ul className="space-y-8">
      {orders.map((order) => {
        const cancelled = order.status === "CANCELLED";
        const current = FLOW.indexOf(order.status as (typeof FLOW)[number]);
        return (
          <li key={order.id} id={order.orderNumber} className="min-w-0 border border-line p-4 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{stamp(order.createdAt)}</p>
                <h3 className="mt-1 break-all font-serif text-3xl">{order.orderNumber}</h3>
              </div>
              <p className="text-sm">{formatMoney(order.grandTotal, currency)}</p>
            </div>

            <ol className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-5">
              {FLOW.map((step, index) => {
                const reached = !cancelled && current >= index;
                return (
                  <li
                    key={step}
                    className={`border px-2 py-2 text-center text-[10px] uppercase tracking-[0.12em] ${reached ? "border-sage text-sage" : "border-line text-muted"}`}
                  >
                    {step}
                  </li>
                );
              })}
            </ol>
            {cancelled ? <p className="mt-3 text-sm text-terracotta">This order was cancelled.</p> : null}

            <ul className="mt-6 divide-y divide-line border-y border-line">
              {order.items.map((item) => (
                <li key={`${item.title}-${item.sizeLabel}`} className="flex gap-3 py-4">
                  <div className="relative h-20 w-14 shrink-0 bg-linen">
                    <EditorialImage src={item.image} alt={item.title} sizes="56px" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-xl">{item.title}</p>
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      Size {item.sizeLabel} · {item.quantity}
                    </p>
                    {item.discountApplied > 0 ? (
                      <p className="mt-1 text-xs text-terracotta">
                        {formatMoney(item.discountApplied * item.quantity, currency)} off
                      </p>
                    ) : null}
                  </div>
                  <p className="shrink-0 text-sm">{formatMoney(item.lineTotal, currency)}</p>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Original subtotal</dt>
                <dd>{formatMoney(order.subtotal, currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Discount</dt>
                <dd>{order.totalDiscount > 0 ? `−${formatMoney(order.totalDiscount, currency)}` : formatMoney(0, currency)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Shipping</dt>
                <dd>{order.shippingFee === 0 ? "Complimentary" : formatMoney(order.shippingFee, currency)}</dd>
              </div>
            </dl>

            {order.customFitNotes ? (
              <div className="mt-4 border border-line bg-linen/60 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Custom fit notes</p>
                <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6">{order.customFitNotes}</p>
              </div>
            ) : null}

            <p className="mt-4 text-sm text-muted">
              {order.shipping.fullName}
              {order.shipping.phone ? (
                <>
                  {" · "}
                  <a className="hover:text-sage" href={telHref(order.shipping.phone)}>
                    {order.shipping.phone}
                  </a>
                </>
              ) : null}
              {" · "}
              {order.shipping.address}, {order.shipping.city} {order.shipping.postalCode}
            </p>
            <Link href={`/order-success/${order.orderNumber}`} className="mt-4 inline-block text-[11px] uppercase tracking-[0.16em] hover:text-sage">
              View confirmation
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
