"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { DeskAlert } from "@/components/admin/desk-alert";
import { ImageManager } from "@/components/admin/image-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import { useSessionStore } from "@/store/session-store";

type Profile = {
  name: string;
  email: string;
  avatarUrl: string;
  phone: string;
};

export function ProfileForm({ profile }: { profile: Profile }) {
  const [form, setForm] = useState(profile);
  const [currentPassword, setCurrentPassword] = useState("");
  const [nextPassword, setNextPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (nextPassword && nextPassword.length < 8) {
      setMessage("Use at least 8 characters for the new password.");
      return;
    }
    if (nextPassword && !currentPassword) {
      setMessage("Enter your current password to change it.");
      return;
    }
    setPending(true);
    setMessage("");
    try {
      const response = await clientFetch("/api/admin/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, currentPassword, nextPassword }),
      });
      const data = (await response.json()) as { message?: string; profile?: Profile };
      if (!response.ok || !data.profile) {
        setMessage(data.message ?? "The profile could not be saved.");
        toast.error(data.message ?? "The profile could not be saved.");
        return;
      }
      setForm(data.profile);
      setCurrentPassword("");
      setNextPassword("");
      const current = useSessionStore.getState().user;
      if (current) {
        useSessionStore.getState().setUser({
          ...current,
          name: data.profile.name,
          email: data.profile.email,
          avatarUrl: data.profile.avatarUrl,
          phone: data.profile.phone,
        });
      }
      toast.success(data.message ?? "Saved.");
    } catch {
      setMessage("The profile could not be saved.");
      toast.error("The profile could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-xl space-y-4">
      <DeskAlert message={message} />
      <ImageManager
        label="Portrait"
        max={1}
        images={form.avatarUrl ? [form.avatarUrl] : []}
        onChange={(images) => setForm((current) => ({ ...current, avatarUrl: images[0] ?? "" }))}
      />
      <div className="space-y-2">
        <Label htmlFor="profile-name">Name</Label>
        <Input id="profile-name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="profile-phone">Phone</Label>
        <Input id="profile-phone" value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="current-password">Current password</Label>
          <Input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="new-password">New password</Label>
          <Input id="new-password" type="password" autoComplete="new-password" value={nextPassword} onChange={(event) => setNextPassword(event.target.value)} />
        </div>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : "Save profile"}
      </Button>
    </form>
  );
}
