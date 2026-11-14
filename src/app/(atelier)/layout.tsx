import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SessionSync } from "@/components/session-sync";
import { SiteFrame } from "@/components/site-frame";
import { readSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AtelierLayout({ children }: { children: ReactNode }) {
  const session = await readSession();
  if (session.status === "blocked") redirect("/api/auth/restricted");
  const user = session.status === "active" ? session.user : null;

  return (
    <>
      <SessionSync user={user} />
      <SiteFrame user={user}>{children}</SiteFrame>
    </>
  );
}
