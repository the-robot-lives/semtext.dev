"use client";

import { useEffect, useRef, useState } from "react";
import { CodeBody, CopySaveButtons } from "@/components/code-viewer";
import type { BundleEntry } from "@/data/reference-tags";
import { semtextAsset } from "@/lib/semtext-asset";

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
 * exactly those (semtext.js — the one bundle since runtime 0.9.0 — the
 * lazy loader and its chunk, the npl bundle). A tag no shipped bundle
 * provides renders as a muted note instead — and flips to a live render
 * automatically once the bundle sync lands and the map is regenerated.
 *
 * Runtime loading is lazy and marker-gated: the __semLazyOff switch keeps
 * the lazy loaders from auto-wiring the DOCUMENT on injection; semtext.js
 * (the one bundle, no kill switch since the runtime's one-bundle refactor)
 * is only ever loaded from this post-hydration click path, so its
 * document pass cannot race React hydration. Wiring is explicit per pane:
 * the lazy tier through window.SemTextLazy.hydrate(root), the full bundle
 * through window.SemText.enhanceCore(root). Hydration can still reset the
 * pane around boot (the hazard the hero window documents), so wiring is
 * re-checked on a short schedule; each re-check is a no-op once the
 * pane's elements carry the data-sem-upgraded markers.
 */

/*
 * The one bundle's scoped surface. window.SemText is declared elsewhere
 * (hero window) with the enhance pass shapes, so read it through a local
 * view instead of re-augmenting the global.
 */
type EnhanceFn = (root: Document | HTMLElement) => void;
interface SemBundle {
  enhanceCore: EnhanceFn;
  enhanceMdDocument?: EnhanceFn;
  enhanceReading?: EnhanceFn;
}

interface LazyBundle {
  hydrate?: (root: Document | HTMLElement) => void;
}

function semBundle(): SemBundle | null {
  const b = (window as unknown as { SemText?: SemBundle }).SemText;
  return b && typeof b.enhanceCore === "function" ? b : null;
}

function lazyBundle(): LazyBundle | null {
  const lz = (window as unknown as { SemTextLazy?: LazyBundle }).SemTextLazy;
  return lz && typeof lz.hydrate === "function" ? lz : null;
}

const THEME_CSS = [
  semtextAsset("themes/_vocabulary.css"),
  semtextAsset("themes/minimal-tech-light.css"),
];

/*
 * The shipped runtime files data/bundles.json lists for one tag, loaded
 * once per page on the first pane that needs them: the vocabulary
 * stylesheets, then every bundle file in map order (lazy loader, full
 * bundle, fallback tier). The page-wide boot switches go in before the
 * first script so the lazy loader never auto-wires the document (the
 * full bundle has no kill switch since the one-bundle refactor — loading
 * it document-wires once, which is why it is only ever loaded from this
 * post-hydration click path, and marker idempotence makes the explicit
 * pane wiring below a no-op afterwards). Files already injected earlier
 * on this page are not re-fetched.
 */
let booted = false;
const loadedScripts = new Set<string>();
/** Boot token: the latest ensureRuntime() call; stale timers no-op on it. */
let bootSeq = 0;

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    // The lazy loaders and everything under their chunk directories (the
    // chunks themselves, which import their shared siblings relatively)
    // are module builds — a classic script tag throws on their
    // import.meta. The IIFE bundles (full bundles, shell, fallback tier)
    // are classic. Test the PATH only: pinned URLs carry a ?v= query.
    const assetPath = src.split("?")[0];
    if (/-lazy\.js$/.test(assetPath) || /(^|\/)[a-z-]*chunks\//.test(assetPath)) {
      script.type = "module";
    }
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
    __semLazyOff?: boolean;
  };
  if (!loadedScripts.size) {
    // No bundle has booted yet: pin the lazy opt-out before the first
    // script lands so the lazy loader never auto-wires the document.
    // (semtext.js has no kill switch — see the header note.)
    w.__semLazyOff = true;
  }
  if (!booted) booted = true;
  for (const f of files) {
    await loadScript(semtextAsset(f));
  }
}

/*
 * Pane wiring: the one bundle's core pass (the vanilla handler chain —
 * source snapshot, attrs, decks, reveals, progress, audience, deep links)
 * over the pane scope. Idempotent via the data-sem-upgraded markers, so
 * re-checks after hydration resets are no-ops once wired.
 */
