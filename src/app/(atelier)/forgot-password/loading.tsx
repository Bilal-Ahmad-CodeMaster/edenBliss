export default function ForgotPasswordLoading() {
  return (
    <section className="mx-auto grid max-w-md gap-8 px-4 pb-16 pt-6 sm:px-6 lg:max-w-page lg:grid-cols-2 lg:gap-12 lg:px-10 lg:py-20">
      <div className="hidden lg:block">
        <div className="shimmer h-3 w-24" />
        <div className="shimmer mt-4 h-20 w-80" />
        <div className="shimmer mt-6 h-16 w-96" />
      </div>
      <div className="space-y-4">
        <div className="shimmer h-3 w-24 lg:hidden" />
        <div className="shimmer h-12 w-56 lg:hidden" />
        <div className="shimmer h-11 w-full" />
        <div className="shimmer h-11 w-full" />
      </div>
    </section>
  );
}
