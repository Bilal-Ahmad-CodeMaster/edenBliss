import type { Metadata } from "next";
import { DeskHeading } from "@/components/admin/desk-alert";
import { SettingsForm } from "@/components/admin/settings-form";
import { getStoreSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "House settings",
  description: "Shipping, tax, and the Eden Bliss announcement bar.",
  openGraph: { title: "House settings · Eden Bliss", description: "Shipping, tax, and the Eden Bliss announcement bar." },
};

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  return (
    <div>
      <DeskHeading eyebrow="Settings" title="How the house presents itself." />
      <SettingsForm settings={settings} />
    </div>
  );
}
