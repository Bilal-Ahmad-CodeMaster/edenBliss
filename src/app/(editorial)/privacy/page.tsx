import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Eden Bliss keeps account, order, and fitting notes.",
  openGraph: {
    title: "Privacy · Eden Bliss",
    description: "How Eden Bliss keeps account, order, and fitting notes.",
  },
};

export const revalidate = 60;

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-10">
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Privacy</p>
      <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">What the house keeps.</h1>
      <div className="mt-8 space-y-6 text-sm leading-7 text-muted">
        <p>
          An account holds your name, email, phone, wishlist, and bag. Orders keep the delivery address, the pieces you chose, and any fit note you wrote. Passwords are stored only as a slow hash. The session lives in an HTTP-only cookie.
        </p>
        <p>
          We do not sell addresses or fitting notes. A blocked account is signed out and cannot place another order until the atelier opens it again. Uploaded images stay outside the public folder and are served only after the file itself has been checked.
        </p>
        <p>To ask for a correction, write to the atelier address published on the contact page.</p>
      </div>
    </article>
  );
}
