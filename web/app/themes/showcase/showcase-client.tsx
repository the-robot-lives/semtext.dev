"use client";

/*
 * ThemeShowcase — client island for /themes/showcase/.
 *
 * Loads the consolidated latest bundle on mount (/semtext/latest/
 * semtext.css + semtext.js via the semtextLatest() helper), then renders
 * the SAME sample SemText markup once per shipped theme, scoped by
 * data-sem-theme on the panel wrapper (theme tokens scope to any
 * element, which is how the site themes examples inside an unthemed
 * page). The page-level switcher writes data-sem-theme on <html> — the
 * whole-document form — and a Default button removes it again (default
 * theme: minimal-tech-light via themes/_default.css in the bundle).
 *
 * The samples are authored in the v0.6 forms on purpose: markdown-list
 * sem-list, pipe-table sem-table, flat inline sem-code, sem-break,
 * sem-highlight — the runtime (SemTextV06) renders them live.
 */

import { useEffect, useState } from "react";
import { semtextLatest } from "@/lib/semtext-asset";

const THEMES = [
  { slug: "minimal-tech-light", label: "minimal-tech-light", note: "default" },
  { slug: "nocturne-console", label: "nocturne-console", note: "dark-first console" },
  { slug: "organic-warm", label: "organic-warm", note: "warm paper" },
  { slug: "editorial-settings", label: "editorial-settings", note: "magazine cool" },
  { slug: "newsprint", label: "newsprint", note: "print-like serif" },
] as const;

function SampleDocument() {
  return (
    <sem-enhanced-document>
      <sem-note variant="tip">
        Rotation is <sem-highlight>per session</sem-highlight> — short-lived
        access, a refresh grant issues a new pair.
      </sem-note>

      <sem-list ordered>
        {"1. Port-forward MinIO\n2. Run migrations\n   - auth schema first\n   - then tokens\n3. Cut release"}
      </sem-list>

      <sem-table controls="sort,filter" label="Token lifetimes">
        {"| Token | Lifetime | Rotates |\n| ----- | -------- | ------- |\n| access | 15 min | no |\n| refresh | 30 days | yes |"}
      </sem-table>

      <p>
        Inline code is an element now: <sem-code>npm run validate</sem-code>.
      </p>

      <sem-code lang="ts" filename="src/rotate.ts">
        {"export function rotate(pair: Pair): Pair {\n  const next = mint();\n  retire(pair.refresh);\n  return next;\n}"}
      </sem-code>

      <sem-procedure>
        <sem-step status="done">provision Infisical path</sem-step>
        <sem-step status="current">port-forward MinIO</sem-step>
        <sem-step>run migrations</sem-step>
      </sem-procedure>

      <sem-break></sem-break>

      <p>
        A thematic break above is authored as{" "}
        <sem-code>{"<sem-break>"}</sem-code>, never <sem-code>{"<hr>"}</sem-code>.
      </p>
    </sem-enhanced-document>
  );
}

export function ThemeShowcase() {
  const [loaded, setLoaded] = useState(false);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = semtextLatest("semtext.css");
    link.onload = () => {
      if (!cancelled) setLoaded(true);
    };
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = semtextLatest("semtext.js");
    script.async = true;
    document.head.appendChild(script);
    return () => {
      cancelled = true;
      link.remove();
      script.remove();
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (active) root.setAttribute("data-sem-theme", active);
    else root.removeAttribute("data-sem-theme");
    return () => root.removeAttribute("data-sem-theme");
  }, [active]);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Theme switcher (whole page)">
        <span className="text-xs font-medium uppercase tracking-wide text-ink-mute">
          Switch this page:
        </span>
        <button
          type="button"
          onClick={() => setActive(null)}
          aria-pressed={active === null}
          className="rounded-md border border-code-border px-3 py-1.5 text-sm text-ink hover:border-violet-soft aria-pressed:border-violet-soft aria-pressed:text-violet-soft"
        >
          Default (no attribute)
        </button>
        {THEMES.map((t) => (
          <button
            key={t.slug}
            type="button"
            onClick={() => setActive(t.slug)}
            aria-pressed={active === t.slug}
            className="rounded-md border border-code-border px-3 py-1.5 font-mono text-sm text-ink hover:border-violet-soft aria-pressed:border-violet-soft aria-pressed:text-violet-soft"
          >
            {t.slug}
          </button>
        ))}
      </div>

      <div className="mt-10 flex flex-col gap-10">
        {THEMES.map((t) => (
          <section key={t.slug} aria-label={`${t.label} panel`}>
            <h2 className="text-lg font-semibold tracking-tight text-ink">
              <code className="font-mono">{t.label}</code>
              <span className="ml-2 text-sm font-normal text-ink-mute">{t.note}</span>
            </h2>
            <div
              data-sem-theme={t.slug}
              className="mt-3 rounded-xl border border-code-border p-6 sm:p-8"
              style={loaded ? undefined : { visibility: "hidden" }}
            >
              <SampleDocument />
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
