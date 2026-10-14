/*
 * semtext-island.js — the Lit SemText runtime island bridge (design v2 §2.2).
 *
 * The SemText runtime is a browser artifact: it is vendored (never rebuilt)
 * and booted imperatively from Hologram actions via this bridge. Hologram
 * pages/components stay on their side of the boundary (view pills, copy/save
 * as native actions); every imperative DOM wiring lives here, one documented
 * seam, so the transpiler never has to see it.
 *
 * Serving: /js/semtext-island.js (priv/static/js, via Plug.Static) and the
 * bundles themselves at /semtext/** (priv/static/semtext, the same artefacts
 * the Next.js site ships — see scripts/sync note in the repo CHANGELOG).
 *
 * Status: P0 skeleton. boot()/wire()/hydrate() below carry the load-bearing
 * mechanics (pane flag scoping, sequential module/classic script loading,
 * boot guards with timed re-checks); the pane semantics (PANE_HANDLERS
 * chain, per-example wiring, color-mode MutationObserver) land with the
 * port lanes once bundles.json drives ExampleViewer (design v2 §2.2-§2.3).
 *
 * Parity contract (asserted by the parity-harness lane — do not break):
 *   figure.code-window + aria-label per example · view pills with
 *   aria-pressed · data-sem-render-note panes · #example-<id> anchors ·
 *   data-color-mode sync.
 */
(function () {
  "use strict";

  if (window.SemtextIsland) return;

  // Pane-scoped off-switches, exactly as the Next.js site sets them before
  // the first script: __semJsOff kills runtime boot, __semLazyOff defers
  // lazy chunks. Read by the vendored bundles themselves.
  function scopePaneFlags(pane, opts) {
    pane.__semJsOff = !!(opts && opts.jsOff);
    pane.__semLazyOff = !!(opts && opts.lazyOff);
  }

  // Sequential loader: modules get the import() path, classic scripts get a
  // tag append. Resolves when every file has run, rejects on first failure.
  function loadScripts(files, pane) {
    return files.reduce(function (p, file) {
      return p.then(function () {
        if (file.type === "module") {
          return import(file.src);
        }
        return new Promise(function (resolve, reject) {
          var el = document.createElement("script");
          el.src = file.src;
          el.onload = resolve;
          el.onerror = function () {
            reject(new Error("semtext-island: failed to load " + file.src));
          };
          pane.appendChild(el);
        });
      });
    }, Promise.resolve());
  }

  var SEMTEXT_BASE = "/semtext/";

  window.SemtextIsland = {
    base: SEMTEXT_BASE,

    // boot(files, pane, opts) — boot the vendored runtime inside one pane.
    // files: [{src, type: "module"|"classic"}] — order matters (bundle then
    // lazy chunks then fallback), driven from bundles.json data.
    boot: function (files, pane, opts) {
      if (!pane) return Promise.reject(new Error("semtext-island: no pane"));
      scopePaneFlags(pane, opts);
      return loadScripts(files, pane);
    },

    // wire(pane, classForm) — attach the pane's event wiring (per-example
    // handler chain). Port-reference lane replaces this stub with the ported
    // PANE_HANDLERS chain.
    wire: function (pane, classForm) {
      if (!pane) return;
      pane.__semWired = true;
      pane.__semClassForm = classForm || null;
    },

    // hydrate(pane) — re-run boot + wiring after a Hologram patch replaces
    // the pane's DOM (client actions re-render templates; the vendored
    // runtime does not survive that). Guarded so double-hydration no-ops.
    hydrate: function (pane, files, opts) {
      if (!pane || pane.__semHydrated) return Promise.resolve();
      pane.__semHydrated = true;
      return this.boot(files || [], pane, opts).then(
        function () {
          pane.__semBooted = true;
        },
        function (err) {
          // Failed boots stay visible: the pane keeps its source/fallback
          // content and the render note never flips to "rendered".
          if (window.console && console.error) console.error(err);
        }
      );
    },
  };
})();
