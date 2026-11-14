"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { clientFetch } from "@/lib/client-fetch";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The list could not be updated.");
        return;
      }
      setEmail("");
      toast.success(data.message ?? "You are on the list.");
    } catch {
      toast.error("The list could not be updated.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 max-w-sm">
      <label htmlFor="newsletter-email" className="text-[11px] uppercase tracking-[0.18em] text-muted">
        The letter
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="newsletter-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email address"
          autoComplete="email"
          className="h-11 min-w-0 flex-1 border border-line bg-background px-3 text-sm outline-none focus:border-sage"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 bg-sage px-4 text-[11px] uppercase tracking-[0.14em] text-alabaster transition hover:bg-sage-hover disabled:opacity-50"
        >
          {pending ? "Sending" : "Join"}
        </button>
      </div>
    </form>
  );
}
