import type { Metadata } from "next";
import { CategoryDesk } from "@/components/admin/category-desk";
import { DeskHeading } from "@/components/admin/desk-alert";
import { listAdminCategories } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Atelier categories",
  description: "Eden Bliss categories and the cloth they hold.",
  openGraph: { title: "Atelier categories · Eden Bliss", description: "Eden Bliss categories and the cloth they hold." },
};

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const rows = await listAdminCategories();
  return (
    <div>
      <DeskHeading eyebrow="Categories" title="Rails and rooms." />
      <CategoryDesk initial={rows} />
    </div>
  );
}
