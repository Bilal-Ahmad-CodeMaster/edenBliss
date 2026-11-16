import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Request a 6-digit code by email and choose a new Eden Bliss password.",
  openGraph: {
    title: "Forgot password · Eden Bliss",
    description: "Request a 6-digit code by email and choose a new Eden Bliss password.",
  },
};

export const dynamic = "force-dynamic";

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto grid max-w-md gap-8 px-4 pb-16 pt-6 sm:px-6 lg:max-w-page lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
      <div className="hidden lg:block">
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted">Account</p>
        <h1 className="mt-3 font-serif text-5xl leading-none sm:text-7xl">A new key to the house.</h1>
        <p className="mt-5 max-w-md text-sm leading-7 text-muted">
          We email a 6-digit code. It lasts 10 minutes, and the new password replaces the old one as soon as the code matches.
        </p>
      </div>
      <div>
        <p className="text-[11px] uppercase tracking-[0.2em] text-muted lg:hidden">Account</p>
        <h1 className="mt-3 font-serif text-4xl leading-none lg:hidden">Forgot password</h1>
        <div className="mt-6 lg:mt-0">
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
