export default function AtelierLoading() {
  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <div className="shimmer h-4 w-28" />
      <div className="shimmer mt-5 h-16 w-2/3 max-w-md" />
      <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="shimmer aspect-[3/4]" />
        ))}
      </div>
    </section>
  );
}
