"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientFetch } from "@/lib/client-fetch";
import { RESTRICTED_MESSAGE } from "@/lib/constants";
import { loginHref } from "@/lib/login-redirect";
import { safeNextPath } from "@/lib/utils";
import { loginFormSchema, signupFormSchema, type LoginFormValues, type SignupFormValues } from "@/lib/validators";
import { useCartStore } from "@/store/cart-store";
import { useWishlistStore } from "@/store/wishlist-store";
import type { CartItem } from "@/types/commerce";

function guestPayload() {
  return {
    wishlist: useWishlistStore.getState().ids,
    cart: useCartStore.getState().items.map((item) => ({
      productId: item.productId,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
    })),
  };
}

function applySession(data: { cart?: CartItem[]; wishlist?: string[] }) {
  if (data.wishlist) useWishlistStore.getState().setIds(data.wishlist);
  if (data.cart) useCartStore.getState().replace(data.cart);
}

export function SignupForm({ nextPath = "/" }: { nextPath?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupFormSchema),
    defaultValues: { name: "", email: "", password: "", phone: "" },
  });

  async function onSubmit(values: SignupFormValues) {
    setPending(true);
    try {
      const response = await clientFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...guestPayload() }),
      });
      const data = (await response.json()) as {
        message?: string;
        cart?: CartItem[];
        wishlist?: string[];
      };
      if (!response.ok) {
        toast.error(data.message ?? "The account could not be opened.");
        return;
      }
      applySession(data);
      toast.success(data.message ?? "Welcome to Eden Bliss. You are signed in.");
      router.push(safeNextPath(nextPath));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="name" {...form.register("name")} />
        {form.formState.errors.name ? <p className="text-sm text-terracotta">{form.formState.errors.name.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="text-sm text-terracotta">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" type="tel" autoComplete="tel" {...form.register("phone")} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="new-password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-terracotta">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Opening your account" : "Create account"}
      </Button>
      <p className="text-sm text-muted">
        Already with the house?{" "}
        <Link href={nextPath && nextPath !== "/" ? loginHref(nextPath) : "/login"} className="text-foreground underline-offset-4 hover:text-sage hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}

export function LoginForm({ restricted, nextPath = "/" }: { restricted: boolean; nextPath?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setPending(true);
    try {
      const response = await clientFetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, ...guestPayload() }),
      });
      const data = (await response.json()) as {
        message?: string;
        cart?: CartItem[];
        wishlist?: string[];
      };
      if (response.status === 403) {
        toast.error(data.message ?? RESTRICTED_MESSAGE);
        return;
      }
      if (!response.ok) {
        toast.error(data.message ?? "Those details do not match our atelier records.");
        return;
      }
      applySession(data);
      toast.success(data.message ?? "Welcome back to Eden Bliss.");
      router.push(safeNextPath(nextPath));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit(onSubmit)} noValidate>
      {restricted ? (
        <p role="alert" className="border border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
          {RESTRICTED_MESSAGE}
        </p>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...form.register("email")} />
        {form.formState.errors.email ? <p className="text-sm text-terracotta">{form.formState.errors.email.message}</p> : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-terracotta">{form.formState.errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in" : "Sign in"}
      </Button>
      <p className="text-sm text-muted">
        New to the house?{" "}
        <Link
          href={nextPath && nextPath !== "/" ? `/signup?next=${encodeURIComponent(nextPath)}` : "/signup"}
          className="text-foreground underline-offset-4 hover:text-sage hover:underline"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
