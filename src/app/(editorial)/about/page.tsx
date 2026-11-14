import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "The House",
  description: "Eden Bliss is a small clothing house for linen, wool, and silk, finished slowly and sent with cash on delivery.",
  openGraph: {
    title: "The House · Eden Bliss",
    description: "Eden Bliss is a small clothing house for linen, wool, and silk, finished slowly and sent with cash on delivery.",
  },
};

export const revalidate = 60;

export default function AboutPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The house</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">A quieter kind of luxury.</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted sm:text-base">
        <p>
          Eden Bliss begins with cloth, not with a season&apos;s slogan. Linen is washed until it feels like something already lived in. Wool is chosen for a shoulder that stays quiet. Silk is sandwashed so it does not announce itself across a room.
        </p>
        <p>
          Sizes are published in metres, centimetres, and inches because a letter on a label is not a measurement. When a waist needs easing or a hem needs a note, that request travels with a cash-on-delivery order.
        </p>
        <p>
          The house ships when the piece is ready. Payment is collected when it arrives. There is no other method, and there is no hurry dressed up as urgency.
        </p>
      </div>
      <Button asChild className="mt-10">
        <Link href="/shop">Enter the shop</Link>
      </Button>
    </article>
  );
}
