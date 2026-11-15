"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import { telHref } from "@/lib/utils";
import type { StoreSettingsDTO } from "@/types/commerce";

export function SettingsForm({ settings, adminEmail }: { settings: StoreSettingsDTO; adminEmail: string }) {
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supportEmail: formData.get("supportEmail"),
          adminEmail: formData.get("adminEmail"),
          supportPhone: formData.get("supportPhone"),
          whatsappNumber: formData.get("whatsappNumber"),
          currencySymbol: formData.get("currencySymbol"),
          standardShippingRate: formData.get("standardShippingRate"),
          freeShippingThreshold: formData.get("freeShippingThreshold"),
          taxPercentage: formData.get("taxPercentage"),
          announcementBarText: formData.get("announcementBarText"),
          themeMode: formData.get("themeMode"),
        }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The settings could not be saved.");
        return;
      }
      toast.success(data.message ?? "Saved.");
    } catch {
      toast.error("The settings could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={onSubmit} className="max-w-xl space-y-4">
      <p className="text-sm text-muted">
        Clients reach the house at{" "}
        <a className="text-sage underline-offset-4 hover:underline" href={`mailto:${settings.supportEmail}`}>
          {settings.supportEmail}
        </a>{" "}
        and{" "}
        <a className="text-sage underline-offset-4 hover:underline" href={telHref(settings.supportPhone)}>
          {settings.supportPhone}
        </a>
        .
      </p>
      <div className="space-y-2">
        <Label htmlFor="adminEmail">Admin inbox</Label>
        <Input id="adminEmail" name="adminEmail" type="email" defaultValue={adminEmail} required />
        <p className="text-xs leading-5 text-muted">Order confirmations and contact notes are mailed here.</p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="supportEmail">Support email</Label>
        <Input id="supportEmail" name="supportEmail" type="email" defaultValue={settings.supportEmail} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="supportPhone">Support phone</Label>
        <Input id="supportPhone" name="supportPhone" defaultValue={settings.supportPhone} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="currencySymbol">Currency</Label>
          <Input id="currencySymbol" name="currencySymbol" defaultValue={settings.currencySymbol} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="taxPercentage">Tax %</Label>
          <Input id="taxPercentage" name="taxPercentage" type="number" defaultValue={settings.taxPercentage} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="standardShippingRate">Shipping</Label>
          <Input id="standardShippingRate" name="standardShippingRate" type="number" defaultValue={settings.standardShippingRate} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="freeShippingThreshold">Free from</Label>
          <Input id="freeShippingThreshold" name="freeShippingThreshold" type="number" defaultValue={settings.freeShippingThreshold} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="announcementBarText">Announcement</Label>
        <Input id="announcementBarText" name="announcementBarText" defaultValue={settings.announcementBarText} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="themeMode">Theme</Label>
        <select
          id="themeMode"
          name="themeMode"
          defaultValue={settings.themeMode}
          className="h-11 w-full border border-line bg-background px-3 text-sm"
        >
          <option value="warm-linen">Warm linen</option>
          <option value="dark-editorial">Dark editorial</option>
          <option value="sage-minimal">Sage minimal</option>
        </select>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : "Save settings"}
      </Button>
    </form>
  );
}
