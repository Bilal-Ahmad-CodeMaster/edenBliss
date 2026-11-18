"use client";

import { useEffect, useState } from "react";
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
  const [locals, setLocals] = useState<string[]>([]);

  useEffect(() => {
    return () => {
      locals.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [locals]);

  async function onPick(list: FileList | null) {
    if (!list?.length || pending) return;
    const room = max - images.length;
    const files = Array.from(list).slice(0, room);
    if (!files.length) {
      setMessage(`This set holds ${max} images.`);
      return;
    }
    const previews = files.map((file) => URL.createObjectURL(file));
    setLocals(previews);
    setPending(true);
    setMessage("");
    try {
      const saved: string[] = [];
      for (const file of files) {
        saved.push(await uploadPreparedImage(file, purpose));
      }
      onChange([...images, ...saved]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The image could not be saved.");
    } finally {
      setLocals([]);
      setPending(false);
    }
  }

  const shown = [...images.map((src) => ({ src, local: false })), ...locals.map((src) => ({ src, local: true }))];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] uppercase tracking-[0.18em] text-muted">{label}</p>
        <label className="relative inline-flex cursor-pointer text-[11px] uppercase tracking-[0.14em] text-sage">
          {pending ? "Preparing" : "Add image"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            multiple={max > 1}
            className="absolute inset-0 cursor-pointer opacity-0"
            disabled={pending || images.length >= max}
            onChange={(event) => {
              void onPick(event.target.files);
              event.target.value = "";
            }}
          />
        </label>
      </div>
      <DeskAlert message={message} />
      <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {shown.map((item) => (
          <li key={item.src} className="relative aspect-[3/4] overflow-hidden border border-line bg-alabaster">
            <img src={item.src} alt="" className="h-full w-full object-cover" />
            {item.local ? null : (
              <button
                type="button"
                className="absolute right-1 top-1 bg-background/90 px-2 py-1 text-[10px] uppercase tracking-[0.12em]"
                onClick={() => onChange(images.filter((image) => image !== item.src))}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
