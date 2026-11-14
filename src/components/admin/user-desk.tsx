"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { isAbort, Pager } from "@/components/admin/pager";
import { VirtualTable } from "@/components/virtual-table";
import { DeskDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "USER" | "ADMIN";
  isBlocked: boolean;
  isOnline: boolean;
  lastActiveAt: string;
};

export function UserDesk({
  initial,
}: {
  initial: { rows: UserRow[]; page: number; pages: number; total: number; online: number };
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [page, setPage] = useState(initial.page);
  const [rows, setRows] = useState(initial.rows);
  const [pages, setPages] = useState(initial.pages);
  const [total, setTotal] = useState(initial.total);
  const [online, setOnline] = useState(initial.online);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetId, setResetId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "10", q: debounced });
    setLoading(true);
    clientFetch(`/api/admin/users?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          rows?: UserRow[];
          pages?: number;
          total?: number;
          online?: number;
          message?: string;
        };
        if (!response.ok || !data.rows) throw new Error(data.message ?? "Accounts could not be loaded.");
        setRows(data.rows);
        setPages(data.pages ?? 1);
        setTotal(data.total ?? data.rows.length);
        setOnline(data.online ?? 0);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setMessage("Accounts could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, page]);

  async function toggleBlock(row: UserRow) {
    const previous = row.isBlocked;
    setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isBlocked: !previous } : item)));
    try {
      const response = await clientFetch(`/api/admin/users/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBlocked: !previous }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isBlocked: previous } : item)));
        toast.error(data.message ?? "The account could not be updated.");
        return;
      }
      toast.success(data.message ?? "Updated.");
    } catch {
      setRows((current) => current.map((item) => (item.id === row.id ? { ...item, isBlocked: previous } : item)));
      toast.error("The account could not be updated.");
    }
  }

  async function resetPassword() {
    if (pending || !resetId) return;
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/users/${resetId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword, nextPassword }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The password could not be changed.");
        return;
      }
      toast.success(data.message ?? "The password has been reset.");
      setResetId("");
      setAdminPassword("");
      setNextPassword("");
    } catch {
      toast.error("The password could not be changed.");
    } finally {
      setPending(false);
    }
  }

  async function removeUser() {
    if (pending || !deleteId) return;
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/users/${deleteId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The account could not be removed.");
        return;
      }
      setRows((current) => current.filter((row) => row.id !== deleteId));
      setTotal((current) => Math.max(0, current - 1));
      toast.success(data.message ?? "Removed.");
      setDeleteId("");
      setAdminPassword("");
    } catch {
      toast.error("The account could not be removed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Search name, email, or phone"
          aria-label="Search accounts"
          className="h-11 max-w-xs"
        />
        <p className="text-xs uppercase tracking-[0.14em] text-muted">
          {total} accounts · <span className="text-sage">{online} in the house</span>
        </p>
      </div>
      <DeskAlert message={message} />
      {loading ? <div className="shimmer h-2" /> : null}
      <VirtualTable
        rows={rows}
        estimate={104}
        empty="No accounts have been opened yet."
        renderRow={(row) => (
          <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-serif text-xl">
                {row.name} {row.isOnline ? <span className="text-sm text-sage">· in</span> : null}
              </p>
              <p className="truncate text-xs text-muted">
                {row.email}
                {row.phone ? ` · ${row.phone}` : ""} · {row.role === "ADMIN" ? "Atelier" : "Client"}
              </p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1 text-[11px] uppercase tracking-[0.14em] sm:flex-row sm:gap-3">
              {row.role === "USER" ? (
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.isBlocked}
                  aria-label={row.isBlocked ? "Unblock account" : "Block account"}
                  onClick={() => void toggleBlock(row)}
                  className={cn("relative h-6 w-11 border", row.isBlocked ? "border-terracotta" : "border-sage")}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-4 w-4 transition-transform",
                      row.isBlocked ? "translate-x-5 bg-terracotta" : "translate-x-0.5 bg-sage",
                    )}
                  />
                </button>
              ) : (
                <span className="text-muted">Atelier</span>
              )}
              <button
                type="button"
                className="text-foreground"
                onClick={() => {
                  setAdminPassword("");
                  setNextPassword("");
                  setResetId(row.id);
                }}
              >
                Password
              </button>
              {row.role === "USER" ? (
                <button
                  type="button"
                  className="text-terracotta"
                  onClick={() => {
                    setAdminPassword("");
                    setDeleteId(row.id);
                  }}
                >
                  Delete
                </button>
              ) : null}
            </div>
          </div>
        )}
      />
      <Pager page={page} pages={pages} total={total} onPage={setPage} />

      <DeskDialog
        open={Boolean(resetId)}
        onOpenChange={(open) => {
          if (!open) setResetId("");
        }}
        title="Set a new password"
        description="Enter your own atelier password before the client's password changes."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void resetPassword();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="admin-password">Your password</Label>
            <Input id="admin-password" type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="next-password">New password</Label>
            <Input id="next-password" type="password" autoComplete="new-password" minLength={8} value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} required />
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Saving" : "Update password"}
          </Button>
        </form>
      </DeskDialog>

      <DeskDialog
        open={Boolean(deleteId)}
        onOpenChange={(open) => {
          if (!open) setDeleteId("");
        }}
        title="Delete this account?"
        description="This removes the client. Confirm with your own atelier password."
      >
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void removeUser();
          }}
        >
          <div className="space-y-2">
            <Label htmlFor="delete-password">Your password</Label>
            <Input id="delete-password" type="password" autoComplete="current-password" value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
          </div>
          <Button type="submit" variant="sale" disabled={pending}>
            {pending ? "Removing" : "Delete account"}
          </Button>
        </form>
      </DeskDialog>
    </div>
  );
}
