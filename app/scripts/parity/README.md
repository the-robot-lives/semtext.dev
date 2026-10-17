# parity — semtext.dev Next.js → Hologram parity harness

Three layers, one contract (`parity-routes.json`), shared rule: **a route the
Hologram app does not serve yet is a GAP — reported, never a failure.** The
harness runs against whatever routes exist today and gets greener as the port
lanes land pages. A route that IS served but diverges (wrong title/h1/key
text, crash) is a FAIL — loud.

| layer | path | needs | speed |
|---|---|---|---|
| ExUnit SSR | `app/backend/test/parity/` | `mix test` only | seconds (CI-fast) |
| live driver | `scripts/parity/parity-check.mjs` | both servers running | seconds |
| BDD behavior | `app/e2e/` (Cucumber) | Hologram server + `npm ci` once | ~minutes |
| snapshots | `scripts/parity/snap-tag.mjs` + `snap-diff.mjs` | one server per run | ~minutes |

## The manifest — `parity-routes.json`

Every Next.js route with pinned `title`, `h1` (distinctive prefix), `keyText`
substrings, `owner` (the P0 lane that must deliver it), and `kind` (`page` /
`soft-redirect` / `template`). `referenceTags` expands the `/reference/<tag>/`
template to one route per tag. Regenerate — never hand-edit titles/h1s:

```sh
node scripts/parity/gen-manifest.mjs --next http://127.0.0.1:3100   # live site
node scripts/parity/gen-manifest.mjs --from <web>/out               # static export
```

New top-level Next routes are added once by hand (an entry in `routes`), then
kept fresh by the generator. Manifest staleness is itself detected: when BOTH
sides disagree with the manifest the same way, the verdict is MISMATCH
(regenerate), not FAIL.

## Layer 1 — ExUnit (hermetic, runs in `mix test`)

`backend/test/parity/route_parity_test.exs` + `support/parity_manifest.ex`.
One test per manifest route against THIS app's SSR via ConnCase: 404/405 →
GAP (recorded + printed in an after-suite ledger); served + divergent →
failure; soft-redirect honored via 3xx or meta refresh; static resources
status-only. Use a private build root per lane:

```sh
cd app/backend
MIX_BUILD_ROOT=/tmp/semtext-hologram/<lane>/_build mix test test/parity
```

## Layer 2 — live cross-server driver

```sh
# next: any Next base (landing-preview dev server, or its snap harness's
# managed server:  node <web>/scripts/snap/snap-tag.mjs --next-base)
# app:   the Hologram dev server (see "Starting the Hologram server")
node scripts/parity/parity-check.mjs --next http://127.0.0.1:3100 --app http://127.0.0.1:4100
# → <PARITY_OUT_ROOT>/check-<ts>/parity-report.md + parity-results.json
```

Trailing-slash conventions are normalized (Next `/docs/` vs Hologram `/docs`);
verdicts: PASS / GAP / FAIL / MISMATCH (see script header). Exit 0 with only
PASS/GAP rows — gaps are the expected mid-port state, not errors.

## Layer 3 — BDD behavior (Cypress, ported features)

`app/e2e/` ports the landing-preview `cypress/e2e/{home,docs}.feature` suites
verbatim (same step text, same selector contract) plus the console-error
guard. Every feature's `Given` probes its route first: GAP routes skip their
scenario with a `PARITY GAP` log and land in `.parity/gaps.jsonl`; the run
summary prints them. Regression semantics unchanged — once a route serves,
its steps assert for real.

```sh
cd app/e2e && npm ci          # cypress binary shared with the web checkout cache
PARITY_APP_BASE=http://127.0.0.1:4100 npx cypress run
```

## Layer 4 — render snapshots + diff

`scripts/parity/snap-tag.mjs` is the ported snap harness (same discovery
contract: `#example-<id>` anchors, `figure.code-window` shapes, view pills
`[aria-pressed]`, `[data-sem-theme]` panes, min-10px output gate, sticky
chrome hiding, live-socket neutering — now covering the Hologram runtime
socket too). Route-parameterized, so it snapshots ANY page on EITHER side:

```sh
node scripts/parity/snap-tag.mjs --start-app              # boot managed Hologram dev (reusable)
node scripts/parity/snap-tag.mjs --base http://127.0.0.1:4100 --tag highlight
node scripts/parity/snap-tag.mjs --base <next-base> --tag highlight --out /tmp/snaps-next
node scripts/parity/snap-diff.mjs /tmp/snaps-next <app-snaps-dir>   # pixel-diff report
```

A 404 route is reported as `GAP: <route> — not served by <base>` (exit 3,
nothing captured) — expected mid-port. `snap-diff` percentages are REVIEW
EVIDENCE for a human/vision pass: cross-framework renders are never
pixel-identical, so the report ranks shots by divergence instead of gating.

## Starting the Hologram server

```sh
node scripts/parity/snap-tag.mjs --start-app
# spawns (once, lockfile-guarded, reusable): cd app/backend &&
#   HOLOGRAM_START=1 MIX_BUILD_ROOT=/tmp/semtext-hologram/parity-harness/_build PORT=<free> mix phx.server
node scripts/parity/snap-tag.mjs --stop    # stop the managed instance
```

DB env passes through: point `DB_PORT` at your own disposable container
(named `semtext-p0-<lane>`), NEVER at a cluster database. Kill only
containers you started, by exact name.

## Cross-lane contract

- Port lanes never edit anything here; landing a route makes the harness
  greener automatically (GAP → PASS or FAIL with concrete detail).
- The parity selectors contract (scaffold.md) is enforced by layers 1–4:
  `figure.code-window`, `#example-<id>` anchors, view pills with
  `aria-pressed`, `[data-sem-theme]` panes, `main#main` content anchor,
  `<title>` per page.
- Change the Next site's routes → run `gen-manifest.mjs` and commit.
- CI wiring is intentionally not touched from here (app-ci.yml is the
  scaffold lane's); see the parity lane report for the proposed job.
