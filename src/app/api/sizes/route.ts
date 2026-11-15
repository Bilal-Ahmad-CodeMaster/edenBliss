import { NextResponse } from "next/server";
import { connectDB, isDatabaseConfigured } from "@/lib/db";
import { enforceRateLimit } from "@/lib/guard";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";
import { Size } from "@/models/Size";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const limited = await enforceRateLimit(request);
  if (limited) return limited;
  if (!isDatabaseConfigured()) return NextResponse.json({ sizes: [] });
  await connectDB();
  const rows = await Size.find()
    .select("label sortOrder measurementsInMeters")
    .sort({ sortOrder: 1 })
    .limit(20)
    .lean<Array<{ _id: { toString(): string }; label: string; measurementsInMeters: GarmentMeasurements }>>();
  return NextResponse.json({
    sizes: rows.map((row) => {
      const converted = convertMeasurements(row.measurementsInMeters);
      return {
        sizeId: String(row._id),
        sizeLabel: row.label,
        stock: 1,
        measurementsInMeters: converted.meters,
        measurementsInCm: converted.centimeters,
        measurementsInInches: converted.inches,
      };
    }),
  });
}
