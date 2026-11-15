export const REQUEST_TIMEOUT_MS = 5000;
export const CSRF_COOKIE = "eb_csrf";

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const parts = document.cookie.split("; ");
  const match = parts.find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : "";
}

export function clientFetch(input: RequestInfo | URL, init: RequestInit & { timeoutMs?: number } = {}) {
  const headers = new Headers(init.headers);
  const method = (init.method ?? "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && !headers.has("x-csrf-token")) {
    const token = readCookie(CSRF_COOKIE);
    if (token) headers.set("x-csrf-token", token);
  }
  const { timeoutMs, ...rest } = init;
  const timeout = AbortSignal.timeout(timeoutMs ?? REQUEST_TIMEOUT_MS);
  const signal = rest.signal ? AbortSignal.any([rest.signal, timeout]) : timeout;
  return fetch(input, { ...rest, headers, signal });
}
