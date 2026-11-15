import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { Types } from "mongoose";
import { escapeRegExp, sanitizeInput, stripHtml } from "@/lib/sanitize";

export type SecuritySession = {
  userId: string;
  role: "USER" | "ADMIN";
};

export function isValidObjectId(id: string) {
  if (!Types.ObjectId.isValid(id)) return false;
  return String(new Types.ObjectId(id)) === id;
}

export function withRowLevelSecurity<T extends Record<string, unknown>>(session: SecuritySession, filter: T) {
  if (session.role === "ADMIN") return filter;
  return { ...filter, user: session.userId };
}

export function enforceRLS<T extends Record<string, unknown>>(session: SecuritySession, filter: T) {
  return withRowLevelSecurity(session, filter);
}

export function assertOwnershipOrAdmin(docUserId: unknown, session: SecuritySession) {
  if (session.role === "ADMIN") return;
  if (!docUserId || String(docUserId) !== session.userId) {
    const error = new Error("You can only change your own records.");
    (error as Error & { status?: number }).status = 403;
    throw error;
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string | null) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signature.replace(/^sha256=/, "").trim();
  const left = Buffer.from(digest);
  const right = Buffer.from(provided);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function requestMeta(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  return {
    ipAddress: forwarded?.split(",")[0]?.trim() || "local",
    userAgent: request.headers.get("user-agent") ?? "",
  };
}

export function publicErrorMessage() {
  return "The request could not be completed.";
}

type ImageKind = { mime: string; ext: "jpg" | "png" | "webp" | "avif" };

function detectImage(bytes: Buffer): ImageKind | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return { mime: "image/png", ext: "png" };
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") {
    return { mime: "image/webp", ext: "webp" };
  }
  if (bytes.length >= 12 && bytes.toString("ascii", 4, 8) === "ftyp") {
    const brand = bytes.toString("ascii", 8, Math.min(bytes.length, 32));
    if (brand.includes("avif") || brand.includes("avis")) return { mime: "image/avif", ext: "avif" };
  }
  return null;
}

function stripJpegMetadata(bytes: Buffer) {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
  const parts: Buffer[] = [bytes.subarray(0, 2)];
  let offset = 2;
  while (offset + 4 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      parts.push(bytes.subarray(offset));
      break;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xda || marker === 0xd9) {
      parts.push(bytes.subarray(offset));
      break;
    }
    const size = bytes.readUInt16BE(offset + 2);
    const next = offset + 2 + size;
    if (size < 2 || next > bytes.length) break;
    const drop = marker === 0xe1 || marker === 0xed;
    if (!drop) parts.push(bytes.subarray(offset, next));
    offset = next;
  }
  return Buffer.concat(parts);
}

function stripPngMetadata(bytes: Buffer) {
  const signature = bytes.subarray(0, 8);
  const kept: Buffer[] = [signature];
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString("ascii", offset + 4, offset + 8);
    const chunkEnd = offset + 12 + length;
    if (chunkEnd > bytes.length) break;
    const drop = type === "eXIf" || type === "tEXt" || type === "zTXt" || type === "iTXt";
    if (!drop) kept.push(bytes.subarray(offset, chunkEnd));
    offset = chunkEnd;
    if (type === "IEND") break;
  }
  return Buffer.concat(kept);
}

function storageDir() {
  const configured = process.env.PRIVATE_STORAGE_DIR || "./storage/private-uploads";
  const dir = path.resolve(process.cwd(), configured);
  const publicDir = path.resolve(process.cwd(), "public");
  if (dir === publicDir || dir.startsWith(`${publicDir}${path.sep}`)) {
    throw new Error("Private storage cannot live inside the public folder.");
  }
  return dir;
}

export async function inspectImageUpload(file: File) {
  const maxBytes = Number(process.env.MAX_FILE_UPLOAD_SIZE_BYTES) || 2_097_152;
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("Images must be 2MB or smaller.");
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length > maxBytes) throw new Error("Images must be 2MB or smaller.");
  const detected = detectImage(bytes);
  if (!detected) throw new Error("Upload a JPEG, PNG, WebP, or AVIF image.");

  const cleaned =
    detected.mime === "image/jpeg"
      ? stripJpegMetadata(bytes)
      : detected.mime === "image/png"
        ? stripPngMetadata(bytes)
        : bytes;
  return { buffer: cleaned, mime: detected.mime, ext: detected.ext };
}

export async function savePrivateImageBuffer(buffer: Buffer, ext: "jpg" | "png" | "webp" | "avif") {
  const dir = storageDir();
  await mkdir(dir, { recursive: true });
  const filename = `${randomUUID()}.${ext}`;
  const target = path.join(dir, filename);
  if (path.dirname(target) !== dir) throw new Error("Invalid storage path.");
  await writeFile(target, buffer, { flag: "wx" });
  return { filename, bytes: buffer.length };
}

export async function verifyAndSavePrivateUpload(file: File) {
  const inspected = await inspectImageUpload(file);
  const saved = await savePrivateImageBuffer(inspected.buffer, inspected.ext);
  return { filename: saved.filename, mime: inspected.mime, bytes: saved.bytes };
}

export async function readPrivateImage(filename: string) {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp|avif)$/i.test(filename)) return null;
  const dir = storageDir();
  const target = path.join(dir, filename);
  if (path.dirname(target) !== dir) return null;
  try {
    const bytes = await readFile(target);
    const detected = detectImage(bytes);
    if (!detected) return null;
    return { bytes, mime: detected.mime };
  } catch {
    return null;
  }
}

export { escapeRegExp, sanitizeInput, stripHtml };
