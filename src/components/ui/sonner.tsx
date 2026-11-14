"use client";

import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-center"
      closeButton
      toastOptions={{
        className: "font-sans",
        style: {
          background: "var(--background)",
          color: "var(--foreground)",
          border: "1px solid var(--line)",
          borderRadius: 0,
        },
      }}
    />
  );
}
