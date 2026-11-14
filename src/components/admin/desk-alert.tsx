export function DeskHeading({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <header className="mb-8">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
      <h1 className="mt-3 font-serif text-4xl leading-none sm:text-5xl">{title}</h1>
    </header>
  );
}

export function DeskAlert({ message }: { message?: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="border border-terracotta/40 bg-terracotta/10 px-4 py-3 text-sm text-terracotta">
      {message}
    </p>
  );
}
