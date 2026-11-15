import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        alabaster: "#FFFFFF",
        obsidian: "#111111",
        ink: "#111111",
        sage: {
          DEFAULT: "#B54B5A",
          hover: "#8E3A48",
        },
        terracotta: "#9E473B",
        linen: "#E6E1DA",
        background: "var(--background)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        line: "var(--line)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        sans: ["var(--font-jakarta)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        page: "80rem",
      },
    },
  },
  plugins: [animate],
};

export default config;
