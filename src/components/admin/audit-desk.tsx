"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import type { AuditRow } from "@/components/admin/audit-table";
import { PageNav } from "@/components/page-nav";

const AuditTable = dynamic(() => import("@/components/admin/audit-table").then((mod) => mod.AuditTable), {
  ssr: false,
  loading: () => <div className="shimmer h-96" />,
});

export function AuditDesk({
  rows,
  page,
  pages,
  total,
}: {
  rows: AuditRow[];
  page: number;
  pages: number;
  total: number;
}) {
  const router = useRouter();
  return (
    <>
      <AuditTable rows={rows} />
      <PageNav page={page} pages={pages} total={total} onPage={(next) => router.push(`/admin/audit?page=${next}`)} />
    </>
  );
}
