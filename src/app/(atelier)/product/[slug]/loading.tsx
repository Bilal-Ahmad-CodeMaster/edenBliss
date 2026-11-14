export default function ProductLoading() {
  return (
    <section className="mx-auto grid max-w-page gap-10 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-10">
      <div className="shimmer aspect-[3/4]" />
      <div>
        <div className="shimmer h-4 w-24" />
        <div className="shimmer mt-4 h-16 w-2/3" />
        <div className="shimmer mt-8 h-11 w-full" />
        <div className="shimmer mt-4 h-11 w-40" />
      </div>
    </section>
  );
}