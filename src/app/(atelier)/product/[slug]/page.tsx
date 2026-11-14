import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OutfitLooks } from "@/components/outfit-looks";
import { ProductGallery } from "@/components/product-gallery";
import { PurchasePanel } from "@/components/purchase-panel";
import { ReviewsPanel } from "@/components/reviews-panel";
import { readSession } from "@/lib/auth";
import { getProductBySlug, getProductReviews, getRelatedProducts, getStoreSettings } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: "Piece",
      description: "This Eden Bliss piece is no longer on the rail.",
      openGraph: { title: "Piece · Eden Bliss", description: "This Eden Bliss piece is no longer on the rail." },
    };
  }
  return {
    title: product.title,
    description: product.storyDescription,
    openGraph: {
      title: `${product.title} · Eden Bliss`,
      description: product.storyDescription,
      images: product.image ? [{ url: product.image, alt: product.title }] : undefined,
    },
  };
}

export const dynamic = "force-dynamic";

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [session, settings, reviews, related] = await Promise.all([
    readSession(),
    getStoreSettings(),
    getProductReviews(product.id, 1, 12),
    getRelatedProducts(product.categorySlug, product.id),
  ]);

  return (
    <article className="mx-auto max-w-page px-4 py-10 sm:px-6 lg:px-10">
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
        <Link href={`/shop/${product.categorySlug}`} className="nav-link">
          {product.categoryName}
        </Link>
      </nav>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <ProductGallery images={product.images} title={product.title} />
        <PurchasePanel
          product={product}
          currency={settings.currencySymbol}
          authenticated={session.status === "active"}
        />
      </div>

      <section className="mt-16 grid gap-10 border-t border-line pt-12 lg:grid-cols-2">
        <div>
          <h2 className="font-serif text-4xl">Fabric and care</h2>
          <p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted">{product.fabricAndCare}</p>
        </div>
        <div>
          <h2 className="font-serif text-4xl">From the fitting room</h2>
          <div className="mt-6">
            <ReviewsPanel
              productId={product.id}
              authenticated={session.status === "active"}
              initialReviews={reviews.reviews}
              initialAverage={product.averageRating}
              initialCount={product.reviewCount}
              initialBreakdown={reviews.breakdown}
            />
          </div>
        </div>
      </section>

      <OutfitLooks images={product.outfitLookImages} title={product.title} related={related} currency={settings.currencySymbol} />
    </article>
  );
}
