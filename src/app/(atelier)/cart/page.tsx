import type { Metadata } from "next";
import { CartView } from "@/components/cart-view";
import { readSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Bag",
  description: "Review the Eden Bliss pieces in your bag. Payment is cash on delivery.",
  openGraph: {
    title: "Bag · Eden Bliss",
    description: "Review the Eden Bliss pieces in your bag. Payment is cash on delivery.",
  },
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [session, settings] = await Promise.all([readSession(), getStoreSettings()]);

  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Bag</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">What you are taking home.</h1>
      <div className="mt-12">
        <CartView
          currency={settings.currencySymbol}
          settings={settings}
          authenticated={session.status === "active"}
        />
      </div>
    </section>
  );
}
