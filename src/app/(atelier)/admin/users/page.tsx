import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { UserDesk } from "@/components/admin/user-desk";
import { listAdminUsers } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Atelier clients",
  description: "Eden Bliss client accounts, access, and presence.",
  openGraph: { title: "Atelier clients · Eden Bliss", description: "Eden Bliss client accounts, access, and presence." },
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const users = await listAdminUsers(params.page, 12);
  return (
    <div>
      <DeskHeading eyebrow="Clients" title="Who is in the house." />
      <UserDesk initial={users} />
    </div>
  );
}
