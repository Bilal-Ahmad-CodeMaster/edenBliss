"use client";

import Link from "next/link";
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import { formatMoney } from "@/lib/prices";
import type { ProductCardData } from "@/types/commerce";

export function SearchOverlay({ currency }: { currency: string }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const debounced = useDebounce(query, 300);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const term = debounced.trim();
    if (term.length < 2) {
      setProducts([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ q: term, limit: "8" });
    clientFetch(`/api/catalog/search?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { products?: ProductCardData[] };
      })
      .then((data) => {
        if (!data || controller.signal.aborted) return;
        setProducts(data.products ?? []);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debounced, open]);

  return (
    <>
      <button
        type="button"
        className="flex h-10 w-10 items-center justify-center transition hover:text-sage"
        aria-label="Search the rail"
        onClick={() => setOpen(true)}
      >
        <Search className="h-4 w-4" />
      </button>
      {open && mounted
        ? createPortal(
            <div className="fixed inset-0 z-[70] overflow-y-auto bg-background px-4 py-8 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-4">
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Search</p>
              <button type="button" aria-label="Close search" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Linen, coat, silk"
              className="mt-6 h-14 w-full border-b border-line bg-transparent font-serif text-3xl outline-none placeholder:text-muted"
            />
            {loading ? <div className="shimmer mt-8 h-16" /> : null}
            <ul className="mt-6 divide-y divide-line">
              {products.map((product) => (
                <li key={product.id}>
                  <Link
                    href={`/product/${product.slug}`}
                    onClick={() => setOpen(false)}
                    className="flex items-baseline justify-between gap-4 py-4 hover:text-sage"
                  >
                    <span className="font-serif text-2xl">{product.title}</span>
                    <span className="text-sm text-muted">{formatMoney(product.finalPrice, currency)}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {debounced.trim().length >= 2 && !loading && products.length === 0 ? (
              <p className="mt-8 text-sm text-muted">Nothing on the rail matches that search.</p>
            ) : null}
            </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
