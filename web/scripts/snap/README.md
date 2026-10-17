# snap — render snapshot harness

Headless capture of every example on `/reference/<tag>/`, in every view the
example exposes, at desktop and mobile widths, for reviewer vision models.

```
npm run snap:tag -- <tag> [--base <url>] [--dist <dir>] [--out <dir>]
npm run snap:tag -- --stop          # stop the harness-managed dev server
```

## Usage

| Flag | Default | Meaning |
|---|---|---|
| `<tag>` | — | reference tag slug (`highlight`, `sem-note`, `npl-declaration`, …) |
| `--base` | harness-managed dev server (see below) | render against this URL instead; the managed server is then left untouched |
| `--dist <dir>` | shipped `web/public/semtext/` | serve `/semtext/**` from a privately built npl bundle dir (route interception) || `--out <dir>` | `.tmp/semtext-docs-overhaul/snaps/<tag>/` (or `$SNAP_OUT_ROOT/<tag>`) | private output dir; wiped at run start |

Exit codes: `0` ok · `1` capture failures (incl. output-gate rejections) ·
`2` usage · `3` no render server / tag page unreachable.

Output: one PNG per example per view per width
(`<example>-<view>-<width>.png`, e.g. `highlight-render-reveal-390.png`),
one `<tag>-fullpage-<width>.png` per width, and an `index.md` manifest
(file table with pixel dimensions + a Notes section). Views captured:
Source pill, Render pill, then every visible mode control inside the
rendered pane (buttons, summaries, tabs, radio/checkbox inputs — e.g. the
quiz reveal controls on `highlight`). Widths: 1280, 1024, and 390. Theme: dark
only — the site chrome is dark-only (no theme toggle, no
`prefers-color-scheme` variant in `globals.css`), so there is no light
capture to take.

## The render server (default base)

`http://localhost:3000` is a dumb static server over `web/out/` — a PREVIOUS
export; it never reflects current source. The harness therefore manages its
own `next dev`, started on demand and shared:

- One instance per worktree, on a free `127.0.0.1` port, recorded in
  `$TMPDIR/semtext-snap-dev-<sha1(web root)>/` (`port`, `pid`, `dev.log`,
  plus a `lock/` dir as the atomic mutex).
- Start-if-absent / reuse-otherwise: concurrent `snap:tag` calls wait on the
  lock and then open browser sessions against the recorded port. A per-run
  server is deliberately NOT used: several `next dev` processes in one
  worktree clobber each other's `.next/routes-manifest.json`.
- Private build dir: the managed server runs with
  `SNAP_NEXT_DIST_DIR=scripts/snap/.next-snap` (honoured by `next.config.ts`),
  so it never shares `.next/` with any other lane's dev server either.
  `scripts/snap/.next-snap/` is harness-owned cache; add it to `.gitignore`
  (cross-lane request — `.gitignore` is not owned by this lane).
- The server is left running for reuse; `npm run snap:tag -- --stop` kills
  it. It is never the `:3000` process, which the harness does not touch.
- Dev-mode edits by other agents recompile under us, so the spec (a) neuters
  the HMR websocket on every loaded page (no hot updates or reloads mid-run),
  (b) forces `scroll-behavior: auto` and kills animations/transitions
  (reduced-motion equivalent) via an injected stylesheet, and (c) waits for
  hydration plus a settle beat before the first shot.

Capture stability rules (these exist because of real bugs, keep them):

- Element shots go through `shotElement()`: instant center scroll, then the
  layout box must be stable across two animation frames and non-zero before
  the shot. A shot taken mid scroll-into-view clips to the viewport
  intersection and degenerates to a 1px sliver (the historical 768×1
  captures). Collapsed / `display:contents` hosts climb to the nearest
  ancestor with a real box (`-frame` suffix).
- Nothing under 10×10 px is ever emitted: the driver re-reads every PNG's
  IHDR dimensions afterwards and deletes + records any degenerate image as a
  capture failure in `index.md`.
- fullPage stitches hide `position: sticky|fixed` chrome for the duration of
  the shot (Cypress composites by scrolling; sticky headers repeat).

## Discovery contract

Examples are `figure.code-window` elements under `main#main`:

- paired example: `aria-label="Authored <name> example"` (source view) +
  `aria-label="<name> rendered"` (render pane, `[data-sem-theme]` inside);
- `sem-md`: one combined figure `aria-label="The sem-md example: rendered
  and authored"` with pane `.ref-md-example` (Lit custom element, waited on
  via `customElements.whenDefined`);
- view pills: `.code-chrome button[aria-pressed]` (present only after React
  hydration — the spec gates on them);
- render settle: the `[data-sem-upgraded]` marker, or `window.SemText`
  defined plus a grace beat (the highlight quiz handler sets no markers).

Figures sharing one aria-label (variant examples repeat it) are
occurrence-paired: the k-th source figure pairs with the k-th render figure
of the same name and is shot as `<name>-v<k+1>-*`.

Known limit: controls that live inside Lit shadow roots are not pierced (the
rendered pane's own controls that are light-DOM are; shadow-DOM ones are
not). Noted per run if a pane shows no discoverable controls.

## `--dist <dir>` — render against a private bundle

The spec reads the dir recursively in Node (`snapReadDist` task; text
assets only, ≤8 MB each, `node_modules`/dot-dirs skipped) and installs a
`cy.intercept("/semtext/**")` that answers from that map with the right
content type and `cache-control: no-store`; misses fall through to the
server. `index.md` Notes record hits vs pass-throughs. Typical use:

