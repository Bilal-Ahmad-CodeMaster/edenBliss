"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VirtualTable } from "@/components/virtual-table";
import { clientFetch } from "@/lib/client-fetch";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  fullName: string;
};

function StatusSelect({ row }: { row: OrderRow }) {
  const [status, setStatus] = useState(row.status);
  const [pending, setPending] = useState(false);

  async function update(next: string) {
    const previous = status;
    setStatus(next);
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/orders/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: "Updated from the atelier desk." }),
      });
      if (!response.ok) {
        setStatus(previous);
        toast.error("The order could not be updated.");
      }
    } catch {
      setStatus(previous);
      toast.error("The order could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <select
      value={status}
      disabled={pending}
      onChange={(event) => void update(event.target.value)}
      className="h-9 border border-line bg-background px-2 text-xs uppercase tracking-[0.12em]"
    >
      {STATUSES.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>
  );
}

export function OrderTable({ rows }: { rows: OrderRow[] }) {
  return (
    <VirtualTable
      rows={rows}
      empty="No cash-on-delivery orders yet."
      renderRow={(row) => (
        <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
          <div>
            <p className="font-serif text-xl">{row.orderNumber}</p>
            <p className="text-xs text-muted">
              {row.fullName} · {row.grandTotal}
            </p>
          </div>
          <StatusSelect row={row} />
        </div>
      )}
    />
  );
}
