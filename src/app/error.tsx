"use client";

export default function Error({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-page flex-col justify-center px-4 py-20 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.22em] text-terracotta">Something paused</p>
      <h1 className="mt-4 max-w-xl font-serif text-5xl leading-none sm:text-7xl">The house paused for a moment.</h1>
      <p className="mt-6 max-w-md text-sm leading-7 text-muted">
        The page could not be finished. Try again, or return when the cloth has settled.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 h-11 w-fit bg-sage px-6 text-sm uppercase tracking-[0.14em] text-alabaster transition hover:-translate-y-0.5 hover:bg-sage-hover"
      >
        Try again
      </button>
    </section>
  );
}
