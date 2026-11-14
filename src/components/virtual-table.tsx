"use client";

import { useRef, type ReactNode } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

export function VirtualTable<T>({
  rows,
  estimate = 72,
  renderRow,
  empty,
  height = "34rem",
}: {
  rows: T[];
  estimate?: number;
  renderRow: (row: T, index: number) => ReactNode;
  empty: string;
  height?: string;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimate,
    overscan: 8,
  });

  if (!rows.length) return <p className="text-sm leading-7 text-muted">{empty}</p>;

  return (
    <div ref={parentRef} className="overflow-auto border border-line" style={{ height }}>
      <div className="relative w-full" style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            className="absolute left-0 top-0 w-full border-b border-line"
            style={{ height: `${item.size}px`, transform: `translateY(${item.start}px)` }}
          >
            {renderRow(rows[item.index], item.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
