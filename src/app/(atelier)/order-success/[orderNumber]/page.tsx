import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderHistory } from "@/components/order-history";
import { readSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { getOwnedOrder } from "@/lib/orders";

type PageProps = { params: Promise<{ orderNumber: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { orderNumber } = await params;
  const title = `Order ${orderNumber}`;
  const description = `Eden Bliss cash-on-delivery order ${orderNumber}, with its pieces, savings, and fit notes.`;
  return {
    title,
    description,
    openGraph: { title: `${title} · Eden Bliss`, description },
  };
}

export const dynamic = "force-dynamic";

export default async function OrderSuccessPage({ params }: PageProps) {
  const { orderNumber } = await params;
  const session = await readSession();
  if (session.status !== "active") notFound();

  const [order, settings] = await Promise.all([
    getOwnedOrder(session.user.id, orderNumber),
    getStoreSettings(),
  ]);
  if (!order) notFound();

  return (
    <section className="mx-auto max-w-page min-w-0 px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-sage">Confirmed</p>
      <h1 className="mt-3 break-all font-serif text-5xl leading-none sm:text-7xl">{order.orderNumber}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
        Pay in cash at your doorstep upon receiving your Eden Bliss parcel. The house will move this order from pending to delivered as it travels.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link href="/profile?tab=orders" className="inline-flex h-11 items-center bg-sage px-6 text-sm uppercase tracking-[0.14em] text-alabaster">
          Track status
        </Link>
        <Link href="/shop" className="inline-flex h-11 items-center border border-line px-6 text-sm uppercase tracking-[0.14em] hover:border-sage hover:text-sage">
          Return to the shop
        </Link>
      </div>
      <div className="mt-12">
        <OrderHistory orders={[order]} currency={settings.currencySymbol} />
      </div>
    </section>
  );
}
