"use client";

import { useState } from "react";
import { toast } from "sonner";
import { VirtualTable } from "@/components/virtual-table";
import { clientFetch } from "@/lib/client-fetch";

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  isOnline: boolean;
  lastActiveAt: string;
};

function BlockButton({ id, blocked }: { id: string; blocked: boolean }) {
  const [value, setValue] = useState(blocked);
  const [pending, setPending] = useState(false);

  async function toggle() {
    if (pending) return;
    const previous = value;
    const next = !previous;
    setValue(next);
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: next }),
      });
      if (!response.ok) {
        setValue(previous);
        toast.error("The account could not be updated.");
      }
    } catch {
      setValue(previous);
      toast.error("The account could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className={`text-[11px] uppercase tracking-[0.14em] ${value ? "text-terracotta" : "text-sage"}`}
    >
      {value ? "Restricted" : "Open"}
    </button>
  );
}

export function UserTable({ rows }: { rows: UserRow[] }) {
  return (
    <VirtualTable
      rows={rows}
      empty="No accounts have been opened yet."
      renderRow={(row) => (
        <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
          <div className="min-w-0">
            <p className="truncate font-serif text-xl">{row.name}</p>
            <p className="truncate text-xs text-muted">
              {row.email} · {row.role === "ADMIN" ? "Atelier" : "Client"}
              {row.isOnline ? " · In the house" : ""}
            </p>
          </div>
          {row.role === "ADMIN" ? <span className="text-[11px] uppercase tracking-[0.14em] text-muted">Atelier</span> : <BlockButton id={row.id} blocked={row.isBlocked} />}
        </div>
      )}
    />
  );
}
