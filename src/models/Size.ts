import { Schema, model, models, type InferSchemaType, type Types } from "mongoose";
import { convertMeasurements, type GarmentMeasurements } from "@/lib/measurements";

const measurementSchema = new Schema(
  {
    chest: { type: Number, required: true, min: 0 },
    waist: { type: Number, required: true, min: 0 },
    shoulder: { type: Number, required: true, min: 0 },
    length: { type: Number, required: true, min: 0 },
    sleeve: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const sizeSchema = new Schema(
  {
    label: { type: String, required: true, unique: true, trim: true, uppercase: true },
    code: { type: String, required: true, unique: true, lowercase: true, trim: true },
    measurementsInMeters: { type: measurementSchema, required: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

sizeSchema.index({ sortOrder: 1 });

sizeSchema.virtual("measurementsInCm").get(function () {
  return convertMeasurements(this.measurementsInMeters as GarmentMeasurements).centimeters;
});

sizeSchema.virtual("measurementsInInches").get(function () {
  return convertMeasurements(this.measurementsInMeters as GarmentMeasurements).inches;
});

export type SizeDocument = InferSchemaType<typeof sizeSchema> & {
  _id: Types.ObjectId;
  measurementsInCm: GarmentMeasurements;
  measurementsInInches: GarmentMeasurements;
};

export const Size = models.Size || model("Size", sizeSchema);
