/*
 * editor-boot.js — the /editor page bootstrap (site-editor lane).
 *
 * Deferred AFTER the island bridge and the editor bundle (script order in
 * the page template is load-bearing): by the time this runs,
 * `SemtextIsland` and `window.SemTextEditor` (which registers
 * `<sem-editor>`) are both installed — or the page says so honestly in the
 * status line.
 *
 * Reads the query params, fetches the document CLIENT-SIDE (the /editor
 * page state carries no document markup — the payload-leak rule), mounts
 * one <sem-editor> into #editor-root and hands it the source:
 *
 *   ?example=<tag>[&variant=<id>]  → GET /editor/examples/<tag> (JSON:
 *                                    compile-time reference data + the
 *                                    tag's shipped-runtime pane spec)
 *   ?src=<path-or-url>             → same-origin path or http(s) URL,
 *                                    fetched as text; VFS keys arrive
 *                                    with the sem-shell integration
 *   (no params)                    → a small built-in starter document
 *
 * This file is site-side and survives the final bundle sync; it only ever
 * talks to the documented element surface (setDocument / runtime /
 * renderPreview), never to placeholder internals.
 */
(function () {
  "use strict";

  var STARTER_NAME = "untitled.html";
  var STARTER = [
    "<sem-note variant=\"info\">",
    "<p>",
    "  This is a scratch <strong>SemText</strong> document. Edit the source",
    "  on the left — the preview re-renders as you type (debounced), and",
    "  the preview never executes scripts.",
    "</p>",
    "<p>",
    "  Open any reference example with <code>?example=sem-note</code>, or a",
    "  document with <code>?src=/demo/some-doc.sem.html</code>.",
    "</p>",
    "</sem-note>",
  ].join("\n");

  var statusEl = null;
  var ed = null;

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
    if (!statusEl) {
      statusEl = document.getElementById("editor-status");
      if (!statusEl) {
        statusEl = document.createElement("p");
        statusEl.id = "editor-status";
        statusEl.setAttribute("aria-live", "polite");
        statusEl.className = "text-sm leading-6 text-ink-mute";
        var root = document.getElementById("editor-root");
        if (root) root.appendChild(statusEl);
      }
    }
    statusEl.textContent = msg;
  }

  function basename(path) {
    var clean = String(path || "").split(/[?#]/)[0];
    var last = clean.substring(clean.lastIndexOf("/") + 1);
    return last === "" ? "document.html" : decodeURIComponent(last);
  }

  function waitForEditor(attempt, cb) {
    if (window.SemTextEditor && customElements.get("sem-editor")) {
      cb(window.SemTextEditor);
      return;
    }
    if (attempt > 50) {
      // Deferred scripts run in order, so this means the bundle failed to
      // load (network, bad deploy) — say so instead of spinning forever.
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
    ed = document.createElement("sem-editor");
    root.appendChild(ed);
  }

  function applyRuntime(doc) {
    ed.runtime = {
      files: doc.files || [],
      themeCss: doc.themeCss || [],
      lazy: !!doc.lazy,
    };
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
        applyRuntime(doc);
        ed.setDocument(doc.source, name);
        ed.renderPreview();
        status(
          "Opened the " +
            doc.tag +
            " example" +
            (doc.variant ? " (variant: " + doc.label + ")" : "") +
            "."
        );
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
        ed.runtime = { files: [], themeCss: [], lazy: false };
        ed.setDocument(text, basename(src));
        ed.renderPreview();
        status("Opened " + src + ".");
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
    var example = params.get("example");
    var src = params.get("src");
    if (example) {
      loadExample(example, params.get("variant"));
    } else if (src) {
      loadSrc(src);
    } else {
      ed.runtime = { files: [], themeCss: [], lazy: false };
      ed.setDocument(STARTER, STARTER_NAME);
      ed.renderPreview();
      status("Scratch document ready — edit the source, or open an example with ?example=<tag>.");
    }
  }

  function boot() {
    statusEl = document.getElementById("editor-status");
    waitForEditor(0, start);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
