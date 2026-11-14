"use client";

import dynamic from "next/dynamic";
import type { AuditRow } from "@/components/admin/audit-table";

const AuditTable = dynamic(() => import("@/components/admin/audit-table").then((mod) => mod.AuditTable), {
  ssr: false,
  loading: () => <div className="shimmer h-96" />,
});

export function AuditDesk({ rows }: { rows: AuditRow[] }) {
  return <AuditTable rows={rows} />;
}
