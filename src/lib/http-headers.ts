export function securityHeaderEntries() {
  const isProd = process.env.NODE_ENV === "production";
  const scriptSrc = isProd
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const directives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://images.unsplash.com",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
  ];
  if (isProd) directives.push("upgrade-insecure-requests");

  return [
    ["Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload"],
    ["Content-Security-Policy", directives.join("; ")],
    ["X-Frame-Options", "DENY"],
    ["X-Content-Type-Options", "nosniff"],
    ["Referrer-Policy", "strict-origin-when-cross-origin"],
    ["Permissions-Policy", "camera=(), microphone=(), geolocation=()"],
    ["X-DNS-Prefetch-Control", "off"],
  ] as const;
}

export function applySecurityHeaders(headers: Headers) {
  for (const [key, value] of securityHeaderEntries()) {
    headers.set(key, value);
  }
}
