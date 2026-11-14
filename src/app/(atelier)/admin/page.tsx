import type { Metadata } from "next";
import Link from "next/link";
import { DeskAlert, DeskHeading } from "@/components/admin/desk-alert";
import { getAdminOverview } from "@/lib/admin-data";
import { formatMoney } from "@/lib/prices";

export const metadata: Metadata = {
  title: "Atelier overview",
  description: "Eden Bliss atelier overview: orders, cloth, and the house in one desk.",
  openGraph: { title: "Atelier overview · Eden Bliss", description: "Orders, cloth, and the house in one desk." },
};

export const dynamic = "force-dynamic";

const statuses = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

export default async function AdminHomePage() {
  const overview = await getAdminOverview();

  return (
    <div className="space-y-10">
      <DeskHeading eyebrow="Overview" title="The house, today." />
      {overview.connected ? null : (
        <DeskAlert message="The archive is not connected, so these counts stay at zero until MongoDB is configured." />
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <article className="border border-line p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Registered</p>
          <p className="mt-3 font-serif text-4xl">{overview.users.total}</p>
        </article>
        <article className="border border-line p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Logged in · 15 min</p>
          <p className="mt-3 font-serif text-4xl text-sage">{overview.users.online}</p>
        </article>
        <article className="border border-line p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Revenue</p>
          <p className="mt-3 font-serif text-4xl">{formatMoney(overview.revenue, overview.currencySymbol)}</p>
        </article>
        <article className="border border-line p-5">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Orders</p>
          <p className="mt-3 font-serif text-4xl">{overview.orders.total}</p>
        </article>
      </div>
      <section>
        <h2 className="font-serif text-3xl">Orders by status</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {statuses.map((status) => (
            <li key={status} className="border border-line px-3 py-4">
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted">{status}</p>
              <p className="mt-2 font-serif text-2xl">{overview.orders.byStatus[status]}</p>
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="font-serif text-3xl">Low stock</h2>
          <ul className="mt-4 divide-y divide-line border border-line">
            {overview.lowStock.length === 0 ? <li className="p-4 text-sm text-muted">No size is at three pieces or fewer.</li> : null}
            {overview.lowStock.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 p-4 text-sm">
                <span>
                  {item.title} · {item.sizeLabel}
                </span>
                <span className="text-terracotta">{item.stock} left</span>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="font-serif text-3xl">Recent orders</h2>
            <Link href="/admin/orders" className="text-[11px] uppercase tracking-[0.14em] text-sage">
              All orders
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto border border-line">
            <table className="w-full min-w-[28rem] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-[0.14em] text-muted">
                <tr>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {overview.recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-4 text-muted">
                      No orders yet.
                    </td>
                  </tr>
                ) : null}
                {overview.recentOrders.map((order) => (
                  <tr key={order.id} className="border-t border-line">
                    <td className="px-4 py-3">{order.orderNumber}</td>
                    <td className="px-4 py-3">{order.fullName}</td>
                    <td className="px-4 py-3">{order.status}</td>
                    <td className="px-4 py-3">{formatMoney(order.grandTotal, overview.currencySymbol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
