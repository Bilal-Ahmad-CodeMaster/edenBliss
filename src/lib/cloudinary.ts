import "server-only";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";

export function cloudinaryReady() {
  const name = process.env.CLOUDINARY_CLOUD_NAME?.trim() ?? "";
  const key = process.env.CLOUDINARY_API_KEY?.trim() ?? "";
  const secret = process.env.CLOUDINARY_API_SECRET?.trim() ?? "";
  if (!name || !key || !secret) return false;
  if ([name, key, secret].some((value) => value.includes("replace_with") || value.includes("xxxxx"))) return false;
  return true;
}

export async function uploadToCloudinary(buffer: Buffer) {
  if (!cloudinaryReady()) {
    throw new Error("Image hosting is not configured.");
  }

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER || "eden-bliss").replace(/[^\w/-]/g, "").slice(0, 80) || "eden-bliss";
  const timeout = Number(process.env.EXTERNAL_API_TIMEOUT_MS) || 5000;

  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The image host took too long.")), timeout);
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        transformation: [{ fetch_format: "auto", quality: "auto:good" }],
      },
      (error, result) => {
        clearTimeout(timer);
        const url = result?.secure_url ?? "";
        if (error || !url.startsWith("https://res.cloudinary.com/")) {
          reject(error ?? new Error("The image could not be stored."));
          return;
        }
        resolve(url);
      },
    );
    Readable.from(buffer).pipe(upload);
  });
}
