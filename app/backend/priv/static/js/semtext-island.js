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
 * the Next.js site ships — see scripts/gen-reference.mjs + the repo
 * CHANGELOG).
 *
 * The pane semantics are the port of the Next.js ExampleViewer runtime
 * (web/components/example-viewer.tsx): page-wide boot switches before the
 * first script, module-vs-classic script types, the fallback bundle's
 * PANE_HANDLERS chain, the boot guard with timed re-checks, and the
 * color-mode MutationObserver. The Hologram side passes NO data through the
 * action boundary: each render pane carries its full runtime spec in a
 * data-sem-pane attribute (rendered SSR-side from Semtext.Reference.Tags)
 * and the actions only call syncPaneById(id).
 *
 * Public API (parity contract — the signatures are load-bearing, asserted
 * by the parity-harness lane; do not change them):
 *   SemtextIsland.boot(files, pane, opts)   — low-level, kept from P0
 *   SemtextIsland.wire(pane, classForm)     — idempotent pane wiring
 *   SemtextIsland.hydrate(pane, files, opts)— re-boot after a DOM patch
 *   SemtextIsland.syncPane(pane)            — port-reference entry point:
 *        reads pane.dataset.semPane and boots/wires per spec
 *   SemtextIsland.syncPaneById(id)          — the action-called form
 *
 * Parity contract (asserted by the parity-harness lane — do not break):
 *   figure.code-window + aria-label per example · view pills with
 *   aria-pressed · data-sem-render-note panes · #example-<id> anchors ·
 *   data-color-mode sync.
 */
