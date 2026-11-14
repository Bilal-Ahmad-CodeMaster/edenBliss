"use client";

import { DeskAlert } from "@/components/admin/desk-alert";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-lg space-y-4">
      <DeskAlert message="The desk could not finish this page. The archive may be offline." />
      <button
        type="button"
        onClick={reset}
        className="h-11 bg-sage px-6 text-sm uppercase tracking-[0.14em] text-alabaster transition hover:bg-sage-hover"
      >
        Try again
      </button>
    </div>
  );
}
