# Proposals API — P1 contract (LANE=data)

Status: **contract** · Owner: LANE=data · Design: `DESIGN-v2.md` §5 + v1 `DESIGN.md` §4–§7
Context module: `app/backend/lib/semtext/proposals.ex` (`Semtext.Proposals`)
Schema (Liquibase): `app/backend/db/changelog/028-proposals-{enums,tables}.yaml`, `030-proposals-indexes.yaml`

Other lanes code against this document and the `Semtext.Proposals` heads. The
contract commit publishes heads (bodies may `raise "todo"`) — implementation
commits fill them in without changing shapes. If a shape must change, the
data lane bumps this file and announces it in `reports/p1-data.md`.

---

## 1. Shape of the surface

| Concern | Decision |
|---|---|
| Base URL | `https://proposals.semtext.dev/api/v1` (ProposalsRouter, host-dispatched — v2 §3.1) |
| Content types | Requests/responses `application/json`; every error body `application/problem+json` (RFC 9457) |
| Auth | GitHub session cookie only (auth lane). API paths get `401` problem+json when unauthenticated; Hologram pages redirect to login. Roles: owner (session user owns the row), moderator (`semtext-moderators` group — auth lane's `require_role(:moderator)`) |
| Pagination | Opaque cursors: `?after=<cursor>&limit=<n>`; envelope `{"items": [...], "next_cursor": string\|null, "has_more": bool}`; `limit` default 20, max 50 |
| Idempotency | `Idempotency-Key` header (or command param) on submit; replay returns the ORIGINAL proposal, HTTP 201 again, plus `Idempotency-Replayed: true` |
| Identity | v2 §5: no anonymous submitters, no anon edit tokens. `submitters` is a SQL VIEW over `users` (+ `github_login`, `trust_tier`) |
| Times | RFC 3339 UTC (`utc_datetime_usec`) |
| Sizes (v1 §5, validated 422) | `example` ≤ 64 KB · files ≤ 256 KB each / 1 MB total (P2 payload) · datasets ≤ 512 KB (P2) |

## 2. Status lifecycle (v1 §3.7 — DB-authoritative)

```
draft ──submit(owner)──▶ submitted ──triage(mod)──▶ under_review ──mod──▶ accepted ──mod──▶ merged
  │                        │            └──mod──▶ declined            └──mod──▶ declined
  └──withdraw(owner)──▶ withdrawn ◀──withdraw(owner)──┘
```

- Owner transitions: `draft → submitted`, `draft → withdrawn`, `submitted → withdrawn`.
- Moderator transitions: `submitted → under_review|declined`, `under_review → accepted|declined`, `accepted → merged`.
- Anything else → `409` problem `invalid-status-transition`.
- `hide`/`unhide` are moderator actions orthogonal to status (`hidden_at` timestamp); hidden rows 404 for the public and render with a moderation banner for moderators.
- Every transition / hide / report lands an append-only `moderation_events` row.

## 3. Endpoints (P1)

| # | Method & path | Auth | Purpose |
|---|---|---|---|
| 1 | `POST /api/v1/proposals` | session (submitter) | Submit (or the same-origin command — §5). `Idempotency-Key` honored. Creates `status: submitted` + version 1 + `discussion_links` row `state: pending` |
| 2 | `GET /api/v1/proposals` | public | Browse/search — `q`, `tag`, `status`, `sort=newest\|updated\|discussed`, `fork_of`, `after`, `limit`. Public result set: `public_statuses` non-hidden (`submitted|under_review|accepted|merged`) |
| 3 | `GET /api/v1/proposals/{slug}` | public (viewer-aware) | Detail: fields + `discussion: {state, url, comment_count, reactions}` chip + `forked_from`. Drafts/hidden 404 unless owner/moderator |
| 4 | `GET /api/v1/proposals/{slug}/versions` | public | Version list (descending) |
| 5 | `GET /api/v1/proposals/{slug}/versions/{n}` | public | Fields + `files` + `files_sha256` (playground input, P2) |
| 6 | `PATCH /api/v1/proposals/{slug}` | owner | Edit DRAFT fields (post-submit edits are P2 versions) |
| 7 | `DELETE /api/v1/proposals/{slug}` | owner | Withdraw (`draft/submitted → withdrawn`); soft — row stays for audit |
| 8 | `POST /api/v1/proposals/{slug}/submit` | owner | Draft → submitted (runs the #1 post-conditions: version 1 + pending discussion link) |
| 9 | `POST /api/v1/proposals/{slug}/report` | public (Turnstile) | Abuse report → `proposal_reports` + `moderation_events(report)`; per-IP rate limit |
| 10 | `GET /api/v1/me/proposals` | session | Dashboard: own drafts + live + forks, newest first |
| 11 | `GET /api/v1/proposals/{slug}/forks` | public | Direct children (P2 grows the recursive tree) |
| 12 | `POST /api/v1/admin/proposals/{slug}/status` | moderator | Body `{status, reason?}` — §2 moderator transitions |
| 13 | `POST /api/v1/admin/proposals/{slug}/hide` · `/unhide` | moderator | Body `{reason?}` |
| 14 | `GET /api/v1/admin/queue` | moderator | `{hidden: [...], reported: [...], sync_failed: [...]}` |
| 15 | `POST /api/v1/admin/reports/{id}/resolve` | moderator | Body `{outcome: resolved\|dismissed}` |
| 16 | `POST /api/v1/admin/discussions/{proposal_id}/retry` | moderator | Failed sync → pending, retry worker picks it up |
| 16a | `POST /api/v1/admin/discussions/{proposal_id}/recreate` | moderator | `removed` link → pending with a fresh attempt budget + cleared link target; re-enqueues creation. The ONLY path back from `removed` — never automatic |
| 17 | `POST /api/v1/webhooks/github` | HMAC (github-sync lane) | Discussion/comment/reaction sync + delivery dedupe; `discussion.deleted` sets the chip to `removed` (only from `ok`) |

P2 (documented now, not built): `POST …/fork`, `POST /api/v1/playgrounds`, `GET /api/v1/playgrounds/{share_slug}`, `GET /api/v1/datasets?public=true`.

### 3.1 Submit request/response (#1, #8)

```json
// POST /api/v1/proposals   Idempotency-Key: <uuid4>
{
  "element_tag": "sem-note",
  "title": "Collapsible notes",
  "summary": "…",
  "motivation": "…",
  "options": [{"name": "collapsed", "meaning": "…"}],
  "example": "<sem-note>…</sem-note>",
  "files": {}                       // optional at P1; v1 §5 caps when present
}
// 201
{
  "slug": "sem-note",
  "url": "https://proposals.semtext.dev/p/sem-note",
  "status": "submitted",
  "discussion": {"state": "pending", "url": null},
  "created_at": "…"
}
// headers: Location: /api/v1/proposals/sem-note, Idempotency-Replayed on replay
```

- `element_tag`/`slug` grammar: `^[a-z][a-z0-9]*(-[a-z0-9]+)*$`, ≤ 64 chars (v1 §7.2 NAME_RE). Slug defaults to `element_tag`; on collision a `-2`/`-3…` suffix is appended (forks re-use tags — uniqueness is enforced on slug globally, on `element_tag` only among non-hidden rows).
- `discussion` creation is async (github-sync's Oban worker): submit returns `state: "pending"` immediately; the chip flips via webhook sync. A GitHub outage degrades to a visible `pending`/`failed` chip — never a lost proposal (acceptance: forced-outage test). A discussion deleted on GitHub moves the chip to `removed` (webhook-set, only from `ok`); the UI shows "discussion removed" and recreation happens exclusively via the moderator `recreate` action (16a) — never auto-recreated.

### 3.2 Browse response (#2)

Items are proposal summaries: `slug, element_tag, title, summary, status, inserted_at, updated_at, discussion: {comment_count, reactions, state}`. `sort`: `newest` = inserted_at desc (default), `updated` = updated_at desc, `discussed` = comment_count desc nulls-last. Cursor = opaque base64 of `"{sort_key}|{id}"`; stable while new rows land (keyset pagination).

## 4. Errors — problem+json catalogue

Base type URI `https://proposals.semtext.dev/problems/`. Body always carries `type`, `title`, `status`, `detail?`, `instance?` + the extensions below.

| type (suffix) | HTTP | Extensions | Raised by |
|---|---|---|---|
| `unauthenticated` | 401 | — | no session on a session-required API path |
| `forbidden` | 403 | — | not owner / not moderator |
| `banned` | 403 | — | `users.is_banned` submitter (auth lane sets the flag) |
| `turnstile-failed` | 403 | — | report endpoint, missing/invalid Turnstile token |
| `not-found` | 404 | — | missing slug, or hidden/draft for this viewer (no existence leak) |
| `invalid-status-transition` | 409 | `from`, `to` | §2 violations |
| `validation-failed` | 422 | `errors: {field: [msg]}` | changeset rejections |
| `size-exceeded` | 422 | `path`, `limit_bytes`, `actual_bytes` | v1 §5 caps |
| `rate-limited` | 429 | `retry_after` (seconds) | §6 buckets; `Retry-After` header set too |
| `internal-error` | 500 | — | unhandled (never leaks internals) |

## 5. Hologram command shapes (same-origin submit — v2 §5)

The `/extend` wizard and the draft editor submit through Hologram `command/3`s
that call `Semtext.Proposals` directly — no cross-origin POST, no CORS, no
Turnstile-at-the-door (D4). Contract for the ui lane:

| Command | Params (event.value payload) | Success state patch | Error state patch |
|---|---|---|---|
| `:submit_proposal` | `%{"fields" => %{element_tag, title, summary, motivation, options, example}, "idempotency_key" => uuid4}` | `{:ok, %{slug, url}}` → navigate to `/p/<slug>` | `{:error, problem_map}` — render `problem_map["detail"]`/`errors` accessibly |
| `:save_draft` | `%{"fields" => …}` | `{:ok, %{slug, status: "draft"}}` | as above |
| `:withdraw` | `%{"slug" => …}` | `{:ok, %{status: "withdrawn"}}` | as above |

- `idempotency_key` is generated once at wizard mount and reused across retries within the session — replay returns the original (acceptance: replay idempotent).
- `problem_map` is exactly the §4 catalogue serialised (`type` suffix, `status`, `detail`, plus `errors`/`retry_after` extensions when present).
- Turnstile appears ONLY on the public report endpoint (#9), site key from config — ui lane renders the widget; verification is server-side.

## 6. Rate limits (v2 §5: per-user submit + per-IP report)

Implementation: `Semtext.Proposals.RateLimit` — Postgres-backed approximate
sliding window over `rate_limit_events` (count rows newer than `now - window`).
Exhaustion returns `{:error, {:limited, retry_after_seconds}}` → 429 problem
`rate-limited` + `Retry-After` header.

| Bucket | Subject | Limit | Window |
|---|---|---|---|
| `submit` | user id | 5 | 1 hour |
| `report` | `ip:<addr>` | 10 | 1 hour |
| `fork` (P2) | user id | 10 | 24 hours |
| `read` | `ip:<addr>` | 120 | 1 minute |

Rows older than 25 h are pruned opportunistically on consume. The window is
approximate (two racing requests may both slip through) — accepted at MVP scale.

## 7. Data model reference (Liquibase-owned — `028`/`029`/`030` changesets)

Ecto mirrors live in `app/backend/lib/semtext/proposals/*.ex`. Types in Ecto
schemas are `Ecto.Enum` over native PG enums; `citext` reads as `:string`.

### proposals
`id uuid pk` · `slug citext unique not null` · `element_tag text not null` · `title text not null` · `summary text not null` · `motivation text not null` · `options jsonb not null default '[]'` · `example text not null default ''` · `status proposal_status_enum not null default 'draft'` · `current_version_id uuid fk→proposal_versions (deferred)` · `forked_from_proposal_id uuid fk→proposals` · `forked_from_version_id uuid fk→proposal_versions` · `submitter_id uuid not null fk→users` · `idempotency_key text unique` · `hidden_at timestamptz` · `search tsvector GENERATED (tag+title+summary+motivation) STORED` · `inserted_at/updated_at`

Indexes: `idx_proposals_list (status, updated_at desc) where hidden_at is null` · `idx_proposals_search gin(search)` · `idx_proposals_tag (element_tag) where hidden_at is null` · `idx_proposals_forks` · `idx_proposals_submitter (submitter_id, updated_at desc)` · `uq_proposals_idempotency_key`

### proposal_versions (P2-readiness)
`id uuid pk` · `proposal_id uuid not null fk` · `version int not null` (`uq(proposal_id, version)`) · `title/summary/motivation text not null` · `options jsonb` · `example text` · `files jsonb not null default '{}'` (`{path: text}`) · `files_sha256 text not null` (sha256 of sorted-files canonical JSON — `Semtext.Proposals.ProposalVersion.canonical_files/1`) · `created_by_id uuid fk→users` · `inserted_at` (immutable)

### discussion_links
`id uuid pk` · `proposal_id uuid not null unique fk` · `repo text not null` · `discussion_number int` · `node_id text` · `url text` · `category text` · `state discussion_state_enum not null default 'pending'` — `pending|ok|failed|removed` (`removed` added 2026-10-17: webhook-set from `ok` only; moderator `recreate` is the only way back) · `attempts int not null default 0` · `comment_count int not null default 0` · `reactions jsonb not null default '{}'` · `last_synced_at timestamptz` · `last_error text` · `uq(repo, discussion_number)`

### moderation_events (append-only)
`id uuid pk` · `proposal_id uuid not null fk` · `actor_user_id uuid fk→users (null for system)` · `actor_system text` · `event moderation_event_enum not null` — `status_change|hide|unhide|report|spam_flag|lock_discussion|claim` · `from_status/to_status proposal_status_enum` · `reason text` · `inserted_at`

### proposal_reports
`id uuid pk` · `proposal_id uuid not null fk` · `reporter_id uuid fk→users (null = anonymous)` · `reason report_reason_enum not null default 'other'` — `spam|harassment|other` · `details text` · `status report_status_enum not null default 'open'` — `open|resolved|dismissed` · `idx open-reports`

### rate_limit_events (insert-only log)
`id uuid pk` · `bucket text not null` · `subject text not null` · `inserted_at` · `idx (bucket, subject, inserted_at)`

### github_webhook_deliveries (github-sync's dedupe table)
`id uuid pk` · `delivery_id text not null unique` · `event text` · `inserted_at`. Contract: insert BEFORE processing; unique violation ⇒ replayed delivery ⇒ no-op.

### users (scaffold table — additive columns here)
`github_login citext` (`uq … where not null`) · `trust_tier smallint not null default 0` (0 new / 1 established — consumed by later rate-limit bumps; P1 stores it) · `role citext not null default 'user'` (`'user'|'moderator'` — LANE=auth's `require_role(:moderator)` + `mix semtext.grant_moderator <github_login>`; added in the same 029 changeset by coordinated request).
`submitters` = SQL VIEW over `users` (`id, user_name, handle, email, github_login, trust_tier, role, admin, verified, status, inserted_at, updated_at`) — v1 naming compatibility; no Ecto schema maps it.

## 8. Context functions other lanes call

- **github-sync**: `ensure_discussion_link/2` · `record_discussion_created/2` · `record_discussion_failure/2` (attempts+1; `pending → failed` after `:discussion_max_attempts`, default 5) · `record_discussion_sync/2` · `retry_discussion/1` · `pending_discussions/1` (retry-worker input, oldest first) · `record_delivery/2` (webhook dedupe). Retry backoff is the worker's (github-sync owns Oban).
- **ui**: every §3 endpoint maps 1:1 to context functions (`create_and_submit/3`, `save_draft/2`, `update_draft/3`, `submit_draft/2`, `withdraw/2`, `get_by_slug/2`, `list_proposals/2`, `list_versions/1`, `get_version/2`, `owner_proposals/1`, `list_forks/1`, `create_report/3`, moderation functions).
- **auth**: `users.github_login` upsert target (unique partial index `uq_users_github_login`); `trust_tier` default 0. The Ecto `Semtext.Schema.Users.User` gains the two fields in the auth lane's commit.
- Visibility rule used by every read: public = `status ∈ public_statuses` AND `hidden_at is null`; drafts = owner + moderators; hidden = moderators only; stranger-mismatch collapses to `{:error, :not_found}`.

## 9. Infra requests (carry to the P1 report)

1. `.infra-config.yaml` `liquibase_targets` entry **`semtext-db`** (the bare `semtext` key is the domain mapping; v2 §5 names the target `semtext-db`): namespace `apps`, service `svc/app-timescaledb`, `db_name: semtext`, changelog dir `Projects/semtext.dev/app/backend/db/changelog`. (Monorepo file — data lane does not edit it.)
2. DB `semtext` + migrations user on `app-timescaledb` (chart env: `SEMTEXT_DB_*` per the scaffold's secret naming) — already requested by the scaffold lane's report; the proposals tables above are the first consumer.
3. No new Infisical keys from this lane (rate limits/search are DB-backed; no Redis dependency added).

## 10. Ownership map (P1)

| Path | Owner |
|---|---|
| `app/backend/db/changelog/**` | data |
| `app/backend/lib/semtext/proposals.ex` + `app/backend/lib/semtext/proposals/**` | data |
| `docs/proposals/API.md` | data |
| `lib/semtext/auth/**`, plugs, `users` Ecto schema fields | auth |
| `lib/semtext/github/**`, workers (Oban), webhook controller | github-sync |
| Hologram pages/components under `hologram/pages/proposals/**`, e2e Cypress | ui |
