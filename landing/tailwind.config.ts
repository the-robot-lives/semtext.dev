import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        slateink: {
          DEFAULT: "var(--bg)",
          lift: "var(--bg-lift)",
          panel: "var(--bg-panel)",
        },
        ink: {
          DEFAULT: "var(--ink)",
          mute: "var(--mute)",
          faint: "var(--faint)",
        },
        violet: {
          DEFAULT: "var(--accent)",
          soft: "var(--accent-soft)",
          dim: "var(--accent-dim)",
        },
        code: {
          DEFAULT: "var(--code-bg)",
          border: "var(--code-border)",
          gray: "var(--code-gray)",
        },
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      maxWidth: {
        content: "72rem",
        docs: "80rem",
      },
      boxShadow: {
        code: "0 24px 80px rgba(15, 23, 42, 0.65)",
        glow: "0 0 0 1px rgba(124, 58, 237, 0.35), 0 18px 50px rgba(124, 58, 237, 0.18)",
      },
    },
  },
  plugins: [],
};

export default config;
