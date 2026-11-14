"use client";

import { VirtualTable } from "@/components/virtual-table";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: string;
};

export function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  return (
    <VirtualTable
      rows={reviews}
      estimate={96}
      empty="Notes from the fitting room will gather here once the first cloth has been worn home."
      renderRow={(review) => (
        <article className="h-full px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
            {review.author} · {review.rating}/5
          </p>
          <p className="mt-2 line-clamp-2 text-sm leading-6">{review.comment}</p>
        </article>
      )}
    />
  );
}
