/*
 * semtext.dev landing bootstrap (port-landing lane).
 *
 * Order of operations, mirroring the Next.js site's script story:
 *
 *  1. Hydration dispatch — Hologram hydrates asynchronously; the landing
 *     components reveal their interactive chrome (hero pills, tab list
 *     keyboard behaviour, carousel controls, generator opener) only once
 *     their `on_hydrated` action lands. We poll briefly for the client
 *     runtime and dispatch to each component by cid. With scripts off
 *     nothing is ever hidden (the SSR markup is complete).
 *
 *  2. View runtimes — inject the SemText view bundles (shell + lazy
 *     renderer) exactly once for the try-section panes.
 *
 *  3. Fallback enhancement — the layout loads /semtext/semtext-fallback.js
 *     deferred with window.__semJsOff set, so the bundle does not auto-wire
 *     on load; here we enhance the whole document exactly once, and
 *     re-enhance the hero's rendered pane on demand (it is injected markup,
 *     invisible to the original pass).
 *
 *  4. Clipboard / download helpers — the code viewer and theme generator
 *     actions call these via Hologram.JS exec.
 *
 *  5. Dialog wiring — backdrop-click-to-close and focus restoration for
 *     the theme generator's native <dialog>.
 */
(function () {
  "use strict";

  if (window.SemtextLanding) return;

  var HYDRATION_TARGETS = ["hero_window", "try_views", "addons_carousel", "theme_generator"];
  var HYDRATION_POLL_MS = 150;
  var HYDRATION_POLLS = 40;

  // -- 1. hydration dispatch --------------------------------------------

  function dispatchHydrated() {
    var dispatched = 0;
    HYDRATION_TARGETS.forEach(function (cid) {
      try {
        window.Hologram.dispatchAction("on_hydrated", cid, {});
        dispatched++;
      } catch (e) {
        /* component not mounted yet (or never) — SSR markup stands */
      }
    });
    return dispatched;
  }

  function hydrationLoop(remaining) {
    if (window.Hologram && typeof window.Hologram.dispatchAction === "function") {
      var done = dispatchHydrated();
      if (done === HYDRATION_TARGETS.length) return;
    }
    if (remaining > 0) {
      window.setTimeout(function () {
        hydrationLoop(remaining - 1);
      }, HYDRATION_POLL_MS);
    }
  }

  // -- 2. view runtimes (single injection) --------------------------------

  var viewRuntimesLoaded = false;

  function loadViewRuntimes() {
    if (viewRuntimesLoaded) return;
    viewRuntimesLoaded = true;

    if (!document.querySelector('script[data-sem-view-runtime="shell"]')) {
      var shell = document.createElement("script");
      shell.defer = true;
      shell.src = "/semtext/semtext-js-shell.js";
      shell.setAttribute("data-sem-view-runtime", "shell");
      document.head.appendChild(shell);
    }
    if (!document.querySelector('script[data-sem-view-runtime="lazy"]')) {
      var lazy = document.createElement("script");
      lazy.defer = true;
      lazy.type = "module";
      lazy.src = "/semtext/semtext-lazy.js";
      lazy.setAttribute("data-sem-view-runtime", "lazy");
      document.head.appendChild(lazy);
    }
  }

  // -- 3. fallback enhancement --------------------------------------------

  function enhanceDocumentOnce() {
    if (
      window.SemTextFallback &&
      !document.documentElement.hasAttribute("data-sem-fallback")
    ) {
      window.SemTextFallback.enhance(document);
    }
  }

  function enhanceHeroPane() {
    var pane = document.getElementById("hero-render-pane");
    if (!pane) return;
    if (window.SemTextFallback) {
      window.SemTextFallback.enhance(pane);
    }
    // Injected pane markup: re-check on the bundle's late arrival the way
    // the Next page's timed re-check did.
    [150, 500, 1200].forEach(function (ms) {
      window.setTimeout(function () {
        if (
          window.SemTextFallback &&
          !pane.hasAttribute("data-sem-fallback")
        ) {
          window.SemTextFallback.enhance(pane);
        }
      }, ms);
    });
  }

  // -- 4. clipboard / download helpers -------------------------------------

  function copyFrom(id) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = el.value != null && el.value !== "" ? el.value : el.textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        legacyCopy(text);
      });
    } else {
      legacyCopy(text);
    }
  }

  function legacyCopy(text) {
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "readonly");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* no clipboard available — nothing else to try */
    }
    document.body.removeChild(ta);
  }

  function saveFrom(id, filename, mimeType) {
    var el = document.getElementById(id);
    if (!el) return;
    var text = el.value != null && el.value !== "" ? el.value : el.textContent;
    var blob = new Blob([text], { type: (mimeType || "text/plain") + ";charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename || "document.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // -- 5. dialog wiring -----------------------------------------------------

  function wireDialog() {
    var dialog = document.getElementById("theme-generator-dialog");
    var opener = document.getElementById("theme-generator-opener");
    if (!dialog || dialog.dataset.semDialogWired) return;
    dialog.dataset.semDialogWired = "1";

    // Backdrop click closes (a click on the <dialog> itself is the backdrop;
    // clicks on content bubble from descendants).
    dialog.addEventListener("click", function (ev) {
      if (ev.target === dialog && dialog.open) {
        dialog.close();
      }
    });
    // Restore focus to the opener when the dialog closes (native behaviour
    // focuses the previously-focused element in some browsers only).
    dialog.addEventListener("close", function () {
      if (opener && typeof opener.focus === "function") {
        opener.focus();
      }
    });
  }

  // -- boot -----------------------------------------------------------------

  function onReady(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  onReady(function () {
    hydrationLoop(HYDRATION_POLLS);
    loadViewRuntimes();
    wireDialog();

    // The deferred fallback bundle may land after this script; wire the
    // one-shot document enhancement to whichever happens last.
    enhanceDocumentOnce();
    document.addEventListener("DOMContentLoaded", enhanceDocumentOnce);
    window.addEventListener("load", enhanceDocumentOnce);
  });

  window.SemtextLanding = {
    enhanceHeroPane: enhanceHeroPane,
    focusActiveTab: focusActiveTab,
    copyFrom: copyFrom,
    saveFrom: saveFrom,
    loadViewRuntimes: loadViewRuntimes,
    hydrate: dispatchHydrated
  };

  // -- tab focus helper ------------------------------------------------------
  // Focus the active tab's button (called from try_views keyboard actions so
  // roving focus follows the selection).
  function focusActiveTab() {
    var active = document.querySelector('[id^="try-tab-"][aria-selected="true"]');
    if (active && typeof active.focus === "function") {
      active.focus();
    }
  }
})();
