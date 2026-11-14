import "server-only";
import { upstashCommand, upstashConfig } from "@/lib/upstash";

type MemoryEntry = { value: string; expires: number };

const memory = new Map<string, MemoryEntry>();
const MAX_ENTRIES = 400;

function ttlSeconds(override?: number) {
  return override ?? (Number(process.env.CACHE_DEFAULT_TTL_SECONDS) || 300);
}

function pruneMemory() {
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expires <= now) memory.delete(key);
  }
  while (memory.size > MAX_ENTRIES) {
    const oldest = memory.keys().next().value;
    if (!oldest) break;
    memory.delete(oldest);
  }
}

function remember(key: string, raw: string, seconds: number) {
  memory.set(key, { value: raw, expires: Date.now() + seconds * 1000 });
  pruneMemory();
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  if (upstashConfig()) {
    try {
      const raw = await upstashCommand<string>(["GET", key]);
      if (typeof raw === "string") return JSON.parse(raw) as T;
    } catch (error) {
      console.error("Redis read failed. Using the in-memory cache.", error);
    }
  }

  pruneMemory();
  const entry = memory.get(key);
  if (!entry || entry.expires <= Date.now()) {
    memory.delete(key);
    return null;
  }
  return JSON.parse(entry.value) as T;
}

export async function cacheSet(key: string, value: unknown, seconds?: number) {
  const ttl = ttlSeconds(seconds);
  const raw = JSON.stringify(value);
  remember(key, raw, ttl);

  if (!upstashConfig()) return;
  try {
    await upstashCommand(["SET", key, raw, "EX", ttl]);
  } catch (error) {
    console.error("Redis write failed. The in-memory cache still holds the value.", error);
  }
}

export async function cacheDel(keys: string[]) {
  for (const key of keys) memory.delete(key);
  if (!keys.length || !upstashConfig()) return;
  try {
    await upstashCommand(["DEL", ...keys]);
  } catch (error) {
    console.error("Redis delete failed.", error);
  }
}

export async function cacheGetOrSet<T>(key: string, seconds: number, loader: () => Promise<T>) {
  const cached = await cacheGet<T>(key);
  if (cached !== null) return cached;
  const fresh = await loader();
  await cacheSet(key, fresh, seconds);
  return fresh;
}

const VERSION_KEY = "eden:catalog:version";

export async function catalogCacheVersion() {
  const version = await cacheGet<string>(VERSION_KEY);
  return version ?? "1";
}

export async function invalidateCatalogCache() {
  await cacheSet(VERSION_KEY, String(Date.now()), 60 * 60 * 24);
}

export function versionedKey(version: string, suffix: string) {
  return `eden:v${version}:${suffix}`;
}
