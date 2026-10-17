# Schema — `sem-procedure` / `sem-step`

Contract per conventions.md v0.6. BDD source of truth for
`test/e2e/sem-procedure.cy.js`. Changes here precede spec changes
precede code.

## Authoring form

```html
<sem-procedure kind="runbook">
  <sem-step status="done">provision Infisical path</sem-step>
  <sem-step status="current">port-forward MinIO</sem-step>
  <sem-step>run migrations</sem-step>
  <sem-step status="blocked">cut release — waiting on CI</sem-step>
</sem-procedure>
```

Class-form alias (conventions Appendix A): `div.sem-procedure[data-kind]` › `div.sem-step[data-status]`.

- `status`: `done` | `current` | `todo` (default) | `blocked`.
- Status sugar (conventions §3) inside step text — `✅ …` = done,
  `→ …` = current, `❌ …` = blocked — **is sugar only**; `status`
  is canonical. Authors pick one. The fallback handler does NOT parse
  sugar; authors wanting sugar write the attr too.
- `kind` free token (`runbook`, `recipe`, `migration` …).
- `id`, `tags` per global attribute catalog.
- **DOM order = execution order.** No step-number attribute; ordinals
  are positional (CSS counters render them).

## Rendered form

- **Zero-JS element.** Pure CSS: list presentation is supplied by the
  theme/structural stylesheet (`role="list"` on the container and
  `role="listitem"` on each step are **optional** in v0.6 — the box and
  counter styling no longer depend on them; documents that carry the
  roles stay valid), ordinal via CSS counter, status glyph via
  `[status]` / `[data-status]` `::after` (✓ done · → current · ⛔ blocked · ○ todo).
- `status="current"` step gets accent border; `blocked` muted-red.
- Lit milestone may add click-to-toggle status; not yet.

## Events

None.

## A11y contract

- Steps read as a list to assistive technology through the stylesheet's
  list presentation; authored `role="list"` / `role="listitem"` are
  optional (v0.6) and may be added for belt-and-braces AT support.
- Status conveyed by glyph **and** `status` attribute (machine +
  AT via text alternative).

## Machine contract

- Container = one ordered procedure; children in DOM order are steps.
- `status` per step is the lifecycle annotation; a procedure with
  any `blocked` step is itself blocked (derivable, not authored).
