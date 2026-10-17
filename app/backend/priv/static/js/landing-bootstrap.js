/*
 * semtext.dev landing bootstrap (port-landing lane).
 *
 * Order of operations, mirroring the Next.js site's script story:
 *
 *  1. JS gate — the landing layout renders <html class="sem-booting">;
 *     this script removes that class as its first act, revealing every
 *     .js-only surface (tablist, carousel controls). With scripts off the
 *     class stays and the SSR markup reads as authored.
 *
 *  2. Try views — the four code/browser/tui/cli panels and their tablist
 *     are fully static Hologram markup (no client state: every state flip
 *     re-renders the panels and wipes runtime-mounted shell DOM). This
 *     script owns them behind delegated listeners: inactive panels are
 *     hidden here, clicks and roving-tabindex keyboard switches are
 *     handled on the [data-sem-try-views] container.
 *
 *  3. Hydration dispatch — Hologram hydrates asynchronously; the hero and
 *     theme generator reveal their interactive chrome once their
 *     `on_hydrated` action lands. We poll briefly for the client runtime
 *     and dispatch to each component by cid.
 *
 *  4. View runtimes — injected ONLY after Hologram hydration has settled
 *     (or a 3s cap, whichever comes first). The shell bundle clears each
 *     sem-shell placeholder and mounts the live terminal; if it lands
 *     before hydration, hydration re-renders the panels over the mount
 *     and the transcript garbles. After settle, the mount is stable.
 *
 *  5. Carousel — static markup + delegated listeners on the
 *     [data-carousel-autoplay] region: prev/next wrap, dots jump, arrow
 *     keys work while focus is inside, autoplay advances every 4 seconds
 *     pausing on hover, focus and hidden tabs, and never starts for
 *     prefers-reduced-motion readers.
 *
 *  6. SemText enhancement — the layout loads /semtext/semtext.js deferred
 *     (the one bundle since runtime 0.9.0); its DOMContentLoaded pass
 *     enhances the document, and here we re-enhance the hero's rendered
 *     pane on demand (it is injected markup, invisible to the original
 *     pass).
 *
 *  7. Clipboard / download helpers — the code viewer and theme generator
 *     actions call these via Hologram.JS exec.
 *
 *  8. Dialog wiring — backdrop-click-to-close and focus restoration for
 *     the theme generator's native <dialog>.
 */
