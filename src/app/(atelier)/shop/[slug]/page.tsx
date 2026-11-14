import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ShopBrowser } from "@/components/shop-browser";
import { readSession } from "@/lib/auth";
import { getCatalogFacets, getNavCategories, getShopProducts, getStoreSettings } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopProducts({ categorySlug: slug });
  if (!shop.category) {
    return {
      title: "Collection",
      description: "This Eden Bliss collection could not be found.",
      openGraph: { title: "Collection · Eden Bliss", description: "This Eden Bliss collection could not be found." },
    };
  }
  return {
    title: shop.category.name,
    description: shop.category.description,
    openGraph: {
      title: `${shop.category.name} · Eden Bliss`,
      description: shop.category.description,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;
  const [session, settings, shop, categories, facets] = await Promise.all([
    readSession(),
    getStoreSettings(),
    getShopProducts({ categorySlug: slug }),
    getNavCategories(),
    getCatalogFacets(),
  ]);

  if (!shop.category || !shop.products) notFound();

  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <nav aria-label="Breadcrumb" className="text-[11px] uppercase tracking-[0.16em] text-muted">
        <Link href="/" className="nav-link">
          Home
        </Link>
        <span className="px-2" aria-hidden>
          /
        </span>
        <Link href="/shop" className="nav-link">
          Shop
        </Link>
        <span className="px-2" aria-hidden>
          /
        </span>
        <span>{shop.category.name}</span>
      </nav>
      <h1 className="mt-6 font-serif text-5xl leading-none sm:text-7xl">{shop.category.name}</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">{shop.category.description}</p>
      <div className="mt-12">
        <ShopBrowser
          initialProducts={shop.products}
          initialQuery=""
          initialCategory={slug}
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
