"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFetch } from "@/lib/client-fetch";

const QUERY_TYPES = ["Fit", "Order", "Cloth", "Delivery", "Other"] as const;

export function ContactForm() {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          queryType: formData.get("queryType"),
          description: formData.get("description"),
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The note could not be sent.");
        return;
      }
      toast.success(data.message ?? "Your note is with the atelier.");
      const form = document.getElementById("contact-desk") as HTMLFormElement | null;
      form?.reset();
    } catch {
      toast.error("The note could not be sent.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form id="contact-desk" action={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="contact-name">Name</Label>
        <Input id="contact-name" name="name" autoComplete="name" required minLength={2} maxLength={80} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email">Email</Label>
        <Input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={120} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-query">Query type</Label>
        <select
          id="contact-query"
          name="queryType"
          defaultValue="Fit"
          className="h-11 w-full border border-line bg-background px-3 text-sm outline-none focus:border-sage"
        >
          {QUERY_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-description">Description</Label>
        <Textarea id="contact-description" name="description" required minLength={10} maxLength={2000} rows={6} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Sending" : "Submit"}
      </Button>
    </form>
  );
}
