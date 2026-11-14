import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DeskHeading } from "@/components/admin/desk-alert";
import { ProfileForm } from "@/components/admin/profile-form";
import { getAdminProfile } from "@/lib/admin-data";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Atelier profile",
  description: "The Eden Bliss desk profile for the signed-in atelier.",
  openGraph: { title: "Atelier profile · Eden Bliss", description: "The Eden Bliss desk profile for the signed-in atelier." },
};

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const auth = await requireAdmin();
  if (!auth.ok) notFound();
  const profile = await getAdminProfile(auth.user.id);
  if (!profile) notFound();

  return (
    <div>
      <DeskHeading eyebrow="Profile" title="Your place at the desk." />
      <ProfileForm profile={profile} />
    </div>
  );
}
