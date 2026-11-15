"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageManager } from "@/components/admin/image-manager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientFetch } from "@/lib/client-fetch";

type Pin = { id?: string; xPercent: number; yPercent: number; productId: string; defaultColorSlug: string; stylingNote: string };
type Look = { id: string; title: string; seasonTag: string; editorialStory: string; coverImage: string; isActive: boolean; hotspots: Pin[] };
type Piece = { id: string; title: string };

const empty = { title: "", seasonTag: "Seasonal", editorialStory: "", coverImage: "", isActive: true, hotspots: [] as Pin[] };

export function LookbookDesk({ initial }: { initial: Look[] }) {
  const [looks, setLooks] = useState(initial);
  const [draft, setDraft] = useState(empty);
  const [editing, setEditing] = useState("");
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    clientFetch("/api/admin/products?limit=50", { signal: controller.signal })
      .then(async (response) => (response.ok ? ((await response.json()) as { rows?: Piece[] }) : null))
      .then((data) => {
        if (data?.rows) setPieces(data.rows);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, []);

  function place(event: React.MouseEvent<HTMLButtonElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const xPercent = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const yPercent = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    setDraft((current) => ({
      ...current,
      hotspots: [...current.hotspots, { xPercent: Math.round(xPercent * 10) / 10, yPercent: Math.round(yPercent * 10) / 10, productId: pieces[0]?.id ?? "", defaultColorSlug: "", stylingNote: "" }],
    }));
  }

  async function save() {
    if (pending) return;
    setPending(true);
    try {
      const response = await clientFetch(editing ? `/api/admin/lookbook/${editing}` : "/api/admin/lookbook", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) {
        toast.error(data.message ?? "The look could not be saved.");
        return;
      }
      toast.success(data.message ?? "Saved.");
      const fresh = await clientFetch("/api/admin/lookbook");
      const list = (await fresh.json()) as { looks?: Look[] };
      if (list.looks) setLooks(list.looks);
      setDraft(empty);
      setEditing("");
    } catch {
      toast.error("The look could not be saved.");
    } finally {
      setPending(false);
    }
  }

  async function remove(id: string) {
    const response = await clientFetch(`/api/admin/lookbook/${id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      toast.error(data.message ?? "The look could not be removed.");
      return;
    }
    setLooks((current) => current.filter((look) => look.id !== id));
    toast.success(data.message ?? "Removed.");
  }

  return (
    <div className="grid min-w-0 gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2">
            <Label htmlFor="look-title">Title</Label>
            <Input id="look-title" value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} />
          </label>
          <label className="space-y-2">
            <Label htmlFor="look-season">Season</Label>
            <Input id="look-season" value={draft.seasonTag} onChange={(event) => setDraft((current) => ({ ...current, seasonTag: event.target.value }))} />
          </label>
        </div>
        <label className="block space-y-2">
          <Label htmlFor="look-story">Editorial story</Label>
          <Textarea id="look-story" value={draft.editorialStory} onChange={(event) => setDraft((current) => ({ ...current, editorialStory: event.target.value }))} />
        </label>
        <ImageManager label="Scene" images={draft.coverImage ? [draft.coverImage] : []} max={1} purpose="lookbook" onChange={(images) => setDraft((current) => ({ ...current, coverImage: images[0] ?? "" }))} />
        {draft.coverImage ? (
          <button type="button" onClick={place} className="relative block aspect-[16/9] w-full overflow-hidden bg-linen">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={draft.coverImage} alt="" className="h-full w-full object-cover" />
            {draft.hotspots.map((pin, index) => (
              <span key={`${pin.xPercent}-${pin.yPercent}-${index}`} className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage" style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }} />
            ))}
          </button>
        ) : null}
        <p className="text-xs text-muted">Click the scene to drop a pin, then choose the piece it should open.</p>
        <ul className="space-y-3">
          {draft.hotspots.map((pin, index) => (
            <li key={`${pin.xPercent}-${index}`} className="grid gap-2 border border-line p-3 sm:grid-cols-2">
              <select
                value={pin.productId}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hotspots: current.hotspots.map((item, itemIndex) => (itemIndex === index ? { ...item, productId: event.target.value } : item)),
                  }))
                }
                className="h-11 border border-line bg-background px-3 text-sm"
              >
                <option value="">Choose a piece</option>
                {pieces.map((piece) => (
                  <option key={piece.id} value={piece.id}>
                    {piece.title}
                  </option>
                ))}
              </select>
              <Input
                value={pin.stylingNote}
                placeholder="Styling note"
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    hotspots: current.hotspots.map((item, itemIndex) => (itemIndex === index ? { ...item, stylingNote: event.target.value } : item)),
                  }))
                }
              />
              <button
                type="button"
                className="text-left text-[11px] uppercase tracking-[0.14em] text-terracotta"
                onClick={() => setDraft((current) => ({ ...current, hotspots: current.hotspots.filter((_, itemIndex) => itemIndex !== index) }))}
              >
                Remove pin
              </button>
            </li>
          ))}
        </ul>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={draft.isActive} onChange={(event) => setDraft((current) => ({ ...current, isActive: event.target.checked }))} />
          Visible on the lookbook
        </label>
        <Button type="button" onClick={() => void save()} disabled={pending}>
          {pending ? "Saving" : editing ? "Update look" : "Save look"}
        </Button>
      </div>
      <ul className="space-y-3">
        {looks.map((look) => (
          <li key={look.id} className="flex items-center justify-between gap-3 border border-line p-3">
            <div className="min-w-0">
              <p className="truncate font-serif text-2xl">{look.title}</p>
              <p className="text-xs text-muted">{look.seasonTag} · {look.hotspots.length} pins</p>
            </div>
            <div className="flex shrink-0 gap-3 text-[11px] uppercase tracking-[0.14em]">
              <button
                type="button"
                className="text-sage"
                onClick={() => {
                  setEditing(look.id);
                  setDraft({
                    title: look.title,
                    seasonTag: look.seasonTag,
                    editorialStory: look.editorialStory,
                    coverImage: look.coverImage,
                    isActive: look.isActive,
                    hotspots: look.hotspots,
                  });
                }}
              >
                Edit
              </button>
              <button type="button" className="text-terracotta" onClick={() => void remove(look.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
