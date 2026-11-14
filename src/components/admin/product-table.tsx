"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VirtualTable } from "@/components/virtual-table";
import { clientFetch } from "@/lib/client-fetch";

type ProductRow = {
  id: string;
  title: string;
  slug: string;
  finalPrice: number;
  isActive: boolean;
  isFeatured: boolean;
  discountPercentage: number;
};

function Toggle({
  id,
  field,
  value,
  label,
}: {
  id: string;
  field: "isActive" | "isFeatured";
  value: boolean;
  label: string;
}) {
  const [current, setCurrent] = useState(value);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const previous = current;
    setCurrent(!previous);
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !previous }),
      });
      if (!response.ok) {
        setCurrent(previous);
        toast.error("The piece could not be updated.");
      }
    } catch {
      setCurrent(previous);
      toast.error("The piece could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button type="button" disabled={pending} onClick={toggle} className="text-[11px] uppercase tracking-[0.14em] text-sage">
      {label}: {current ? "Yes" : "No"}
    </button>
  );
}

export function ProductTable({ rows }: { rows: ProductRow[] }) {
  return (
    <VirtualTable
      rows={rows}
      empty="The rail is empty."
      renderRow={(row) => (
        <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-serif text-xl">{row.title}</p>
            <p className="text-xs text-muted">
              {row.finalPrice}
              {row.discountPercentage > 0 ? ` · −${row.discountPercentage}%` : ""}
            </p>
          </div>
          <div className="flex shrink-0 gap-4">
            <Toggle id={row.id} field="isActive" value={row.isActive} label="On rail" />
            <Toggle id={row.id} field="isFeatured" value={row.isFeatured} label="Edit" />
          </div>
        </div>
      )}
    />
  );
}
