import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { LookbookDesk } from "@/components/admin/lookbook-desk";
import { listAdminLooks } from "@/lib/lookbook";

export const metadata: Metadata = {
  title: "Lookbook",
  description: "Place shoppable pins on an Eden Bliss editorial scene.",
  openGraph: { title: "Lookbook · Eden Bliss", description: "Place shoppable pins on an Eden Bliss editorial scene." },
};

export const dynamic = "force-dynamic";

export default async function AdminLookbookPage() {
  const looks = await listAdminLooks();
  return (
    <div>
      <DeskHeading eyebrow="Lookbook" title="Shop the look." />
      <LookbookDesk initial={looks} />
    </div>
  );
}
