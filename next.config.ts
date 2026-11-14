import type { NextConfig } from "next";
import { securityHeaderEntries } from "./src/lib/http-headers";

const securityHeaders = securityHeaderEntries().map(([key, value]) => ({ key, value }));
const immutableCache = [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }];

const nextConfig: NextConfig = {
  compress: true,
  webpack(config, { dev, isServer }) {
    if (dev && !isServer) {
      config.output.filename = "static/chunks/eb/[name].js";
      config.output.chunkFilename = "static/chunks/eb/[name].js";
    }
    return config;
  },
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  reactStrictMode: true,
  serverExternalPackages: ["mongoose", "nodemailer"],
  experimental: {
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    if (process.env.NODE_ENV !== "production") {
      return [
        { source: "/:path*", headers: securityHeaders },
        { source: "/_next/static/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      ];
    }
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/_next/static/:path*", headers: immutableCache },
      { source: "/api/media/:path*", headers: immutableCache },
    ];
  },
};

export default nextConfig;
