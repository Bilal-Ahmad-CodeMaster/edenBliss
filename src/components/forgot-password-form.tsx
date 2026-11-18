"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function sendCode(event?: FormEvent) {
    event?.preventDefault();
    if (pending) return;
    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await clientFetch("/api/auth/forgot-password", {
        method: "POST",
        timeoutMs: 20000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        const message = data.message ?? "The code could not be sent.";
        setError(message);
        toast.error(message);
        return;
      }
      setEmail(trimmed);
      setStep("code");
      toast.success(data.message ?? "A 6-digit code is on its way.");
    } catch {
      setError("The code could not be sent.");
      toast.error("The code could not be sent.");
    } finally {
      setPending(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    if (!/^\d{6}$/.test(code.trim())) {
      setError("Enter the 6-digit code from the email.");
      return;
    }
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }
    setPending(true);
    setError("");
    try {
      const response = await clientFetch("/api/auth/reset-password", {
        method: "POST",
        timeoutMs: 20000,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.trim(), password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        const message = data.message ?? "The password could not be updated.";
        setError(message);
        toast.error(message);
        return;
      }
      toast.success(data.message ?? "Your password has been updated.");
      router.push("/login");
      router.refresh();
    } catch {
      setError("The password could not be updated.");
      toast.error("The password could not be updated.");
    } finally {
      setPending(false);
    }
  }

  if (step === "email") {
    return (
      <form className="space-y-5" onSubmit={sendCode} noValidate>
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </div>
        {error ? <p className="text-sm text-terracotta">{error}</p> : null}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Sending the code" : "Email me a code"}
        </Button>
        <p className="text-sm text-muted">
          Remembered it?{" "}
          <Link href="/login" className="text-foreground underline-offset-4 hover:text-sage hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    );
  }

  return (
    <form className="space-y-5" onSubmit={resetPassword} noValidate>
      <p className="text-sm leading-6 text-muted">Enter the 6-digit code sent to {email}. It expires in 10 minutes.</p>
      <div className="space-y-2">
        <Label htmlFor="reset-code">Code</Label>
        <Input
          id="reset-code"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-password">New password</Label>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="reset-confirm">Confirm password</Label>
        <PasswordInput
          id="reset-confirm"
          autoComplete="new-password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          required
        />
      </div>
      {error ? <p className="text-sm text-terracotta">{error}</p> : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Updating" : "Update password"}
      </Button>
      <div className="flex items-center justify-between text-sm text-muted">
        <button type="button" className="underline-offset-4 hover:text-sage hover:underline" disabled={pending} onClick={() => void sendCode()}>
          Send a new code
        </button>
        <Link href="/login" className="underline-offset-4 hover:text-sage hover:underline">
          Sign in
        </Link>
      </div>
    </form>
  );
}
