"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { clientFetch } from "@/lib/client-fetch";

export function ReviewForm({ productId, authenticated }: { productId: string; authenticated: boolean }) {
  const [pending, setPending] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  if (!authenticated) {
    return <p className="text-sm text-muted">Sign in to leave a note from the fitting room.</p>;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, rating, comment }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The note could not be saved.");
        return;
      }
      setComment("");
      toast.success(data.message ?? "Your note has been kept.");
    } catch {
      toast.error("The note could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-[11px] uppercase tracking-[0.16em] text-muted" htmlFor="rating">
        Rating
      </label>
      <select
        id="rating"
        value={rating}
        onChange={(event) => setRating(Number(event.target.value))}
        className="h-11 w-full border border-line bg-background px-3 text-sm"
      >
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </select>
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
  );
}
