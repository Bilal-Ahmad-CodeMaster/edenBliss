"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function EditorialImage({
  src,
  alt,
  sizes,
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const remote = src.startsWith("http://") || src.startsWith("https://");

  if (!src || failed) {
    return (
      <div className={cn("flex h-full w-full items-end bg-linen p-5", className)}>
        <span className="font-serif text-2xl leading-none text-obsidian">{alt}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      unoptimized={remote}
      sizes={sizes}
      priority={priority}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
