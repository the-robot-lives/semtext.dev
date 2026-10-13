"use client";

import { useEffect, useRef, useState } from "react";
import { CodeBody, CopySaveButtons } from "@/components/code-viewer";
import type { BundleEntry } from "@/data/reference-tags";

/*
 * One authored example on /reference: a view switch over the same authored
 * block — Split (source left, live render right; the default), Source
 * only, Render only. Every view is ONE window card: a single chrome row
 * (filename, toggle, Copy/Save) over the pane(s).
 *
 * The toggle follows the landing's hero-window control: the same pill
 * classes in the code chrome, revealed only after hydration — with no
 * JavaScript the buttons are not in the DOM at all, so the static export
 * stays zero-JS safe and shows the side-by-side layout with the
 * highlighted source and the authored markup in the render pane (the
 * vocabulary stylesheet the layout carries styles it as authored prose).
 *
 * The render runtime is data-driven: the page passes the shipped bundle
 * files data/bundles.json lists for this tag, and Render lazily loads
 * exactly those (the lazy loader and its chunk, the npl full bundle once
 * it ships, the fallback enhancement tier). A tag no shipped bundle
 * provides renders as a muted note instead — and flips to a live render
 * automatically once the bundle sync lands and the map is regenerated.
 *
 * Runtime loading is pane-scoped: the page-wide boot switches
 * (window.__semJsOff for the full bundles and the fallback bundle,
 * window.__semLazyOff for the lazy loaders) keep every bundle from
 * auto-wiring the DOCUMENT on injection — a document pass would enhance
 * every hidden example pane at once (and mutate panes React is still
 * hydrating). Wiring is explicit per pane: the lazy tier is driven
 * through window.SemTextLazy.hydrate(root), the fallback tier through
 * window.SemTextFallback's per-pane handlers. Hydration can still reset
 * the pane around boot (the hazard the hero window documents), so wiring
 * is re-checked on a short schedule; each re-check is a no-op once the
 * pane's elements carry the bundle's tier markers.
 */

/*
 * The fallback bundle's pane-scoped surface. window.SemTextFallback is
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

interface LazyBundle {
  hydrate?: (root: Document | HTMLElement) => void;
}

function fallbackBundle(): FallbackBundle | null {
  const fb = (window as unknown as { SemTextFallback?: FallbackBundle })
    .SemTextFallback;
  return fb && typeof fb.enhance === "function" ? fb : null;
}

function lazyBundle(): LazyBundle | null {
  const lz = (window as unknown as { SemTextLazy?: LazyBundle }).SemTextLazy;
  return lz && typeof lz.hydrate === "function" ? lz : null;
}

const THEME_CSS = [
  "/semtext/themes/_vocabulary.css",
  "/semtext/themes/minimal-tech-light.css",
];

/*
 * The shipped runtime files data/bundles.json lists for one tag, loaded
 * once per page on the first pane that needs them: the vocabulary
 * stylesheets, then every bundle file in map order (lazy loader, full
 * bundle, fallback tier). The page-wide boot switches go in before the
 * first script so nothing auto-wires the document; pane wiring is
 * explicit below instead. Files already injected earlier on this page are
 * not re-fetched (the switches would be redundant anyway).
 */
let booted = false;
const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    // The lazy loaders (and their chunks, which they import themselves)
    // are module builds — a classic script tag throws on their
    // import.meta. The IIFE bundles and the fallback tier are classic.
    if (/-lazy\.js$/.test(src)) script.type = "module";
    script.onload = () => {
      loadedScripts.add(src);
      resolve();
    };
    script.onerror = () => reject(new Error(`${src} failed to load`));
    document.head.appendChild(script);
  });
}

async function bootElementRuntime(files: string[]): Promise<void> {
  for (const href of THEME_CSS) {
    if (document.querySelector(`link[href="${href}"]`)) continue;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  }
  const w = window as unknown as {
    __semJsOff?: boolean;
    __semLazyOff?: boolean;
  };
  if (!loadedScripts.size) {
    // No bundle has booted yet: pin the page-wide opt-outs before the
    // first script lands so none of the tiers auto-wire the document.
    w.__semJsOff = true;
    w.__semLazyOff = true;
  }
  if (!booted) booted = true;
  for (const f of files) {
    await loadScript(`/semtext/${f}`);
  }
}

/*
 * The fallback bundle's handler chain, minus the two document-scoped
 * passes: enhanceAudience always re-collects sem-audiences profiles across
 * the WHOLE document (two example panes here carry the same profile ids,
 * so each call would log duplicate-id warnings), and enhanceTarget no-ops
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

function hydratePane(pane: HTMLDivElement | null) {
  const lz = lazyBundle();
  if (!pane || !lz) return;
  lz.hydrate!(pane);
}

/* The landing's view-control pills. */
function pillClasses(active: boolean) {
  return [
    "inline-flex min-h-7 cursor-pointer items-center whitespace-nowrap rounded-full border px-3 py-1",
    "font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors",
    active
      ? "border-violet bg-violet text-white"
      : "border-code-border text-code-gray hover:border-violet-soft hover:text-ink",
  ].join(" ");
}

type ViewMode = "split" | "source" | "render";

