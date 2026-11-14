"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { isAbort, Pager } from "@/components/admin/pager";
import { VirtualTable } from "@/components/virtual-table";
import { DeskDialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import { formatCentimeters, formatInches, formatMeters, MEASUREMENT_KEYS, type GarmentMeasurements } from "@/lib/measurements";
import { formatMoney } from "@/lib/prices";

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  createdAt: string;
  fullName: string;
  phone: string;
};

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  paymentMethod: string;
  customFitNotes: string;
  shippingDetails: {
    fullName: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    postalCode: string;
  };
  subtotal: number;
  totalDiscount: number;
  shippingFee: number;
  taxAmount: number;
  grandTotal: number;
  items: Array<{
    title: string;
    sizeLabel: string;
    quantity: number;
    unitPrice: number;
    discountApplied: number;
    lineTotal: number;
    measurements: { meters: GarmentMeasurements; centimeters: GarmentMeasurements; inches: GarmentMeasurements };
  }>;
  statusHistory: Array<{ status: string; note: string; updatedAt: string }>;
};

export function OrderDesk({
  initial,
  currency,
}: {
  initial: { orders: OrderRow[]; page: number; pages: number; total: number };
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(initial.page);
  const [rows, setRows] = useState(initial.orders);
  const [pages, setPages] = useState(initial.pages);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState("");
  const [detail, setDetail] = useState<OrderDetail | null>(null);
  const [detailError, setDetailError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "12", q: debounced });
    if (status) params.set("status", status);
    setLoading(true);
    clientFetch(`/api/admin/orders?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { orders?: OrderRow[]; pages?: number; message?: string };
        if (!response.ok || !data.orders) throw new Error(data.message ?? "Orders could not be loaded.");
        setRows(data.orders);
        setPages(data.pages ?? 1);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setMessage("Orders could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, status, page]);

  useEffect(() => {
    if (!openId) return;
    const controller = new AbortController();
    setDetail(null);
    setDetailError("");
    clientFetch(`/api/admin/orders/${openId}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { order?: OrderDetail; message?: string };
        if (!response.ok || !data.order) throw new Error(data.message ?? "The order could not be opened.");
        setDetail(data.order);
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setDetailError("The order could not be opened.");
      });
    return () => controller.abort();
  }, [openId]);

  async function updateStatus(next: string) {
    if (!detail || saving) return;
    const previous = detail.status;
    setDetail({ ...detail, status: next });
    setSaving(true);
    try {
      const response = await clientFetch(`/api/admin/orders/${detail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, note: "Updated from the atelier desk." }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        setDetail((current) => (current ? { ...current, status: previous } : current));
        toast.error(data.message ?? "The order could not be updated.");
        return;
      }
      setRows((current) => current.map((row) => (row.id === detail.id ? { ...row, status: next } : row)));
      toast.success(data.message ?? "The order status has been updated.");
    } catch {
      setDetail((current) => (current ? { ...current, status: previous } : current));
      toast.error("The order could not be updated.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <Input
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setPage(1);
          }}
          placeholder="Order, name, or phone"
          aria-label="Search orders"
          className="h-11 max-w-xs"
        />
        <select
          value={status}
          aria-label="Filter by status"
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="h-11 border border-line bg-background px-3 text-xs uppercase tracking-[0.12em]"
        >
          <option value="">All statuses</option>
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>
      <DeskAlert message={message} />
      {loading ? <div className="shimmer h-2" /> : null}
      <VirtualTable
        rows={rows}
        estimate={84}
        empty="No cash-on-delivery orders yet."
        renderRow={(row) => (
          <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
            <div className="min-w-0">
              <p className="font-serif text-xl">{row.orderNumber}</p>
              <p className="truncate text-xs text-muted">
                {row.fullName} · {row.phone} · {formatMoney(row.grandTotal, currency)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-[11px] uppercase tracking-[0.14em] text-muted">{row.status}</span>
              <button type="button" className="text-[11px] uppercase tracking-[0.14em] text-sage" onClick={() => setOpenId(row.id)}>
                Open
              </button>
            </div>
          </div>
        )}
      />
      <Pager page={page} pages={pages} onPage={setPage} />

      <DeskDialog
        open={Boolean(openId)}
        onOpenChange={(open) => {
          if (!open) setOpenId("");
        }}
        wide
        title={detail?.orderNumber ?? "Order"}
        description={detail ? `${detail.shippingDetails.fullName} · ${detail.paymentMethod}` : "Opening the parcel."}
      >
          {detail ? (
            <div className="space-y-6">
              <label className="block space-y-2">
                <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Status</span>
                <select
                  value={detail.status}
                  disabled={saving}
                  onChange={(event) => void updateStatus(event.target.value)}
                  className="h-11 w-full border border-line bg-background px-3 text-xs uppercase tracking-[0.12em]"
                >
                  {STATUSES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <section className="border border-terracotta/40 bg-terracotta/10 p-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-terracotta">Custom fit, waist, and alterations</p>
                <p className="mt-2 text-sm leading-7">
                  {detail.customFitNotes || "No waist, height, or alteration notes were left with this order."}
                </p>
              </section>
              <section className="space-y-4">
                {detail.items.map((item) => (
                  <article key={`${item.title}-${item.sizeLabel}`} className="border border-line p-4">
                    <p className="font-serif text-2xl">{item.title}</p>
                    <p className="mt-1 text-sm text-muted">
                      Size {item.sizeLabel} · qty {item.quantity} · {formatMoney(item.unitPrice + item.discountApplied, currency)} base ·{" "}
                      {formatMoney(item.discountApplied, currency)} off · {formatMoney(item.lineTotal, currency)}
                    </p>
                    <ul className="mt-3 space-y-1 text-xs text-muted">
                      {MEASUREMENT_KEYS.map((key) => (
                        <li key={key}>
                          {key} {formatMeters(item.measurements.meters[key])} · {formatCentimeters(item.measurements.centimeters[key])} ·{" "}
                          {formatInches(item.measurements.inches[key])}
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </section>
              <p className="text-sm">
                Subtotal {formatMoney(detail.subtotal, currency)} · discount {formatMoney(detail.totalDiscount, currency)} · shipping{" "}
                {formatMoney(detail.shippingFee, currency)} · tax {formatMoney(detail.taxAmount, currency)}
              </p>
              <p className="font-serif text-3xl">{formatMoney(detail.grandTotal, currency)}</p>
              <section>
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">History</p>
                <ul className="mt-3 space-y-2 text-sm">
                  {[...detail.statusHistory].reverse().map((event, index) => (
                    <li key={`${event.updatedAt}-${index}`}>
                      {event.status}
                      {event.updatedAt ? ` · ${new Date(event.updatedAt).toLocaleString()}` : ""}
                      {event.note ? ` · ${event.note}` : ""}
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          ) : (
            <div className="space-y-3">
              <DeskAlert message={detailError} />
              {detailError ? null : <div className="shimmer h-64" />}
            </div>
          )}
      </DeskDialog>
    </div>
  );
}
