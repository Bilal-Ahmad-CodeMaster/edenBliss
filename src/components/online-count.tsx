"use client";

import { useEffect, useState } from "react";
import { clientFetch } from "@/lib/client-fetch";

export function OnlineCount() {
  const [online, setOnline] = useState<number | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    clientFetch("/api/admin/presence", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as { online?: number };
      })
      .then((data) => {
        if (!controller.signal.aborted && typeof data?.online === "number") setOnline(data.online);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  return (
    <div className="border border-line p-6">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted">Signed in now</p>
      {online === null ? <div className="shimmer mt-4 h-12 w-16" /> : <p className="mt-3 font-serif text-5xl">{online}</p>}
      <p className="mt-3 text-sm leading-6 text-muted">
        Counted from heartbeats in the last minute and a half. A blocked account is never included.
      </p>
    </div>
  );
}
