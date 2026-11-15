"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Button } from "@/components/ui/button";

function MagneticLink({
  href,
  children,
  variant = "default",
  className,
}: {
  href: string;
  children: string;
  variant?: "default" | "outline";
  className?: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useRef(0);
  const y = useRef(0);

  return (
    <motion.div
      ref={ref}
      onMouseMove={(event) => {
        if (reduce || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const nextX = (event.clientX - (rect.left + rect.width / 2)) * 0.28;
        const nextY = (event.clientY - (rect.top + rect.height / 2)) * 0.28;
        x.current = nextX;
        y.current = nextY;
        ref.current.style.transform = `translate3d(${nextX}px, ${nextY}px, 0)`;
      }}
      onMouseLeave={() => {
        if (!ref.current) return;
        ref.current.style.transform = "translate3d(0, 0, 0)";
      }}
      className="transition-transform duration-300"
    >
      <Button asChild variant={variant} className={className}>
        <Link href={href}>{children}</Link>
      </Button>
    </motion.div>
  );
}

export function Hero() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "14%"]);
  const fade = useTransform(scrollYProgress, [0, 1], [1, 0.55]);

  return (
    <section ref={ref} className="relative flex min-h-[calc(100svh-7.25rem)] items-end overflow-hidden bg-ink">
      <motion.div className="absolute inset-0" style={reduce ? undefined : { y, opacity: fade }}>
        <Image
          src="/hero-clothes.jpg"
          alt="An ivory linen dress, a sage coat, and an espresso jacket hanging in the atelier"
          fill
          priority
          sizes="100vw"
          className="scale-110 object-cover object-center"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-r from-ink/75 via-ink/40 to-ink/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-ink/15" />
      <motion.div
        className="relative z-10 mx-auto w-full max-w-page px-4 pb-12 pt-24 sm:px-6 sm:pb-16 lg:px-10"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-alabaster/80">Seasonal collections</p>
        <h1 className="mt-4 max-w-4xl font-serif text-5xl leading-[0.9] text-alabaster sm:text-7xl lg:text-8xl">
          Elegance in every thread.
        </h1>
        <p className="mt-4 font-serif text-2xl text-alabaster sm:text-3xl">Welcome to Eden Bliss! ✨</p>
        <p className="mt-5 max-w-md text-sm leading-7 text-alabaster/85 sm:text-base">
          A little world of elegance, comfort and beautiful fashion. Discover stylish outfits, graceful designs and seasonal collections with us.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MagneticLink href="/shop">Explore Collection</MagneticLink>
          <MagneticLink href="/lookbook" variant="outline" className="border-alabaster/80 text-alabaster hover:border-alabaster hover:text-alabaster">
            Lookbook
          </MagneticLink>
          <MagneticLink
            href="/about"
            variant="outline"
            className="border-alabaster/80 text-alabaster hover:border-alabaster hover:text-alabaster"
          >
            The Brand Story
          </MagneticLink>
        </div>
      </motion.div>
    </section>
  );
}
