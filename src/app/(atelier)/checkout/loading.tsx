export default function CheckoutLoading() {
  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <div className="shimmer h-4 w-24" />
      <div className="shimmer mt-5 h-16 w-1/2 max-w-sm" />
      <div className="mt-12 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-4">
          <div className="shimmer h-24" />
          <div className="shimmer h-12" />
          <div className="shimmer h-12" />
          <div className="shimmer h-32" />
        </div>
        <div className="shimmer h-64" />
      </div>
    </section>
  );
}
