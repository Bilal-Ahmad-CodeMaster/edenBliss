"use client";

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={index} className="min-w-0">
          <div className="shimmer aspect-[3/4]" />
          <div className="shimmer mt-4 h-3 w-20" />
          <div className="shimmer mt-3 h-7 w-3/4" />
        </div>
      ))}
    </div>
  );
}
