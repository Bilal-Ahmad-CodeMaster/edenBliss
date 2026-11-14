import type { Metadata } from "next";
import { CategoryShowcase } from "@/components/category-showcase";
import { Hero } from "@/components/hero";
import { ShopBrowser } from "@/components/shop-browser";
import { readSession } from "@/lib/auth";
import { getCatalogFacets, getNavCategories, getShopProducts, getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Cloth, cut slowly",
  description:
    "Eden Bliss opens with linen columns, wool coats, and cashmere overshirts. A luxury clothing house with measured sizes and cash on delivery.",
  openGraph: {
    title: "Eden Bliss · Cloth, cut slowly",
    description: "Linen, wool, and silk cut in small lots. Measured sizes. Cash on delivery.",
  },
};

export const revalidate = 60;

export default async function HomePage() {
  const [session, settings, categories, facets, shop] = await Promise.all([
    readSession(),
    getStoreSettings(),
    getNavCategories(),
    getCatalogFacets(),
    getShopProducts({ limit: 12, sort: "featured" }),
  ]);

  return (
    <>
      <Hero />
      <CategoryShowcase categories={categories} />
      <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The edit</p>
        <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Pieces on the rail</h2>
        <div className="mt-10">
          <ShopBrowser
            initialProducts={shop.products ?? []}
            initialQuery=""
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
    </>
  );
}
