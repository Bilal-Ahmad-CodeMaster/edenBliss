export default function ProfileLoading() {
  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <div className="shimmer h-4 w-24" />
      <div className="shimmer mt-5 h-16 w-2/3 max-w-sm" />
      <div className="mt-10 grid gap-8 lg:grid-cols-[12rem_minmax(0,32rem)]">
        <div className="shimmer h-40 w-32" />
        <div className="space-y-4">
          <div className="shimmer h-12" />
          <div className="shimmer h-12" />
          <div className="shimmer h-12" />
        </div>
      </div>
    </section>
  );
}
