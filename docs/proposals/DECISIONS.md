# Proposals P1 — decision record

Date: 2026-10-17 · Owner: P1 wrap (coordinator-confirmed defaults) · Scope: ui-lane open questions from `reports/p1-ui.md` + wrap findings. Each entry states the decision, its rationale, and where it is applied.

## D1 — Turnstile on the report form

**Decision:** Required before pilot posture; optional (configured off, skips gracefully) in sandbox.

**Rationale:** The report form is abuse surface #1 once non-team users arrive. Sandbox has no untrusted traffic, so gating it there only burns dev time; the skip-when-unconfigured path (already shipped) is the dev behavior. The pilot posture demands human-verification on untrusted writes.

**Applied:** `report_form.ex` keeps the skip-when-unconfigured path (`SEMTEXT_TURNSTILE_SITE_KEY`/`SEMTEXT_TURNSTILE_SECRET_KEY` unset ⇒ no widget, form still works). **Cutover checklist gate:** the `pilot` section of `CUTOVER-INFRA.md` lists both keys as required before any pilot deploy. Revisit the code path (reject writes when `pilot` posture and keys missing) in P2.

## D2 — Ownership of router/dev.exs/host_dispatch_test transitional changes

**Decision:** Belong to the P1 wrap owner (this lane), not port-docs.

**Rationale:** The ui lane took over the transitional `/` + `/p/:slug` JSON stubs and the multi-host dev wiring as part of landing the proposals pages; the tests assert the current contract. Port-docs' wizard/scaffold files remain port-docs' with additive ui edits (already documented in `reports/p1-ui.md`).

**Applied:** `app/backend/lib/semtext_web/proposals_router.ex`, `app/backend/config/dev.exs` (`:hosts` + `:proposals_ui :origin`), `test/semtext_web/plugs/host_dispatch_test.exs` are maintained by the proposals lane going forward.

## D3 — E2E env-var convention

**Decision:** `SEMTEXT_E2E_*` is the standing prefix for end-to-end stub inputs.

**Rationale:** One greppable namespace for every Cypress-only input (host origins, stub logins) across repos and CI; avoids collision with runtime `SEMTEXT_*` config keys.

**Applied:** The e2e suite reads Cypress env `E2E_*` today (`E2E_HOSTS`, `E2E_MAIN_ORIGIN`, `E2E_PROPOSALS_ORIGIN`, `E2E_PROPOSALS_TEST_LOGIN`, `E2E_PROPOSALS_MOD_LOGIN`, `PARITY_APP_BASE` in `app/e2e/cypress.config.ts`). Renaming the *env vars feeding Cypress* to `SEMTEXT_E2E_*` is a mechanical P2 cleanup; the convention (one namespaced set, fail-loudly when missing, never skip) is the durable contract. CI secrets for these are listed in `CUTOVER-INFRA.md` under `SEMTEXT_E2E_*` names.

## D4 — GitHub-issue fallback link on the wizard

**Decision:** Keep the constant fallback link until the Discussion e2e is green against the real GitHub App; remove it then.

**Rationale:** The fallback (plain constant href, no prefill — prefill was removed after the NativeValue-in-state corruption) is the only submit path that survives a broken sync pipeline. It comes out the moment the real path is proven end to end, not before.

**Applied:** `vocab_proposal_wizard.ex` template constant. Removal gate recorded in `CUTOVER-INFRA.md` (post-cutover verification step: webhook + Discussion sync round trip green ⇒ delete the fallback).

## D5 — REST API §3 scope in P1

**Decision:** Ship P1 as read-only browse/detail JSON + the authenticated submit path; everything else in API.md §3 is P2.

**Rationale:** The Hologram pages + `/hologram/*` command path cover the brief's P1 UI surface. A minimal read-only JSON surface unblocks external consumers without committing to a full public API contract before the data model has survived contact with users.

**Applied:** Browse/detail GET handlers + submit; moderation/search/pagination JSON is P2. Owner: proposals lane.

## Wrap findings folded into this record

- **Wizard client-event "instability" root cause** was a state bug, not a runtime one: `VocabProposalWizard.recompute/2` never persisted the changed field, so the controlled-input patch reset every keystroke and `@ready` never flipped. Fixed (`p1(wizard)` commit); proven by instrumented browser run + 5/5 Cypress.
- **Rate-limited submits** now answer a 429 problem notice instead of 500 (`Problems.problem/2` binary+map clause).
- **Moderation commands** use `%{system: :moderator_panel}` actors (append_event/4 contract).
- **Hydration restores `html.no-js`** — fixed with a class-attribute MutationObserver re-flip in `site-chrome.js` (`p1(site-chrome)` commit).
- **Known issue (not fixed, evidence in the wrap report):** the client runtime intermittently swallows the first wizard submit response's `:goto` — server always 200s + inserts; a second click on the same mount (same Idempotency-Key, replays) navigates. Specs click twice; product follow-up for the hologram owner.
- **Rate limiter vs re-used dev DBs:** the `:submit` bucket (5/window) makes the proposals spec suite fail on a re-used local DB. CI runs on a fresh DB are unaffected; local reruns need `DELETE FROM rate_limit_events;` first. Not a spec bug.
