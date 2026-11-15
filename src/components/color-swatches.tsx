"use client";

import type { ColorSwatch } from "@/types/commerce";

export function ColorSwatches({
  colors,
  active,
  onChange,
}: {
  colors: ColorSwatch[];
  active: string;
  onChange: (slug: string) => void;
}) {
  if (colors.length < 2 && colors.every((color) => color.colorSlug === "house")) return null;
  if (!colors.length) return null;

  return (
    <div className="flex flex-wrap items-center gap-2" role="listbox" aria-label="Colour">
      {colors.map((color) => {
        const selected = color.colorSlug === active;
        return (
          <button
            key={color.colorSlug}
            type="button"
            role="option"
            aria-selected={selected}
            aria-label={color.colorName}
            title={color.colorName}
            onClick={() => onChange(color.colorSlug)}
            className={`h-7 w-7 rounded-full border transition ${selected ? "ring-2 ring-sage ring-offset-2 ring-offset-background" : "border-line"}`}
            style={{ backgroundColor: color.hexCode }}
          />
        );
      })}
    </div>
  );
}
