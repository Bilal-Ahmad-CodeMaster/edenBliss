import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRow({ value, className }: { value: number; className?: string }) {
  const rounded = Math.round(value);
  return (
    <span className={cn("inline-flex gap-0.5", className)} aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={cn("h-3.5 w-3.5", star <= rounded ? "fill-sage text-sage" : "text-muted")} />
      ))}
    </span>
  );
}
