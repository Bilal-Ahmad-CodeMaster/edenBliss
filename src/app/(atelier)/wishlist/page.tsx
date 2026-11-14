import type { Metadata } from "next";
import Link from "next/link";
import { GuestWishlist } from "@/components/guest-wishlist";
import { WishlistBoard } from "@/components/wishlist-board";
import { readSession } from "@/lib/auth";
import { getStoreSettings, getWishlistPieces } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Pieces saved at Eden Bliss, ready to move into the bag or set aside.",
  openGraph: {
    title: "Wishlist · Eden Bliss",
    description: "Pieces saved at Eden Bliss, ready to move into the bag or set aside.",
  },
};

export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const [session, settings] = await Promise.all([readSession(), getStoreSettings()]);

  return (
    <section className="mx-auto max-w-page min-w-0 px-4 py-12 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Favorites</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">Set aside for later.</h1>
      <p className="mt-5 max-w-xl text-sm leading-7 text-muted">
        Move a saved piece into the bag in its first available size, or take it off the list.
      </p>
      {session.status === "active" ? (
        <Link href="/profile" className="mt-6 inline-block text-[11px] uppercase tracking-[0.16em] hover:text-sage">
          Back to profile
        </Link>
      ) : null}
      <div className="mt-12">
        {session.status === "active" ? (
          <WishlistBoard
            products={await getWishlistPieces(session.user.wishlist)}
            currency={settings.currencySymbol}
            authenticated
          />
        ) : (
          <GuestWishlist currency={settings.currencySymbol} />
        )}
      </div>
    </section>
  );
}
