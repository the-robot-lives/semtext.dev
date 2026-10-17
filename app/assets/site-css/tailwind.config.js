/** Tailwind config for the semtext.dev Hologram site pages (port-docs lane).
 *
 * Ported verbatim from the Next.js site's tailwind.config.ts
 * (worktree landing-preview, web/tailwind.config.ts) so the same utility
 * classes resolve with the same values. Only `content` differs: it scans
 * the Hologram app's page/component templates instead of the Next tree.
 *
 * Regenerate the committed stylesheet with the vendored CLI (any checkout
 * of the Next site has it in web/node_modules):
 *
 *   <repo>/.../landing-preview/web/node_modules/.bin/tailwindcss \
 *     -c app/assets/site-css/tailwind.config.js \
 *     -i app/assets/site-css/site.css \
 *     -o app/backend/priv/static/css/semtext-site.css
 *
 * The compiled output is committed (the fleet Hologram apps ship no node
 * build); rerun it after adding or changing template classes. Wiring the
 * regen into CI is a P0 follow-up (see the port-docs lane report).
 */
const config = {
  content: [
    "../../backend/lib/semtext_web/**/*.{ex,holo}",
  ],
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
          // Alpha-capable so opacity modifiers (bg-violet/20, border-violet/60,
          // …) generate: Tailwind can't apply /N to a plain var() color. The
          // rgb() values are #7c3aed / #a78bfa == var(--accent)/var(--accent-soft)
          // in site.css — kept in lockstep by this comment.
          DEFAULT: "rgb(124 58 237 / <alpha-value>)",
          soft: "rgb(167 139 250 / <alpha-value>)",
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
        docs: "96rem",
      },
      boxShadow: {
        code: "0 24px 80px rgba(15, 23, 42, 0.65)",
        glow: "0 0 0 1px rgba(124, 58, 237, 0.35), 0 18px 50px rgba(124, 58, 237, 0.18)",
      },
    },
  },
  plugins: [],
};

module.exports = config;
