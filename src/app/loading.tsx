import { SkeletonGrid } from "@/components/skeleton-grid";

export default function Loading() {
  return (
    <section className="mx-auto max-w-page px-4 py-12 sm:px-6 lg:px-10">
      <div className="shimmer h-4 w-28" />
      <div className="shimmer mt-5 h-16 w-2/3 max-w-md" />
      <div className="mt-12">
        <SkeletonGrid />
      </div>
    </section>
  );
}
