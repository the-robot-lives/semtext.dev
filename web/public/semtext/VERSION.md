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
