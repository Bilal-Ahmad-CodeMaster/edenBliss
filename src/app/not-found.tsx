"use client";

import Link from "next/link";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const pathname = usePathname();
  const router = useRouter();
  const keep = pathname.startsWith("/admin") || pathname.startsWith("/__missing");

  useEffect(() => {
    if (!keep) router.replace("/");
  }, [keep, router]);

  if (!keep) return null;

  return (
    <section className="mx-auto flex min-h-[70vh] max-w-page flex-col justify-center px-4 py-20 sm:px-6 lg:px-10">
      <Link href="/" className="font-serif text-3xl tracking-tight">
        Eden Bliss
      </Link>
      <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-muted">404</p>
      <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[0.9] sm:text-8xl">This page has left the atelier.</h1>
      <p className="mt-6 max-w-md text-sm leading-7 text-muted">
        The cloth you followed is not on this rail. The shop is open, and the sizes are still measured.
      </p>
      <Button asChild className="mt-8 w-fit">
        <Link href="/">Return home</Link>
      </Button>
    </section>
  );
}
