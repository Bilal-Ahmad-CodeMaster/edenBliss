"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { PageNav } from "@/components/page-nav";
import { toast } from "sonner";
import { EditorialImage } from "@/components/editorial-image";
import { LogoutButton } from "@/components/logout-button";
import { OrderHistory } from "@/components/order-history";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import { compressProfileImage } from "@/lib/compress-image";
import { telHref } from "@/lib/utils";
import { useSessionStore } from "@/store/session-store";
import type { CustomerOrder, CustomerProfile } from "@/types/commerce";

export function ProfileDesk({
  profile,
  orders,
  currency,
  initialTab,
  orderPage,
  orderPages,
  orderTotal,
}: {
  profile: CustomerProfile;
  orders: CustomerOrder[];
  currency: string;
  initialTab: "details" | "orders";
  orderPage: number;
  orderPages: number;
  orderTotal: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);
  const [form, setForm] = useState(profile);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function syncSession(next: CustomerProfile) {
    const current = useSessionStore.getState().user;
    if (!current) return;
    useSessionStore.getState().setUser({
      ...current,
      name: next.name,
      phone: next.phone,
      avatarUrl: next.avatarUrl,
    });
  }

  async function saveProfile() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await clientFetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          street: form.shippingAddress.street,
          city: form.shippingAddress.city,
          state: form.shippingAddress.state,
          postalCode: form.shippingAddress.postalCode,
          country: form.shippingAddress.country,
        }),
      });
      const data = (await response.json()) as { message?: string; profile?: CustomerProfile };
      if (!response.ok || !data.profile) {
        const message = data.message ?? "The profile could not be saved.";
        setError(message);
        toast.error(message);
        return;
      }
      setForm(data.profile);
      syncSession(data.profile);
      toast.success(data.message ?? "Your profile is saved.");
    } catch {
      setError("The profile could not be saved.");
      toast.error("The profile could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function uploadPortrait(file: File | undefined) {
    if (!file || pending) return;
    setPending(true);
    setError("");
    try {
      const compressed = await compressProfileImage(file);
      const body = new FormData();
      body.set("file", compressed);
      const response = await clientFetch("/api/account/avatar", { method: "POST", body });
      const data = (await response.json()) as { message?: string; profile?: CustomerProfile };
      if (!response.ok || !data.profile) {
        const message = data.message ?? "The portrait could not be saved.";
        setError(message);
        toast.error(message);
        return;
      }
      setForm(data.profile);
      syncSession(data.profile);
      toast.success(data.message ?? "Portrait updated.");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The portrait could not be saved.";
      setError(message);
      toast.error(message);
    } finally {
      setPending(false);
    }
  }

  async function removePortrait() {
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await clientFetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          street: form.shippingAddress.street,
          city: form.shippingAddress.city,
          state: form.shippingAddress.state,
          postalCode: form.shippingAddress.postalCode,
          country: form.shippingAddress.country,
          removeAvatar: true,
        }),
      });
      const data = (await response.json()) as { message?: string; profile?: CustomerProfile };
      if (!response.ok || !data.profile) {
        const message = data.message ?? "The portrait could not be removed.";
        setError(message);
        toast.error(message);
        return;
      }
      setForm(data.profile);
      syncSession(data.profile);
      toast.success("Portrait removed.");
    } catch {
      setError("The portrait could not be removed.");
      toast.error("The portrait could not be removed.");
    } finally {
      setPending(false);
    }
  }

  function setAddress(key: keyof CustomerProfile["shippingAddress"], value: string) {
    setForm((current) => ({ ...current, shippingAddress: { ...current.shippingAddress, [key]: value } }));
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2 border-b border-line">
        <button
          type="button"
          className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${tab === "details" ? "border-b-2 border-sage text-foreground" : "text-muted"}`}
          onClick={() => setTab("details")}
        >
          Details
        </button>
        <button
          type="button"
          className={`px-4 py-3 text-[11px] uppercase tracking-[0.16em] ${tab === "orders" ? "border-b-2 border-sage text-foreground" : "text-muted"}`}
          onClick={() => setTab("orders")}
        >
          My orders
        </button>
        <Link href="/wishlist" className="px-4 py-3 text-[11px] uppercase tracking-[0.16em] text-muted hover:text-sage">
          Favorites
        </Link>
      </div>

      {error ? <Alert className="mt-6">{error}</Alert> : null}

      {tab === "details" ? (
        <div className="mt-8 grid gap-10 lg:grid-cols-[12rem_minmax(0,32rem)]">
          <div>
            <div className="relative h-40 w-32 bg-linen">
              <EditorialImage src={form.avatarUrl} alt={form.name} sizes="128px" />
            </div>
            <label className="mt-4 block text-[11px] uppercase tracking-[0.16em] text-muted">
              Portrait
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="mt-2 block w-full max-w-full text-xs text-foreground file:mr-3 file:border file:border-line file:bg-background file:px-3 file:py-2 file:text-[11px] file:uppercase file:tracking-[0.12em]"
                disabled={pending}
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  void uploadPortrait(file);
                }}
              />
            </label>
            {form.avatarUrl ? (
              <button type="button" className="mt-3 text-xs uppercase tracking-[0.14em] text-muted hover:text-terracotta" onClick={() => void removePortrait()} disabled={pending}>
                Remove portrait
              </button>
            ) : null}
          </div>

          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void saveProfile();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full name</Label>
              <Input id="profile-name" value={form.name} autoComplete="name" onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-phone">Phone</Label>
              <Input id="profile-phone" type="tel" value={form.phone} autoComplete="tel" onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
              {form.phone ? (
                <a className="inline-block text-sm hover:text-sage" href={telHref(form.phone)}>
                  Call {form.phone}
                </a>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-street">Street</Label>
              <Input id="profile-street" value={form.shippingAddress.street} autoComplete="street-address" onChange={(event) => setAddress("street", event.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-city">City</Label>
                <Input id="profile-city" value={form.shippingAddress.city} autoComplete="address-level2" onChange={(event) => setAddress("city", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-state">State</Label>
                <Input id="profile-state" value={form.shippingAddress.state} autoComplete="address-level1" onChange={(event) => setAddress("state", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-postal">Postal code</Label>
                <Input id="profile-postal" value={form.shippingAddress.postalCode} autoComplete="postal-code" onChange={(event) => setAddress("postalCode", event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-country">Country</Label>
                <Input id="profile-country" value={form.shippingAddress.country} autoComplete="country-name" onChange={(event) => setAddress("country", event.target.value)} />
              </div>
            </div>
            <p className="text-sm text-muted">
              Email stays with the account:{" "}
              <a className="hover:text-sage" href={`mailto:${form.email}`}>
                {form.email}
              </a>
            </p>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving" : "Save profile"}
            </Button>
          </form>
        </div>
      ) : (
        <div className="mt-8">
          <OrderHistory orders={orders} currency={currency} />
          <PageNav
            page={orderPage}
            pages={orderPages}
            total={orderTotal}
            onPage={(next) => router.push(`/profile?tab=orders&page=${next}`)}
          />
        </div>
      )}

      <div className="mt-12">
        <LogoutButton />
      </div>
    </div>
  );
}
