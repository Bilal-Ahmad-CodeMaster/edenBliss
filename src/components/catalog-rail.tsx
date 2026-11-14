"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { SkeletonGrid } from "@/components/skeleton-grid";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import type { NavCategory, ProductCardData } from "@/types/commerce";

const SIZES = ["S", "M", "L", "XL", "XXL"] as const;
const SORTS = [
  ["featured", "Featured"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
  ["rating", "Top rated"],
] as const;

export function CatalogRail({
  categories,
  initialProducts,
  currency,
  authenticated,
  initialCategory = "",
  initialSubcategory = "",
  initialQuery = "",
  initialSort = "featured",
  initialTotal,
  initialPages = 1,
}: {
  categories: NavCategory[];
  initialProducts: ProductCardData[];
  currency: string;
  authenticated: boolean;
  initialCategory?: string;
  initialSubcategory?: string;
  initialQuery?: string;
  initialSort?: (typeof SORTS)[number][0];
  initialTotal?: number;
  initialPages?: number;
}) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);
  const [size, setSize] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [sale, setSale] = useState(false);
  const [sort, setSort] = useState<(typeof SORTS)[number][0]>(initialSort);
  const [page, setPage] = useState(1);
  const [products, setProducts] = useState(initialProducts);
  const [pages, setPages] = useState(initialPages);
  const [total, setTotal] = useState(initialTotal ?? initialProducts.length);
  const [loading, setLoading] = useState(false);
  const skip = useRef(true);
  const debouncedQuery = useDebounce(query, 300);
  const debouncedMin = useDebounce(min, 300);
  const debouncedMax = useDebounce(max, 300);
  const children = useMemo(() => categories.find((item) => item.slug === category)?.children ?? [], [categories, category]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "12", sort });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    if (size) params.set("size", size);
    if (debouncedMin) params.set("min", debouncedMin);
    if (debouncedMax) params.set("max", debouncedMax);
    if (sale) params.set("sale", "1");
    setLoading(true);
    clientFetch(`/api/catalog/search?${params}`, { signal: controller.signal })
      .then(async (response) => {
        const data = (await response.json()) as { products?: ProductCardData[]; total?: number; pages?: number };
        if (!response.ok || controller.signal.aborted) return;
        setProducts(data.products ?? []);
        setTotal(data.total ?? 0);
        setPages(data.pages ?? 1);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [debouncedQuery, debouncedMin, debouncedMax, category, subcategory, size, sale, sort, page]);

  return (
    <div>
      <div className="grid gap-4 border border-line p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Search
          <input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Linen, coat, silk"
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal text-foreground outline-none focus:border-sage"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Category
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setSubcategory("");
              setPage(1);
            }}
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal text-foreground"
          >
            <option value="">All</option>
            {categories.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Subcategory
          <select
            value={subcategory}
            onChange={(event) => {
              setSubcategory(event.target.value);
              setPage(1);
            }}
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal text-foreground"
          >
            <option value="">All</option>
            {children.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Sort
          <select
            value={sort}
            onChange={(event) => {
              setSort(event.target.value as (typeof SORTS)[number][0]);
              setPage(1);
            }}
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal text-foreground"
          >
            {SORTS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Size</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SIZES.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setSize((current) => (current === label ? "" : label));
                  setPage(1);
                }}
                className={`h-10 min-w-10 border px-3 text-sm ${size === label ? "border-sage bg-sage text-alabaster" : "border-line"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Min price
          <input
            type="number"
            min={0}
            value={min}
            onChange={(event) => {
              setMin(event.target.value);
              setPage(1);
            }}
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal outline-none focus:border-sage"
          />
        </label>
        <label className="block text-[11px] uppercase tracking-[0.16em] text-muted">
          Max price
          <input
            type="number"
            min={0}
            value={max}
            onChange={(event) => {
              setMax(event.target.value);
              setPage(1);
            }}
            className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm normal-case tracking-normal outline-none focus:border-sage"
          />
        </label>
        <label className="flex items-center gap-3 self-end text-sm">
          <input
            type="checkbox"
            checked={sale}
            onChange={(event) => {
              setSale(event.target.checked);
              setPage(1);
            }}
          />
          On sale / off only
        </label>
      </div>
      <p className="mt-4 text-xs uppercase tracking-[0.16em] text-muted">{total} pieces</p>
      <div className="mt-8">
        {loading ? (
          <SkeletonGrid />
        ) : (
          <ProductGrid
            products={products}
            currency={currency}
            authenticated={authenticated}
            empty={
              query || category || subcategory || size || min || max || sale
                ? "Nothing on the rail matches those choices."
                : "The rail is empty until the archive is connected."
            }
          />
        )}
      </div>
      {pages > 1 ? (
        <div className="mt-8 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em]">
          <button type="button" disabled={page <= 1 || loading} className="disabled:opacity-40" onClick={() => setPage((current) => current - 1)}>
            Previous
          </button>
          <span className="text-muted">
            {page} / {pages}
          </span>
          <button type="button" disabled={page >= pages || loading} className="disabled:opacity-40" onClick={() => setPage((current) => current + 1)}>
            Next
          </button>
        </div>
      ) : null}
    </div>
  );
}
