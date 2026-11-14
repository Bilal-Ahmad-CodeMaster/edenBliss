"use client";

import { ProductCard } from "@/components/product-card";
import type { ProductCardData } from "@/types/commerce";

export function ProductGrid({
  products,
  currency,
  authenticated,
  empty,
}: {
  products: ProductCardData[];
  currency: string;
  authenticated: boolean;
  empty: string;
}) {
  if (!products.length) {
    return <p className="max-w-md text-sm leading-7 text-muted">{empty}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} currency={currency} authenticated={authenticated} />
      ))}
    </div>
  );
}
