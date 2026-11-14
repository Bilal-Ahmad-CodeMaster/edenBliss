function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map((entry) => clean(entry));

  if (value && typeof value === "object") {
    if (value instanceof Date) return value;

    const output: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith("$") || key.includes(".")) continue;
      output[key] = clean(entry);
    }
    return output;
  }

  return value;
}

/** Drops Mongo operator keys so request bodies cannot alter query operators. */
export function sanitize<T>(value: T): T {
  return clean(value) as T;
}

export function sanitizeInput<T>(value: T): T {
  return sanitize(value);
}

export function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, "")
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "")
    .trim();
}

export async function readJson(request: Request) {
  try {
    return sanitize(await request.json());
  } catch {
    return null;
  }
}
