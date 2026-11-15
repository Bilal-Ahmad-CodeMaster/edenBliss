"use client";

import Image from "next/image";
import { useState } from "react";
import { uploadPreparedImage } from "@/components/admin/prepare-image";
import { DeskAlert } from "@/components/admin/desk-alert";

export function ImageManager({
  label,
  images,
  onChange,
  max = 8,
  purpose = "product",
}: {
  label: string;
  images: string[];
  onChange: (images: string[]) => void;
  max?: number;
  purpose?: "product" | "outfit" | "category" | "lookbook";
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function onPick(list: FileList | null) {
    if (!list?.length || pending) return;
    const room = max - images.length;
    if (room <= 0) {
      setMessage(`This set holds ${max} images.`);
      return;
    }
    setPending(true);
    setMessage("");
    const next = [...images];
    try {
      for (const file of Array.from(list).slice(0, room)) {
        next.push(await uploadPreparedImage(file));
      }
      onChange(next);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The image could not be saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
        <label className="cursor-pointer text-[11px] uppercase tracking-[0.14em] text-sage">
          {pending ? "Preparing" : "Add image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={max > 1}
            className="sr-only"
            disabled={pending || images.length >= max}
            onChange={(event) => {
              void onPick(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <DeskAlert message={message} />
      {pending ? <div className="shimmer h-24" /> : null}
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {images.map((src) => (
          <li key={src} className="relative aspect-[3/4] border border-line bg-alabaster">
            <Image src={src} alt="" fill sizes="120px" className="object-cover" />
            <button
              type="button"
              className="absolute right-1 top-1 bg-background/90 px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
              onClick={() => onChange(images.filter((item) => item !== src))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
