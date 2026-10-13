"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The sem-md example's Render/Source toggle — the landing hero window's
 * view control (same pills, same labels, Render as the default) applied to
 * the one tag whose authored example is Markdown.
 *
 * Render view (default): renderedHtml carries two views of the same
 * authored block, built at page-build time (components/sem-md-rendered.ts):
 * a static table, and the authored <sem-md> element itself. When the real
 * component chunk arrives the element upgrades and builds its own chrome
 * and table from the authored Markdown — and a CSS rule keyed on the
 * element's upgrade marker swaps the static table out, so there is no
 * timing race and no double render.
 *
 * The chunk arrives through the semtext-lazy loader scoped to THIS example
 * only: the page sets window.__semLazyOff before injecting
 * semtext-lazy.js (the counterpart of the full bundle's __semJsOff), so no
 * document-wide scan runs, and `SemTextLazy.hydrate(pane)` fetches exactly
 * one chunk — chunks/sem-md.js — instead of upgrading the page's other
 * sem-* markup. A failed chunk load changes nothing: the static table is
 * already the finished render.
 *
 * Source view: the authored markup as code with line numbers and a copy
 * button.
 *
 * Zero-JS: the static export renders the table, hides the authored
 * element, and renders no toggle and no copy button — they exist only
 * after hydration, the hero window's pattern.
 */

declare global {
  interface Window {
    SemTextLazy?: { hydrate: (root: Element) => Promise<void> };
    __semLazyOff?: boolean;
  }
}

const LAZY_JS = "/semtext/semtext-lazy.js";

function pill(active: boolean): string {
  return [
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

export function SemMdExample({
  source,
  renderedHtml,
  chromeLabel,
}: {
  /** The authored block, verbatim — the Source view and the copy button. */
  source: string;
  /** Build-time render of the same block (see components/sem-md-rendered.ts). */
  renderedHtml: string;
  /** Figure chrome title, e.g. "sem-md — the authored block, rendered". */
  chromeLabel: string;
}) {
  const [js, setJs] = useState(false);
  const [view, setView] = useState<"render" | "source">("render");
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const paneRef = useRef<HTMLDivElement>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setJs(true), []);

  // Load the sem-md chunk through the lazy loader, scoped to this example.
  // Runs once on mount — Render is the default view, so the chunk is
  // wanted immediately.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!window.SemTextLazy) {
          // Page-driven hydration only: never the document-wide scan.
          // type="module" is the artifact's embedding contract — it
          // resolves its chunks against import.meta.url, which a classic
          // script does not have.
          window.__semLazyOff = true;
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.type = "module";
            script.src = LAZY_JS;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("semtext-lazy.js failed to load"));
            document.head.appendChild(script);
          });
        }
        const pane = paneRef.current;
        if (pane && !cancelled) await window.SemTextLazy!.hydrate(pane);
      } catch {
        // Without the chunk the static render stands on its own.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  function copySource() {
    navigator.clipboard
      .writeText(source)
      .then(() => setCopyState("copied"))
      .catch(() => setCopyState("failed"));
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyState("idle"), 1500);
  }

  const lines = source.replace(/\n$/, "").split("\n");

  return (
    <figure className="code-window" aria-label="The sem-md example: rendered and authored">
      <div className="code-chrome">
        <span className="dot live" aria-hidden="true" />
        <span className="font-mono">{chromeLabel}</span>
        {/* Rendered only after hydration: with no JS the controls are not
            in the DOM at all, so the static page stays zero-JS clean. */}
        {js && (
          <span className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setView("render")}
              aria-pressed={view === "render"}
              className={pill(view === "render")}
            >
              Render
            </button>
            <button
              type="button"
              onClick={() => setView("source")}
              aria-pressed={view === "source"}
              className={pill(view === "source")}
            >
              Source
            </button>
          </span>
        )}
      </div>

      {/* Render view — the default, present in the static HTML. paneRef
          scopes the lazy loader's hydrate to this example only. */}
      <div
        ref={paneRef}
        hidden={view !== "render"}
        className="ref-md-example px-4 py-4 sm:px-5"
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />

      {/* Source view — the authored markup, line-numbered, with copy. */}
      <div hidden={view !== "source"} className="ref-md-source-pane">
        {js && (
          <div className="flex justify-end border-b border-white/5 px-4 py-2">
            <button
              type="button"
              onClick={copySource}
              className={pill(copyState === "copied")}
              aria-live="polite"
            >
              {copyState === "copied" ? "Copied" : copyState === "failed" ? "Copy failed" : "Copy"}
            </button>
          </div>
        )}
        <pre className="max-h-96 overflow-auto p-4 font-mono text-[0.74rem] leading-relaxed text-ink">
          <code>
            {lines.map((line, i) => (
              <span key={i} className="ref-md-line">
                <span className="ref-md-ln" aria-hidden="true">
                  {i + 1}
                </span>
                {line === "" ? " " : line}
              </span>
            ))}
          </code>
        </pre>
      </div>
    </figure>
  );
}
