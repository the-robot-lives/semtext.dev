# Reference refresh procedure (`/reference`)

The `/reference` section of the Hologram app (`app/backend`) is built from
compile-time data under `app/backend/priv/data/`. Generated files are never
hand-edited; hand-authored overlays are mandatory per tag and fail the build
when a tag is missing. The reference **source** data lives at the repo root
in `data/` (relocated from the retired `web/data/` 2026-11-11): the
generated `elements.json` / `bundles.json` plus the hand-authored
`reference-*.ts` overlays.

| File | Kind | Owner |
|---|---|---|
| `elements.json`, `bundles.json` | generated upstream (`npl-enhanced-content`) | `mix semtext.gen_reference --web .` copies them from `data/` |
| `example-variants.json` | converted from `data/reference-example-variants.ts` | `mix semtext.gen_reference` |
| `description-overrides.json` | hand-authored plain-language copy, **mandatory per tag** | edit by hand |
| `claude-examples.json` | per-tag "SemText — Claude example", **mandatory per tag** | hand (`"source": "hand"`) + seeder (`"source": "seed"`) |

## Steps

1. Pull the upstream subtree / vendor bump (bundles come from upstream
   `npl-enhanced-content` `develop`, never from the subtree copy). Sync the
   vendored bundle tree first: `node scripts/sync-bundles.mjs --from <dist>`
   (regenerates `data/bundles.json`).
2. `cd app/backend && mix semtext.gen_reference --web . --seed-claude-examples`
   - `--web` takes a directory CONTAINING `data/`; `.` (the repo root) is the
     normal value now that the source data lives at `data/`. The underlying
     `app/scripts/gen-reference.mjs` also accepts `--data <dir>` and defaults
     to the repo `data/` when run directly;
   - refreshes `elements.json`, `bundles.json`, `example-variants.json`, `glossary.ex`, `buckets.ex`;
   - re-seeds every `"source": "seed"` entry of `claude-examples.json` from the
     new spec examples (normalised to the sem-text-author conventions) and
     adds entries for new tags; `"source": "hand"` entries are never touched;
   - validates every Claude example with `bin/semtext-validate.mjs` and prints
     the result.
3. Add a `description-overrides.json` entry for every new tag.
4. Hand-polish new examples worth it: edit the entry, flip `"source"` to `"hand"`.
5. `mix compile && mix test` — `test/semtext/reference/claude_examples_test.exs`
   re-validates every example and checks the seeder is in sync
   (`node app/scripts/seed-claude-examples.mjs --check`).

If a new tag already broke the build (no Claude example), run the seeder
directly — it needs no compile: `node app/scripts/seed-claude-examples.mjs`.

## Claude examples

Each card on `/reference` and the header of every `/reference/<tag>` page
show the tag's Claude example twice: a static code block (`<pre><code>`,
labelled "SemText — Claude example") and a live render pane booted by
`priv/static/js/semtext-island.js`. Index renders are collapsed by default
(per-card "Live render" toggle, page-wide "Show renders" switch); expanded
panes boot when scrolled into view. The pane spec is derived from
`bundles.json`, so a vendor bump that ships a new handler upgrades every
render without code changes. `data-sem-shell="pending"` marks where the
future JS shell mounts.

Authoring rules for examples: minimal and valid; include the container when
the tag only lives inside one (`sem-reference` in `sem-references`,
`sem-step` in `sem-procedure`, `sem-reader`/`agent` under the root); markdown
pipe tables in `sem-table`, flat `sem-code`, `<highlight>` instead of
`<b>`/`<strong>`, `cite` + `id` on `sem-reference`, no role attributes.

Known validator-schema gap: `spec/schema/semtext.schema.json` does not yet
list the `npl-*` family, `sem-browser`, `sem-question` or `sem-option`;
their examples may only fail with `unknown-element` for those names.
