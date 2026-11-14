import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { SizeDesk } from "@/components/admin/size-desk";
import { listAdminSizes } from "@/lib/admin-data";

export const metadata: Metadata = {
  title: "Atelier sizes",
  description: "Eden Bliss size measurements in metres.",
  openGraph: { title: "Atelier sizes · Eden Bliss", description: "Eden Bliss size measurements in metres." },
};

export const dynamic = "force-dynamic";

export default async function AdminSizesPage() {
  const rows = await listAdminSizes();
  return (
    <div>
      <DeskHeading eyebrow="Sizes" title="Measured in metres." />
      <SizeDesk initial={rows} />
    </div>
  );
}
