import Link from "next/link";
import { EditorialImage } from "@/components/editorial-image";
import type { NavCategory } from "@/types/commerce";

export function CategoryShowcase({ categories }: { categories: NavCategory[] }) {
  if (!categories.length) return null;

  return (
    <section className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">The rooms</p>
      <h2 className="mt-3 font-serif text-4xl sm:text-5xl">Collections, cut apart.</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-12">
        {categories.map((category, index) => (
          <Link
            key={category.slug}
            href={`/shop/${category.slug}`}
            className={`group relative min-h-72 overflow-hidden bg-linen ${
              index === 0 ? "md:col-span-7 md:row-span-2 md:min-h-[40rem]" : "md:col-span-5"
            }`}
          >
            {category.imageUrl ? (
              <EditorialImage
                src={category.imageUrl}
                alt={category.name}
                sizes={index === 0 ? "(max-width: 768px) 100vw, 58vw" : "(max-width: 768px) 100vw, 40vw"}
                className="transition duration-700 group-hover:scale-105"
              />
            ) : null}
            {category.imageUrl ? <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" /> : null}
            <div className={`absolute inset-x-0 bottom-0 p-6 ${category.imageUrl ? "text-alabaster" : "text-foreground"}`}>
              <p className="text-[11px] uppercase tracking-[0.18em]">Collection</p>
              <h3 className="mt-2 font-serif text-4xl">{category.name}</h3>
              {category.children.length ? (
                <p className={`mt-2 text-sm ${category.imageUrl ? "text-alabaster/80" : "text-muted"}`}>
                  {category.children.map((child) => child.name).join(" · ")}
                </p>
              ) : null}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
