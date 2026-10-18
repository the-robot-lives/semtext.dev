/*
 * editor-flags.js — page boot switches for /editor (must load BEFORE the
 * first SemText bundle; deferred scripts run in document order, so being
 * the first defer tag in the page template is load-bearing).
 *
 *   __semJsOff   kills the full bundles' document scan — the core bundle
 *                registers the vocabulary and nothing else; the editor
 *                page's documents are claimed by <sem-editor>, never
 *                auto-wired.
 *   __semLazyOff defers the lazy loaders — the full core bundle carries
 *                the whole vocabulary; per-tag chunks are dead weight here.
 *
 * Same contract the landing page uses before injecting the fallback
 * bundle (see priv/static/semtext/VERSION.md) — the bundles read these
 * switches at boot, so they must be pinned before the first bundle runs.
 */
(function () {
  "use strict";
  window.__semJsOff = true;
  window.__semLazyOff = true;
})();
