import { upstashPipeline, upstashConfig } from "@/lib/upstash";

type LimitResult = { ok: true; remaining: number } | { ok: false; remaining: 0; retryAfter: number };

type Bucket = number[];

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

function windowMs() {
  return Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000;
}

function limitFor(scope: "auth" | "public") {
  if (scope === "auth") return Number(process.env.RATE_LIMIT_MAX_REQUESTS_AUTH) || 5;
  return Number(process.env.RATE_LIMIT_MAX_REQUESTS_PUBLIC) || 60;
}

export function limitScope(pathname: string): "auth" | "public" {
  if (pathname.startsWith("/api/auth/heartbeat") || pathname.startsWith("/api/auth/me")) return "public";
  if (pathname.startsWith("/api/auth")) return "auth";
  if (pathname.startsWith("/api/checkout")) return "auth";
  if (pathname.includes("/password")) return "auth";
  return "public";
}

export function clientAddress(headers: Headers) {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "local";
  return headers.get("x-real-ip") ?? "local";
}

function pruneBuckets() {
  if (buckets.size <= MAX_BUCKETS) return;
  const overflow = buckets.size - MAX_BUCKETS;
  const keys = buckets.keys();
  for (let index = 0; index < overflow; index += 1) {
    const next = keys.next().value;
    if (!next) break;
    buckets.delete(next);
  }
}

function memoryLimit(key: string, limit: number, window: number): LimitResult {
  const now = Date.now();
  const hits = (buckets.get(key) ?? []).filter((stamp) => stamp > now - window);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    const retryAfter = Math.max(1, Math.ceil((hits[0] + window - now) / 1000));
    return { ok: false, remaining: 0, retryAfter };
  }
  hits.push(now);
  buckets.set(key, hits);
  pruneBuckets();
  return { ok: true, remaining: limit - hits.length };
}

async function redisLimit(key: string, limit: number, window: number): Promise<LimitResult | null> {
  if (!upstashConfig()) return null;
  const now = Date.now();
  const member = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const results = await upstashPipeline([
    ["ZREMRANGEBYSCORE", key, 0, now - window],
    ["ZADD", key, now, member],
    ["ZCARD", key],
    ["PEXPIRE", key, window],
  ]);
  if (!results) return null;
  const count = Number(results[2]?.result ?? 0);
  if (count > limit) {
    return { ok: false, remaining: 0, retryAfter: Math.max(1, Math.ceil(window / 1000)) };
  }
  return { ok: true, remaining: Math.max(0, limit - count) };
}

export async function consumeRateLimit(key: string, scope: "auth" | "public"): Promise<LimitResult> {
  return consumeCountedLimit(key, limitFor(scope));
}

export async function consumeCountedLimit(key: string, limit: number): Promise<LimitResult> {
  const window = windowMs();
  try {
    const redis = await redisLimit(`eden:rl:${key}`, limit, window);
    if (redis) return redis;
  } catch (error) {
    console.error(
      "Redis rate limit failed. Using the in-memory window.",
      error instanceof Error ? error.message : "Unknown rate limit error",
    );
  }
  return memoryLimit(key, limit, window);
}

export function rateLimitKey(scope: "auth" | "public", ip: string, userId?: string) {
  return `${scope}:${ip}:${userId || "anon"}`;
}
