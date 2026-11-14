export const CSRF_COOKIE = "eb_csrf";

function secret() {
  const value = process.env.CSRF_SECRET;
  if (!value) throw new Error("CSRF_SECRET is not defined.");
  return value;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function safeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return mismatch === 0;
}

async function sign(token: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(token));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function issueCsrfToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const token = bytesToBase64Url(bytes);
  return `${token}.${await sign(token)}`;
}

export async function isValidCsrfToken(value: string | undefined | null) {
  if (!value) return false;
  const splitAt = value.lastIndexOf(".");
  if (splitAt <= 0) return false;
  const token = value.slice(0, splitAt);
  const signature = value.slice(splitAt + 1);
  const expected = await sign(token);
  return safeEqual(signature, expected);
}
