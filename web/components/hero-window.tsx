"use client";

import { useEffect, useRef, useState } from "react";

/*
 * The rendered view uses the real SemText bundle, copied verbatim
 * from noizu-labs-ml/npl-enhanced-content dist into public/semtext/
 * (v0.1.0, dist commit 0f5a8cf, 2026-10-07 — see public/semtext/VERSION.md).
 * Assets load lazily, same-origin, on the first Render click. Until then
 * the window shows the Source view; with no JS at all the toggle buttons
 * never appear (they are rendered with [hidden] and only revealed once
 * this component hydrates), so the static export stays zero-JS safe.
 */

/*
 * SOURCE and RENDERED_HTML are the SAME string on purpose: the section's
 * point is that render never rewrites the authored markup — Render wires
 * the identical file in place. Do not "diverge" them.
 */

const SOURCE = `<sem-note variant="warning">
  Refresh tokens rotate per use —
  each exchange retires the last one.
</sem-note>

<sem-facts view-as="flashcards">
  <sem-fact id="f-jwt" kind="concept">
    <statement>JWTs rotate per session</statement>
    <conclusion>Short-lived access tokens;
    the refresh grant issues a new pair.</conclusion>
    <sem-distractor>Store the token in
    localStorage for durability.</sem-distractor>
  </sem-fact>
</sem-facts>`;

const RENDERED_HTML = `<sem-note variant="warning">
  Refresh tokens rotate per use —
  each exchange retires the last one.
</sem-note>

<sem-facts view-as="flashcards">
  <sem-fact id="f-jwt" kind="concept">
    <statement>JWTs rotate per session</statement>
    <conclusion>Short-lived access tokens;
    the refresh grant issues a new pair.</conclusion>
    <sem-distractor>Store the token in
    localStorage for durability.</sem-distractor>
  </sem-fact>
</sem-facts>`;

declare global {
  interface Window {
    // The bundle's enhance(root) accepts a Document or any element subtree
    // (it only calls root.querySelectorAll — see semtext.js K()).
    SemTextFallback?: { enhance: (root: Document | HTMLElement) => void };
    __semJsOff?: boolean;
  }
}

const THEME_CSS = [
  "/semtext/semtext.css",
  "/semtext/semtext-theme-minimal-tech-light.css",
];

function pillClasses(active: boolean) {
  return [
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

export function HeroWindow() {
  const [view, setView] = useState<"source" | "rendered">("source");
  const [js, setJs] = useState(false);
  const bootedRef = useRef(false);
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => setJs(true), []);

  async function show(next: "source" | "rendered") {
    setView(next);
    if (next !== "rendered") return;
    try {
      if (!bootedRef.current) {
        for (const href of THEME_CSS) {
          if (document.querySelector(`link[href="${href}"]`)) continue;
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = href;
          document.head.appendChild(link);
        }
        if (!window.SemTextFallback) {
          // Keep the bundle from auto-wiring the document on injection;
          // wiring is explicit below.
          window.__semJsOff = true;
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement("script");
            script.src = "/semtext/semtext.js";
            script.onload = () => resolve();
            script.onerror = () => reject(new Error("semtext.js failed to load"));
            document.head.appendChild(script);
          });
        }
        bootedRef.current = true;
      }
      // Enhance ONLY this window's pane, and only if its deck is not
      // already wired — never a second full-document pass (that would
      // double-wrap the scope section's sem-reveals). React hydration
      // resets this client component's dangerouslySetInnerHTML pane at
      // an unpredictable point around the DOMContentLoaded document pass
      // (discarding any wiring on it), so after wiring we re-check the
      // pane's own marker on a short schedule: each re-check is a no-op
      // once the deck carries data-sem-fallback, and any toggle back to
      // Render re-wires a wiped pane.
      const wirePane = () => {
        const pane = paneRef.current;
        const deck = pane?.querySelector("sem-facts");
        if (pane && deck && !deck.hasAttribute("data-sem-fallback")) {
          window.SemTextFallback?.enhance(pane);
        }
      };
      wirePane();
      for (const ms of [150, 500, 1200]) setTimeout(wirePane, ms);
    } catch {
      // Without the bundle the rendered view still shows every element:
      // the vocabulary CSS hides nothing until a tier marker is set.
    }
  }

  return (
    <figure className="code-window" aria-label="A SemText document fragment">
      <div className="code-chrome">
        <span className="dot live" aria-hidden="true" />
        <span className="dot" aria-hidden="true" />
        <span className="dot" aria-hidden="true" />
        <span>auth-notes.xhtml · what the model reads</span>
        {/* Rendered only after hydration: with no JS the controls are not
            in the DOM at all, so the static page stays zero-JS clean. */}
        {js && (
          <span className="ml-auto flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => show("source")}
              aria-pressed={view === "source"}
              className={pillClasses(view === "source")}
            >
              Source
            </button>
            <button
              type="button"
              onClick={() => show("rendered")}
              aria-pressed={view === "rendered"}
              className={pillClasses(view === "rendered")}
            >
              Render
            </button>
          </span>
        )}
      </div>
      <pre hidden={view !== "source"}>
        <code>{SOURCE}</code>
      </pre>
      {/* data-sem-theme keys the copied theme's tokens; data-color-mode="dark"
          pins the dark token block so the card sits on the page's own palette.
          paneRef scopes the Render enhancement to THIS pane only (see show()). */}
      <div
        ref={paneRef}
        hidden={view !== "rendered"}
        data-sem-theme="minimal-tech-light"
        data-color-mode="dark"
        className="px-4 py-4 sm:px-5"
        dangerouslySetInnerHTML={{ __html: RENDERED_HTML }}
      />
    </figure>
  );
}
