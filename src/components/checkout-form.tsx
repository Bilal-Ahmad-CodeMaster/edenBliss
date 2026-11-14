"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { BagSummary } from "@/components/bag-summary";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFetch } from "@/lib/client-fetch";
import { checkoutFormSchema, type CheckoutFormValues } from "@/lib/validators";
import { useCartStore } from "@/store/cart-store";
import { useSessionStore } from "@/store/session-store";
import type { CustomerProfile, StoreSettingsDTO } from "@/types/commerce";

export function CheckoutForm({
  authenticated,
  currency,
  settings,
  profile,
}: {
  authenticated: boolean;
  currency: string;
  settings: StoreSettingsDTO;
  profile: CustomerProfile | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());
  const items = useCartStore((state) => state.items);
  const hydrated = useCartStore((state) => state.hydrated);
  const user = useSessionStore((state) => state.user);
  const signedIn = authenticated || Boolean(user);
  const form = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      fullName: profile?.name ?? "",
      phone: profile?.phone ?? "",
      email: profile?.email ?? "",
      address: profile?.shippingAddress.street ?? "",
      city: profile?.shippingAddress.city ?? "",
      state: profile?.shippingAddress.state ?? "",
      postalCode: profile?.shippingAddress.postalCode ?? "",
      country: profile?.shippingAddress.country ?? "",
      customFitNotes: "",
      saveToProfile: Boolean(profile),
      idempotencyKey: idempotencyKey.current,
    },
  });

  if (!hydrated) return <div className="shimmer h-40" />;

  if (!items.length) {
    return (
      <div className="max-w-lg">
        <p className="text-sm leading-7 text-muted">Your bag is empty. Choose a piece before checkout.</p>
        <Button asChild className="mt-8">
          <Link href="/shop">Continue through the shop</Link>
        </Button>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="max-w-lg">
        <BagSummary items={items} currency={currency} settings={settings} />
        <p className="mt-6 text-sm leading-7 text-muted">Sign in to leave a fit note and place the cash-on-delivery order.</p>
        <Button asChild className="mt-6">
          <Link href="/login?next=/checkout">Sign in to place the order</Link>
        </Button>
      </div>
    );
  }

  async function onSubmit(values: CheckoutFormValues) {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await clientFetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, idempotencyKey: idempotencyKey.current, paymentMethod: "COD" }),
      });
      const data = (await response.json()) as { message?: string; orderNumber?: string };
      if (!response.ok || !data.orderNumber) {
        const message = data.message ?? "The order could not be placed.";
        setError(message);
        toast.error(message);
        return;
      }
      useCartStore.getState().clear();
      if (values.saveToProfile && user) {
        useSessionStore.getState().setUser({ ...user, name: values.fullName, phone: values.phone });
      }
      toast.success(data.message ?? "Your order is confirmed for cash on delivery.");
      router.push(`/order-success/${data.orderNumber}`);
      router.refresh();
    } catch {
      setError("The order could not be placed.");
      toast.error("The order could not be placed.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid min-w-0 gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <form
        className="min-w-0 space-y-4"
        onSubmit={form.handleSubmit(onSubmit, (errors) => {
          const message = Object.values(errors).find((issue) => issue?.message)?.message ?? "Check the delivery details.";
          setError(String(message));
          toast.error(String(message));
        })}
        noValidate
      >
        <input type="hidden" {...form.register("idempotencyKey")} />
        {error ? <Alert>{error}</Alert> : null}
        <div className="border border-sage bg-sage/10 p-4">
          <p className="text-[11px] uppercase tracking-[0.18em] text-sage">Cash on delivery</p>
          <p className="mt-2 text-sm leading-6">Pay in cash at your doorstep upon receiving your Eden Bliss parcel.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" autoComplete="name" {...form.register("fullName")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="checkout-email">Email</Label>
          <Input id="checkout-email" type="email" autoComplete="email" {...form.register("email")} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="address">Street</Label>
          <Input id="address" autoComplete="street-address" {...form.register("address")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" autoComplete="address-level2" {...form.register("city")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input id="state" autoComplete="address-level1" {...form.register("state")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal code</Label>
            <Input id="postalCode" autoComplete="postal-code" {...form.register("postalCode")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" autoComplete="country-name" {...form.register("country")} />
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm leading-6">
          <input type="checkbox" className="mt-1" {...form.register("saveToProfile")} />
          <span>Save these details to my profile for the next parcel.</span>
        </label>
        <div className="space-y-2 border border-line p-4">
          <Label htmlFor="customFitNotes">Custom Fit & Measurement Notes (Optional)</Label>
          <Textarea
            id="customFitNotes"
            rows={4}
            placeholder="My waist is 0.78m (31 inches), please keep the trouser length at 1.02m"
            {...form.register("customFitNotes")}
          />
        </div>
        <Button type="submit" disabled={pending}>
          {pending ? "Placing the order" : "Place cash on delivery order"}
        </Button>
      </form>
      <aside className="h-fit border border-line p-6">
        <h2 className="font-serif text-3xl">To pay</h2>
        <div className="mt-6">
          <BagSummary items={items} currency={currency} settings={settings} />
        </div>
      </aside>
    </div>
  );
}
