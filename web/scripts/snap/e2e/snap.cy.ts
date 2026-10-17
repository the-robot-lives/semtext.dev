/// <reference types="cypress" />

/*
 * snap.cy.ts — render-snapshot spec for one reference tag.
 *
 * Driven by scripts/snap/snap-tag.mjs (`npm run snap:tag -- <tag> …`);
 * the driver passes { tag, base, dist, out } through Cypress env `snap`.
 * See ../README.md for the full contract and the --dist interception.
 *
 * What it captures, per example on /reference/<tag>/:
 *   - every view the example exposes (Source / Render pills, and the
 *     rendered element's own mode controls inside the pane),
 *   - at 1280 and 390 CSS px wide,
 *   - dark theme (the site chrome is dark-only; see README),
 * plus one full-page context shot per width.
 *
 * The discovery contract (stable selectors the /reference components
 * already ship — see components/example-viewer.tsx, code-viewer.tsx,
 * sem-md-example.tsx):
 *   - every example lives in an anchored container, `#example-<id>`
 *     (`example-primary` for the generator's example, the variant id for
 *     each entry in data/reference-example-variants.ts); a container's
 *     source and render views are paired BY THAT ANCHOR, never by
 *     occurrence order;
 *   - inside a container: the source figure
 *     `figure.code-window[aria-label^="Authored"]`, the render figure via
 *     its `[data-sem-theme]` pane (a not-yet-renderable tag carries an
 *     "… render unavailable" note figure instead), or the sem-md combined
 *     figure `aria-label="The sem-md example: rendered and authored"`;
 *   - the view pills are `.code-chrome button[aria-pressed]` —
 *     Side by side (the page default) / Source / Render;
 *   - a wired render carries the `[data-sem-upgraded]` marker inside
 *     the pane.
 * Shots are named `<tag>-<exampleId>-<view>-<width>.png` (view: split |
 * source | render | state). Figures matching none of the shapes above are
 * still captured: default state, then one shot per aria-pressed pill.
 *
 * Known limitation: mode controls inside a Lit shadow root (upgraded
 * sem-md via the lazy chunk) are not pierced — vanilla-DOM controls in
 * Render panes ARE captured.
 */

type SnapEnv = { tag: string; base: string; dist: string; out: string };
const snap = Cypress.env("snap") as SnapEnv;

const WIDTHS: Array<{ w: number; h: number }> = [
  { w: 1280, h: 800 },
  { w: 1024, h: 800 },
  { w: 390, h: 844 },
];

const RENDER_MARKER = "[data-sem-upgraded]";
const PILL_SEL = ".code-chrome button[aria-pressed]";
const PANE_CONTROLS =
  'button, summary, [role="tab"], [role="button"], input[type="radio"], input[type="checkbox"]';

type ExampleKind = "paired" | "source" | "semmd" | "unknown";
type Example = {
  /** The container's stable id: `#example-<id>` anchor + shot names. */
  exampleId: string;
  kind: ExampleKind;
  /** the anchored container selector */
  boxSel: string;
  /** figure selector for the source view (kind: paired | source) */
  srcSel?: string;
  /** figure selector for the render view (kind: paired) */
  renSel?: string;
  /** the one figure (kind: semmd | unknown) */
  figSel?: string;
};

function slug(s: string, max = 28): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, max) || "x"
  );
}

function note(msg: string, kind = "warn"): void {
  cy.task("snapNote", { kind, msg }, { log: false });
}

function isVisible(el: Element): boolean {
  return el.getClientRects().length > 0;
}

function findPill(scope: ParentNode, text: RegExp): HTMLElement | null {
  return (
    Array.from(scope.querySelectorAll<HTMLElement>(PILL_SEL)).find((b) =>
      text.test(b.textContent || "")
    ) || null
  );
}

/** Never emit an image under this many px in either dimension. */
const MIN_PX = 10;

