import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Cormorant_Garamond, Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-cormorant",
  display: "swap",
  preload: true,
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jakarta",
  display: "swap",
  preload: true,
});

function siteUrl() {
  try {
    return new URL(process.env.APP_BASE_URL || "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
}

export const metadata: Metadata = {
  metadataBase: siteUrl(),
  title: {
    default: "Eden Bliss",
    template: "%s · Eden Bliss",
  },
  description:
    "Eden Bliss is a luxury clothing house for linen, wool, and silk. Cash on delivery, measured sizes, and cloth cut in small lots.",
  openGraph: {
    siteName: "Eden Bliss",
    type: "website",
    title: "Eden Bliss",
    description: "A luxury clothing house for linen, wool, and silk, cut slowly and sent with cash on delivery.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jakarta.variable} overflow-x-hidden`}>
      <body className="overflow-x-hidden bg-background font-sans text-foreground antialiased px-4">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
