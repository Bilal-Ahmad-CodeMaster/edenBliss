import type { Metadata } from "next";
import { FindMySizeDesk } from "@/components/find-my-size-desk";
import { getStoreSettings } from "@/lib/catalog";
import { listSizeBook } from "@/lib/size-book";

export const metadata: Metadata = {
  title: "Find my size",
  description: "Match your measurements to an Eden Bliss size.",
};

export const dynamic = "force-dynamic";

export default async function FindMySizePage() {
  const [settings, sizes] = await Promise.all([getStoreSettings(), listSizeBook()]);

  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Atelier</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">Find my size</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
        Enter your height, weight, and waist. The house size book recommends a fit, with the garment measurements beside your own.
      </p>
      <div className="mt-10 max-w-xl border border-line p-5 sm:p-8">
        <FindMySizeDesk whatsappNumber={settings.whatsappNumber} sizes={sizes} />
      </div>
    </section>
  );
}