/**
 * Guarded element screenshot.
 *
 * - `display: none` (wrong view active) → skip with a failure note; never
 *   climb to an ancestor, that would capture the wrong state.
 * - collapsed / zero-box host (e.g. `display: contents` custom elements,
 *   the 768×1 npl-declaration bug) → climb to the nearest ancestor with a
 *   real layout box and capture that instead, with a `-frame` suffix.
 * - still under MIN_PX after climbing → no PNG, failure note in index.md.
 */
function shotElement(sel: string, shotName: string): void {
  cy.window({ log: false }).then((win) => {
    const doc = win.document;
    const el = doc.querySelector<HTMLElement>(sel);
    if (!el) {
      note(`capture failed: ${shotName} — ${sel} not in the DOM — no PNG emitted`, "fail");
      return;
    }
    if (win.getComputedStyle(el).display === "none") {
      note(
        `capture failed: ${shotName} — ${sel} is display:none (view not active?) — no PNG emitted`,
        "fail"
      );
      return;
    }
    // Instant center-scroll, then wait for the layout box to be stable
    // across two animation frames before measuring or shooting — a shot
    // taken mid scroll-into-view clips to the viewport intersection and
    // degenerates to a 1px sliver.
    cy.then(() =>
      new Promise<DOMRect>((resolve) => {
        el.scrollIntoView({
          block: "center",
          behavior: "instant" as ScrollBehavior,
        });
        const t0 = Date.now();
        let last = el.getBoundingClientRect();
        let same = 0;
        const tick = () => {
          const r = el.getBoundingClientRect();
          same =
            Math.abs(r.top - last.top) < 0.5 && Math.abs(r.height - last.height) < 0.5
              ? same + 1
              : 0;
          last = r;
          if (same >= 2 || Date.now() - t0 > 1500) resolve(last);
          else win.requestAnimationFrame(tick);
        };
        win.requestAnimationFrame(tick);
      }).then((rect) => {
        let target: HTMLElement = el;
        let r = rect;
        let climbs = 0;
        while (
          (r.height < MIN_PX || r.width < MIN_PX) &&
          climbs < 6 &&
          target.parentElement &&
          target.parentElement !== doc.documentElement
        ) {
          target = target.parentElement;
          r = target.getBoundingClientRect();
          climbs += 1;
        }
        if (r.height < MIN_PX || r.width < MIN_PX) {
          note(
            `capture failed: ${shotName} — ${sel} (and ${climbs} ancestor(s)) stayed under ${MIN_PX}px at ${Math.round(r.width)}×${Math.round(r.height)} — no PNG emitted`,
            "fail"
          );
          return;
        }
        const suffix = target === el ? "" : "-frame";
        // Hide sticky/fixed chrome for element shots too: Cypress re-scrolls
        // the subject into view its own way before a subject screenshot,
        // which can park the element's first line under the sticky docs
        // header (npl-artifact-source-1280). Element shots are of the
        // example, not the page chrome.
        withStickyHidden(() => {
          cy.wrap(target, { log: false }).screenshot(`${shotName}${suffix}`, {
            log: false,
          });
        });
      })
    );
  });
}

/**
 * Hide position:sticky/fixed chrome (the docs header) for the duration of a
 * shot. Two reasons: fullPage stitches composite by scrolling, so sticky
 * elements repeat down the image; and Cypress re-scrolls a subject into
 * view before an element screenshot, which can park the element under the
 * sticky header. Scope: PAGE CHROME ONLY — nothing inside main#main is ever
 * hidden. Restores visibility after.
 */
function withStickyHidden(shot: () => void): void {
  cy.window({ log: false }).then((win) => {
    const hidden: HTMLElement[] = [];
    win.document.querySelectorAll("*").forEach((n) => {
      const el = n as HTMLElement;
      const pos = win.getComputedStyle(el).position;
      if (pos !== "sticky" && pos !== "fixed") return;
      // Page chrome only: the docs header / side nav live OUTSIDE main#main.
      // Never hide sticky chrome inside the captured content itself — a
      // sticky thead inside an example (sem-table) is content under review.
      if (el.closest("main#main")) return;
      el.style.visibility = "hidden";
      hidden.push(el);
    });
    (win as unknown as { __snapHidden?: HTMLElement[] }).__snapHidden = hidden;
  });
  shot();
  cy.window({ log: false }).then((win) => {
    const w = win as unknown as { __snapHidden?: HTMLElement[] };
    (w.__snapHidden || []).forEach((el) => {
      el.style.visibility = "";
    });
    w.__snapHidden = [];
  });
}

