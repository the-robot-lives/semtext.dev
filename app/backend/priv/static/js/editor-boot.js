/*
 * editor-boot.js — the /editor page bootstrap (site-editor lane; real
 * bundle cutover, release sync 2026-10-17).
 *
 * Bundle loading is HYDRATION-SAFE BY CONSTRUCTION: the two bundles load
 * as template-authored <script defer> tags (editor_page.ex, order
 * load-bearing), the way the spec repo's own web/demo/editor.html does —
 * driving them through the island bridge's appended script tags races
 * Hologram hydration (a hydration re-render can detach a pending script
 * and its onload never fires, hanging the chain). The page-level boot
 * switches come from /js/editor-flags.js (first defer tag): nothing
 * auto-wires, so page-wide the bundles only register — every wiring on
 * this page is imperative and lives here.
 *
 *   /js/editor-flags.js        __semJsOff + __semLazyOff (first!)
 *   /semtext/semtext.js        the core vocabulary — registers every
 *                              sem-* element the editor's canvas renders
 *   /semtext/semtext-editor.js the editor (§9.2): registers <sem-editor>
 *                              + <sem-editor-code>, installs the
 *                              `SemTextEditor` global
 *                              (claim / claimPending / createDocument /
 *                              tryParse / version)
 *   /js/editor-boot.js         this file
 *
 * Reads the query params, fetches the document CLIENT-SIDE (the /editor
 * page state carries no document markup — the payload-leak rule), mounts
 * one <sem-editor> into #editor-root and opens the document through the
 * §9.2 door: SemTextEditor.tryParse/createDocument + el.openDocument(doc):
 *
 *   ?example=<tag>[&variant=<id>]  → GET /editor/examples/<tag> (JSON:
 *                                    compile-time reference data + the
 *                                    tag's theme pair)
 *   ?src=<path-or-url>             → same-origin path or an http(s) URL,
 *                                    fetched as text; VFS keys arrive
 *                                    with the sem-shell integration
 *   ?view=1                        read-only: the shell renders with its
 *                                    edit verbs disabled (example sharing
 *                                    without an edit invite)
 *   (no params)                    → a small built-in starter document
 *
 * This file is site-side and survives bundle syncs; it only ever talks to
 * the documented element surface (SemTextEditor factory + <sem-editor>
 * openDocument / mode / data-mode), never to bundle internals.
 *
 * Hydration defences (the client router strips the query string and its
 * re-render can re-execute template scripts and wipe mounted children):
 *   - QUERY is snapshotted from the navigation timing entry at eval time
 *   - run() executes once per page (window.__semEditorBooted)
 *   - mount() adopts an existing <sem-editor> instead of mounting a rival
 *   - installSelfHeal() re-attaches the editor if a wipe removes it
 */
