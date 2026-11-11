# TEST-HEALTH — test tiers, CI lanes, and the e2e lane post-mortem

The referenced-by-everything map for how this repo tests: `vite.config.ts`
(coverage ratchet), `app/README.md` (CI section), and both root workflows.
Numbers below are **measured** (2026-11-11 unless noted), not aspirational.

## Tiers and where they run

| Tier | Command | Count / wall | Where it runs | Notes |
|---|---|---|---|---|
| mod (Claude Code mod) | `npm run test:mod` → `claude plugin test mods/semtext` | 73 tests, <1s | **PR + develop push (`ci.yml: mod`) + nightly** | No credentials needed (see below). CLI installed in-job from npm, pinned `@anthropic-ai/claude-code@2.1.322`. |
| unit (vitest) | `npm run test:unit` | 62 tests, ~3.5s | **PR + develop push (`ci.yml: unit`)** | Plain run — fast lane pays no coverage cost. |
| unit + coverage gate | `npm run test:unit:cover` | ~same + instrumentation | **nightly only** (`full-suite`) | Threshold is the ratchet in `vite.config.ts` (lines: 16). Coverage artifact uploaded nightly. |
| landing (Next.js) | `npx tsc --noEmit` + `npm run build` | — | **PR + develop push** (`ci.yml: test-landing`) | `landing/` static export. |
| e2e (cypress) | `npx cypress run --e2e` | 28 specs, ~204s spec-time | **nightly only** (`full-suite`, unsharded) | Removed from the PR lane 2026-11-11 — see post-mortem. `npm test` / `test:open` still run it locally. |
| smoke (cypress subset) | `npm run test:smoke` | 2 specs (standalone-lit, agent-surface) | **opt-in local / nightly-extra — never a gate** | Added 2026-11-11; wire into a lane deliberately, if ever. |
| docker (PR fail-fast) | build-push-action, no push | — | PR only (`ci.yml: docker-build`) | Image steps untouched by the lane change. |
| app backend (Hologram) | `mix test` via `app-ci.yml` | see that lane | app-ci.yml | **Out of scope for this file's lanes** — `app-ci.yml` and release triggers were not touched here. |

PR/develop gate is now: `test-landing` + `unit` + `mod` (~4s of tests). The
sandbox posture accepts e2e regressing reaching `develop` and being caught by
nightly — the trade buys back a lane that hadn't executed a single spec since
2026-10-20.

## Is `claude plugin test` CI-runnable? Yes — no credentials

Verified 2026-11-11 in a clean `HOME` with `ANTHROPIC_API_KEY` and
`CLAUDE_CODE_OAUTH_TOKEN` empty: all 73 mod tests pass in under a second.
The mod test files run as plain children of the CLI binary (they import from
`claude-code/testing`) — **no model call, no login, no network auth**. The
suite also needs no `node_modules`; the CI job installs only the pinned CLI.

CI cost is the `npm install -g @anthropic-ai/claude-code` step. When bumping
the pin, re-run `npm run test:mod` locally first; if a future CLI ever starts
requiring auth, quarantine the job (add it below) rather than deleting the
tier.

## Post-mortem: the e2e lane, 101 consecutive failures (2026-10-20 → 2026-11-11)

**Symptom.** Every CI run of the 3-way cypress shard matrix, and the nightly
full-suite, died inside `cypress-io/github-action@v6` with
`Socket closed before the connection was established` ~15ms after it began
waiting on `http://localhost:4173/demo/index.html`. **Zero specs ever
executed** — 101 consecutive failures across the lane, identical in nightly.

**Root cause.** The action's internal wait/socket plumbing, not this repo: the
preview server it waited on was fine (the same URL answers instantly for the
explicit node poll added below, and locally `npm run serve` + `npx cypress
run` works). No spec change can make or unmake this failure mode; that is
exactly why 101 runs burned with zero information.

**Fix (2026-11-11).** No `cypress-io/github-action` anywhere. The nightly
lane uses explicit steps: `npm ci` → `npm run build:strict` → background
`nohup npm run serve` → node built-in-`fetch` poll of the old wait-on URL
(1s ticks, 120s cap) → `npx cypress run --e2e` in the foreground (its exit
code gates the job) → serve log dumped on failure. The PR/develop shards were
**removed from `ci.yml`** (they only ever fed that broken action); e2e is a
nightly tier. `docker-build`/`build-push` `needs:` no longer reference the
removed `test` job; their image steps are byte-identical.

**CYPRESS_INSTALL_BINARY.** The `unit` job sets it to `0` (no browser in the
npm install). The nightly `full-suite` must leave it **unset** and restores
`~/.cache/Cypress` from the actions cache — the binary download lives outside
`~/.npm`. The `mod` jobs run no npm install at all, so the variable is moot
there.

## Quarantine / known-red

- **`nightly.yml: warm-docker-cache` — real Next.js type error.** Distinct
  from the e2e action breakage above: the nightly docker build fails on an
  actual TypeScript error in the landing build path. Carried as known-red
  since 2026-11-11; **not fixed by this lane change** (fixing it is product
  work, not test-infra work). Track it where the fix will land, not here.
- Nothing else quarantined: mod/unit/landing are green on the measured head.

## Local commands

```bash
npm run test:unit          # 62 tests, ~3.5s
npm run test:mod           # 73 mod tests, needs `claude` CLI on PATH; no login
npm run test:unit:cover    # coverage gate, as nightly runs it
npm test                   # full cypress e2e locally: needs `npm run build`
                           #   first + `npm run serve` in another shell —
                           #   repo policy: do NOT run the e2e suite routinely;
                           #   nightly exercises it
npm run test:smoke         # 2-spec cypress subset, opt-in only
```

Per-change loop is `test:unit` + `test:mod` (~4s together); slower tiers run
on their lane, not in your terminal.

## Shard weights are stale — re-measure before re-sharding

`scripts/cypress-shard.mjs` stays in the tree (kept available; nothing in CI
calls it now). Its `WEIGHTS` are CI wall seconds from the **2026-10-07** run —
10 specs named, while the suite has since grown to 28, and no spec has been
measured in CI since the lane died. Every unlisted spec gets
`DEFAULT_WEIGHT = 5`, so shard balance is currently fiction (sharding can
still never *drop* a spec — assignment is exhaustive). Before re-sharding
anything, re-measure per-spec times and refresh the map.

## App (Hologram backend) tier notes

`app/.github/workflows/` (extracted to the repo root `.github/workflows/` on
hydration by other apps) runs `mix test --cover` + a backend docker smoke
build per PR. Template defaults: coverage gate in `backend/mix.exs`; PR runs
restore caches only (develop/main/nightly save). `app-ci.yml` is untouched by
the root-lane change above and is the source of truth for its own numbers.

### Entity repo overrides call `super`

The template's entity-repo `create`/`update`/`delete` overrides self-dispatched
(sign-up's `Credentials.register/4` raised) until 2026-10-07; fixed in-template
by delegating to `super`. Apps hydrated **before** 2026-10-07 need the same
fix — see `app/README.md` (source of record) and hydrated-app changelogs.
