import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
  description: "The terms for shopping Eden Bliss, including cash on delivery.",
  openGraph: {
    title: "Terms · Eden Bliss",
    description: "The terms for shopping Eden Bliss, including cash on delivery.",
  },
};

export const revalidate = 60;

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Terms</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">How an order is made.</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
        <p>
          Prices, discounts, and shipping are read from the archive when you place the order. A figure typed into the browser is never the price you pay. Payment is cash on delivery.
        </p>
        <p>
          A size is a set of measurements, not a promise that every body matches a letter. Fit notes are requests, and the atelier will follow them when the cloth allows.
        </p>
        <p>
          If a piece is no longer in the size you chose, the order stops rather than sending a substitute. You can write to the house from the contact page if a parcel needs to be held or refused on arrival.
        </p>
      </div>
    </article>
  );
}
