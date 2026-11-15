import "server-only";
import { cloudinaryReady, uploadToCloudinary } from "@/lib/cloudinary";
import { inspectImageUpload, savePrivateImageBuffer } from "@/lib/security";

export async function storeVerifiedImage(file: File) {
  const inspected = await inspectImageUpload(file);
  if (cloudinaryReady()) {
    const url = await uploadToCloudinary(inspected.buffer);
    return { url, mime: inspected.mime, bytes: inspected.buffer.length, host: "cloudinary" as const };
  }

  const saved = await savePrivateImageBuffer(inspected.buffer, inspected.ext);
  const prefix = process.env.PUBLIC_MEDIA_CDN_PREFIX || "/api/media";
  return {
    url: `${prefix}/${saved.filename}`,
    mime: inspected.mime,
    bytes: saved.bytes,
    host: "private" as const,
  };
}
