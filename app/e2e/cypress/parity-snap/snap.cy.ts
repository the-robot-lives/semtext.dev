/// <reference types="cypress" />

/*
 * snap.cy.ts — render-snapshot spec for ONE route, driven by
 * scripts/parity/snap-tag.mjs (the driver passes { tag, route, base, dist,
 * out } through Cypress env `snap`). Route-parameterized port of the
 * landing-preview harness's scripts/snap/e2e/snap.cy.ts: identical
 * discovery contract and capture guarantees, runnable against EITHER side
 * of the replatform (Next.js landing-preview or the Hologram app).
 *
 * What it captures, per example on the route:
 *   - every view the example exposes (Source / Render pills, and the
 *     rendered element's own mode controls inside the pane),
 *   - at 1280, 1024, and 390 CSS px wide,
 *   - dark theme (the site chrome is dark-only on both sides),
 * plus one full-page context shot per width.
 *
 * The discovery contract (stable selectors BOTH implementations must ship
 * — see landing-preview components/example-viewer.tsx, code-viewer.tsx,
 * sem-md-example.tsx; port lanes reproduce them, scaffold.md "Conventions"):
 *   - every example lives in an anchored container, `#example-<id>`;
 *     source and render views pair BY THAT ANCHOR, never by occurrence;
 *   - inside a container: the source figure
 *     `figure.code-window[aria-label^="Authored "]`, the render figure via
 *     its `[data-sem-theme]` pane, or the not-yet-renderable note figure
 *     `[data-sem-render-note]` / `aria-label$=" render unavailable"`;
 *   - the view pills are `.code-chrome button[aria-pressed]`;
 *   - a wired render carries `[data-sem-fallback]` or `[data-sem-upgraded]`.
 * Shots are named `<tag>-<exampleId>-<view>-<width>.png`. A page with no
 * `main#main` anchor or no examples is a parity finding (noted), not a
 * crash — the run falls back to full-page shots.
 */

type SnapEnv = { tag: string; route: string; base: string; dist: string; out: string };
const snap = Cypress.env("snap") as SnapEnv;

// A snapshot of a broken page IS the parity evidence — an app whose
// runtime JS throws must still get captured (full-page + whatever
// rendered), so the diff shows the divergence instead of aborting.
// (The BDD suite keeps the strict uncaught-error + console policy; this
// config runs with supportFile: false, so nothing else applies.)
Cypress.on("uncaught:exception", () => false);

const WIDTHS: Array<{ w: number; h: number }> = [
  { w: 1280, h: 800 },
  { w: 1024, h: 800 },
  { w: 390, h: 844 },
];

const RENDER_MARKER = "[data-sem-fallback], [data-sem-upgraded]";
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
 * Guarded element screenshot (unchanged contract):
 * - `display: none` → failure note, no shot (never climb: wrong state);
 * - collapsed / zero-box host → climb to the nearest ancestor with a real
 *   layout box, `-frame` suffix;
 * - still under MIN_PX → failure note, no PNG.
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
            `capture failed: ${shotName} — ${sel} (and ${climbs} ancestor(s)) stayed under ${MIN_PX}px at ${Math.round(r.width)}x${Math.round(r.height)} — no PNG emitted`,
            "fail"
          );
          return;
        }
        const suffix = target === el ? "" : "-frame";
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
 * Hide position:sticky/fixed chrome for the duration of a shot (fullPage
 * stitches composite by scrolling — sticky chrome repeats; Cypress
 * re-scrolls subjects under sticky headers). Scope: PAGE CHROME ONLY —
 * nothing inside the content anchor is ever hidden.
 */