```
# in the npl epic worktree (private out dir, never the shared dist/):
# NOTE: call build.mjs directly — `npm run build -- --out` appends the flag
# to the LAST chained script (build-extension.mjs) and rebuilds the SHARED
# dist/ instead.
node scripts/build.mjs --out /tmp/semtext-snap/<lane>
npm --prefix <semtext worktree>/web run snap:tag -- highlight \
  --dist /tmp/semtext-snap/<lane>
```

`build.mjs --out <dir>` writes its artifacts directly into `<dir>` (no
nested `dist/`), so `--dist` points at the same dir. The intercept map must
contain `themes/_vocabulary.css` — the example viewer fetches
`/semtext/themes/_vocabulary.css`, and without it the request falls through
to the site's shipped (possibly stale) copy. Builds emit it verbatim next to
the flattened `semtext.css`; older builds without the twin need the
vocabulary copied in by hand. The theme file needs its site name too: copy
`themes/semtext-theme-minimal-tech-light.css` to `themes/minimal-tech-light.css`
in the `--dist` dir (the viewer fetches the latter path — `sync-bundles.mjs`
does both when the phase-2 sync runs).

## Concurrency safety

- Each run owns its `--out` (default per-tag); the dir is wiped at start, so
  never share one between runs. All Cypress writes (screenshots, videos,
  downloads, notes) land inside it; the repo `cypress/` tree is untouched.
- The only shared resource is the single managed dev server, which is
  read-only for runners (lock is held only while starting it).
- No servers other than the one managed instance; no shared ports.
- Proven: three tags (`npl-declaration`, `highlight`, `sem-note`) captured
  side by side with clean separate outputs (see the harness report).

## Bundle sync recipe (`web/public/semtext/` ← npl-enhanced-content)

Produced in the npl epic worktree
(`Projects/npl-enhanced-content/.claude/worktrees/epic-docs-overhaul`,
branch `epic.docs-overhaul`):

1. `npm run build` — `scripts/build.mjs` (vite IIFE bundles `semtext.js`,
   `npl.js`, `semtext-agent.js` when its entry exists, `semtext-js-shell.js`,
   plus the lazy loaders `semtext-lazy.js` / `npl-lazy.js` with `chunks/` +
   `npl-chunks/` and the `semtext-manifest.json` / `npl-manifest.json` /
   `semtext-js-shell-manifest.json` manifests, plus theme CSS in
   `dist/themes/`; NOTE it `rm -rf`s its target dir first — never two
   builds at once against one dir) then `scripts/build-standalone.mjs`
   (`dist/demo`, `dist/site`, `dist/spec`). The vocabulary stylesheet
   ships twice: flattened as `dist/semtext.css` and verbatim as
   `dist/themes/_vocabulary.css` (the site's example viewer fetches the
   latter path).
2. Build to a PRIVATE out dir when verifying (`--out /tmp/semtext-snap/…`);
   the shared `dist/` belongs to whoever runs there.
3. Sync into `web/public/semtext/` (the LEAD does this, not the harness) —
   one command since the asset-versioning scheme landed:

   ```
   node scripts/sync-bundles.mjs --from <npl-dist>
   ```

   It reads the stamped snapshot (`dist/v<semver>/` + `dist/version.json`,
   written by upstream `npm run build`) and publishes
   `public/semtext/v<semver>/` (immutable per-release snapshot), refreshes
   `stable/` and `latest/`, rewrites `versions.json` + `VERSION.md`, keeps
   the unversioned alias mirroring STABLE, and regenerates
   `data/bundles.json`. Previous `v*/` directories are kept. The retired
   `semtext-fallback.js` (removed upstream in 0.9.0) is no longer synced —
   old version directories keep their published copies.
   `--dry-run` prints the plan; `--version` overrides the stamped tag.
4. Regression warning: the copies of `themes/_vocabulary.css` (body paint
   scoped to `[data-sem-theme]`) and `themes/minimal-tech-light.css`
   (`--sem-muted` contrast fix) currently in `web/public/semtext/` carry a
   contrast patch NOT present in upstream `dist` at 0f5a8cf — re-copying an
   unpatched older dist theme silently regresses it. Compare before
   overwriting.
5. `web/data/elements.json` (feeds the reference pages) is generated by
   `scripts/build-elements-index.mjs` in the npl repo, output copied to
   `web/data/elements.json`.

## `web/scripts/sync-bundles.mjs` — the sync, scripted (phase 2)

The lead's copy step, mechanized — idempotent (sha256-gated: only differing
files are written), mirrors chunk dirs (stale hash-named extras deleted;
anything not hash-named is reported and kept), drops the retired
`semtext-fallback.js` from the alias roots, handles both theme
renames (vocabulary verbatim; a flattened `semtext.css` is accepted as a
stand-in when the verbatim sheet is absent), syncs `spec/` → `public/spec/`,
then re-runs `build-bundle-map.mjs` so `data/bundles.json` (shipped /
cssOnly / aliasRuntime) always describes exactly what was synced:

```
# from web/ — plan first, then for real:
node scripts/sync-bundles.mjs --from <npl-build-dir> --dry-run
node scripts/sync-bundles.mjs --from <npl-build-dir>
```

`--site <web-root>` syncs a different checkout. Not wired into npm scripts
yet — the phase-2 lead runs it by hand.
