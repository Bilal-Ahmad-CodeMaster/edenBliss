import type { GarmentMeasurements } from "@/lib/measurements";

export type FitPreference = "tailored" | "regular" | "relaxed";

const EASE: Record<FitPreference, number> = {
  tailored: 0,
  regular: 0.04,
  relaxed: 0.08,
};

export type SizeCandidate = {
  sizeLabel: string;
  measurementsInMeters: GarmentMeasurements;
};

export type SizeMatch = {
  sizeLabel: string;
  confidence: number;
  garment: GarmentMeasurements;
  body: Pick<GarmentMeasurements, "chest" | "waist">;
};

export function recommendSize(input: {
  heightM: number;
  weightKg: number;
  waistM: number;
  chestM?: number;
  fit: FitPreference;
  sizes: SizeCandidate[];
}): SizeMatch | null {
  const sizes = input.sizes.filter((size) => size.measurementsInMeters.waist > 0);
  if (!sizes.length) return null;
  const ease = EASE[input.fit];
  const bodyWaist = input.waistM + ease;
  const bodyChest = (input.chestM && input.chestM > 0 ? input.chestM : estimateChest(input.heightM, input.weightKg)) + ease;
  const ranked = sizes
    .map((size) => {
      const waistGap = Math.abs(size.measurementsInMeters.waist - bodyWaist);
      const chestGap = Math.abs(size.measurementsInMeters.chest - bodyChest);
      return { size, score: waistGap * 0.62 + chestGap * 0.38 };
    })
    .sort((left, right) => left.score - right.score);
  const best = ranked[0];
  if (!best) return null;
  const confidence = Math.round(Math.max(0.42, Math.min(0.98, 1 - best.score / 0.22)) * 100);
  return {
    sizeLabel: best.size.sizeLabel,
    confidence,
    garment: best.size.measurementsInMeters,
    body: { chest: round(bodyChest - ease), waist: round(input.waistM) },
  };
}

function estimateChest(heightM: number, weightKg: number) {
  const raw = 0.72 + weightKg / 220 + Math.max(0, heightM - 1.55) * 0.08;
  return round(Math.min(1.45, Math.max(0.7, raw)));
}

function round(value: number) {
  return Math.round(value * 1000) / 1000;
}

export function toMeters(value: number, unit: "cm" | "m" | "in") {
  if (unit === "m") return value;
  if (unit === "cm") return value / 100;
  return value * 0.0254;
}

export function heightToMeters(feet: number, inches: number) {
  return (feet * 12 + inches) * 0.0254;
}

export function poundsToKg(pounds: number) {
  return pounds * 0.45359237;
}