(function () {
  "use strict";

  if (window.SemtextIsland) return;

  // Page-wide (document-level) boot switches, set before the FIRST script
  // of a page boots: __semJsOff kills the full bundles' document scan,
  // __semLazyOff defers the lazy loaders. Vendored bundle code reads these.
  var pageFlagsPinned = false;
  function pinPageFlags() {
    if (pageFlagsPinned) return;
    window.__semJsOff = true;
    window.__semLazyOff = true;
    pageFlagsPinned = true;
  }

  // Sequential loader: modules get the import() path, classic scripts get a
  // tag append (into the pane for isolation; the Next site appended to head,
  // but the flag pins make document scans inert either way). Resolves when
  // every file has run, rejects on first failure.
  var loadedSrcs = {};
  // Only same-origin scripts are loadable: the spec is build-authored, but
  // the guard keeps a tampered pane spec from turning the loader into a
  // cross-origin script injector.
  function sameOriginSrc(src) {
    try {
      return new URL(src, location.href).origin === location.origin;
    } catch (e) {
      return false;
    }
  }
  function loadScript(src, pane) {
    if (loadedSrcs[src]) return loadedSrcs[src];
    if (!sameOriginSrc(src)) {
      return Promise.reject(new Error("semtext-island: refusing non-same-origin script " + src));
    }
    var p;
    if (/(^|\/)[a-z-]*chunks\//.test(src) || /-lazy\.js$/.test(src)) {
      p = import(src);
    } else {
      p = new Promise(function (resolve, reject) {
        var el = document.createElement("script");
        el.src = src;
        el.onload = resolve;
        el.onerror = function () {
          reject(new Error("semtext-island: failed to load " + src));
        };
        pane.appendChild(el);
      });
    }
    loadedSrcs[src] = p.then(
      function () {},
      function (err) {
        delete loadedSrcs[src]; // a failed load may be retried
        throw err;
      },
    );
    return loadedSrcs[src];
  }

  function boot(files, pane, opts) {
    if (!pane) return Promise.reject(new Error("semtext-island: no pane"));
    pinPageFlags();
    var seq = Promise.resolve();
    (opts && opts.themeCss ? opts.themeCss : []).forEach(function (href) {
      if (!document.querySelector('link[href="' + href + '"]')) {
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    });
    files.forEach(function (f) {
      seq = seq.then(function () {
        return loadScript(typeof f === "string" ? f : f.src, pane);
      });
    });
    return seq;
  }

  // ————— the fallback bundle's pane-scoped surface —————
  // The legacy fallback tier and the full bundle export the same per-pane
  // handler surface, so either drives the chain; class-form panes prefer the
  // full bundle first (its reading tier covers `.sem-<tag>` hosts, which the
  // tag-shaped lazy scan never matches). Tier markers make the handlers
  // idempotent, so a pane re-checked against a different surface later is
  // still safe.

  var PANE_HANDLERS = [
    "enhanceSource",
    "enhanceAttrs",
    "enhanceFacts",
    "enhanceDetails",
    "enhanceNote",
    "enhanceProperties",
    "enhanceViews",
    "enhanceReveal",
    "enhanceProgress",
    // Pane-safe since the audiences lane scoped its profile collection to
    // the given root.
    "enhanceAudience",
  ];

  function handlerBundle(classForm) {
    var order = classForm ? ["SemText", "SemTextFallback"] : ["SemTextFallback", "SemText"];
    for (var i = 0; i < order.length; i++) {
      var b = window[order[i]];
      if (b && typeof b.enhance === "function") return b;
    }
    return null;
  }

  // wire(pane, classForm) — attach the pane's event wiring: the fallback
  // bundle's handler chain, minus the two document-scoped passes. Idempotent
  // via the tier markers (a pane already carrying them is left alone).
  function wire(pane, classForm) {
    if (!pane) return false;
    if (pane.querySelector("[data-sem-fallback], [data-sem-upgraded]")) return true;
    var fb = handlerBundle(classForm);
    if (!fb) return false;
    var present = PANE_HANDLERS.filter(function (h) {
      return typeof fb[h] === "function";
    });
    if (present.length) {
      present.forEach(function (h) {
        fb[h](pane);
      });
    } else {
      // A surface exporting none of the split handlers still gets the
      // whole-pane enhance() (which runs the document-shaped passes last —
      // pane flags keep them scoped).
      fb.enhance(pane);
    }
    return true;
  }

  function lazyHydrate(pane) {
    var lz = window.SemTextLazy;
    if (!pane || !lz || typeof lz.hydrate !== "function") return false;
    lz.hydrate(pane);
    return true;
  }

  // ————— boot guard + re-checks (the hero window's race, ported) —————
  // Hydration can reset the pane around boot, so wiring is re-checked on a
  // short schedule; each re-check is a no-op once the pane's elements carry
  // the bundle's tier markers. The guard freezes pointer interaction until
  // wiring settles (bounded ~2.5s).

  var CHECKS = [150, 500, 1200, 2500];

  function revealChrome(pane) {
    var figure = pane.closest("figure.code-window");
    if (figure) figure.classList.add("is-live");
  }

  function syncPaneById(id) {
    syncPane(document.getElementById(id));
  }

  function syncPane(pane) {
    if (!pane) return;
    var spec;
    try {
      spec = JSON.parse(pane.getAttribute("data-sem-pane") || "null");
    } catch (e) {
      spec = null;
    }
    if (!spec) return;

    // The authored markup rides in the spec (attribute round-trip decodes
    // the entity escaping): the render pane's raw HTML — the one thing the
    // Hologram template cannot emit (it escapes all text). Replace the
    // zero-JS placeholder with it on first sync.
    if (!pane.__semContentSet && typeof spec.html === "string") {
      pane.__semContentSet = true;
      // Authored build-time markup (never user input). Parse + adopt instead
      // of a raw innerHTML sink: identical rendering semantics for markup —
      // script elements are inert in both paths — without the flagged sink.
      var parsed = new DOMParser().parseFromString(spec.html, "text/html");
      pane.replaceChildren.apply(pane, parsed.body.childNodes);
    }

    var classForm = !!spec.classForm;
    var wantsHydrate = !!spec.lazy;
    var wantsWire = spec.wire !== false;

    pane.dataset.semBooting = "";
    pane.style.pointerEvents = "none";

    var release = function (p) {
      if (!p) return;
      delete p.dataset.semBooting;
      p.style.pointerEvents = "";
      revealChrome(p);
    };

    var wireNow = function () {
      var p = document.getElementById(pane.id) || pane;
      var ok = true;
      if (wantsHydrate) ok = lazyHydrate(p) && ok;
      if (wantsWire) ok = wire(p, classForm) && ok;
      return p;
    };

    boot(spec.files || [], pane, { themeCss: spec.themeCss || [] })
      .then(function () {
        var myPane = pane;
        wireNow();
        CHECKS.forEach(function (ms, i) {
          setTimeout(function () {
            // The Hologram patch may have replaced the pane element since
            // boot (view switches): re-resolve by id, then re-check.
            var p = (myPane.id && document.getElementById(myPane.id)) || myPane;
            if (!p || !p.isConnected) p = myPane;
            wireNow();
            var marked =
              !!p.querySelector("[data-sem-fallback], [data-sem-upgraded]") ||
              !wantsWire; // hydrate-only panes (sem-md) release on the last check
            if (i === CHECKS.length - 1 || marked) release(p);
          }, ms);
        });
      })
      .catch(function (err) {
        // Without the bundle the rendered pane keeps its placeholder: the
        // vocabulary CSS hides nothing until a tier marker is set.
        if (window.console && console.error) console.error(err);
        release(pane);
      });
  }

  // hydrate(pane, files, opts) — re-run boot after a Hologram patch replaces
  // the pane's DOM. Guarded so double-hydration no-ops. (syncPane supersedes
  // this for spec-carrying panes; kept for the P0 contract.)
  function hydrate(pane, files, opts) {
    if (!pane || pane.__semHydrated) return Promise.resolve();
    pane.__semHydrated = true;
    return boot(files || [], pane, opts).then(
      function () {
        pane.__semBooted = true;
      },
      function (err) {
        // Failed boots stay visible: the pane keeps its source/fallback
        // content and the render note never flips to "rendered".
        if (window.console && console.error) console.error(err);
      },
    );
  }

  // ————— color-mode sync (the vocabulary theme keys off the pane) —————
  // The pane follows the page's data-color-mode (dark is the site default;
  // the attribute wins once mounted). One observer per page watches the
  // root and rewrites every live pane's attribute.

  function watchColorMode() {
    if (watchColorMode.done) return;
    watchColorMode.done = true;
    var sync = function () {
      var mode = document.documentElement.getAttribute("data-color-mode") || "dark";
      var panes = document.querySelectorAll("[data-sem-theme]");
      for (var i = 0; i < panes.length; i++) {
        panes[i].setAttribute("data-color-mode", mode);
      }
    };
    sync();
    new MutationObserver(sync).observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-color-mode"],
    });
  }

  // ————— header docs search —————
  // Port of the Next header combobox: one input, grouped SemText/NPL
  // results over /data/elements.json (name prefix first, then summary
  // substring), arrow-key selection, Enter to open, Escape to clear. The
  // "/" shortcut focuses it unless the reader is already typing in a
  // field. No JS: the input still renders and the reference keeps its own
  // filter — nothing is promised twice.
  function initDocsSearch() {
    var wrap = document.querySelector("[data-docs-search]");
    if (!wrap || wrap.dataset.searchBound) return;
    wrap.dataset.searchBound = "1";
    var input = wrap.querySelector("input");
    var list = wrap.querySelector("ul");
    if (!input || !list) return;

    var entries = null; // [{name, summary, href, family}]
    var active = -1;
    var options = []; // live option elements

    function load() {
      if (entries) return Promise.resolve(entries);
      return fetch("/data/elements.json")
        .then(function (r) { return r.json(); })
        .then(function (d) { entries = d.tags || []; return entries; });
    }

    function close() {
      list.hidden = true;
      input.setAttribute("aria-expanded", "false");
      input.removeAttribute("aria-activedescendant");
      active = -1;
    }

    function choose(li) {
      var href = li && li.getAttribute("data-href");
      if (href && /^\/reference\/[a-z0-9-]+\/$/.test(href)) { close(); input.value = ""; window.location.assign(href); }
    }

    function render(q) {
      while (list.firstChild) list.removeChild(list.firstChild);
      options = [];
      active = -1;
      var ql = q.toLowerCase();
      var scored = [];
      for (var i = 0; i < entries.length; i++) {
        var e = entries[i];
        var name = e.name.toLowerCase();
        var idx = name.indexOf(ql);
        if (idx === 0) scored.push([0, e]);
        else if (idx > 0) scored.push([1, e]);
        else if (e.summary.toLowerCase().indexOf(ql) !== -1) scored.push([2, e]);
      }
      scored.sort(function (a, b) { return a[0] - b[0]; });
      var top = scored.slice(0, 10);

      if (top.length === 0) {
        var none = document.createElement("li");
        none.className = "px-3 py-2 font-mono text-xs text-ink-faint";
        none.textContent = "No matching tag";
        none.setAttribute("role", "option");
        list.appendChild(none);
      } else {
        var lastFamily = null;
        for (var j = 0; j < top.length; j++) {
          var tag = top[j][1];
          if (tag.family !== lastFamily) {
            lastFamily = tag.family;
            var head = document.createElement("li");
            head.className = "px-3 pt-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-ink-faint";
            head.textContent = tag.family === "sem" ? "SemText" : "NPL";
            head.setAttribute("role", "presentation");
            list.appendChild(head);
          }
          var li = document.createElement("li");
          li.className = "cursor-pointer px-3 py-2 hover:bg-white/5";
          li.setAttribute("role", "option");
          li.setAttribute("data-href", "/reference/" + tag.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "/");
          var nameEl = document.createElement("span");
          nameEl.className = "font-mono text-xs text-ink";
          nameEl.textContent = tag.name;
          var sumEl = document.createElement("span");
          sumEl.className = "ml-2 text-xs text-ink-mute";
          sumEl.textContent = tag.summary.length > 64 ? tag.summary.slice(0, 63) + "…" : tag.summary;
          li.appendChild(nameEl);
          li.appendChild(sumEl);
          list.appendChild(li);
          options.push(li);
        }
      }
      list.hidden = false;
      input.setAttribute("aria-expanded", "true");
    }

    function setActive(next) {
      if (active >= 0 && options[active]) {
        options[active].classList.remove("bg-white/5");
      }
      active = next;
      if (active >= 0 && options[active]) {
        options[active].classList.add("bg-white/5");
        input.setAttribute("aria-activedescendant", "docs-search-opt");
        options[active].id = "docs-search-opt";
        if (options[active].scrollIntoView) options[active].scrollIntoView({ block: "nearest" });
      }
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      if (!q) { close(); return; }
      load().then(function () { if (input.value.trim()) render(q); }).catch(function () {});
    });
    input.addEventListener("focus", function () {
      if (input.value.trim()) load().then(function () { render(input.value.trim()); }).catch(function () {});
    });
    input.addEventListener("keydown", function (ev) {
      var visible = !list.hidden;
      if (ev.key === "ArrowDown" && visible) {
        ev.preventDefault();
        setActive(Math.min(active + 1, options.length - 1));
      } else if (ev.key === "ArrowUp" && visible) {
        ev.preventDefault();
        setActive(Math.max(active - 1, 0));
      } else if (ev.key === "Enter") {
        var pick = (active >= 0 && options[active]) || (visible && options[0]);
        if (pick) { ev.preventDefault(); choose(pick); }
      } else if (ev.key === "Escape") {
        input.value = "";
        close();
        input.blur();
      }
    });
    list.addEventListener("mousedown", function (ev) {
      var li = ev.target.closest("li[data-href]");
      if (li) { ev.preventDefault(); choose(li); }
    });
    document.addEventListener("click", function (ev) {
      if (!wrap.contains(ev.target)) close();
    });
  }

  // "/" focuses the header search from anywhere except a text field.
  function initSearchShortcut() {
    var wrap = document.querySelector("[data-docs-search]");
    if (!wrap || wrap.dataset.shortcutBound) return;
    wrap.dataset.shortcutBound = "1";
    document.addEventListener("keydown", function (ev) {
      if (ev.key !== "/" || ev.ctrlKey || ev.metaKey || ev.altKey) return;
      var t = ev.target;
      var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable);
      if (typing) return;
      var input = wrap.querySelector("input");
      if (input) { ev.preventDefault(); input.focus(); }
    });
  }

  // ————— integrations carousel autoplay —————
  // The element owns the index (prev/next/dots are Hologram actions); the
  // island only ticks the side next control every six seconds and manages
  // the pause surface: hover or keyboard focus inside the region pauses,
  // a hidden tab skips ticks, and prefers-reduced-motion readers never get
  // autoplay at all. While paused the status line becomes aria-live=polite
  // so a paused reader still hears position changes; while playing it is
  // aria-live=off (the section is moving on its own).
  function initCarouselAutoplay() {
    var region = document.querySelector("[data-carousel-autoplay]");
    if (!region || region.dataset.carouselBound) return;
    region.dataset.carouselBound = "1";
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var paused = false;
    var status = function () { return region.querySelector("[data-carousel-status]"); };
    var setLive = function () {
      var st = status();
      if (st) st.setAttribute("aria-live", paused ? "polite" : "off");
    };
    region.addEventListener("mouseenter", function () { paused = true; setLive(); });
    region.addEventListener("mouseleave", function () { paused = false; setLive(); });
    region.addEventListener("focusin", function () { paused = true; setLive(); });
    region.addEventListener("focusout", function (e) {
      if (!region.contains(e.relatedTarget)) { paused = false; setLive(); }
    });
    setInterval(function () {
      if (paused || document.visibilityState !== "visible") return;
      // Re-scan per tick: the controls render once the element hydrates,
      // which may land after this script runs.
      var next = region.querySelector("[data-carousel-next]");
      if (next) next.click();
    }, 6000);
  }

  // ————— reference index filter —————
  // Port of the Next index page's FILTER_SCRIPT: the #ref-search input
  // narrows the element cards and the sidebar links by tag name or summary.
  // With no JS nothing runs and the page shows every element — the SSR
  // render is whole. Guarded: binds only when the elements exist.
  function initRefFilter() {
    var input = document.getElementById("ref-search");
    if (!input) return;

    var cards = document.querySelectorAll("main a[data-ref-tag]");
    var links = [].slice.call(
      document.querySelectorAll('nav[aria-label="Docs"] a[data-ref]')
    );
    var count = document.getElementById("ref-count");

    function apply() {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      for (var i = 0; i < cards.length; i++) {
        var el = cards[i];
        el.hidden = q.length > 0 && el.getAttribute("data-ref").indexOf(q) === -1;
        if (!el.hidden) shown++;
      }
      for (var j = 0; j < links.length; j++) {
        var a = links[j];
        a.hidden = q.length > 0 && (a.getAttribute("data-ref") || "").indexOf(q) === -1;
      }
      if (count) {
        count.textContent =
          q.length > 0 ? shown + " of " + cards.length + " tags" : "";
        count.hidden = q.length === 0;
      }
    }

    input.addEventListener("input", apply);
  }

  // ————— auto-boot —————
  // The only entry point pages rely on: on DOMContentLoaded (or now, if the
  // document is already parsed) walk every pane the SSR markup rendered and
  // let syncPane decide boot vs hydrate vs no-op. Components never queue
  // boot actions, so nothing double-boots when the bridge loads first.
  function bootAll() {
    var panes = document.querySelectorAll("[data-sem-pane]");
    for (var i = 0; i < panes.length; i++) syncPane(panes[i]);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      bootAll();
      initRefFilter();
      initCarouselAutoplay();
      initDocsSearch();
      initSearchShortcut();
    });
  } else {
    bootAll();
    initRefFilter();
    initCarouselAutoplay();
    initDocsSearch();
    initSearchShortcut();
  }

  window.SemtextIsland = {
    base: "/semtext/",
    boot: boot,
    wire: wire,
    hydrate: hydrate,
    syncPane: syncPane,
    syncPaneById: syncPaneById,
    watchColorMode: watchColorMode,
  };
})();
