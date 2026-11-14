"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { isAbort, Pager } from "@/components/admin/pager";
import { ProductForm, type ProductEditor } from "@/components/admin/product-form";
import { VirtualTable } from "@/components/virtual-table";
import { DeskDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { formatMoney } from "@/lib/prices";

export type ProductListRow = {
  id: string;
  title: string;
  slug: string;
  categoryName: string;
  finalPrice: number;
  basePrice: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  discountPercentage: number;
  discountAmount: number;
};

type CategoryOption = { id: string; name: string; parentId: string };
type SizeOption = { id: string; label: string };

export function ProductDesk({
  initial,
  categories,
  sizes,
  currency,
}: {
  initial: { rows: ProductListRow[]; page: number; pages: number; total: number };
  categories: CategoryOption[];
  sizes: SizeOption[];
  currency: string;
}) {
  const [query, setQuery] = useState("");
  const debounced = useDebounce(query, 300);
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(initial.page);
  const [rows, setRows] = useState(initial.rows);
  const [pages, setPages] = useState(initial.pages);
  const [total, setTotal] = useState(initial.total);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [removeId, setRemoveId] = useState("");
  const [pending, setPending] = useState(false);
  const [editor, setEditor] = useState<string | null>(null);
  const [draft, setDraft] = useState<ProductEditor | null>(null);
  const [editorError, setEditorError] = useState("");
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "10", q: debounced });
    if (category) params.set("category", category);
    setLoading(true);
    clientFetch(`/api/admin/products?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as {
          rows?: ProductListRow[];
          pages?: number;
          total?: number;
          message?: string;
        };
        if (!response.ok || !data.rows) throw new Error(data.message ?? "The rail could not be loaded.");
        setRows(data.rows);
        setPages(data.pages ?? 1);
        setTotal(data.total ?? data.rows.length);
        setMessage("");
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setMessage("The rail could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, category, page, refresh]);

  useEffect(() => {
    if (!editor || editor === "new") {
      setDraft(null);
      setEditorError("");
      return;
    }
    const controller = new AbortController();
    setDraft(null);
    setEditorError("");
    clientFetch(`/api/admin/products/${editor}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { product?: ProductEditor; message?: string };
        if (!response.ok || !data.product) throw new Error(data.message ?? "The piece could not be opened.");
        setDraft({
          ...data.product,
          subCategoryId: data.product.subCategoryId ?? "",
          discountMode: data.product.discountMode === "flat" ? "flat" : "percent",
        });
      })
      .catch((error: unknown) => {
        if (isAbort(error)) return;
        setEditorError("The piece could not be opened.");
      });
    return () => controller.abort();
  }, [editor]);

  async function remove() {
    if (!removeId || pending) return;
    setPending(true);
    try {
      const response = await clientFetch(`/api/admin/products/${removeId}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The piece could not be removed.");
        return;
      }
      setRows((current) => current.filter((row) => row.id !== removeId));
      setTotal((current) => Math.max(0, current - 1));
      setRemoveId("");
      toast.success(data.message ?? "Removed.");
    } catch {
      toast.error("The piece could not be removed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Search pieces"
            aria-label="Search pieces"
            className="h-11 max-w-xs"
          />
          <select
            value={category}
            aria-label="Filter by category"
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
            className="h-11 border border-line bg-background px-3 text-sm"
          >
            <option value="">All categories</option>
            {categories
              .filter((item) => !item.parentId)
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        </div>
        <Button type="button" onClick={() => setEditor("new")}>
          Add piece
        </Button>
      </div>
      <p className="text-xs text-muted">{total} pieces</p>
      <DeskAlert message={message} />
      {loading ? <div className="shimmer h-2" /> : null}
      <VirtualTable
        rows={rows}
        estimate={88}
        empty="The rail is empty."
        renderRow={(row) => (
          <div className="flex h-full items-center justify-between gap-4 px-4 text-sm">
            <div className="min-w-0">
              <p className="truncate font-serif text-xl">{row.title}</p>
              <p className="truncate text-xs text-muted">
                {row.categoryName || "Unassigned"} · {formatMoney(row.finalPrice, currency)} · stock {row.stock}
                {row.stock <= LOW_STOCK_THRESHOLD ? " · low" : ""}
                {row.isActive ? "" : " · hidden"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-3 text-[11px] uppercase tracking-[0.14em]">
              {row.discountAmount > 0 || row.discountPercentage > 0 ? (
                <span className="text-terracotta">
                  {row.discountAmount > 0 ? `−${formatMoney(row.discountAmount, currency)}` : `−${Math.round(row.discountPercentage)}%`}
                </span>
              ) : null}
              <button type="button" className="text-sage" onClick={() => setEditor(row.id)}>
                Edit
              </button>
              <button type="button" className="text-terracotta" onClick={() => setRemoveId(row.id)}>
                Delete
              </button>
            </div>
          </div>
        )}
      />
      <Pager page={page} pages={pages} total={total} onPage={setPage} />
      <DeskDialog
        open={editor !== null}
        onOpenChange={(open) => {
          if (!open) setEditor(null);
        }}
        wide
        title={editor === "new" ? "Add piece" : "Update piece"}
        description="Price, stock, and the offer are saved from the desk. The shop never trusts a price typed in the browser."
      >
        {editor && editor !== "new" && !draft && !editorError ? <div className="shimmer h-64" /> : null}
        {editorError ? <DeskAlert message={editorError} /> : null}
        {editor === "new" || draft ? (
          <ProductForm
            key={draft?.id ?? "new"}
            product={draft ?? undefined}
            categories={categories}
            sizes={sizes}
            currency={currency}
            onSaved={() => {
              setEditor(null);
              setRefresh((current) => current + 1);
            }}
          />
        ) : null}
      </DeskDialog>
      <DeskDialog
        open={Boolean(removeId)}
        onOpenChange={(open) => {
          if (!open) setRemoveId("");
        }}
        title="Remove this piece?"
        description="It leaves the shop rail. Past orders keep their own record."
      >
        <div className="flex gap-3">
          <Button type="button" variant="sale" disabled={pending} onClick={() => void remove()}>
            Delete
          </Button>
          <Button type="button" variant="outline" onClick={() => setRemoveId("")}>
            Keep it
          </Button>
        </div>
      </DeskDialog>
    </div>
  );
}
