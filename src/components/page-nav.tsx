"use client";

export const PAGE_SIZE = 10;

export function pageNumbers(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  const items: Array<number | "gap"> = [1];
  if (start > 2) items.push("gap");
  for (let number = start; number <= end; number += 1) items.push(number);
  if (end < pages - 1) items.push("gap");
  items.push(pages);
  return items;
}

const control =
  "inline-flex h-10 min-w-10 items-center justify-center border px-3 text-[11px] uppercase tracking-[0.16em] transition duration-300 disabled:cursor-not-allowed disabled:opacity-40";

export function PageNav({
  page,
  pages,
  total,
  pageSize = PAGE_SIZE,
  onPage,
}: {
  page: number;
  pages: number;
  total?: number;
  pageSize?: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const from = total ? (page - 1) * pageSize + 1 : 0;
  const to = total ? Math.min(page * pageSize, total) : 0;

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-col items-center gap-4">
      {total ? (
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
          {from}–{to} of {total}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button type="button" className={`${control} border-line hover:border-sage hover:text-sage`} disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </button>
        {pageNumbers(page, pages).map((item, index) =>
          item === "gap" ? (
            <span key={`gap-${index}`} className="px-1 text-sm text-muted" aria-hidden>
              …
            </span>
          ) : (
            <button
              key={item}
              type="button"
              aria-current={item === page ? "page" : undefined}
              className={`${control} ${item === page ? "border-sage bg-sage text-alabaster" : "border-line hover:border-sage hover:text-sage"}`}
              onClick={() => onPage(item)}
            >
              {item}
            </button>
          ),
        )}
        <button type="button" className={`${control} border-line hover:border-sage hover:text-sage`} disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Next
        </button>
      </div>
    </nav>
  );
}

export function LoadMore({
  shown,
  total,
  loading,
  onLoad,
}: {
  shown: number;
  total: number;
  loading: boolean;
  onLoad: () => void;
}) {
  if (total <= shown) return null;
  return (
    <div className="mt-12 flex flex-col items-center gap-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">
        Showing {shown} of {total}
      </p>
      <button
        type="button"
        onClick={onLoad}
        disabled={loading}
        className="h-11 min-w-48 border border-sage px-8 text-[11px] uppercase tracking-[0.18em] text-sage transition duration-300 hover:bg-sage hover:text-alabaster disabled:opacity-50"
      >
        {loading ? "Loading" : "Load more"}
      </button>
    </div>
  );
}
