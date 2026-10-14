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
 */
(function () {
  "use strict";

  var root = document.documentElement;
  if (root.classList.contains("no-js")) {
    root.classList.remove("no-js");
    root.classList.add("js");
  }

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
