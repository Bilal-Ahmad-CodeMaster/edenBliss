import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout-form";
import { getCustomerProfile } from "@/lib/account";
import { readSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Place an Eden Bliss order for cash on delivery, with optional custom fit and measurement notes.",
  openGraph: {
    title: "Checkout · Eden Bliss",
    description: "Place an Eden Bliss order for cash on delivery, with optional custom fit and measurement notes.",
  },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const session = await readSession();
  const settings = await getStoreSettings();
  const profile = session.status === "active" ? await getCustomerProfile(session.user.id) : null;

  return (
    <section className="mx-auto max-w-page min-w-0 px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Checkout</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">Cash at the door.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
        The parcel leaves the house with a fit note if you leave one. Payment is collected when it arrives.
      </p>
      <div className="mt-12">
        <CheckoutForm
          authenticated={session.status === "active"}
          currency={settings.currencySymbol}
          settings={settings}
          profile={profile}
        />
      </div>
    </section>
  );
}
