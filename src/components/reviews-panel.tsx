"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { StarRow } from "@/components/star-row";
import { Button } from "@/components/ui/button";
import { VirtualTable } from "@/components/virtual-table";
import { clientFetch } from "@/lib/client-fetch";

type ReviewItem = {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: string;
};

type Breakdown = { 1: number; 2: number; 3: number; 4: number; 5: number };

export function ReviewsPanel({
  productId,
  authenticated,
  initialReviews,
  initialAverage,
  initialCount,
  initialBreakdown,
}: {
  productId: string;
  authenticated: boolean;
  initialReviews: ReviewItem[];
  initialAverage: number;
  initialCount: number;
  initialBreakdown: Breakdown;
}) {
  const [reviews, setReviews] = useState(initialReviews);
  const [average, setAverage] = useState(initialAverage);
  const [count, setCount] = useState(initialCount);
  const [breakdown, setBreakdown] = useState(initialBreakdown);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [pending, setPending] = useState(false);
  const busiest = Math.max(1, ...Object.values(breakdown));

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = (await response.json()) as {
        message?: string;
        review?: ReviewItem | null;
        averageRating?: number;
        reviewCount?: number;
      };
      if (!response.ok) {
        toast.error(data.message ?? "The note could not be saved.");
        return;
      }
      if (data.review) {
        setReviews((current) => [data.review as ReviewItem, ...current]);
        setBreakdown((current) => ({ ...current, [rating]: current[rating as 1 | 2 | 3 | 4 | 5] + 1 }));
      }
      if (typeof data.averageRating === "number") setAverage(data.averageRating);
      if (typeof data.reviewCount === "number") setCount(data.reviewCount);
      setComment("");
      toast.success(data.message ?? "Your note has been kept.");
    } catch {
      toast.error("The note could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <div className="flex items-end gap-4">
        <p className="font-serif text-5xl">{average.toFixed(1)}</p>
        <div>
          <StarRow value={average} />
          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-muted">{count} notes</p>
        </div>
      </div>
      <ul className="mt-6 space-y-2">
        {[5, 4, 3, 2, 1].map((star) => (
          <li key={star} className="grid grid-cols-[2rem_1fr_2rem] items-center gap-3 text-xs text-muted">
            <span>{star}</span>
            <span className="h-1 bg-line">
              <span className="block h-1 bg-sage" style={{ width: `${(breakdown[star as 1 | 2 | 3 | 4 | 5] / busiest) * 100}%` }} />
            </span>
            <span>{breakdown[star as 1 | 2 | 3 | 4 | 5]}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8">
        {reviews.length > 8 ? (
          <VirtualTable
            rows={reviews}
            estimate={96}
            height="24rem"
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
        ) : reviews.length === 0 ? (
          <p className="text-sm leading-7 text-muted">Notes from the fitting room will gather here once the first cloth has been worn home.</p>
        ) : (
          <ul className="divide-y divide-line border-y border-line">
            {reviews.map((review) => (
              <li key={review.id} className="py-4">
                <p className="text-[11px] uppercase tracking-[0.16em] text-muted">
                  {review.author} · {review.rating}/5
                </p>
                <p className="mt-2 text-sm leading-7">{review.comment}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-8">
        {authenticated ? (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Your rating</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-label={`${value} star${value === 1 ? "" : "s"}`}
                  onClick={() => setRating(value)}
                  className={`h-10 w-10 border text-sm ${rating >= value ? "border-sage bg-sage text-alabaster" : "border-line"}`}
                >
                  {value}
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              rows={4}
              required
              minLength={2}
              maxLength={2000}
              placeholder="How the cloth sat, and whether you would wear it again."
              className="w-full border border-line bg-background px-3 py-2 text-sm outline-none focus:border-sage"
            />
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Leave a note"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted">
            <Link href="/login" className="nav-link">
              Sign in
            </Link>{" "}
            to leave a note from the fitting room.
          </p>
        )}
      </div>
    </div>
  );
}
