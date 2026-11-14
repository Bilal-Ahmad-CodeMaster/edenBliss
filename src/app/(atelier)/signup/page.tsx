import type { Metadata } from "next";
import { SignupForm } from "@/components/auth-forms";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Open an Eden Bliss account. You will be signed in immediately, with your guest bag and wishlist kept.",
  openGraph: {
    title: "Create an account · Eden Bliss",
    description: "Open an Eden Bliss account and continue straight into the house, already signed in.",
  },
};

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);

  return (
    <section className="mx-auto grid max-w-md gap-8 px-4 pb-16 pt-6 sm:px-6 lg:max-w-page lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Join the house</p>
        <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">A place for your cloth.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted">
          Create an account and we will sign you in at once. Anything saved in this browser — bag or wishlist — comes with you to the landing page.
        </p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted lg:hidden">Join the house</p>
        <h1 className="mt-3 font-serif text-4xl leading-none lg:hidden">Create an account</h1>
        <div className="mt-6 lg:mt-0">
          <SignupForm nextPath={nextPath} />
        </div>
      </div>
    </section>
  );
}