/** Discover every example figure under main#main. */
function discover(doc: Document): Example[] {
  // One anchored container per example: source and render views pair by
  // the `#example-<id>` anchor the page guarantees, so a primary example
  // plus N variants are N independent entries — never occurrence-matched.
  const de = doc.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    note(
      `horizontal overflow: scrollWidth ${de.scrollWidth} > clientWidth ${de.clientWidth} — the page must never scroll sideways`,
      "warn"
    );
  }
  const boxes = Array.from(
    doc.querySelectorAll<HTMLElement>("main#main div[id^='example-']")
  );
  const ordered: Example[] = [];

  for (const box of boxes) {
    const id = box.id.slice("example-".length) || "primary";
    const boxSel = `main#main #${CSS.escape(box.id)}`;
    // View pairing is by STABLE SHAPE, never stamped attributes: React
    // re-renders on every view switch and re-creates the figures, so only
    // selectors that re-resolve after a switch are safe. Within one
    // container each shape is unique: the authored source figure, the
    // live render figure (it owns the [data-sem-theme] pane), or the
    // not-yet-renderable note figure.
    const figs = Array.from(
      box.querySelectorAll<HTMLElement>("figure.code-window")
    );
    const srcSel = `${boxSel} figure.code-window[aria-label^="Authored "]`;
    const mdFig = figs.find(
      (f) =>
        f.getAttribute("aria-label") ===
        "The sem-md example: rendered and authored"
    );
    const hasPane = figs.some((f) => f.querySelector("[data-sem-theme]"));
    // The note pane carries a marker attribute, not a label: the one-card
    // relabel may rename the figure, the marker never moves.
    const hasNote = figs.some((f) =>
      f.querySelector("[data-sem-render-note]")
    );
    const renSel = `${boxSel} figure.code-window:has([data-sem-theme])`;
    const noteSel = `${boxSel} figure.code-window[aria-label$=" render unavailable"]`;

    if (mdFig) {
      ordered.push({
        exampleId: id,
        kind: "semmd",
        boxSel,
        figSel: `${boxSel} figure.code-window`,
        renSel,
      });
    } else if (hasPane && hasNote) {
      note(`example #${box.id}: both a render pane and a note figure — unexpected shape`, "warn");
      ordered.push({ exampleId: id, kind: "unknown", boxSel, figSel: `${boxSel} figure.code-window` });
    } else if (hasPane) {
      ordered.push({ exampleId: id, kind: "paired", boxSel, srcSel, renSel });
    } else if (hasNote) {
      ordered.push({ exampleId: id, kind: "source", boxSel, srcSel });
    } else if (figs.length) {
      ordered.push({ exampleId: id, kind: "unknown", boxSel, figSel: `${boxSel} figure.code-window` });
    } else {
      note(`example #${box.id}: no figure.code-window inside — nothing captured`, "warn");
    }
  }
  return ordered;
}

/**
 * Soft wait for the Render pane to be wired. Never fails the run.
 *
 * Success signals, whichever lands first:
 *   - the `[data-sem-upgraded]` marker inside the pane — set by the
 *     enhance pass on the panes it upgrades;
 *   - window.SemText defined — some upgraded subtrees set no marker of
 *     their own, so once the bundle is up we sit out ExampleViewer's
 *     re-wire schedule (boot + 150/500/1200 ms) and trust it.
 * On timeout a note is recorded and the shot is taken as-is (an
 * unenhanced pane is itself a review finding).
 */
