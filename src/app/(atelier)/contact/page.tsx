import type { Metadata } from "next";
import { ContactForm } from "@/components/contact-form";
import { getStoreSettings } from "@/lib/catalog";
import { telHref } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact",
  description: "Write or call the Eden Bliss atelier for cloth, fit, and cash-on-delivery questions.",
  openGraph: {
    title: "Contact · Eden Bliss",
    description: "Write or call the Eden Bliss atelier for cloth, fit, and cash-on-delivery questions.",
  },
};

export const revalidate = 60;

export default async function ContactPage() {
  const settings = await getStoreSettings();

  return (
    <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Contact</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">The atelier desk.</h1>
      <p className="mt-6 text-sm leading-7 text-muted">
        For fit notes, cloth questions, and the progress of a cash-on-delivery order, write or call. The desk answers in the order the messages arrive.
      </p>
      <div className="mt-10 max-w-xl">
        <ContactForm />
      </div>
      <dl className="mt-12 space-y-6">
        <div>
          <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">Email</dt>
          <dd className="mt-2 font-serif text-3xl">
            <a className="hover:text-sage" href={`mailto:${settings.supportEmail}`}>
              {settings.supportEmail}
            </a>
          </dd>
        </div>
        <div>
          <dt className="text-[11px] uppercase tracking-[0.18em] text-muted">Telephone</dt>
          <dd className="mt-2 font-serif text-3xl">
            <a className="hover:text-sage" href={telHref(settings.supportPhone)}>
              {settings.supportPhone}
            </a>
          </dd>
        </div>
      </dl>
    </section>
  );
}
