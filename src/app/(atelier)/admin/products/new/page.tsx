import type { Metadata } from "next";
import { DeskAlert, DeskHeading } from "@/components/admin/desk-alert";
import { ProductForm } from "@/components/admin/product-form";
import { listAdminSizes, listCategoryOptions } from "@/lib/admin-data";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "New piece",
  description: "Add a new piece of cloth to the Eden Bliss rail.",
  openGraph: { title: "New piece · Eden Bliss", description: "Add a new piece of cloth to the Eden Bliss rail." },
};

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const [categories, sizes, settings] = await Promise.all([listCategoryOptions(), listAdminSizes(), getStoreSettings()]);
  const ready = categories.some((category) => !category.parentId) && sizes.length > 0;

  return (
    <div>
      <DeskHeading eyebrow="New piece" title="Cut it into the book." />
      {ready ? null : <DeskAlert message="Add a category and at least one size before a piece can be saved." />}
      <div className="mt-6">
        <ProductForm
          categories={categories}
          sizes={sizes.map((size) => ({ id: size.id, label: size.label }))}
          currency={settings.currencySymbol}
        />
      </div>
    </div>
  );
}
