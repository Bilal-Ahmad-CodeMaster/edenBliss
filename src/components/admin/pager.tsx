"use client";

import { PageNav } from "@/components/page-nav";

export function Pager({
  page,
  pages,
  total,
  onPage,
}: {
  page: number;
  pages: number;
  total?: number;
  onPage: (page: number) => void;
}) {
  return <PageNav page={page} pages={pages} total={total} onPage={onPage} />;
}

export function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}
