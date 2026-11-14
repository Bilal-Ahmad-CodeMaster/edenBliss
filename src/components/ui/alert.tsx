import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Alert({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p role="alert" className={cn("border border-terracotta bg-terracotta/10 px-4 py-3 text-sm text-terracotta", className)}>
      {children}
    </p>
  );
}
