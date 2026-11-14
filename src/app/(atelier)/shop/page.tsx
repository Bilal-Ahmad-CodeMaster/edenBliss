import type { Metadata } from "next";
import { ShopBrowser } from "@/components/shop-browser";
import { readSession } from "@/lib/auth";
import { getCatalogFacets, getNavCategories, getShopProducts, getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description: "Shop Eden Bliss: linen dresses, wool tailoring, silk blouses, and cashmere knitwear with measured sizes.",
  openGraph: {
    title: "Shop · Eden Bliss",
    description: "Linen, wool, silk, and cashmere currently on the Eden Bliss rail.",
  },
};

export const revalidate = 60;

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const params = await searchParams;
  const [session, settings, shop, categories, facets] = await Promise.all([
    readSession(),
    getStoreSettings(),
    getShopProducts({ q: params.q, page: Number(params.page) || 1 }),
    getNavCategories(),
    getCatalogFacets(),
  ]);

  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The shop</p>
      <h1 className="mt-3 max-w-3xl font-serif text-5xl leading-none sm:text-7xl">Everything currently on the rail.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
        Eight opening pieces, each with a full size run measured in metres, centimetres, and inches.
      </p>
      <div className="mt-12">
        <ShopBrowser
          initialProducts={shop.products ?? []}
          initialQuery={params.q ?? ""}
          currency={settings.currencySymbol}
          authenticated={session.status === "active"}
          total={shop.total}
          categories={categories}
          sizes={facets.sizes}
          minPrice={facets.minPrice}
          maxPrice={facets.maxPrice}
        />
      </div>
    </section>
  );
}
