import type { Metadata } from "next";
import { AuditDesk } from "@/components/admin/audit-desk";
import { DeskHeading } from "@/components/admin/desk-alert";
import { listAuditLogs } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Atelier audit",
  description: "Immutable record of changes made at the Eden Bliss desk.",
  openGraph: { title: "Atelier audit · Eden Bliss", description: "Immutable record of changes made at the Eden Bliss desk." },
};

export const dynamic = "force-dynamic";

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const audit = await listAuditLogs(params.page, 20);
  return (
    <div>
      <DeskHeading eyebrow="Audit" title="What the desk has touched." />
      <AuditDesk rows={audit.rows} />
    </div>
  );
}