function settleRender(figSel: string, paneSel: string, ms = 8000): void {
  cy.window({ log: false })
    .then(
      (win) =>
        new Cypress.Promise<"marker" | "loaded" | "timeout">((resolve) => {
          const t0 = Date.now();
          const tick = () => {
            const fig = win.document.querySelector(figSel);
            const pane = fig && fig.querySelector(paneSel);
            if (pane && pane.querySelector(RENDER_MARKER)) return resolve("marker");
            const w = win as unknown as { SemText?: unknown };
            if (w.SemText && Date.now() - t0 > 1600) return resolve("loaded");
            if (Date.now() - t0 > ms) return resolve("timeout");
            win.setTimeout(tick, 200);
          };
          tick();
        })
    )
    .then((how) => {
      if (how === "timeout") {
        note(
          `render never wired in ${figSel} ${paneSel} within ${ms}ms (no tier markers, window.SemTextFallback absent) — captured the pane as-is`
        );
      }
    });
}

/** Fixed settle (lazy-lit upgrades expose no stable marker to poll). */
function settleFixed(ms: number): void {
  cy.wait(ms, { log: false });
}

/**
 * Click each visible control inside a rendered pane, one shot per state.
 * Controls are collected once, then clicked in order through the command
 * queue (cy.then defers each click until the previous shot is done).
 */
function captureControls(
  figSel: string,
  paneSel: string,
  prefix: string,
  w: number
): void {
  cy.get("body", { log: false }).then(($b) => {
    const doc = $b[0].ownerDocument;
    const fig = doc.querySelector(figSel);
    const pane = fig && fig.querySelector(paneSel);
    if (!pane) {
      note(`${prefix}: no pane ${paneSel} inside ${figSel} — no control states captured`, "info");
      return;
    }
    const ctls = Array.from(pane.querySelectorAll<HTMLElement>(PANE_CONTROLS)).filter(
      isVisible
    );
    if (!ctls.length) {
      note(
        `${prefix}: pane has no visible light-DOM controls (shadow-DOM controls are not pierced) — default state only`,
        "info"
      );
      return;
    }
    const used = new Map<string, number>();
    ctls.forEach((el, i) => {
      const raw =
        el.getAttribute("aria-label") ||
        (el.textContent || "").trim().slice(0, 40) ||
        `ctl${i + 1}`;
      const base = slug(raw) || `ctl${i + 1}`;
      const n = (used.get(base) || 0) + 1;
      used.set(base, n);
      const shotName = `${prefix}-${n > 1 ? `${base}-${n}` : base}-${w}`;
      cy.then(() => {
        el.click();
      });
      cy.wait(450, { log: false });
      shotElement(figSel, shotName);
    });
  });
}

