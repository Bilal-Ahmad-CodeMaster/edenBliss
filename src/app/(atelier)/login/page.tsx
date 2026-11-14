import type { Metadata } from "next";
import { LoginForm } from "@/components/auth-forms";
import { safeNextPath } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Eden Bliss to keep your wishlist, bag, and fitting notes with the house.",
  openGraph: {
    title: "Sign in · Eden Bliss",
    description: "Sign in to Eden Bliss to keep your wishlist, bag, and fitting notes with the house.",
  },
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ restricted?: string; next?: string }>;
}) {
  const params = await searchParams;
  const restricted = params.restricted === "1";
  const nextPath = safeNextPath(params.next);

  return (
    <section className="mx-auto grid max-w-md gap-8 px-4 pb-16 pt-6 sm:px-6 lg:max-w-page lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Account</p>
        <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">Welcome back.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted">
          Your bag and wishlist from this browser travel with you when you sign in. Cash on delivery remains the only way to pay.
        </p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted lg:hidden">Account</p>
        <h1 className="mt-3 font-serif text-4xl leading-none lg:hidden">Sign in</h1>
        <div className="mt-6 lg:mt-0">
          <LoginForm restricted={restricted} nextPath={nextPath} />
        </div>
      </div>
    </section>
  );
}