export function ExampleViewer({
  name,
  code,
  renderable,
  bundles = [],
  exampleLabel,
  renderNote,
}: {
  name: string;
  code: string;
  renderable: boolean;
  /** Shipped bundle files data/bundles.json lists for this tag. */
  bundles?: BundleEntry[];
  /** Distinguishes variant examples of one tag in labels and AT names. */
  exampleLabel?: string;
  /** Why the render pane is a note instead of a live render. */
  renderNote?: string;
}) {
  const [js, setJs] = useState(false);
  const [view, setView] = useState<ViewMode>("split");
  const paneRef = useRef<HTMLDivElement>(null);

  useEffect(() => setJs(true), []);

  const files = bundles.map((b) => b.file);
  const lazyCovered = files.includes("semtext-lazy.js");

  function ensureRuntime() {
    if (!renderable) return;
    bootElementRuntime(files)
      .then(() => {
        if (lazyCovered) hydratePane(paneRef.current);
        wirePane(paneRef.current);
        // Hydration may reset this pane around boot (the hero window's
        // hazard); each re-check is a no-op once the pane carries the
        // bundle's tier markers. The lazy chunk's Lit upgrade lands
        // asynchronously after hydrate(), so keep re-checking.
        for (const ms of [150, 500, 1200, 2500])
          setTimeout(() => {
            if (lazyCovered) hydratePane(paneRef.current);
            wirePane(paneRef.current);
          }, ms);
      })
      .catch(() => {
        // Without the bundle the rendered pane still shows every element:
        // the vocabulary CSS hides nothing until a tier marker is set.
      });
  }

  // The default view is side by side, render pane included — wire the
  // runtime on mount as well as on view switches.
  useEffect(() => {
    if (js && renderable && (view === "split" || view === "render")) {
      ensureRuntime();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [js, renderable, view]);

  function show(next: ViewMode) {
    setView(next);
  }

  const labelSuffix = exampleLabel ? ` — ${exampleLabel}` : "";
  const toggle =
    js && (renderable || view !== "render") ? (
      <span className="ml-2 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => show("split")}
          aria-pressed={view === "split"}
          className={pillClasses(view === "split")}
        >
          Split
        </button>
        <button
          type="button"
          onClick={() => show("source")}
          aria-pressed={view === "source"}
          className={pillClasses(view === "source")}
        >
          Source
        </button>
        {renderable ? (
          <button
            type="button"
            onClick={() => show("render")}
            aria-pressed={view === "render"}
            className={pillClasses(view === "render")}
          >
            Render
          </button>
        ) : null}
      </span>
    ) : null;

  /*
   * ONE window card per view: a single chrome row (filename · authored
   * example, the view toggle, Copy/Save) over the pane(s). The chrome
   * never wraps mid-word or stretches the card: the filename truncates
   * with a tooltip, the pill labels are short and nowrap, and below 640px
   * Copy/Save drop to a second chrome row instead of overflowing.
   */
  const chrome = (
    <div className="code-chrome flex-wrap gap-y-1">
      <span className={renderable ? "dot live" : "dot"} aria-hidden="true" />
      <span
        className="min-w-0 flex-1 truncate"
        title={`${name}.html · authored example`}
      >
        {name}.html · authored example
      </span>
      {toggle}
      <CopySaveButtons code={code} filename={`${name}.html`} />
    </div>
  );

  /* Small pane caption inside the card body: "source" / "render". */
  const paneTag = (what: string) => (
    <div className="px-4 pt-3 pb-1 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-code-gray sm:px-5">
      {what}
    </div>
  );

  const sourcePane = (
    <>
      {paneTag("source")}
      <CodeBody code={code} />
    </>
  );

  /* The render pane: a live pane when a shipped bundle provides the tag,
   * otherwise the muted note the page derives from the same map — the
   * data-sem-render-note marker keeps the pane discoverable in tests. */
  const renderPane = renderable ? (
    <>
      {paneTag("render")}
      <div
        ref={paneRef}
        data-sem-theme="minimal-tech-light"
        data-color-mode="dark"
        className="min-h-24 px-4 py-4 sm:px-5"
        dangerouslySetInnerHTML={{ __html: code }}
      />
    </>
  ) : (
    <>
      {paneTag("render — pending bundle")}
      <div
        data-sem-render-note
        className="min-h-24 px-4 py-6 text-sm italic leading-6 text-ink-faint sm:px-5"
      >
        {renderNote ??
          "No shipped runtime — the authored example renders as plain HTML."}
      </div>
    </>
  );

  if (view === "source") {
    return (
      <figure
        className="code-window mt-8"
        aria-label={`Authored ${name} example${labelSuffix}`}
      >
        {chrome}
        {sourcePane}
      </figure>
    );
  }

  if (view === "render") {
    return (
      <figure
        className="code-window mt-8"
        aria-label={`${name} rendered${labelSuffix}`}
      >
        {chrome}
        {renderPane}
      </figure>
    );
  }

  /*
   * Split — the default. One card, two panes: ≥1024px equal columns with
   * a single divider; below, the render pane stacks under the source
   * inside the same card. Grid stretch keeps the panes one block, both
   * top-aligned; each pane scrolls its own overflow (CodeBody contains
   * horizontal code overflow, the render pane flows).
   */
  return (
    <figure
      className="code-window mt-8"
      aria-label={`Authored ${name} example${labelSuffix}`}
    >
      {chrome}
      <div className="grid grid-cols-1 lg:grid-cols-2">
        <div className="min-w-0 lg:pr-6">{sourcePane}</div>
        <div className="min-w-0 border-t border-white/10 lg:border-t-0 lg:border-l lg:pl-6">
          {renderPane}
        </div>
      </div>
    </figure>
  );
}
