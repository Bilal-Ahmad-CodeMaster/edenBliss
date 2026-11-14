export const MEASUREMENT_KEYS = [
  "chest",
  "waist",
  "shoulder",
  "length",
  "sleeve",
] as const;

export type MeasurementKey = (typeof MEASUREMENT_KEYS)[number];

export type GarmentMeasurements = Record<MeasurementKey, number>;

export function toCentimeters(meters: number) {
  return Math.round(meters * 1000) / 10;
}

export function toInches(meters: number) {
  return Math.round(meters * 39.3700787402 * 100) / 100;
}

export function convertMeasurements(meters: GarmentMeasurements) {
  const centimeters = {} as GarmentMeasurements;
  const inches = {} as GarmentMeasurements;

  for (const key of MEASUREMENT_KEYS) {
    centimeters[key] = toCentimeters(meters[key]);
    inches[key] = toInches(meters[key]);
  }

  return { meters, centimeters, inches };
}

export function formatMeters(value: number) {
  return `${value.toFixed(2)} m`;
}

export function formatCentimeters(value: number) {
  return `${value.toFixed(1)} cm`;
}

export function formatInches(value: number) {
  return `${value.toFixed(2)} in`;
}
