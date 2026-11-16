import "server-only";
import https from "https";
import { lookup as osLookup, resolve4 } from "node:dns";
import { Readable } from "stream";
import { v2 as cloudinary } from "cloudinary";
import { usePublicDnsWhenLoopback } from "@/lib/mongo-dns";

function publicLookup(hostname: string, options: unknown, callback: (...args: unknown[]) => void) {
  usePublicDnsWhenLoopback();
  let opts = options;
  let done = callback;
  if (typeof options === "function") {
    done = options as (...args: unknown[]) => void;
    opts = {};
  }
  const all = typeof opts === "object" && opts !== null && "all" in opts && Boolean((opts as { all?: boolean }).all);
  resolve4(hostname, (error, addresses) => {
    if (!error && addresses?.length) {
      if (all) done(null, addresses.map((address) => ({ address, family: 4 })));
      else done(null, addresses[0], 4);
      return;
    }
    osLookup(hostname, opts as never, done as never);
  });
}

const uploadAgent = new https.Agent({ keepAlive: false, lookup: publicLookup as never });

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
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim().toLowerCase(),
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const folder = (process.env.CLOUDINARY_UPLOAD_FOLDER || "eden-bliss").replace(/[^\w/-]/g, "").slice(0, 80) || "eden-bliss";
  const timeout = Math.max(Number(process.env.EXTERNAL_API_TIMEOUT_MS) || 5000, 20000);

  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("The image host took too long.")), timeout);
    const upload = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        unique_filename: true,
        overwrite: false,
        agent: uploadAgent,
        transformation: [{ fetch_format: "auto", quality: "auto:good" }],
      },
      (error, result) => {
        clearTimeout(timer);
        const url = result?.secure_url ?? "";
        if (error || !url.startsWith("https://res.cloudinary.com/")) {
          const detail =
            error instanceof Error
              ? error.message
              : typeof error === "object" && error && "message" in error
                ? String((error as { message?: unknown }).message)
                : "The image could not be stored.";
          reject(new Error(detail || "The image could not be stored."));
          return;
        }
        resolve(url);
      },
    );
    Readable.from(buffer).pipe(upload);
  });
}
