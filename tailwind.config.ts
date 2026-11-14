import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        alabaster: "#FAF7F2",
        obsidian: "#1C1917",
        ink: "#121110",
        sage: {
          DEFAULT: "#3F5A45",
          hover: "#2F4534",
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
