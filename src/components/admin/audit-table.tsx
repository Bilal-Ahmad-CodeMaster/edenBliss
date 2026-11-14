"use client";

import { VirtualTable } from "@/components/virtual-table";

export type AuditRow = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  ipAddress: string;
  createdAt: string;
};

export function AuditTable({ rows }: { rows: AuditRow[] }) {
  return (
    <VirtualTable
      rows={rows}
      estimate={64}
      empty="No atelier actions have been recorded yet."
      renderRow={(row) => (
        <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-serif text-xl">{row.action}</p>
            <p className="truncate text-xs text-muted">
              {row.targetType} · {row.targetId}
            </p>
          </div>
          <p className="shrink-0 text-xs text-muted">{row.ipAddress}</p>
        </div>
      )}
    />
  );
}
