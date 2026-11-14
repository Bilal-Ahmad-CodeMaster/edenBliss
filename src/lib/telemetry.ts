import "server-only";
import { SpanStatusCode, trace } from "@opentelemetry/api";

const tracer = trace.getTracer(process.env.OTEL_SERVICE_NAME || "eden-bliss-ecommerce");

export async function traceSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string | number | boolean>,
) {
  const start = process.hrtime.bigint();
  return tracer.startActiveSpan(name, async (span) => {
    try {
      if (attributes) {
        for (const [key, value] of Object.entries(attributes)) {
          span.setAttribute(key, value);
        }
      }
      return await fn();
    } catch (error) {
      span.recordException(error instanceof Error ? error : new Error("Request failed"));
      span.setStatus({ code: SpanStatusCode.ERROR });
      throw error;
    } finally {
      const durationMs = Number(process.hrtime.bigint() - start) / 1_000_000;
      span.setAttribute("eden.duration_ms", durationMs);
      const threshold = Number(process.env.SLOW_REQUEST_THRESHOLD_MS) || 400;
      if (durationMs >= threshold) {
        console.warn(
          JSON.stringify({
            level: "warn",
            service: process.env.OTEL_SERVICE_NAME || "eden-bliss-ecommerce",
            span: name,
            durationMs: Math.round(durationMs),
            slow: true,
          }),
        );
      }
      span.end();
    }
  });
}