(function () {
  "use strict";

  var STARTER_NAME = "untitled.html";
  var STARTER = [
    "<sem-note variant=\"info\">",
    "<p>",
    "  This is a scratch <strong>SemText</strong> document. Double-click",
    "  any block to edit it; switch Visual / Code / Split in the toolbar,",
    "  and export with the toolbar or Ctrl/Cmd+S.",
    "</p>",
    "<p>",
    "  Open any reference example with <code>?example=sem-note</code>, or a",
    "  document with <code>?src=/demo/some-doc.sem.html</code>.",
    "</p>",
    "</sem-note>",
  ].join("\n");

  var statusEl = null;
  var ed = null;
  var linkedThemes = {};
  var lastStatus = "";

  // Hologram hydration can land AFTER this boot chain (cold page bundles)
  // and reset the template-rendered #editor-root to its SSR children —
  // removing the mounted editor and reverting the status line (the round-2
  // /editor bug: the page stayed on "loading…" forever). The mutation
  // observer alone missed that wipe in the field, so boot ALSO re-asserts
  // on a time ladder — immune to how the wipe happens, same defence the
  // landing bootstrap uses. Every step is idempotent; ticks stop touching
  // the DOM once the editor is connected and the status text matches.
  var REASSERT_AT = [300, 800, 1600, 3000, 5000, 8000];

  function reassert() {
    var root = document.getElementById("editor-root");
    if (!root) return;
    var existing = root.querySelector("sem-editor");
    if (existing) {
      ed = existing;
      if (lastStatus && (statusEl || document.getElementById("editor-status"))) {
        var current = document.getElementById("editor-status");
        if (current && current.textContent !== lastStatus) status(lastStatus);
      }
      return;
    }
    if (ed && !ed.isConnected) {
      // The detached node kept its opened document — re-attach it as-is.
      root.appendChild(ed);
      if (lastStatus) status(lastStatus);
    } else if (!ed) {
      start(); // the first mount never happened (root was missing then)
    }
  }

  function armReassert() {
    for (var i = 0; i < REASSERT_AT.length; i++) {
      window.setTimeout(reassert, REASSERT_AT[i]);
    }
  }

  // The Hologram client router rewrites the URL during hydration and
  // drops the query string, so location.search is unreliable by the time
  // the boot chain finishes. The navigation timing entry preserves the
  // URL the browser actually loaded — read the params from there.
  function originalSearch() {
    try {
      var entries = performance.getEntriesByType("navigation");
      var nav = entries && entries[0];
      if (nav && nav.name) {
        var q = nav.name.indexOf("?");
        if (q !== -1) return nav.name.substring(q + 1);
      }
    } catch (e) {
      // performance API unavailable — fall through to location.search
    }
    return window.location.search;
  }

  // Snapshot at script-eval time (before any async rewrite can land).
  var QUERY = originalSearch();

  function status(msg) {
    lastStatus = msg;
    // Re-resolve each call: hydration's re-render can replace the SSR
    // status <p> with a fresh copy carrying the original placeholder text.
    statusEl = document.getElementById("editor-status");
    if (!statusEl) {
      statusEl = document.createElement("p");
      statusEl.id = "editor-status";
      statusEl.setAttribute("aria-live", "polite");
      statusEl.className = "text-sm leading-6 text-ink-mute";
      var root = document.getElementById("editor-root");
      if (root) root.appendChild(statusEl);
    }
    statusEl.textContent = msg;
  }

  function basename(path) {
    var clean = String(path || "").split(/[?#]/)[0];
    var last = clean.substring(clean.lastIndexOf("/") + 1);
    return last === "" ? "document.html" : decodeURIComponent(last);
  }

  /** Theme stylesheets for the opened document (the example feed carries
   *  the tag's theme pair). Idempotent: one link per href. */
  function applyTheme(themeCss) {
    (themeCss || []).forEach(function (href) {
      if (!href || linkedThemes[href]) return;
      linkedThemes[href] = true;
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
    });
  }

  function waitForEditor(attempt, cb) {
    if (window.SemTextEditor && customElements.get("sem-editor")) {
      cb(window.SemTextEditor);
      return;
    }
    if (attempt > 50) {
      // The bundles are template-authored deferred scripts, so this means
      // a bundle failed to load (network, bad deploy) — say so instead of
      // spinning forever.
      status("The editor bundle did not load. Check the network tab — the page stays readable without it.");
      return;
    }
    setTimeout(function () {
      waitForEditor(attempt + 1, cb);
    }, 100);
  }

  function mount() {
    var root = document.getElementById("editor-root");
    if (!root) return;
    // Idempotent: Hologram hydration can re-execute template scripts after
    // the client router has rewritten the URL (dropping the query string) —
    // a second run must adopt the existing editor, never mount a rival.
    ed = root.querySelector("sem-editor");
    if (!ed) {
      // Build off-DOM first: the code-lane child must be in place when the
      // element connects (the spec demo authors it before the bundle runs).
      ed = document.createElement("sem-editor");
      var lane = document.createElement("sem-editor-code");
      lane.setAttribute("slot", "code-view");
      ed.appendChild(lane);
      root.appendChild(ed);
    } else if (!ed.querySelector("sem-editor-code")) {
      // Adopted editor without a lane (older boot) — add it; the editor
      // re-renders its panes on state changes, so a late slot still fills.
      var adoptLane = document.createElement("sem-editor-code");
      adoptLane.setAttribute("slot", "code-view");
      ed.appendChild(adoptLane);
    }
  }

  /** Parse + open through the §9.2 door. Parse problems never throw —
   *  a failed verdict still carries the best-effort tree, which the
   *  status line reports honestly before the editor opens it. */
  function openSource(editorApi, source, name) {
    var verdict = editorApi.tryParse(source);
    if (!verdict.ok) {
      status(
        name +
          " parsed with errors — opening the best-effort view: " +
          String(verdict.error && verdict.error.message ? verdict.error.message : "invalid document")
      );
    }
    ed.openDocument(verdict.doc);
    return verdict.ok;
  }

  /** done(editorApi) opens whichever document the params selected. */
  function boot(themeCss, done) {
    waitForEditor(0, function (editorApi) {
      try {
        applyTheme(themeCss);
        done(editorApi);
      } catch (err) {
        // The editor never blocks the page on a defect — say what broke.
        status("The editor failed to open the document: " + (err && err.message ? err.message : String(err)));
      }
    });
  }

  // Hydration's client-router re-render can wipe dynamically mounted
  // children of #editor-root AFTER this boot has mounted and opened the
  // document (Cypress' instrumented load hydrates late; warm-cache Chrome
  // usually hydrates before boot and never shows it). Self-heal: watch
  // the document and re-attach our editor if a wipe removes it — the
  // detached node keeps its state, so the reopened document survives.
  function installSelfHeal() {
    if (typeof MutationObserver === "undefined") return;
    // documentElement, not body: a re-render that replaces wholesale can
    // take the body's children with it; the documentElement node persists.
    var watchRoot = document.documentElement || document.body;
    if (!watchRoot) return;
    new MutationObserver(function () {
      if (!ed || ed.isConnected) return;
      var root = document.getElementById("editor-root");
      if (root && root.querySelector("sem-editor") === null) {
        root.appendChild(ed);
        status(lastStatus);
      }
    }).observe(watchRoot, { childList: true, subtree: true });
  }

  function loadExample(tag, variant) {
    var url =
      "/editor/examples/" +
      encodeURIComponent(tag) +
      (variant ? "?variant=" + encodeURIComponent(variant) : "");
    status("Loading the " + tag + " example…");
    fetch(url, { headers: { Accept: "application/json" } })
      .then(function (resp) {
        if (!resp.ok) {
          return resp
            .json()
            .catch(function () {
              return null;
            })
            .then(function (body) {
              var detail = body && body.errors && body.errors.detail;
              throw new Error(detail || "HTTP " + resp.status);
            });
        }
        return resp.json();
      })
      .then(function (doc) {
        var name = doc.tag + (doc.variant ? "-" + doc.variant : "") + ".html";
        boot(doc.themeCss, function (editorApi) {
          openSource(editorApi, doc.source, name);
          var label =
            "the " + doc.tag + " example" + (doc.variant ? " (variant: " + doc.label + ")" : "");
          status(
            window.__semEditorReadonly
              ? "Read-only view — " + label + "."
              : "Opened " + label + ". Double-click a block to edit it."
          );
        });
      })
      .catch(function (err) {
        status("Could not load the " + tag + " example: " + err.message);
      });
  }

  function loadSrc(src) {
    var isAbsoluteUrl = /^(https?:)?\/\//i.test(src);
    var isPath = src.charAt(0) === "/";
    if (!isAbsoluteUrl && !isPath) {
      status(
        "Unsupported src — use a same-origin path or an http(s) URL. VFS keys arrive with the sem-shell integration."
      );
      return;
    }
    status("Loading " + src + "…");
    fetch(src)
      .then(function (resp) {
        if (!resp.ok) throw new Error("HTTP " + resp.status);
        return resp.text();
      })
      .then(function (text) {
        boot([], function (editorApi) {
          openSource(editorApi, text, basename(src));
          status("Opened " + src + ".");
        });
      })
      .catch(function (err) {
        status("Could not load " + src + ": " + err.message);
      });
  }

  function start() {
    mount();
    if (!ed) {
      status("The editor mount point is missing from this page.");
      return;
    }
    var params = new URLSearchParams(QUERY);
    // Read-only view (?view=1): set BEFORE openDocument so the shell wires
    // without its edit verbs (Lit captures pre-upgrade property sets).
    if (params.get("view") === "1") {
      ed.readonly = true;
      window.__semEditorReadonly = true;
    }
    var example = params.get("example");
    var src = params.get("src");
    if (example) {
      loadExample(example, params.get("variant"));
    } else if (src) {
      loadSrc(src);
    } else {
      boot([], function (editorApi) {
        openSource(editorApi, STARTER, STARTER_NAME);
        status(
          (window.__semEditorReadonly ? "Read-only view — " : "Scratch document ready — ") +
            "double-click to edit, or open an example with ?example=<tag>."
        );
      });
    }
  }

  function run() {
    // Hydration re-executes template scripts — the first run owns the boot
    // (its QUERY snapshot carries the navigation-entry query string the
    // client router strips; a re-run would see an empty query and wrongly
    // fall back to the starter document over the opened example).
    if (window.__semEditorBooted) return;
    window.__semEditorBooted = true;
    installSelfHeal();
    start();
    armReassert();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