function wirePane(pane: HTMLDivElement | null) {
  if (!pane) return;
  if (pane.querySelector("[data-sem-upgraded]")) return;
  const b = semBundle();
  if (!b) return;
  b.enhanceCore(pane);
}

function hydratePane(pane: HTMLDivElement | null) {
  const lz = lazyBundle();
  if (!pane || !lz) return;
  lz.hydrate!(pane);
}

/*
 * A class-form example (`div.sem-<tag>` / `div.npl-<tag>` hosts). The lazy
 * scans are tag-shaped (custom-element names only), so these wire only
 * under the alias runtime bundles.json lists (see aliasRuntime in
 * data/reference-tags.ts).
 */
function usesClassForm(code: string): boolean {
  return /class\s*=\s*["'`][^"'`]*\b(sem|npl)-[a-z0-9-]+/.test(code);
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
  aliasRuntime,
  exampleLabel,
  renderNote,
}: {
  name: string;
  code: string;
  renderable: boolean;
  /** Shipped bundle files data/bundles.json lists for this tag. */
  bundles?: BundleEntry[];
  /** Extra bundle files class-form examples need (bundles.json's
   * aliasRuntime — passed down as a prop so the client bundle never
   * embeds the tag JSON). */
  aliasRuntime?: Record<string, string>;
  /** Distinguishes variant examples of one tag in labels and AT names. */
  exampleLabel?: string;
  /** Why the render pane is a note instead of a live render. */
  renderNote?: string;
}) {
  const [js, setJs] = useState(false);
  const [view, setView] = useState<ViewMode>("split");
  const paneRef = useRef<HTMLDivElement>(null);
  // The pane follows the page's color mode: the vocabulary theme keys its
  // paint off the pane's data-color-mode, and the page chrome owns the real
  // choice (dark is the site default; the attribute wins once mounted).
  const [colorMode, setColorMode] = useState("dark");

  useEffect(() => setJs(true), []);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () =>
      setColorMode(root.getAttribute("data-color-mode") ?? "dark");
    sync();
    const obs = new MutationObserver(sync);
    obs.observe(root, { attributes: true, attributeFilter: ["data-color-mode"] });
    return () => obs.disconnect();
  }, []);

  /*
   * Everything served from /semtext/ for this tag: the map's bundle files
   * (minus any namespace loader we must not run — npl-lazy.js has no off
   * switch and would document-scan the whole page) plus every chunk the map
   * names. Chunks self-define their elements on import (the sem lazy
   * loader re-imports its own chunk through the same module cache, so the
   * duplicate load is free); loading chunks directly is what lets an npl
   * tag wire pane-scoped without its document scanner.
   */
  const SEM_LAZY = "semtext-lazy.js";
  const files = bundles.map((b) => b.file);
  const lazyCovered = files.includes(SEM_LAZY);
  const chunkFiles = bundles
    .map((b) => b.chunk)
    .filter((c): c is string => typeof c === "string");
  const classForm = usesClassForm(code);
  const aliasFiles =
    classForm && aliasRuntime
      ? Object.values(aliasRuntime).filter((f) => f && !files.includes(f))
      : [];
  const loadFiles = [
    ...files.filter((f) => f === SEM_LAZY || !/-lazy\.js$/.test(f)),
    ...chunkFiles,
    ...aliasFiles,
  ];

  function ensureRuntime() {
    if (!renderable) return;
    const pane = paneRef.current;
    const boot = ++bootSeq;
    if (pane) {
      // Boot guard (the sem-source lane's race): interacting with the pane
      // mid-boot snapshots a half-wired tree. Freeze pointer interaction
      // until wiring settles — the pane's first tier marker, the last
      // re-check, or a failed boot, whichever lands first (bounded ~2.5s).
      pane.dataset.semBooting = "";
      pane.style.pointerEvents = "none";
    }
    const release = (p: HTMLDivElement | null) => {
      if (!p) return;
      delete p.dataset.semBooting;
      p.style.pointerEvents = "";
    };
    bootElementRuntime(loadFiles)
      .then(() => {
        const checks = [150, 500, 1200, 2500];
        const wire = () => {
          const p = paneRef.current;
          if (lazyCovered) hydratePane(p);
          wirePane(p);
          return p;
        };
        wire();
        // Hydration may reset this pane around boot (the hero window's
        // hazard); each re-check is a no-op once the pane carries the
        // bundle's tier markers. The lazy chunk's Lit upgrade lands
        // asynchronously after hydrate(), so keep re-checking; release the
        // boot guard early once a marker is on the pane. Timers from a
        // superseded boot (view switch) no-op on the boot token.
        checks.forEach((ms, i) =>
          setTimeout(() => {
            if (boot !== bootSeq) return;
            const p = wire();
            if (
              p &&
              (i === checks.length - 1 ||
                p.querySelector("[data-sem-upgraded]"))
            ) {
              release(p);
            }
          }, ms),
        );
      })
      .catch(() => {
        // Without the bundle the rendered pane still shows every element:
        // the vocabulary CSS hides nothing until a tier marker is set.
        release(paneRef.current);
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
      /* Below sm the pills take their own full-width chrome row (order-last
         keeps them after filename/actions there); sm+ unchanged. */
      <span className="ml-2 flex items-center gap-1.5 max-sm:order-last max-sm:ml-0 max-sm:w-full">
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
   * the pills drop to one full-width second row while Copy/Save become
   * icon buttons beside the filename (ViewerActions below).
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
      <ViewerActions code={code} filename={`${name}.html`} />
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
        data-color-mode={colorMode}
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
      <>
        <figure
          className="code-window mt-8"
          aria-label={`Authored ${name} example${labelSuffix}`}
        >
          {chrome}
          {sourcePane}
        </figure>
      </>
    );
  }

  if (view === "render") {
    return (
      <>
        <figure
          className="code-window mt-8"
          aria-label={`${name} rendered${labelSuffix}`}
        >
          {chrome}
          {renderPane}
        </figure>
      </>
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
    <>
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
    </>
  );
}

/*
 * The viewer's Copy/Save pair. Same actions as code-viewer's shared
 * CopySaveButtons — copy the authored source, download `filename` — but
 * below `sm` they render as icon buttons (fixed 28px targets, constant
 * aria-labels, status in `title` and a live region) so the chrome row
 * keeps filename + actions on one line at 390 instead of wrapping text
 * buttons mid-row; at `sm` and up they fall back to the shared text
 * pair. Icons are inline SVG (no font-glyph surprises).
 */
function ViewerActions({ code, filename }: { code: string; filename: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "saved" | "error">(
    "idle"
  );
  const flash = (next: typeof status) => {
    setStatus(next);
    window.setTimeout(() => setStatus("idle"), 2000);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      flash("copied");
    } catch {
      flash("error");
    }
  };

  const save = () => {
    try {
      const blob = new Blob([code], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      flash("saved");
    } catch {
      flash("error");
    }
  };

  const iconBtn =
    "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border transition-colors sm:hidden";
  const idle = "border-code-border text-code-gray hover:border-violet-soft hover:text-ink";
  const done = "border-violet text-violet-soft";

  return (
    <span className="ml-2 flex items-center gap-1.5" role="group" aria-label="Example actions">
      {/* Icon buttons below sm; display:none removes them from the a11y
          tree, so exactly one Copy and one Save are ever exposed. */}
      <button
        type="button"
        onClick={copy}
        aria-label="Copy code"
        title={status === "copied" ? "Copied" : "Copy code"}
        className={`${iconBtn} ${status === "copied" ? done : idle}`}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="4.5" y="4.5" width="8" height="8" rx="1.5" stroke="currentColor" />
          <path d="M9.5 2.5h-6a1 1 0 0 0-1 1v6" stroke="currentColor" />
        </svg>
      </button>
      <button
        type="button"
        onClick={save}
        aria-label={`Save ${filename}`}
        title={`Save ${filename}`}
        className={`${iconBtn} ${status === "saved" ? done : idle}`}
      >
        <svg aria-hidden="true" width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1.5v7m0 0L4.2 5.7M7 8.5l2.8-2.8" stroke="currentColor" strokeLinecap="round" />
          <path d="M1.5 9.5v2a1 1 0 0 0 1 1h9a1 1 0 0 0 1-1v-2" stroke="currentColor" strokeLinecap="round" />
        </svg>
      </button>
      {/* Text pair at sm+; hidden below sm. */}
      <span className="hidden items-center sm:flex">
        <CopySaveButtons code={code} filename={filename} />
      </span>
      <span aria-live="polite" className="sr-only">
        {status === "copied"
          ? "Copied to clipboard"
          : status === "saved"
            ? "Download started"
            : status === "error"
              ? "Action failed"
              : ""}
      </span>
    </span>
  );
}
