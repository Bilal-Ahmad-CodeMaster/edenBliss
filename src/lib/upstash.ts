type UpstashConfig = { endpoint: string; token: string };

export function upstashConfig(): UpstashConfig | null {
  const raw = process.env.REDIS_URL ?? "";
  if (!raw.startsWith("redis://") && !raw.startsWith("rediss://")) return null;
  if (raw.includes("<") || raw.includes("xxxxx") || raw.includes("endpoint")) return null;

  try {
    const url = new URL(raw);
    const token = decodeURIComponent(url.password);
    if (!token || !url.hostname) return null;
    return { endpoint: `https://${url.hostname}`, token };
  } catch {
    return null;
  }
}

export function externalTimeoutMs() {
  return Number(process.env.EXTERNAL_API_TIMEOUT_MS) || 5000;
}

export async function upstashCommand<T>(command: (string | number)[]): Promise<T | null> {
  const config = upstashConfig();
  if (!config) return null;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
    signal: AbortSignal.timeout(externalTimeoutMs()),
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { result?: T };
  return payload.result ?? null;
}

export async function upstashPipeline(commands: (string | number)[][]) {
  const config = upstashConfig();
  if (!config) return null;

  const response = await fetch(`${config.endpoint}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(commands),
    cache: "no-store",
    signal: AbortSignal.timeout(externalTimeoutMs()),
  });

  if (!response.ok) return null;
  return (await response.json()) as { result?: unknown }[];
}
