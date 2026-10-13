"use client";

import { useEffect, useRef, useState } from "react";
import { CodeViewer, CopySaveButtons } from "@/components/code-viewer";
import { SEMTEXT_VERSION } from "@/lib/semtext-version";

/*
 * One authored example on /reference: the code viewer (highlighting, line
 * numbers, Copy, Save) with an optional Source / Render toggle.
 *
 * The toggle follows the landing's hero-window control: the same pill
 * classes in the code chrome, revealed only after hydration — with no
 * JavaScript the buttons are not in the DOM at all, so the static export
 * stays zero-JS safe and shows the highlighted source by default.
 *
 * Render lazy-loads the element's runtime chunk (bootElementRuntime): the
 * vocabulary stylesheet the layout does not carry, plus the fallback
 * bundle copied verbatim into public/semtext/ — loaded ONCE on the first
 * Render, then THIS pane is enhanced, never the document (a document pass
 * would wire every hidden example pane and mutate panes React is still
 * hydrating). Hydration can still reset the pane around boot (the hazard
 * the hero window documents), so wiring is re-checked on a short
 * schedule; each re-check is a no-op once the pane's elements carry the
 * bundle's tier markers.
 */

/*
 * The fallback bundle's pane-scoped surface. Window["SemTextFallback"] is
 * declared elsewhere with the bare enhance() shape, so read it through a
 * local view of the full export set instead of re-augmenting the global.
 */
type EnhanceFn = (root: Document | HTMLElement) => void;
interface FallbackBundle {
  enhance: EnhanceFn;
  enhanceSource?: EnhanceFn;
  enhanceAttrs?: EnhanceFn;
  enhanceFacts?: EnhanceFn;
  enhanceDetails?: EnhanceFn;
  enhanceNote?: EnhanceFn;
  enhanceProperties?: EnhanceFn;
  enhanceViews?: EnhanceFn;
  enhanceReveal?: EnhanceFn;
  enhanceProgress?: EnhanceFn;
}

function fallbackBundle(): FallbackBundle | null {
  const fb = (window as unknown as { SemTextFallback?: FallbackBundle })
    .SemTextFallback;
  return fb && typeof fb.enhance === "function" ? fb : null;
}

const THEME_CSS = [
  "/semtext/themes/_vocabulary.css",
  "/semtext/themes/minimal-tech-light.css",
];

/*
 * The element runtime chunk, loaded once per page on the first Render:
 * the vocabulary stylesheets plus the fallback bundle copied verbatim
 * into public/semtext/ (VERSION.md). __semJsOff keeps the bundle from
 * auto-wiring the DOCUMENT on injection — a document pass would enhance
 * every hidden example pane at once (and mutate panes React is still
 * hydrating); wiring is explicit and pane-scoped below instead.
 */
let bootPromise: Promise<void> | null = null;
function bootElementRuntime(): Promise<void> {
  if (!bootPromise) {
    bootPromise = (async () => {
      for (const href of THEME_CSS) {
        if (document.querySelector(`link[href="${href}"]`)) continue;
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
      if (!window.SemTextFallback) {
        window.__semJsOff = true;
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = `/semtext/semtext-fallback.js?v=${SEMTEXT_VERSION}`;
          script.onload = () => resolve();
          script.onerror = () =>
            reject(new Error("semtext-fallback.js failed to load"));
          document.head.appendChild(script);
        });
      }
    })();
  }
  return bootPromise;
}

/*
 * K()'s handler chain, minus the two document-scoped passes:
 * enhanceAudience always re-collects sem-audiences profiles across the
 * WHOLE document (two example panes here carry the same profile ids, so
 * each call would log duplicate-id warnings), and enhanceTarget no-ops
 * for non-document roots anyway. Falls back to enhance() if the bundle
 * ever stops exporting the split.
 */
const PANE_HANDLERS = [
  "enhanceSource",
  "enhanceAttrs",
  "enhanceFacts",
  "enhanceDetails",
  "enhanceNote",
  "enhanceProperties",
  "enhanceViews",
  "enhanceReveal",
  "enhanceProgress",
] as const;

function wirePane(pane: HTMLDivElement | null) {
  const fb = fallbackBundle();
  if (!pane || !fb) return;
  if (pane.querySelector("[data-sem-fallback], [data-sem-upgraded]")) return;
  if (PANE_HANDLERS.every((h) => typeof fb[h] === "function")) {
    for (const h of PANE_HANDLERS) fb[h]!(pane);
  } else {
    fb.enhance(pane);
  }
}

/* The landing's view-control pills. */
function pillClasses(active: boolean) {
  return [
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

export function ExampleViewer({
  name,
  code,
  renderable,
}: {
  name: string;
  code: string;
  renderable: boolean;
}) {
  const [js, setJs] = useState(false);
  const [view, setView] = useState<"source" | "render">("source");
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => setJs(true), []);

  function show(next: "source" | "render") {
    setView(next);
    if (next !== "render") return;
    bootElementRuntime()
      .then(() => {
        wirePane(paneRef.current);
        // Hydration may reset this pane around boot (the hero window's
        // hazard); each re-check is a no-op once the pane carries the
        // bundle's tier markers.
        for (const ms of [150, 500, 1200]) setTimeout(() => wirePane(paneRef.current), ms);
      })
      .catch(() => {
        // Without the bundle the rendered view still shows every element:
        // the vocabulary CSS hides nothing until a tier marker is set.
      });
  }

  const toggle =
    js && renderable ? (
      <span className="ml-2 flex items-center gap-1.5">
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
          onClick={() => show("render")}
          aria-pressed={view === "render"}
          className={pillClasses(view === "render")}
        >
          Render
        </button>
      </span>
    ) : null;

  if (!renderable) {
    return (
      <div className="max-w-3xl">
        <CodeViewer
          code={code}
          filename={`${name}.html`}
          caption="authored example"
          label={`Authored ${name} example`}
        />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div hidden={view !== "source"}>
        <CodeViewer
          code={code}
          filename={`${name}.html`}
          caption="authored example"
          label={`Authored ${name} example`}
          actions={toggle}
        />
      </div>
      {/* The rendered pane: data-sem-theme keys the theme's tokens,
          data-color-mode pins the dark block so the render sits on the
          page's own palette. paneRef scopes the Render enhancement to THIS
          pane only — never a second full-document pass. */}
      <figure
        className="code-window mt-8"
        aria-label={`${name} rendered`}
        hidden={view !== "render"}
      >
        <div className="code-chrome">
          <span className="dot live" aria-hidden="true" />
          <span className="flex-1">
            {name}.html · rendered
          </span>
          {toggle}
          {/* Same action pair, same bar slots as the Source view's chrome:
              Copy and Save always address the authored source. Both need
              script, so they exist only after hydration (the pills'
              pattern) — the static export carries neither. */}
          {js && <CopySaveButtons code={code} filename={`${name}.html`} />}
        </div>
        <div
          ref={paneRef}
          data-sem-theme="minimal-tech-light"
          data-color-mode="dark"
          className="px-4 py-4 sm:px-5"
          dangerouslySetInnerHTML={{ __html: code }}
        />
      </figure>
    </div>
  );
}
