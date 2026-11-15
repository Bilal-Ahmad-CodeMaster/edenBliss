"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo, useState } from "react";
import { DeskDialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCentimeters, formatInches, formatMeters, toCentimeters, toInches } from "@/lib/measurements";
import {
  heightToMeters,
  poundsToKg,
  recommendSize,
  toMeters,
  type FitPreference,
} from "@/lib/size-match";
import { stylistWhatsAppText, whatsAppHref } from "@/lib/whatsapp";
import type { ProductSizeOption } from "@/types/commerce";

export function SizeFinderModal({
  open,
  onClose,
  sizes,
  productTitle,
  colorName,
  whatsappNumber,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  sizes: ProductSizeOption[];
  productTitle?: string;
  colorName?: string;
  whatsappNumber?: string;
  onSelect?: (sizeLabel: string, waistMeters: number) => void;
}) {
  const reduce = useReducedMotion();
  const [system, setSystem] = useState<"metric" | "imperial">("metric");
  const [heightCm, setHeightCm] = useState("170");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("7");
  const [weight, setWeight] = useState("68");
  const [waist, setWaist] = useState("80");
  const [chest, setChest] = useState("");
  const [fit, setFit] = useState<FitPreference>("regular");

  function switchSystem(next: "metric" | "imperial") {
    if (next === system) return;
    if (next === "imperial") {
      const totalInches = (Number(heightCm) || 0) / 2.54;
      setFeet(String(Math.floor(totalInches / 12)));
      setInches(String(Math.round(totalInches % 12)));
      setWeight(String(Math.round((Number(weight) || 0) / 0.45359237)));
      setWaist(String(Math.round(((Number(waist) || 0) / 2.54) * 10) / 10));
      if (chest.trim()) setChest(String(Math.round(((Number(chest) || 0) / 2.54) * 10) / 10));
    } else {
      setHeightCm(String(Math.round(((Number(feet) || 0) * 12 + (Number(inches) || 0)) * 2.54)));
      setWeight(String(Math.round((Number(weight) || 0) * 0.45359237)));
      setWaist(String(Math.round((Number(waist) || 0) * 2.54 * 10) / 10));
      if (chest.trim()) setChest(String(Math.round((Number(chest) || 0) * 2.54 * 10) / 10));
    }
    setSystem(next);
  }

  const result = useMemo(() => {
    const heightM = system === "metric" ? toMeters(Number(heightCm) || 0, "cm") : heightToMeters(Number(feet) || 0, Number(inches) || 0);
    const weightKg = system === "metric" ? Number(weight) || 0 : poundsToKg(Number(weight) || 0);
    const waistM = toMeters(Number(waist) || 0, system === "metric" ? "cm" : "in");
    const chestM = chest.trim() ? toMeters(Number(chest) || 0, system === "metric" ? "cm" : "in") : undefined;
    if (heightM < 1.2 || heightM > 2.3 || weightKg < 35 || weightKg > 200 || waistM < 0.5 || waistM > 1.6) return null;
    return recommendSize({
      heightM,
      weightKg,
      waistM,
      chestM,
      fit,
      sizes: sizes.map((size) => ({ sizeLabel: size.sizeLabel, measurementsInMeters: size.measurementsInMeters })),
    });
  }, [chest, feet, fit, heightCm, inches, sizes, system, waist, weight]);

  const waistMeters = toMeters(Number(waist) || 0, system === "metric" ? "cm" : "in");
  const stylist = whatsAppHref(
    whatsappNumber ?? "",
    stylistWhatsAppText({ title: productTitle || "a piece", colorName, sizeLabel: result?.sizeLabel }),
  );

  return (
    <DeskDialog open={open} onOpenChange={(next) => !next && onClose()} title="Find my size" description="Measured against the house size book.">
      <div className="space-y-5">
        <div className="flex gap-2">
          {(
            [
              ["metric", "cm / kg"],
              ["imperial", "ft / lbs"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => switchSystem(value)}
              className={`h-9 px-3 text-[11px] uppercase tracking-[0.14em] ${system === value ? "bg-sage text-alabaster" : "border border-line"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {system === "metric" ? (
            <Field label="Height (cm)" value={heightCm} onChange={setHeightCm} />
          ) : (
            <>
              <Field label="Height (ft)" value={feet} onChange={setFeet} />
              <Field label="Height (in)" value={inches} onChange={setInches} />
            </>
          )}
          <Field label={system === "metric" ? "Weight (kg)" : "Weight (lbs)"} value={weight} onChange={setWeight} />
          <Field label={system === "metric" ? "Waist (cm)" : "Waist (in)"} value={waist} onChange={setWaist} />
          <Field label={system === "metric" ? "Chest (cm, optional)" : "Chest (in, optional)"} value={chest} onChange={setChest} />
        </div>
        <label className="block space-y-2 text-sm">
          <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Fit preference</span>
          <select value={fit} onChange={(event) => setFit(event.target.value as FitPreference)} className="h-11 w-full border border-line bg-background px-3">
            <option value="tailored">Tailored / Slim</option>
            <option value="regular">Regular / True to size</option>
            <option value="relaxed">Relaxed / Oversized</option>
          </select>
        </label>
        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key={result.sizeLabel}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0 }}
              className="border border-line bg-alabaster p-4 text-obsidian"
            >
              <p className="font-serif text-3xl">Your best fit: Size {result.sizeLabel}</p>
              <div className="mt-3 h-1.5 bg-linen">
                <div className="h-full bg-sage" style={{ width: `${result.confidence}%` }} />
              </div>
              <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-muted">{result.confidence}% match</p>
              <div className="mt-4 overflow-x-hidden">
                <table className="w-full table-fixed text-left text-xs">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-[0.14em] text-muted">
                      <th className="w-[22%] py-1 font-medium"> </th>
                      <th className="w-[39%] py-1 font-medium">Garment</th>
                      <th className="w-[39%] py-1 font-medium">Body</th>
                    </tr>
                  </thead>
                  <tbody>
                    <CompareRow label="Chest" garment={result.garment.chest} body={result.body.chest} />
                    <CompareRow label="Waist" garment={result.garment.waist} body={result.body.waist} />
                    <CompareRow label="Shoulder" garment={result.garment.shoulder} />
                    <CompareRow label="Length" garment={result.garment.length} />
                  </tbody>
                </table>
              </div>
              {onSelect ? (
                <Button
                  type="button"
                  className="mt-4"
                  onClick={() => {
                    onSelect(result.sizeLabel, waistMeters);
                    onClose();
                  }}
                >
                  Select size {result.sizeLabel} & close
                </Button>
              ) : null}
            </motion.div>
          ) : (
            <p className="text-sm text-muted">Enter a height, weight, and waist to see a size.</p>
          )}
        </AnimatePresence>
        {stylist ? (
          <a href={stylist} target="_blank" rel="noreferrer" className="inline-block text-[11px] uppercase tracking-[0.14em] text-sage">
            Ask a stylist on WhatsApp
          </a>
        ) : null}
      </div>
    </DeskDialog>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="space-y-2 text-sm">
      <span className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</span>
      <input value={value} inputMode="decimal" onChange={(event) => onChange(event.target.value)} className="h-11 w-full border border-line bg-background px-3" />
    </label>
  );
}

function measureCell(meters: number) {
  return `${formatMeters(meters)} · ${formatCentimeters(toCentimeters(meters))} · ${formatInches(toInches(meters))}`;
}

function CompareRow({ label, garment, body }: { label: string; garment: number; body?: number }) {
  return (
    <tr className="border-t border-line">
      <th className="py-2 pr-1 font-medium">{label}</th>
      <td className="break-words py-2 pr-1">{measureCell(garment)}</td>
      <td className="break-words py-2">{body === undefined ? "—" : measureCell(body)}</td>
    </tr>
  );
}
