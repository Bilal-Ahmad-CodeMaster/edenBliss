"use client";

import { useEffect, useMemo, useState } from "react";
import { ProductGrid } from "@/components/product-grid";
import { SkeletonGrid } from "@/components/skeleton-grid";
import { clientFetch } from "@/lib/client-fetch";
import { useDebounce } from "@/hooks/use-debounce";
import type { NavCategory, ProductCardData } from "@/types/commerce";

type Sort = "" | "featured" | "newest" | "price-asc" | "price-desc" | "rating";

export function ShopBrowser({
  initialProducts,
  initialQuery,
  initialCategory = "",
  currency,
  authenticated,
  total,
  categories,
  sizes,
  minPrice,
  maxPrice,
}: {
  initialProducts: ProductCardData[];
  initialQuery: string;
  initialCategory?: string;
  currency: string;
  authenticated: boolean;
  total: number;
  categories: NavCategory[];
  sizes: string[];
  minPrice: number;
  maxPrice: number;
}) {
  const parent = categories.find((category) => category.slug === initialCategory);
  const childParent = categories.find((category) => category.children.some((child) => child.slug === initialCategory));
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(parent?.slug ?? childParent?.slug ?? "");
  const [subcategory, setSubcategory] = useState(childParent ? initialCategory : "");
  const [size, setSize] = useState("");
  const [sale, setSale] = useState(false);
  const [sort, setSort] = useState<Sort>("");
  const [page, setPage] = useState(1);
  const [low, setLow] = useState(minPrice);
  const [high, setHigh] = useState(maxPrice > minPrice ? maxPrice : minPrice);
  const [products, setProducts] = useState(initialProducts);
  const [count, setCount] = useState(total);
  const [pages, setPages] = useState(Math.max(1, Math.ceil(total / 12)));
  const [loading, setLoading] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const debouncedLow = useDebounce(low, 300);
  const debouncedHigh = useDebounce(high, 300);
  const children = useMemo(
    () => categories.find((item) => item.slug === category)?.children ?? [],
    [categories, category],
  );
  const priced = maxPrice > minPrice;

  const startingCategory = parent?.slug ?? childParent?.slug ?? "";
  const startingSubcategory = childParent ? initialCategory : "";
  const startingHigh = priced ? maxPrice : minPrice;
  const signature = [
    debouncedQuery.trim(),
    category,
    subcategory,
    size,
    sale ? "1" : "",
    sort,
    page,
    priced ? debouncedLow : "",
    priced ? debouncedHigh : "",
  ].join("|");
  const initialSignature = [initialQuery.trim(), startingCategory, startingSubcategory, "", "", "", 1, priced ? minPrice : "", priced ? startingHigh : ""].join("|");

  useEffect(() => {
    if (signature === initialSignature) {
      setProducts(initialProducts);
      setCount(total);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({ page: String(page), limit: "12" });
    if (debouncedQuery.trim()) params.set("q", debouncedQuery.trim());
    if (category) params.set("category", category);
    if (subcategory) params.set("subcategory", subcategory);
    if (size) params.set("size", size);
    if (sale) params.set("sale", "1");
    if (sort) params.set("sort", sort);
    if (priced) {
      params.set("min", String(debouncedLow));
      params.set("max", String(debouncedHigh));
    }
    setLoading(true);
    clientFetch(`/api/catalog/search?${params}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { products?: ProductCardData[]; total?: number; pages?: number };
      })
      .then((data) => {
        if (!data || controller.signal.aborted) return;
        setProducts(data.products ?? []);
        setCount(data.total ?? 0);
        setPages(data.pages ?? 1);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [
    signature,
    initialSignature,
    initialProducts,
    total,
    page,
    debouncedQuery,
    category,
    subcategory,
    size,
    sale,
    sort,
    priced,
    debouncedLow,
    debouncedHigh,
  ]);

  return (
    <div>
      <div className="space-y-10">
        <form className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-4" onSubmit={(event) => event.preventDefault()}>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Search</span>
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Linen, coat, silk"
              className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm outline-none focus:border-sage"
            />
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Category</span>
            <select
              value={category}
              onChange={(event) => {
                setCategory(event.target.value);
                setSubcategory("");
                setPage(1);
              }}
              className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm"
            >
              <option value="">All cloth</option>
              {categories.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted">Subcategory</span>
            <select
              value={subcategory}
              onChange={(event) => {
                setSubcategory(event.target.value);
                setPage(1);
              }}
              className="mt-2 h-11 w-full border border-line bg-background px-3 text-sm"
            >
              <option value="">All</option>
              {children.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <fieldset>
            <legend className="text-[11px] uppercase tracking-[0.18em] text-muted">Size</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setSize("");
                  setPage(1);
                }}
                className={`h-9 border px-3 text-[11px] uppercase tracking-[0.14em] ${size === "" ? "border-sage bg-sage text-alabaster" : "border-line"}`}
              >
                All
              </button>
              {sizes.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    setSize(label);
                    setPage(1);
                  }}
                  className={`h-9 border px-3 text-[11px] uppercase tracking-[0.14em] ${size === label ? "border-sage bg-sage text-alabaster" : "border-line"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
          {priced ? (
            <fieldset>
              <legend className="text-[11px] uppercase tracking-[0.18em] text-muted">Price</legend>
              <div className="mt-3 space-y-2">
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={low}
                  aria-label="Lowest price"
                  onChange={(event) => {
                    setLow(Math.min(Number(event.target.value), high));
                    setPage(1);
                  }}
                  className="w-full accent-sage"
                />
                <input
                  type="range"
                  min={minPrice}
                  max={maxPrice}
                  value={high}
                  aria-label="Highest price"
                  onChange={(event) => {
                    setHigh(Math.max(Number(event.target.value), low));
                    setPage(1);
                  }}
                  className="w-full accent-sage"
                />
                <p className="text-xs text-muted">
                  {currency} {low} – {currency} {high}
                </p>
              </div>
            </fieldset>
          ) : null}
          <label className="flex items-center gap-3 text-sm">
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
        </form>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs uppercase tracking-[0.16em] text-muted">{count} pieces</p>
            <label className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-muted">
              Sort
              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as Sort);
                  setPage(1);
                }}
                className="h-10 border border-line bg-background px-3 text-sm normal-case tracking-normal text-foreground"
              >
                <option value="">Newest</option>
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </label>
          </div>
          {loading ? (
            <SkeletonGrid />
          ) : (
            <ProductGrid
              products={products}
              currency={currency}
              authenticated={authenticated}
              empty={
                debouncedQuery.trim() || category || size || sale
                  ? "Nothing on the rail matches those filters."
                  : "The rail is empty until the archive is connected. Run the seed once MongoDB is available."
              }
            />
          )}
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
      </div>
    </div>
  );
}
