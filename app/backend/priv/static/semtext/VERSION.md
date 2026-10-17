# SemText bundles served by this landing page

`semtext-fallback.js` and `themes/` are copied verbatim from the
`dist/` output of `noizu-labs-ml/npl-enhanced-content`:

- version: 0.1.0 (dist `package.json`)
- dist commit: `0f5a8cf8fd0de3ada76c8fa2b10fe7f576d3d6c2` (2026-10-07)
- copied: 2026-10-13

They are loaded on demand, same-origin from `public/semtext/`, by the
hero window's Render control (`web/components/hero-window.tsx`). No CDN,
no build step: the file the browser gets is the file the project ships.
The bundle installs the global `SemTextFallback`; the page sets
`window.__semJsOff` before injecting it so nothing auto-wires the whole
document, then calls `SemTextFallback.enhance(document)` for the rendered
view only.

## Local patch (2026-10-13) — diverges from dist

`themes/_vocabulary.css` and `themes/minimal-tech-light.css` carry a
contrast fix NOT yet in dist commit `0f5a8cf`:

- `_vocabulary.css`: the body paint rule is scoped to `[data-sem-theme]`
  instead of `body`. When a theme mounts on an embedded subtree (this
  landing puts `data-sem-theme` on the hero pane div), the tokens are
  undefined at body scope, the old rule resolved `var(--sem-fg)` to
  nothing, and every card inherited UA black — note/callout body and
  flashcard statement rendered near-invisible black-on-slate (1.44:1).
- `minimal-tech-light.css`: dark `--sem-muted` `#94a3b8` → `#cbd5e1`
  (callout labels and flashcard conclusions: 5.71 → 9.85:1 on the
  card surface).

`noizu-labs-ml/npl-enhanced-content` needs the same two changes in its
source theme; until then, re-copying dist over `themes/` will regress
this fix. Contrast ratios verified in headless Chrome against the
served page (see the landing contrast commit for the numbers).

## Lazy bundle (2026-10-13) — semtext-lazy.js + chunks/

`semtext-lazy.js`, `semtext-manifest.json` and `chunks/` are copied
verbatim from the `dist/` output of `noizu-labs-ml/npl-enhanced-content`:

- source branch: `feat/lazy-opt-in` (commit `cdf4356`, on top of
  `feat/semtext-lazy` which is ahead of the `feat/lit-only-bundle`
  one-bundle surface; the sem-md Markdown renderer itself is unchanged
  from that surface)
- copied: 2026-10-13

The reference page's sem-md example (`/reference/`, `/elements/`) loads
the sem-md chunk through this loader, scoped to the example: the page sets
`window.__semLazyOff` before injecting `semtext-lazy.js`, then calls
`window.SemTextLazy.hydrate(pane)` — exactly one chunk download
(`chunks/sem-md.js` plus its static imports), no document-wide scan, so
the pages' other sem-* markup stays authored prose.

`themes/` here is NOT overwritten by this copy and still carries the
local contrast patch documented above — the lazy chunks need no new CSS.
