/*
 * sem-html-boot.js — hydration for [data-sem-html] panes on /dataviz/.
 *
 * The Hologram `Sem` component carries pre-rendered SemText markup in a
 * `data-sem-html` attribute (Hologram escapes every interpolation, so the
 * markup travels attribute-escaped and lossless). This boot promotes each
 * attribute to innerHTML, then watches the document so panes that come
 * back from a Hologram client re-render are re-hydrated — the same
 * MutationObserver pattern semtext-island.js uses for render panes.
 *
 * Why here and not site-chrome.js: site-chrome is the assets lane's file;
 * this keeps the /dataviz/ payload self-contained. Order matters — the
 * reading bundle (deferred after this script) scans for
 * <sem-data-visualizer> elements, so hydration must land first: this
 * script is a plain (non-deferred) body script and runs during parse,
 * strictly before any deferred bundle.
 *
 * The markup is a build-time module attribute in the page module, never
 * user input.
 */
(function () {
  "use strict";

  function hydrateRoot(root) {
    var nodes = root.querySelectorAll("[data-sem-html]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var html = el.getAttribute("data-sem-html");
      if (html != null) {
        el.innerHTML = html;
        el.removeAttribute("data-sem-html");
      }
    }
  }

  function start() {
    hydrateRoot(document);
    var observer = new MutationObserver(function (mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var added = mutations[i].addedNodes;
        for (var j = 0; j < added.length; j++) {
          var node = added[j];
          if (node.nodeType !== 1) continue;
          if (node.hasAttribute && node.hasAttribute("data-sem-html")) {
            var html = node.getAttribute("data-sem-html");
            node.innerHTML = html;
            node.removeAttribute("data-sem-html");
          }
          if (node.querySelectorAll) hydrateRoot(node);
        }
      }
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
