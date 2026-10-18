/** Tailwind config for the semtext.dev Hologram site pages (port-docs lane).
 *
 * Ported verbatim from the Next.js site's tailwind.config.ts
 * (worktree landing-preview, web/tailwind.config.ts) so the same utility
 * classes resolve with the same values. Only `content` differs: it scans
 * the Hologram app's page/component templates instead of the Next tree.
 *
 * Regenerate the committed stylesheet (from this directory — the content
 * globs resolve against the CWD, so run it from app/assets/site-css):
 *
 *   cd app/assets/site-css
 *   npx tailwindcss@3.4.19 -c tailwind.config.js -i site.css \
 *     -o ../../backend/priv/static/css/semtext-site.css --minify
 *
 * (2026-10-18: do NOT use the vendored landing-preview
 * web/node_modules CLI the original comment pointed at — that install
 * no-ops and emits zero utilities even on a trivial fixture; npx pinned
 * to the same 3.4.19 reproduces the committed sheet byte-for-byte. The
 * output IS deterministic — verified with a back-to-back byte compare.)
 *
 * The committed output is MINIFIED (the whitespace contract tests pin the
 * minified form). site.css MUST keep its three @tailwind directives at the
 * top — they are what makes the CLI emit the preflight + utility layers
 * (a run against a directive-less input silently emits only the custom
 * css, ~12 KB, dropping every utility the templates use; that happened
 * on 2026-10-18 and is why this note exists). Content scans the Hologram
 * templates AND priv/static/js — editor-boot.js injects Tailwind classes
 * at runtime (the status line's text-sm/leading-6/text-ink-mute), so the
 * JS chrome belongs in the scan.
 *
 * The compiled output is committed (the fleet Hologram apps ship no node
 * build); rerun it after adding or changing template classes. Wiring the
 * regen into CI is a P0 follow-up (see the port-docs lane report).
 */
const config = {
  content: [
    "../../backend/lib/semtext_web/**/*.{ex,holo}",
    "../../backend/priv/static/js/**/*.js",
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
