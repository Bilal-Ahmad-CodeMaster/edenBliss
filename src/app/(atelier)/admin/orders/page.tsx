import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { OrderDesk } from "@/components/admin/order-desk";
import { listAdminOrders } from "@/lib/admin-data";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Atelier orders",
  description: "Review and update Eden Bliss cash-on-delivery orders.",
  openGraph: { title: "Atelier orders · Eden Bliss", description: "Review and update Eden Bliss cash-on-delivery orders." },
};

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const [orders, settings] = await Promise.all([listAdminOrders({ page: params.page, limit: 10 }), getStoreSettings()]);

  return (
    <div>
      <DeskHeading eyebrow="Orders" title="Cash on delivery." />
      <OrderDesk initial={orders} currency={settings.currencySymbol} />
    </div>
  );
}
