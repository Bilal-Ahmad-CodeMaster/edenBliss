import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskHeading } from "@/components/admin/desk-alert";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminSizes, listCategoryOptions } from "@/lib/admin-data";
import { getAdminProduct } from "@/lib/admin-write";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Edit piece",
  description: "Update an Eden Bliss piece, its sizes, and its price.",
  openGraph: { title: "Edit piece · Eden Bliss", description: "Update an Eden Bliss piece, its sizes, and its price." },
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, sizes, settings] = await Promise.all([
    getAdminProduct(id),
    listCategoryOptions(),
    listAdminSizes(),
    getStoreSettings(),
  ]);
  if (!product) notFound();

  return (
    <div>
      <DeskHeading eyebrow="Edit piece" title={product.title} />
      <ProductForm
        product={{
          ...product,
          subCategoryId: product.subCategoryId,
          discountMode: product.discountMode === "flat" ? "flat" : "percent",
        }}
        categories={categories}
        sizes={sizes.map((size) => ({ id: size.id, label: size.label }))}
        currency={settings.currencySymbol}
      />
    </div>
  );
}
