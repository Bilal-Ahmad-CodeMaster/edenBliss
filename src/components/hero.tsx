"use client";

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
    <section ref={ref} className="relative flex min-h-[calc(100svh-7.25rem)] items-end overflow-hidden bg-linen">
      <motion.div
        className="absolute inset-0"
        style={reduce ? undefined : { y, opacity: fade }}
      >
        <div
          className="h-full w-full scale-110 bg-cover bg-center"
          style={{ backgroundImage: "url(/hero-linen.svg)" }}
          role="img"
          aria-label="A linen column in warm ivory, photographed in late light"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/15 to-transparent" />
      <motion.div
        className="relative z-10 mx-auto w-full max-w-page px-4 pb-12 pt-24 sm:px-6 sm:pb-16 lg:px-10"
        initial={reduce ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className="text-[11px] uppercase tracking-[0.22em] text-alabaster/80">Spring cloth, cut in small lots</p>
        <h1 className="mt-4 max-w-3xl font-serif text-6xl leading-[0.88] text-alabaster sm:text-8xl">Cloth, cut slowly.</h1>
        <p className="mt-6 max-w-md text-sm leading-7 text-alabaster/85 sm:text-base">
          Linen that still smells of flax, wool with a quiet shoulder, and silk that does not shine. Measured in metres, sent cash on delivery.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <MagneticLink href="/shop">Explore Collection</MagneticLink>
          <MagneticLink href="/about" variant="outline" className="border-alabaster/80 text-alabaster hover:border-alabaster hover:text-alabaster">
            The Brand Story
          </MagneticLink>
        </div>
      </motion.div>
    </section>
  );
}
