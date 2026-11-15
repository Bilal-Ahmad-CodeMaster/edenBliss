import "server-only";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";
import { Size } from "@/models/Size";
import type { ProductSizeOption } from "@/types/commerce";

export async function listSizeBook(): Promise<ProductSizeOption[]> {
  if (!isDatabaseConfigured()) return [];
  await connectDB();
  const rows = await Size.find()
    .select("label sortOrder measurementsInMeters")
    .sort({ sortOrder: 1 })
    .limit(20)
    .lean<Array<{ _id: { toString(): string }; label: string; measurementsInMeters: GarmentMeasurements }>>();
  return rows.map((row) => {
    const converted = convertMeasurements(row.measurementsInMeters);
    return {
      sizeId: String(row._id),
      sizeLabel: row.label,
      stock: 1,
      measurementsInMeters: converted.meters,
      measurementsInCm: converted.centimeters,
      measurementsInInches: converted.inches,
    };
  });
}
