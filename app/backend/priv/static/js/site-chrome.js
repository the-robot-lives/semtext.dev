/*
 * SemText site chrome — progressive enhancement, Hologram-independent.
 *
 * Loaded with `defer` from SiteLayout. Hologram owns component state and
 * actions; this file only does what templates cannot:
 *
 *   1. Flip the no-JS gate: <html> renders with class="no-js"; removing
 *      it reveals .js-only surfaces (carousel controls, wizard forms,
 *      search) and hides .no-js-only fallbacks. With scripts off nothing
 *      here runs and the page reads as authored.
 *   2. "/" focuses the header search (the Next site's keybind).
 *   3. Escape in the header search restores focus to the menu toggle.
 *   4. window.SemtextSite.copyFrom(id) — clipboard helper for buttons
 *      whose copy target is plain text (used by the theme generator's
 *      copy affordances).
 *   5. Hydrate Sem panes: the `Sem` component (components/site/sem.ex)
 *      carries pre-rendered SemText markup in a `data-sem-html` attribute
 *      (Hologram escapes every interpolation, so the markup travels
 *      attribute-escaped and lossless). This promotes each attribute to
 *      innerHTML, then re-hydrates panes that come back from a Hologram
 *      client re-render (attribute watch, loop-safe: hydration removes
 *      the attribute and the handler skips hosts without one). Ordering
 *      contract: this file is a deferred HEAD script, so it runs before
 *      any deferred BODY bundle — e.g. /dataviz/semtext-reading.js scans
 *      for <sem-data-visualizer> only after the panes exist.
 */
(function () {
  "use strict";

  var root = document.documentElement;
  if (root.classList.contains("no-js")) {
    root.classList.remove("no-js");
    root.classList.add("js");
  }

  // Hologram hydration restores the SSR'd `class="no-js"` on <html> (the
  // client render rebuilds the layout literal), re-hiding every .js-only
  // surface. Re-flip whenever it reappears — this script running IS the
  // proof of JS, and the class is ours to keep.
  new MutationObserver(function () {
    if (root.classList.contains("no-js")) {
      root.classList.remove("no-js");
      root.classList.add("js");
    }
  }).observe(root, { attributes: true, attributeFilter: ["class"] });

  // 5. Sem pane hydration (see header note). The markup is authored in
  // page modules at build time — never user input.
  function hydrateSemPane(el) {
    var html = el.getAttribute("data-sem-html");
    // Empty string stays a no-op: the pane's static fallback (e.g. the
    // showcase viewer's render note) must never be wiped into an empty host.
    if (html) {
      // Authored build-time markup (never user input). Parse + adopt rather
      // than a raw innerHTML write — same rendered markup, no sink.
      var parsed = new DOMParser().parseFromString(html, "text/html");
      var frag = document.createDocumentFragment();
      while (parsed.body.firstChild) frag.appendChild(parsed.body.firstChild);
      el.replaceChildren(frag);
      el.removeAttribute("data-sem-html");
    }
  }

  function hydrateSemPanes(scope) {
    var nodes = scope.querySelectorAll("[data-sem-html]");
    for (var i = 0; i < nodes.length; i++) {
      hydrateSemPane(nodes[i]);
    }
  }

  hydrateSemPanes(document);
  new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var mutation = mutations[i];
      if (mutation.type === "attributes") {
        hydrateSemPane(mutation.target);
      } else {
        var added = mutation.addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute && node.hasAttribute("data-sem-html")) {
            hydrateSemPane(node);
          }
          if (node.querySelectorAll) hydrateSemPanes(node);
        }
      }
    }
  }).observe(root, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["data-sem-html"],
  });

  function isEditable(el) {
    if (!el) return false;
    var tag = el.tagName;
    return (
      tag === "INPUT" ||
      tag === "TEXTAREA" ||
      tag === "SELECT" ||
      el.isContentEditable === true
    );
  }

  function searchInput() {
    return document.getElementById("header-search-input");
  }

  document.addEventListener("keydown", function (event) {
    if (event.defaultPrevented) return;

    if (event.key === "/" && !event.metaKey && !event.ctrlKey && !event.altKey) {
      var target = event.target;
      if (isEditable(target)) return;
      var input = searchInput();
      if (input) {
        event.preventDefault();
        input.focus();
        input.select();
      }
      return;
    }

    if (event.key === "Escape") {
      var active = document.activeElement;
      if (active && active.id === "header-search-input") {
        var owner = document.querySelector(
          '[data-sem-menu-toggle], [aria-controls="header-menu-panel"]'
        );
        if (owner) {
          event.preventDefault();
          owner.focus();
        }
      }
    }
  });

  window.SemtextSite = {
    copyFrom: function (id) {
      var el = document.getElementById(id);
      if (!el || !navigator.clipboard) return Promise.resolve(false);
      return navigator.clipboard.writeText(el.value != null ? el.value : el.textContent).then(
        function () {
          return true;
        },
        function () {
          return false;
        }
      );
    },
  };
})();
