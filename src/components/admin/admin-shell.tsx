"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const links = [
  ["Overview", "/admin"],
  ["Categories", "/admin/categories"],
  ["Sizes", "/admin/sizes"],
  ["Pieces", "/admin/products"],
  ["Lookbook", "/admin/lookbook"],
  ["Orders", "/admin/orders"],
  ["Clients", "/admin/users"],
  ["Profile", "/admin/profile"],
  ["Settings", "/admin/settings"],
  ["Audit", "/admin/audit"],
] as const;

function isCurrent(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <ul className="space-y-1">
      {links.map(([label, href]) => {
        const current = isCurrent(pathname, href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={onNavigate}
              aria-current={current ? "page" : undefined}
              className={cn(
                "block px-3 py-2 text-[11px] uppercase tracking-[0.16em] transition",
                current ? "bg-sage text-alabaster" : "hover:text-sage",
              )}
            >
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function AdminShell({ name, children }: { name: string; children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10">
      <aside className="hidden lg:block">
        <p className="px-3 text-[11px] uppercase tracking-[0.2em] text-muted">Atelier desk</p>
        <nav className="mt-4" aria-label="Atelier">
          <NavLinks pathname={pathname} />
        </nav>
        <p className="mt-8 px-3 text-xs text-muted">{name}</p>
      </aside>

      <div className="min-w-0">
        <div className="mb-6 flex items-center justify-between lg:hidden">
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Atelier desk</p>
          <button
            type="button"
            className="inline-flex h-10 items-center gap-2 border border-line px-3 text-[11px] uppercase tracking-[0.14em]"
            aria-expanded={open}
            onClick={() => setOpen(true)}
          >
            <Menu className="h-4 w-4" />
            Menu
          </button>
        </div>
        {children}
      </div>

      <div className={cn("fixed inset-0 z-50 lg:hidden", open ? "" : "pointer-events-none")} aria-hidden={!open}>
        <button
          type="button"
          aria-label="Close menu"
          className={cn("absolute inset-0 bg-ink/40 transition", open ? "opacity-100" : "opacity-0")}
          onClick={() => setOpen(false)}
        />
        <nav
          aria-label="Atelier"
          className={cn(
            "absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-background p-6 transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Atelier desk</p>
            <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <NavLinks pathname={pathname} onNavigate={() => setOpen(false)} />
          <p className="mt-auto pt-8 text-xs text-muted">{name}</p>
        </nav>
      </div>
    </div>
  );
}
