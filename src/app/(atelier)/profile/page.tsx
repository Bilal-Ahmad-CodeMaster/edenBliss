import type { Metadata } from "next";
import Link from "next/link";
import { ProfileDesk } from "@/components/profile-desk";
import { getCustomerProfile } from "@/lib/account";
import { readSession } from "@/lib/auth";
import { getStoreSettings } from "@/lib/catalog";
import { listOwnedOrders } from "@/lib/orders";

export const metadata: Metadata = {
  title: "Profile",
  description: "Your Eden Bliss profile, shipping address, and cash-on-delivery orders.",
  openGraph: {
    title: "Profile · Eden Bliss",
    description: "Your Eden Bliss profile, shipping address, and cash-on-delivery orders.",
  },
};

export const dynamic = "force-dynamic";

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; page?: string }>;
}) {
  const session = await readSession();
  if (session.status !== "active") {
    return (
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-10">
        <h1 className="font-serif text-5xl">Sign in to open your profile.</h1>
        <Link href="/login?next=/profile" className="mt-8 inline-flex h-11 items-center bg-sage px-6 text-sm uppercase tracking-[0.14em] text-alabaster">
          Sign in
        </Link>
      </section>
    );
  }

  const params = await searchParams;
  const [profile, orders, settings] = await Promise.all([
    getCustomerProfile(session.user.id),
    listOwnedOrders(session.user.id, params.page),
    getStoreSettings(),
  ]);

  if (!profile) {
    return (
      <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-10">
        <h1 className="font-serif text-5xl">The profile could not be opened.</h1>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-page min-w-0 px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Profile</p>
      <h1 className="mt-3 break-words font-serif text-5xl leading-none sm:text-7xl">{profile.name}</h1>
      <div className="mt-10">
        <ProfileDesk
          profile={profile}
          orders={orders.orders}
          currency={settings.currencySymbol}
          whatsappNumber={settings.whatsappNumber}
          initialTab={params.tab === "orders" ? "orders" : "details"}
          orderPage={orders.page}
          orderPages={orders.pages}
          orderTotal={orders.total}
        />
      </div>
    </section>
  );
}