/** One example, one width: split (the default), source, render, controls. */
function captureExample(ex: Example, w: number): void {
  const id = ex.exampleId;
  if (ex.kind === "paired" || ex.kind === "source") {
    // Source view (the ExampleViewer default; click anyway to normalise
    // state after a previous width pass ended on Render).
    cy.document({ log: false }).then((doc) => {
      const box = doc.querySelector(ex.boxSel);
      if (!box) return;
      const pill = findPill(box, /source/i);
      if (pill) pill.click();
      else note(`${id}: no Source pill found — captured current state as source`);
    });
    cy.wait(400, { log: false });
    shotElement(ex.srcSel!, `${snap.tag}-${id}-source-${w}`);
  }

  if (ex.kind === "paired") {
    // Side by side — the page default, back to it explicitly so the shot
    // is deterministic: source left, live render right (or the
    // not-yet-renderable note — itself review evidence).
    cy.document({ log: false }).then((doc) => {
      const box = doc.querySelector(ex.boxSel);
      if (!box) return;
      const pill = findPill(box, /split/i);
      if (pill) pill.click();
      else note(`${id}: no Side-by-side pill found — captured current state as split`);
    });
    cy.wait(400, { log: false });
    shotElement(ex.boxSel, `${snap.tag}-${id}-split-${w}`);

    cy.document({ log: false }).then((doc) => {
      const box = doc.querySelector(ex.boxSel);
      if (!box) return;
      const pill = findPill(box, /render/i);
      if (pill) pill.click();
      else note(`no Render pill found for ${id} — skipping render view`);
    });
    settleRender(ex.renSel!, "[data-sem-theme]");
    settleFixed(700);
    shotElement(ex.renSel!, `${snap.tag}-${id}-render-${w}`);
    captureControls(ex.renSel!, "[data-sem-theme]", `${snap.tag}-${id}-render`, w);
  }

  if (ex.kind === "semmd") {
    // Combined figure; its default view is Render. Capture the default as
    // the split view (its only form), then Source for naming parity, then
    // Render, then pane controls.
    shotElement(ex.figSel!, `${snap.tag}-${id}-split-${w}`);
    cy.document({ log: false }).then((doc) => {
      const fig = doc.querySelector(ex.figSel!);
      if (!fig) return;
      const pill = findPill(fig, /source/i);
      if (pill) pill.click();
    });
    cy.wait(400, { log: false });
    shotElement(ex.figSel!, `${snap.tag}-${id}-source-${w}`);

    cy.document({ log: false }).then((doc) => {
      const fig = doc.querySelector(ex.figSel!);
      if (!fig) return;
      const pill = findPill(fig, /render/i);
      if (pill) pill.click();
    });
    // The lazy chunk upgrades <sem-md> to a Lit element; poll for its
    // definition, then a fixed settle — no stable in-pane marker exists.
    cy.window({ log: false })
      .then(
        (win) =>
          new Cypress.Promise<boolean>((resolve) => {
            const t = win.setTimeout(() => resolve(false), 8000);
            win.customElements.whenDefined("sem-md").then(() => {
              win.clearTimeout(t);
              resolve(true);
            });
          })
      )
      .then((ok) => {
        if (!ok) note("sem-md custom element never defined — captured the static table");
      });
    settleFixed(1200);
    shotElement(ex.figSel!, `${snap.tag}-${id}-render-${w}`);
    captureControls(ex.figSel!, ".ref-md-example", `${snap.tag}-${id}-render`, w);
  }

  if (ex.kind === "unknown") {
    // Generic fallback: default state, then one shot per aria-pressed pill.
    shotElement(ex.figSel!, `${snap.tag}-${id}-state-${w}`);
    cy.get("body", { log: false }).then(($b) => {
      const doc = $b[0].ownerDocument;
      const fig = doc.querySelector(ex.figSel!);
      if (!fig) return;
      const pills = Array.from(
        fig.querySelectorAll<HTMLElement>(PILL_SEL)
      ).filter(isVisible);
      pills.forEach((pill) => {
        const shotName = `${snap.tag}-${id}-${slug(pill.textContent || "pill")}-${w}`;
        cy.then(() => pill.click());
        cy.wait(500, { log: false });
        shotElement(ex.figSel!, shotName);
      });
    });
  }
}