function withStickyHidden(shot: () => void): void {
  cy.window({ log: false }).then((win) => {
    const main = win.document.querySelector("main#main") || win.document.querySelector("main");
    const hidden: HTMLElement[] = [];
    win.document.querySelectorAll("*").forEach((n) => {
      const el = n as HTMLElement;
      const pos = win.getComputedStyle(el).position;
      if (pos !== "sticky" && pos !== "fixed") return;
      if (main && main.contains(el)) return;
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

/** Discover every example figure under the content anchor. */
function discover(doc: Document): { main: Element | null; examples: Example[] } {
  const main = doc.querySelector("main#main") || doc.querySelector("main");
  if (!main) {
    note(
      "no <main id=\"main\"> anchor on this page — the chrome contract (skip-link target + content anchor) is not met; full-page shots only",
      "warn"
    );
    return { main: null, examples: [] };
  }
  const de = doc.documentElement;
  if (de.scrollWidth > de.clientWidth + 1) {
    note(
      `horizontal overflow: scrollWidth ${de.scrollWidth} > clientWidth ${de.clientWidth} — the page must never scroll sideways`,
      "warn"
    );
  }
  const boxes = Array.from(main.querySelectorAll<HTMLElement>("div[id^='example-']"));
  const ordered: Example[] = [];

  for (const box of boxes) {
    const id = box.id.slice("example-".length) || "primary";
    const boxSel = `#${CSS.escape(box.id)}`;
    const figs = Array.from(box.querySelectorAll<HTMLElement>("figure.code-window"));
    const srcSel = `${boxSel} figure.code-window[aria-label^="Authored "]`;
    const mdFig = figs.find(
      (f) =>
        f.getAttribute("aria-label") === "The sem-md example: rendered and authored"
    );
    const hasPane = figs.some((f) => f.querySelector("[data-sem-theme]"));
    const hasNote = figs.some((f) => f.querySelector("[data-sem-render-note]"));
    const renSel = `${boxSel} figure.code-window:has([data-sem-theme])`;

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
  return { main, examples: ordered };
}

/**
 * Soft wait for the Render pane to be wired. Never fails the run: tier
 * markers ([data-sem-fallback]/[data-sem-upgraded]) or window.SemTextFallback
 * resolve early; on timeout the pane is captured as-is (an unenhanced pane
 * is itself a review finding).
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
            const w = win as unknown as { SemTextFallback?: unknown };
            if (w.SemTextFallback && Date.now() - t0 > 1600) return resolve("loaded");
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

function settleFixed(ms: number): void {
  cy.wait(ms, { log: false });
}

/**
 * Click each visible control inside a rendered pane, one shot per state.
 * Controls are collected once, then clicked in order through the command
 * queue.
 */
function captureControls(figSel: string, paneSel: string, prefix: string, w: number): void {
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
      const name = slug(raw) || `ctl${i + 1}`;
      const n = (used.get(name) || 0) + 1;
      used.set(name, n);
      const shotName = `${prefix}-${n > 1 ? `${name}-${n}` : name}-${w}`;
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
    shotElement(ex.figSel!, `${snap.tag}-${id}-state-${w}`);
    cy.get("body", { log: false }).then(($b) => {
      const doc = $b[0].ownerDocument;
      const fig = doc.querySelector(ex.figSel!);
      if (!fig) return;
      const pills = Array.from(fig.querySelectorAll<HTMLElement>(PILL_SEL)).filter(isVisible);
      pills.forEach((pill) => {
        const shotName = `${snap.tag}-${id}-${slug(pill.textContent || "pill")}-${w}`;
        cy.then(() => pill.click());
        cy.wait(500, { log: false });
        shotElement(ex.figSel!, shotName);
      });
    });
  }
}

describe(`snap ${snap.route}`, () => {
  let distHits = 0;
  let distMisses = 0;

  it("captures every example in every view at all widths", () => {
    if (!snap.route) throw new Error("Cypress env snap.route is empty — run via snap-tag.mjs");

    // Capture stability, identical to the original harness: instant
    // scrolling (the site sets scroll-behavior:smooth; async scroll-into-
    // view degenerates shots), no animation/transition frames under a
    // screenshot, and live-update sockets neutered so the DOM stays exactly
    // as served. The Next HMR sockets AND the Hologram runtime socket are
    // neutered — SSR content is what is under review.
    cy.on("window:before:load", (win) => {
      const st = win.document.createElement("style");
      st.textContent = [
        "html, body, * { scroll-behavior: auto !important; }",
        "*, *::before, *::after {",
        "  animation-duration: 0s !important; animation-delay: 0s !important;",
        "  transition-duration: 0s !important; transition-delay: 0s !important;",
        "}",
      ].join("");
      win.document.head.appendChild(st);
      const RealWS = win.WebSocket;
      const PatchedWS = function (this: unknown, url: unknown, protocols?: unknown) {
        if (/hmr|webpack|_next|turbo|hologram|phoenix/i.test(String(url))) {
          return {
            url: String(url),
            readyState: 3, // CLOSED — live clients no-op on a dead socket
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
            const hit = files[rel];
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
      cy.visit(snap.route);
      cy.get("main#main, main", { timeout: 30000 })
        .should("exist")
        .then(($main) => {
          if (!$main.attr("id")) {
            note("content anchor is <main> without id=\"main\" — chrome contract gap (noted, not fatal)");
          }
        });

      // Discover FIRST; the hydration gate only applies to pages that
      // should carry example chrome at all (a smoke/landing page without
      // code windows is a full-page-shots run, not a failure).
      cy.get("body", { log: false }).then(($b) => {
        const doc = $b[0].ownerDocument;
        const { examples } = discover(doc);
        if (!examples.length) {
          note("no examples discovered — full-page shots only");
        }
        const gate = (): Cypress.Chainable => {
          if (!examples.length) return cy.wrap(null, { log: false });
          return cy
            .get("main#main .code-chrome button, main .code-chrome button", { timeout: 30000 })
            .should("have.length.gte", 1)
            .then(() => {
              cy.window({ log: false }).should((win) => {
                expect(win.document.readyState, "readyState").to.eq("complete");
              });
            });
        };
        gate().then(() => {
          // Settle beat: fonts, lazy CSS and in-flight compiles land before
          // the first shot (live sockets are already neutered).
          cy.wait(800, { log: false });
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
