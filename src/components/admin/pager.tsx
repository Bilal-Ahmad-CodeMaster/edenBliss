"use client";

export function Pager({
  page,
  pages,
  onPage,
}: {
  page: number;
  pages: number;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) return null;
  return (
    <div className="mt-4 flex items-center gap-4 text-[11px] uppercase tracking-[0.14em]">
      <button type="button" className="disabled:opacity-40" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="text-muted">
        {page} / {pages}
      </span>
      <button type="button" className="disabled:opacity-40" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </div>
  );
}

export function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
