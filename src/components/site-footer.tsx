import Link from "next/link";
import { NewsletterForm } from "@/components/newsletter-form";
import { telHref } from "@/lib/utils";
import type { NavCategory, StoreSettingsDTO } from "@/types/commerce";

export function SiteFooter({
  settings,
  categories,
}: {
  settings: StoreSettingsDTO;
  categories: NavCategory[];
}) {
  return (
    <footer className="mt-20 border-t border-line">
      <div className="mx-auto grid max-w-page gap-12 px-4 py-14 sm:px-6 md:grid-cols-4 lg:px-10">
        <div className="md:col-span-2">
          <Link href="/" className="font-serif text-4xl tracking-tight">
            Eden Bliss
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-7 text-muted">
            A small house for linen, wool, and silk. Cloth is cut slowly, finished by hand, and sent with cash on delivery.
          </p>
          <NewsletterForm />
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Visit</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href="/shop" className="nav-link">
                Shop
              </Link>
            </li>
            {categories.flatMap((category) =>
              category.children.map((child) => (
                <li key={child.slug}>
                  <Link href={`/shop/${child.slug}`} className="nav-link">
                    {child.name}
                  </Link>
                </li>
              )),
            )}
            <li>
              <Link href="/about" className="nav-link">
                The House
              </Link>
            </li>
            <li>
              <Link href="/contact" className="nav-link">
                Contact
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Atelier</p>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <a className="nav-link" href={`mailto:${settings.supportEmail}`}>
                {settings.supportEmail}
              </a>
            </li>
            <li>
              <a className="nav-link" href={telHref(settings.supportPhone)}>
                {settings.supportPhone}
              </a>
            </li>
            <li>
              <Link href="/profile" className="nav-link">
                Profile
              </Link>
            </li>
            <li>
              <Link href="/faq" className="nav-link">
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="nav-link">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="nav-link">
                Terms
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-page px-4 py-6 text-xs tracking-[0.14em] text-muted sm:px-6 lg:px-10">
          © {new Date().getFullYear()} Eden Bliss. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
