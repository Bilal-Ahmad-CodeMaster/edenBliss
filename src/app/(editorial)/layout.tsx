import type { ReactNode } from "react";
import { SessionDiscover } from "@/components/session-sync";
import { SiteFrame } from "@/components/site-frame";

export const revalidate = 60;

export default function EditorialLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <SessionDiscover />
      <SiteFrame user={null}>{children}</SiteFrame>
    </>
  );
}
