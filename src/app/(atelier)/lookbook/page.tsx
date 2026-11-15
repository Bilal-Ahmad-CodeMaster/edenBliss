import type { Metadata } from "next";
import { LookbookStage } from "@/components/lookbook-stage";
import { getStoreSettings } from "@/lib/catalog";
import { listPublicLooks } from "@/lib/lookbook";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Shop the seasonal Eden Bliss looks. Tap a pin to add a piece to your bag.",
  openGraph: {
    title: "Lookbook · Eden Bliss",
    description: "Shop the seasonal Eden Bliss looks. Tap a pin to add a piece to your bag.",
  },
};

export const revalidate = 60;

export default async function LookbookPage() {
  const [looks, settings] = await Promise.all([listPublicLooks(), getStoreSettings()]);
  return (
    <section className="mx-auto min-w-0 max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Seasonal collections</p>
      <h1 className="mt-3 font-serif text-5xl sm:text-7xl">Shop the look.</h1>
      <div className="mt-12">
        <LookbookStage looks={looks} currency={settings.currencySymbol} />
      </div>
    </section>
  );
}
