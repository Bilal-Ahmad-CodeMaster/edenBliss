"use client";

import { clientFetch } from "@/lib/client-fetch";

export async function compressImageFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 1600;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("The image could not be prepared.");
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.82;
  let blob = await toBlob(canvas, "image/webp", quality);
  const type = blob ? "image/webp" : "image/jpeg";
  if (!blob) blob = await toBlob(canvas, type, quality);
  if (!blob) throw new Error("The image could not be prepared.");

  while (blob.size > 1_800_000 && quality > 0.45) {
    quality = Math.round((quality - 0.12) * 100) / 100;
    const next = await toBlob(canvas, blob.type || type, quality);
    if (!next) break;
    blob = next;
  }

  if (blob.size > 2_097_152) {
    throw new Error("That image is still larger than 2MB after compression.");
  }

  const extension = (blob.type || type) === "image/webp" ? "webp" : "jpg";
  return new File([blob], `cloth.${extension}`, { type: blob.type || type });
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

export async function uploadPreparedImage(
  file: File,
  purpose: "product" | "outfit" | "category" | "lookbook" = "product",
) {
  const prepared = await compressImageFile(file);
  const body = new FormData();
  body.set("file", prepared);
  body.set("purpose", purpose);
  const response = await clientFetch("/api/upload", { method: "POST", body, timeoutMs: 30000 });
  const data = (await response.json()) as { url?: string; message?: string };
  if (!response.ok || !data.url) throw new Error(data.message ?? "The image could not be saved.");
  return data.url;
}