(function () {
  "use strict";

  if (window.SemtextLanding) return;

  var HYDRATION_TARGETS = ["hero_window", "theme_generator"];
  var HYDRATION_POLL_MS = 150;
  var HYDRATION_POLLS = 40;
  var RUNTIME_SETTLE_MS = 400;
  var RUNTIME_CAP_MS = 3000;

  // -- 1. JS gate ----------------------------------------------------------

  var root = document.documentElement;
  root.classList.remove("sem-booting");
  root.classList.add("js");

  // Hologram hydration rebuilds the layout literal and restores the SSR'd
  // `class="sem-booting"` on <html>, re-hiding every .js-only surface (the
  // site-chrome no-js flip has the same fight and wins the same way: watch
  // the attribute and re-flip; this script running IS the proof of JS).
  new MutationObserver(function () {
    if (root.classList.contains("sem-booting")) {
      root.classList.remove("sem-booting");
    }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });

  // -- 2. try views (static markup, delegated behaviour) --------------------

  var TAB_BASE_CLASS =
    "inline-flex min-h-7 cursor-pointer items-center rounded-full border px-3 py-1 font-mono text-[0.68rem] uppercase tracking-[0.14em] transition-colors";
  var TAB_ACTIVE_CLASS = TAB_BASE_CLASS + " border-violet bg-violet text-white";
  var TAB_INACTIVE_CLASS =
    TAB_BASE_CLASS + " border-code-border text-code-gray hover:border-violet-soft hover:text-ink";

  function tabKey(tab) {
    return tab.getAttribute("data-sem-tab");
  }

  function setTab(key, moveFocus) {
    var scope = document.querySelector("[data-sem-try-views]");
    if (!scope) return;
    var tabs = scope.querySelectorAll("[data-sem-tab]");
    for (var i = 0; i < tabs.length; i++) {
      var tab = tabs[i];
      var active = tabKey(tab) === key;
      tab.setAttribute("aria-selected", active ? "true" : "false");
      tab.setAttribute("tabindex", active ? "0" : "-1");
      tab.className = active ? TAB_ACTIVE_CLASS : TAB_INACTIVE_CLASS;
      var panel = document.getElementById("try-panel-" + tabKey(tab));
      if (panel) {
        if (active) {
          panel.removeAttribute("hidden");
        } else {
          panel.setAttribute("hidden", "hidden");
        }
      }
      if (active && moveFocus && typeof tab.focus === "function") tab.focus();
    }
  }

  // Delegation lives on document — Hologram hydration can replace any
  // element in the page, and a document listener survives every swap.
  document.addEventListener("click", function (ev) {
    var tab = ev.target.closest ? ev.target.closest("[data-sem-tab]") : null;
    if (tab) setTab(tabKey(tab), false);
  });

  document.addEventListener("keydown", function (ev) {
    var tab = ev.target.closest ? ev.target.closest("[data-sem-tab]") : null;
    if (!tab) return;
    var scope = tab.closest("[data-sem-try-views]");
    if (!scope) return;
    var order = [];
    var tabs = scope.querySelectorAll("[data-sem-tab]");
    for (var i = 0; i < tabs.length; i++) order.push(tabKey(tabs[i]));
    var at = order.indexOf(tabKey(tab));
    var next = null;
    if (ev.key === "ArrowRight") next = order[(at + 1) % order.length];
    else if (ev.key === "ArrowLeft") next = order[(at - 1 + order.length) % order.length];
    else if (ev.key === "Home") next = order[0];
    else if (ev.key === "End") next = order[order.length - 1];
    if (next) {
      ev.preventDefault();
      setTab(next, true);
    }
  });

  function initTryViews() {
    // Non-active panels start hidden (the SSR render shows all four stacked
    // for scripts-off readers; with JS only the active tab is visible). On
    // fixup re-runs the selected tab is re-asserted (hydration wipes the
    // hidden attrs back); the user's choice always wins over the default.
    var scope = document.querySelector("[data-sem-try-views]");
    var current = scope ? scope.querySelector('[data-sem-tab][aria-selected="true"]') : null;
    setTab(current ? tabKey(current) : "code", false);
  }

  // -- 3. hydration dispatch ------------------------------------------------

  var hydrateDone = false;

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
      if (done === HYDRATION_TARGETS.length) {
        hydrateDone = true;
        return;
      }
    }
    if (remaining > 0) {
      window.setTimeout(function () {
        hydrationLoop(remaining - 1);
      }, HYDRATION_POLL_MS);
    }
  }

  // -- 4. view runtimes (single injection, after hydration settles) ----------

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

  function scheduleViewRuntimes() {
    // Hydration settled → give the final client render one more beat, then
    // mount. If hydration never lands (blocked runtime, cap reached), the
    // SSR DOM is stable too — mounting into it is equally safe.
    if (hydrateDone) {
      window.setTimeout(loadViewRuntimes, RUNTIME_SETTLE_MS);
    } else {
      window.setTimeout(loadViewRuntimes, RUNTIME_CAP_MS);
    }
  }

  // -- 5. carousel (static markup, delegated behaviour) ----------------------

  var CAROUSEL_INTERVAL_MS = 4000;

  // Wired state for the carousel: which region element owns the behaviour,
  // its stop() (autoplay timer), and its render() (fixup re-apply).
  var carouselRegion = null;
  var carouselStop = null;
  var carouselRender = null;

  function initCarousel() {
    var region = document.querySelector("[data-carousel-autoplay]");
    if (!region) return;
    if (region === carouselRegion) return;

    // A fresh (hydration-replaced) region element: tear down the previous
    // owner's autoplay timer before rebinding.
    if (carouselStop) carouselStop();
    carouselRegion = region;

    var track = region.querySelector("[data-carousel-track]");
    if (!track) return;
    var cards = [];
    var trackItems = track.querySelectorAll("[data-carousel-card]");
    for (var i = 0; i < trackItems.length; i++) cards.push(trackItems[i]);

    var dots = [];
    var dotItems = region.querySelectorAll("[data-carousel-go]");
    for (var j = 0; j < dotItems.length; j++) dots.push(dotItems[j]);
    var status = region.querySelector("[data-carousel-status]");

    // Card titles come from the dots' labels ("Go to card N: <title>") so
    // the strings live in one place — the template.
    var titles = dots.map(function (dot) {
      var label = dot.getAttribute("aria-label") || "";
      var at = label.indexOf(": ");
      return at >= 0 ? label.slice(at + 2) : "";
    });

    var index = 0;
    var timer = null;
    var hovering = false;
    var focused = false;
    var reduced = window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)")
      : { matches: false };

    function wrap(i) {
      var n = cards.length || 1;
      return ((i % n) + n) % n;
    }

    function render() {
      track.classList.remove("flex-col", "gap-4");
      track.classList.add(
        "flex-row",
        "items-stretch",
        "transition-transform",
        "duration-300",
        "ease-out"
      );
      track.style.transform = "translateX(-" + index * 100 + "%)";
      cards.forEach(function (card, i) {
        card.classList.add("min-w-full");
        if (i === index) {
          card.removeAttribute("aria-hidden");
        } else {
          card.setAttribute("aria-hidden", "true");
        }
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle("bg-violet", i === index);
        dot.classList.toggle("bg-code-border", i !== index);
        if (i === index) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
      if (status) {
        var title = titles[index] || "";
        status.textContent = index + 1 + " / " + cards.length + (title ? " — " + title : "");
      }
    }

    function go(i) {
      index = wrap(i);
      render();
    }

    function running() {
      return timer !== null;
    }

    function start() {
      if (timer) return;
      if (hovering || focused || document.hidden) return;
      if (reduced.matches) return; // never autoplay for reduced-motion readers
      timer = window.setInterval(function () {
        go(index + 1);
      }, CAROUSEL_INTERVAL_MS);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function manual(deltaOrIndex, absolute) {
      go(absolute ? deltaOrIndex : index + deltaOrIndex);
      // Restart the clock so the card just chosen is not skipped at once.
      stop();
      start();
    }

    // All listeners live on document (hydration can swap any element);
    // handlers no-op unless the event originates inside this region.
    document.addEventListener("click", function (ev) {
      var btn = ev.target.closest
        ? ev.target.closest("[data-carousel-prev], [data-carousel-next], [data-carousel-go]")
        : null;
      if (!btn || !region.contains(btn)) return;
      if (btn.hasAttribute("data-carousel-go")) {
        var n = parseInt(btn.getAttribute("data-carousel-go"), 10);
        manual(isNaN(n) ? 0 : n, true);
      } else if (btn.hasAttribute("data-carousel-next")) {
        manual(1, false);
      } else {
        manual(-1, false);
      }
    });

    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "ArrowRight" && ev.key !== "ArrowLeft") return;
      var inside =
        region.contains(ev.target) ||
        (ev.target.closest && ev.target.closest("[data-carousel-autoplay]") === region);
      if (!inside) return;
      ev.preventDefault();
      manual(ev.key === "ArrowRight" ? 1 : -1, false);
    });

    document.addEventListener("mouseover", function (ev) {
      if (region.contains(ev.target)) {
        if (!hovering) {
          hovering = true;
          stop();
        }
      } else if (hovering && !region.contains(ev.relatedTarget)) {
        hovering = false;
        start();
      }
    });

    document.addEventListener("focusin", function (ev) {
      if (region.contains(ev.target)) {
        focused = true;
        stop();
      } else if (focused) {
        focused = false;
        start();
      }
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        stop();
      } else {
        start();
      }
    });
    if (reduced.addEventListener) {
      reduced.addEventListener("change", function () {
        if (reduced.matches) stop();
      });
    }

    render();
    start();

    // Hydration re-renders restore the SSR track (stacked column, no
    // transform). Re-apply the track state on the fixup ticks.
    carouselRender = render;
  }

  // -- post-hydration fixups -------------------------------------------------
  // Hologram's hydration render restores SSR attributes over anything this
  // script applied earlier (the sem-booting class gets its own observer;
  // tab panels and the carousel track get re-applied here on a short
  // schedule that covers hydration landing at any point).

  function applyStaticState() {
    root.classList.remove("sem-booting");
    initTryViews();
    initCarousel();
    if (carouselRender) carouselRender();
  }

  function scheduleFixups() {
    [400, 1000, 2000, 3200, 4600, 6000].forEach(function (ms) {
      window.setTimeout(applyStaticState, ms);
    });
  }

  // -- 6. SemText enhancement ------------------------------------------------

  function enhanceHeroPane() {
    var pane = document.getElementById("hero-render-pane");
    if (!pane) return;
    var st = window.SemText;
    if (st && typeof st.enhanceCore === "function") {
      st.enhanceCore(pane);
    }
    // Injected pane markup: re-check on the bundle's late arrival the way
    // the Next page's timed re-check did.
    [150, 500, 1200].forEach(function (ms) {
      window.setTimeout(function () {
        var st2 = window.SemText;
        if (st2 && typeof st2.enhanceCore === "function" && !pane.querySelector("[data-sem-upgraded]")) {
          st2.enhanceCore(pane);
        }
      }, ms);
    });
  }

  // -- 7. clipboard / download helpers ---------------------------------------

  // Text-direct variants (CodeViewer actions pass the source literally,
  // escaped payload-safeside; no hidden textarea in the DOM).
  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {
        legacyCopy(text);
      });
    } else {
      legacyCopy(text);
    }
  }

  function copyFrom(id) {
    var el = document.getElementById(id);
    if (!el) return;
    copyText(el.value != null && el.value !== "" ? el.value : el.textContent);
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

  function saveText(text, filename, mimeType) {
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

  function saveFrom(id, filename, mimeType) {
    var el = document.getElementById(id);
    if (!el) return;
    saveText(el.value != null && el.value !== "" ? el.value : el.textContent, filename, mimeType);
  }

  // -- 8. dialog wiring -------------------------------------------------------

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

  // -- boot -------------------------------------------------------------------

  function onReady(fn) {
    if (document.readyState !== "loading") {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }

  onReady(function () {
    applyStaticState();
    scheduleFixups();
    hydrationLoop(HYDRATION_POLLS);
    scheduleViewRuntimes();
    wireDialog();

    // The one bundle's DOMContentLoaded pass handles document wiring on its
    // own (the layout loads it deferred); the hero pane's injected markup
    // is re-wired on demand via SemtextLanding.enhanceHeroPane().
  });

  window.SemtextLanding = {
    enhanceHeroPane: enhanceHeroPane,
    setTab: setTab,
    copyText: copyText,
    copyFrom: copyFrom,
    saveText: saveText,
    saveFrom: saveFrom,
    loadViewRuntimes: loadViewRuntimes,
    hydrate: dispatchHydrated
  };
})();