describe(`snap /reference/${snap.tag}/`, () => {
  // --dist intercept counters, reported once at the end of the test.
  let distHits = 0;
  let distMisses = 0;

  it("captures every example in every view at both widths", () => {
    if (!snap.tag) throw new Error("Cypress env snap.tag is empty — run via npm run snap:tag");

    // Reload-safe capture on a dev base: other agents editing the worktree
    // make the dev server recompile mid-run, and the HMR socket would
    // hot-update (or full-reload) the page between click and screenshot —
    // half-rendered shots. Neuter the dev HMR/overlay sockets on every
    // page this run loads: the captured DOM then stays exactly as
    // hydrated. Non-dev sockets (none exist on this site) pass through.
    cy.on("window:before:load", (win) => {
      // The site sets html{scroll-behavior:smooth}. Cypress' internal
      // scroll-into-view before an element screenshot is then ASYNC, and
      // the shot lands mid-scroll with the element off-viewport — the
      // 768×1px degenerate captures. Force instant scrolling for the run.
      const st = win.document.createElement("style");
      st.textContent = [
        "html, body, * { scroll-behavior: auto !important; }",
        // reduced-motion equivalent: no animation/transition frame may
        // land under a screenshot.
        "*, *::before, *::after {",
        "  animation-duration: 0s !important; animation-delay: 0s !important;",
        "  transition-duration: 0s !important; transition-delay: 0s !important;",
        "}",
      ].join("");
      win.document.head.appendChild(st);
      const RealWS = win.WebSocket;
      const PatchedWS = function (this: unknown, url: unknown, protocols?: unknown) {
        if (/hmr|webpack|_next|turbo/.test(String(url))) {
          return {
            url: String(url),
            readyState: 3, // CLOSED — the HMR client no-ops on a dead socket
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3,
            protocol: "",
            extensions: "",
            bufferedAmount: 0,
            binaryType: "blob",
            send() {},
            close() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() {
              return false;
            },
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null,
          } as unknown as WebSocket;
        }
        return new RealWS(url as string, protocols as string | string[]);
      } as unknown as typeof WebSocket;
      PatchedWS.prototype = RealWS.prototype;
      (win as unknown as { WebSocket: typeof WebSocket }).WebSocket = PatchedWS;
    });

    // --dist: serve /semtext/** from a privately built bundle dir.
    const start = snap.dist
      ? cy.task("snapReadDist", snap.dist, { timeout: 60000 }).then((map) => {
          if (!map) throw new Error(`--dist directory unreadable: ${snap.dist}`);
          const files = map as Record<string, { body: string; type: string }>;
          cy.intercept("/semtext/**", (req) => {
            const rel = decodeURIComponent(new URL(req.url).pathname).replace(
              /^\/semtext\//,
              ""
            );
            // Pinned URLs carry a version / stable / latest prefix
            // (/semtext/v0.1.0/…, /semtext/stable/…); the private dist is
            // flat (the npl build layout), so look those prefixes through.
            const unpinned = rel.replace(
              /^(?:v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?|stable|latest)\//,
              ""
            );
            const hit = files[rel] ?? files[unpinned];
            if (hit) {
              distHits += 1;
              req.reply({
                statusCode: 200,
                body: hit.body,
                headers: {
                  "content-type": hit.type,
                  "cache-control": "no-store",
                },
              });
            } else {
              distMisses += 1;
              req.continue();
            }
          });
        })
      : cy.wrap(null, { log: false });

    start.then(() => {
      cy.visit(`/reference/${snap.tag}/`);
      cy.get("main#main", { timeout: 30000 }).should("exist");

      cy.get("body", { log: false }).then(($b) => {
        const doc = $b[0].ownerDocument;
        const figs = doc.querySelectorAll("main#main figure.code-window");
        if (!figs.length) {
          note("no figure.code-window examples on this page — full-page shots only");
        }
      });

      // Hydration gate: script-only chrome buttons (Copy/Save or the
      // view pills) exist only after React hydrates.
      cy.get("main#main .code-chrome button", { timeout: 30000 })
        .should("have.length.gte", 1)
        .then(() => {
          // Settle: document complete + a quiet beat so dev-mode fonts,
          // lazy CSS and any in-flight compile output have landed before
          // the first shot (HMR socket is already neutered above).
          cy.window({ log: false }).should((win) => {
            expect(win.document.readyState, "readyState").to.eq("complete");
          });
          cy.wait(800, { log: false });
          cy.get("body", { log: false }).then(($b) => {
            const examples = discover($b[0].ownerDocument);
            if (!examples.length) {
              note("no examples discovered — full-page shots only");
            }
            WIDTHS.forEach(({ w, h }) => {
              cy.viewport(w, h);
              cy.wait(300, { log: false });
              examples.forEach((ex) => captureExample(ex, w));
              withStickyHidden(() => {
                cy.screenshot(`${snap.tag}-fullpage-${w}`, {
                  capture: "fullPage",
                  log: false,
                });
              });
            });
            if (snap.dist) {
              cy.then(() => {
                cy.task(
                  "snapNote",
                  {
                    kind: "info",
                    msg: `--dist ${snap.dist}: ${distHits} /semtext request(s) served from the private build, ${distMisses} passed through to the server`,
                  },
                  { log: false }
                );
              });
            }
          });
        });
    });
  });
});
