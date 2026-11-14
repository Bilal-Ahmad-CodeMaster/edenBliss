"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Heart, Menu, UserRound } from "lucide-react";
import { useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { SearchOverlay } from "@/components/search-overlay";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useSessionStore } from "@/store/session-store";
import { useWishlistCount } from "@/store/wishlist-store";
import { telHref } from "@/lib/utils";
import type { NavCategory, PublicUser, StoreSettingsDTO } from "@/types/commerce";

export function SiteHeader({
  categories,
  user,
  currency,
  email,
  phone,
  settings,
}: {
  categories: NavCategory[];
  user: PublicUser | null;
  currency: string;
  email: string;
  phone: string;
  settings: Pick<StoreSettingsDTO, "standardShippingRate" | "freeShippingThreshold" | "taxPercentage">;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [hoverSlug, setHoverSlug] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(categories[0]?.slug ?? null);
  const reduce = useReducedMotion();
  const wishlistCount = useWishlistCount();
  const ready = useSessionStore((state) => state.ready);
  const storeUser = useSessionStore((state) => state.user);
  const activeUser = ready ? storeUser : user;
  const accountHref = activeUser ? "/profile" : "/login";
  const isAdmin = activeUser?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 sm:h-20 sm:px-6 lg:px-10">
        <Link href="/" className="font-serif text-[1.7rem] leading-none tracking-tight text-foreground sm:text-3xl">
          Eden Bliss
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
          <Link href="/shop" className="nav-link text-[11px] uppercase tracking-[0.2em]">
            Shop
          </Link>
          {categories.map((category) => (
            <div
              key={category.slug}
              className="relative"
              onMouseEnter={() => setHoverSlug(category.slug)}
              onMouseLeave={() => setHoverSlug((current) => (current === category.slug ? null : current))}
            >
              <Link href={`/shop/${category.slug}`} className="nav-link text-[11px] uppercase tracking-[0.2em]">
                {category.name}
              </Link>
              <AnimatePresence>
                {hoverSlug === category.slug && category.children.length > 0 ? (
                  <motion.div
                    initial={reduce ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduce ? undefined : { opacity: 0, y: 6 }}
                    transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute left-0 top-full z-50 min-w-56 pt-3"
                  >
                    <div className="border border-line bg-background p-4 shadow-editorial">
                      <Link href={`/shop/${category.slug}`} className="block py-2 text-[11px] uppercase tracking-[0.16em] hover:text-sage">
                        All {category.name}
                      </Link>
                      {category.children.map((child) => (
                        <Link
                          key={child.slug}
                          href={`/shop/${child.slug}`}
                          className="block py-2 text-sm text-muted transition hover:text-sage"
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          ))}
          <Link href="/about" className="nav-link text-[11px] uppercase tracking-[0.2em]">
            The House
          </Link>
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchOverlay currency={currency} />
          <Link
            href="/wishlist"
            className="relative flex h-10 w-10 items-center justify-center transition hover:text-sage"
            aria-label={`Wishlist, ${wishlistCount} saved`}
          >
            <Heart className="h-4 w-4" />
            {wishlistCount > 0 ? (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-sage px-1 text-[9px] text-alabaster">
                {wishlistCount}
              </span>
            ) : null}
          </Link>
          <CartDrawer currency={currency} authenticated={Boolean(activeUser)} settings={settings} />
          <div className="relative hidden sm:block" onMouseLeave={() => setAccountOpen(false)}>
            <button
              type="button"
              className="flex h-10 w-10 items-center justify-center transition hover:text-sage"
              aria-label={activeUser ? "Account" : "Sign in"}
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen((current) => !current)}
              onMouseEnter={() => setAccountOpen(true)}
            >
              <UserRound className="h-4 w-4" />
            </button>
            {accountOpen ? (
              <div className="absolute right-0 top-full z-50 w-48 border border-line bg-background p-3 shadow-editorial">
                {activeUser ? (
                  <>
                    <p className="truncate px-2 py-1 font-serif text-xl">{activeUser.name}</p>
                    <Link href="/profile" className="block px-2 py-2 text-[11px] uppercase tracking-[0.14em] hover:text-sage" onClick={() => setAccountOpen(false)}>
                      Profile
                    </Link>
                    <Link href="/wishlist" className="block px-2 py-2 text-[11px] uppercase tracking-[0.14em] hover:text-sage" onClick={() => setAccountOpen(false)}>
                      Wishlist
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block px-2 py-2 text-[11px] uppercase tracking-[0.14em] hover:text-sage" onClick={() => setAccountOpen(false)}>
                      Sign in
                    </Link>
                    <Link href="/signup" className="block px-2 py-2 text-[11px] uppercase tracking-[0.14em] hover:text-sage" onClick={() => setAccountOpen(false)}>
                      Create account
                    </Link>
                  </>
                )}
              </div>
            ) : null}
          </div>

          {isAdmin ? (
            <Link
              href="/admin"
              className="inline-flex h-9 items-center border border-sage px-3 text-[11px] uppercase tracking-[0.16em] text-sage transition hover:bg-sage hover:text-alabaster"
            >
              Admin
            </Link>
          ) : null}

          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger className="flex h-10 w-10 items-center justify-center lg:hidden" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </SheetTrigger>
            <SheetContent>
              <div className="flex h-full flex-col overflow-y-auto px-6 pb-10 pt-16" data-lenis-prevent>
                <SheetTitle>Eden Bliss</SheetTitle>
                <SheetDescription className="mt-2">The house, the shop, and your fitting room.</SheetDescription>
                <nav className="mt-10 flex flex-col gap-2" aria-label="Mobile">
                  <Link href="/shop" onClick={() => setMenuOpen(false)} className="py-2 font-serif text-3xl">
                    Shop
                  </Link>
                  {categories.map((category) => {
                    const isOpen = expanded === category.slug;
                    return (
                      <div key={category.slug} className="border-t border-line py-2">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between py-2 text-left font-serif text-3xl"
                          aria-expanded={isOpen}
                          onClick={() => setExpanded((current) => (current === category.slug ? null : category.slug))}
                        >
                          {category.name}
                          <span className="font-sans text-xs tracking-[0.2em] text-muted">{isOpen ? "Close" : "Open"}</span>
                        </button>
                        <AnimatePresence initial={false}>
                          {isOpen ? (
                            <motion.div
                              initial={reduce ? false : { height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={reduce ? undefined : { height: 0, opacity: 0 }}
                              transition={{ duration: reduce ? 0 : 0.25 }}
                              className="overflow-hidden"
                            >
                              <div className="flex flex-col pb-3 pl-1">
                                <Link href={`/shop/${category.slug}`} onClick={() => setMenuOpen(false)} className="py-2 text-sm uppercase tracking-[0.14em] hover:text-sage">
                                  All {category.name}
                                </Link>
                                {category.children.map((child) => (
                                  <Link key={child.slug} href={`/shop/${child.slug}`} onClick={() => setMenuOpen(false)} className="py-2 text-sm text-muted hover:text-sage">
                                    {child.name}
                                  </Link>
                                ))}
                              </div>
                            </motion.div>
                          ) : null}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                  <Link href="/about" onClick={() => setMenuOpen(false)} className="border-t border-line py-4 font-serif text-3xl">
                    The House
                  </Link>
                  <Link href="/contact" onClick={() => setMenuOpen(false)} className="py-2 text-sm uppercase tracking-[0.16em]">
                    Contact
                  </Link>
                  <Link href="/faq" onClick={() => setMenuOpen(false)} className="py-2 text-sm uppercase tracking-[0.16em]">
                    Questions
                  </Link>
                  <Link href={accountHref} onClick={() => setMenuOpen(false)} className="py-2 text-sm uppercase tracking-[0.16em]">
                    {activeUser ? activeUser.name : "Sign in"}
                  </Link>
                  {isAdmin ? (
                    <Link href="/admin" onClick={() => setMenuOpen(false)} className="py-2 text-sm uppercase tracking-[0.16em] text-sage">
                      Admin
                    </Link>
                  ) : null}
                </nav>
                <div className="mt-8 space-y-2 border-t border-line pt-6 text-sm">
                  <a className="block hover:text-sage" href={`mailto:${email}`}>
                    {email}
                  </a>
                  <a className="block hover:text-sage" href={telHref(phone)}>
                    {phone}
                  </a>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
