import { SkeletonGrid } from "@/components/skeleton-grid";

export default function ShopLoading() {
  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <div className="shimmer h-4 w-24" />
      <div className="shimmer mt-4 h-16 w-full max-w-lg" />
      <div className="mt-12">
        <SkeletonGrid />
      </div>
    </section>
  );
}
