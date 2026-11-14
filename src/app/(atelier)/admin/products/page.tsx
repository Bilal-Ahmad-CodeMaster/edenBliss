import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { ProductDesk } from "@/components/admin/product-desk";
import { listAdminProducts, listAdminSizes, listCategoryOptions } from "@/lib/admin-data";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Atelier pieces",
  description: "The Eden Bliss cloth currently on the rail.",
  openGraph: { title: "Atelier pieces · Eden Bliss", description: "The Eden Bliss cloth currently on the rail." },
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const [products, categories, sizes, settings] = await Promise.all([
    listAdminProducts({ page: params.page, limit: 12 }),
    listCategoryOptions(),
    listAdminSizes(),
    getStoreSettings(),
  ]);

  return (
    <div>
      <DeskHeading eyebrow="Pieces" title="What is on the rail." />
      <ProductDesk
        initial={products}
        categories={categories}
        sizes={sizes.map((size) => ({ id: size.id, label: size.label }))}
        currency={settings.currencySymbol}
      />
    </div>
  );
}
