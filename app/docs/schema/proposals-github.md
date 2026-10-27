# Proposals & GitHub Domain

Proposal pipeline for `proposals.semtext.dev` (design v2): community members submit SemText element proposals, moderators triage them, and accepted work syncs to GitHub Discussions. Introduced in changesets 026–031. Context code: `Semtext.Proposals` (`backend/lib/semtext/proposals/`); GitHub integration: `Semtext.Github` (`backend/lib/semtext/github/`). Entry points: `SemtextWeb.ProposalsRouter` (SSR pages, GitHub OAuth) and `POST /api/v1/webhooks/github` (`SemtextWeb.GithubWebhookController`).

## users (GitHub columns, 029)

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| github_login | CITEXT | Yes | — | GitHub login used by the proposals host |
| trust_tier | SMALLINT | Yes | — | Numeric submitter trust tier |
| role | CITEXT | Yes | — | Proposals-host role (`moderator` gates moderation pages) |

`view_submitters` (SQL view, 029) projects the submitter-facing columns of `users`.

## proposals

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| slug | CITEXT | No | — | Unique slug (URL path `/p/:slug`) |
| element_tag | TEXT | No | — | Proposed SemText element tag |
| title / summary / motivation | TEXT | No | — | Core proposal fields |
| options | JSONB | No | '[]' | Structured options (e.g. schema choices) |
| example | TEXT | No | '' | Example markup |
| status | proposal_status_enum | No | 'draft' | draft → submitted → under_review → accepted/declined/merged/withdrawn |
| current_version_id | UUID (FK, deferrable) | Yes | — | Fast pointer to the latest `proposal_versions` row (circular FK, deferred) |
| forked_from_proposal_id / forked_from_version_id | UUID (FK) | Yes | — | Fork lineage (self-referential) |
| submitter_id | UUID (FK users) | No | — | Owning submitter |
| idempotency_key | TEXT | Yes | — | Unique; replays return the original (`{:ok, value, :replayed}`) |
| hidden_at | TIMESTAMPTZ | Yes | — | Soft-hide by moderation |
| search | TSVECTOR | No | generated | Generated column (english) over element_tag/title/summary/motivation |
| inserted_at / updated_at | TIMESTAMPTZ | No | now() | Timestamps |

**Indexes (030)**: proposals-list, proposals-search (GIN on `search`), proposals-tag, proposals-forks, proposals-submitter, proposals-idempotency.

## proposal_versions

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| proposal_id | UUID (FK) | No | — | Owning proposal |
| version | INTEGER | No | — | Monotonic version number |
| title / summary / motivation | TEXT | No | — | Snapshot of the editable fields |
| options | JSONB | No | '[]' | Snapshot of options |
| example | TEXT | No | '' | Snapshot of example |
| files | JSONB | No | '{}' | File map snapshot |
| files_sha256 | TEXT | No | — | Content hash of `files` (integrity) |
| created_by_id | UUID (FK users) | Yes | — | Author of the version |
| inserted_at | TIMESTAMPTZ | No | now() | Creation time |

**Constraints (030)**: unique (proposal_id, version); `030-index-versions-latest` supports current-version lookups.

## discussion_links

One-to-one with `proposals` — the GitHub Discussions mirror state for a proposal.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| proposal_id | UUID (FK, UNIQUE) | No | — | Owning proposal |
| repo | TEXT | No | — | Target GitHub repo |
| discussion_number | INTEGER | Yes | — | GitHub discussion number |
| node_id / url / category | TEXT | Yes | — | GitHub identifiers |
| state | discussion_state_enum | No | 'pending' | pending / ok / failed / removed (`removed` added in 031) |
| attempts | INTEGER | No | 0 | Sync attempts |
| comment_count | INTEGER | No | 0 | Refreshed by webhook events |
| reactions | JSONB | No | '{}' | Refreshed by webhook events |
| last_synced_at | TIMESTAMPTZ | Yes | — | Last successful sync |
| last_error | TEXT | Yes | — | Last failure detail |
| inserted_at / updated_at | TIMESTAMPTZ | No | now() | Timestamps |

Lifecycle: enqueued inside the submit transaction (`Semtext.Github.Sync.enqueue_discussion/1`); the webhook sets `removed` only from `ok` (stale webhooks against pending/failed are no-ops); recreation back to `pending` is moderator-only (`Proposals.recreate_discussion/1`) — never automatic. **Constraint (030)**: unique (repo, discussion_number).

## moderation_events

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| proposal_id | UUID (FK) | No | — | Owning proposal |
| actor_user_id | UUID (FK users) | Yes | — | Moderator (NULL when system) |
| actor_system | TEXT | Yes | — | System actor label |
| event | moderation_event_enum | No | — | status_change / hide / unhide / report / spam_flag / lock_discussion / claim |
| from_status / to_status | proposal_status_enum | Yes | — | Status transition pair |
| reason | TEXT | Yes | — | Moderator reason |
| inserted_at | TIMESTAMPTZ | No | now() | Creation time |

## proposal_reports

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| proposal_id | UUID (FK) | No | — | Reported proposal |
| reporter_id | UUID (FK users) | Yes | — | Reporter |
| reason | report_reason_enum | No | 'other' | spam / harassment / other |
| details | TEXT | Yes | — | Free-text detail |
| status | report_status_enum | No | 'open' | open / resolved / dismissed |
| inserted_at / updated_at | TIMESTAMPTZ | No | now() | Timestamps |

## rate_limit_events

Persistent audit of rejected rate-limit attempts (complements Hammer's in-memory Redis limits).

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| bucket | TEXT | No | — | Rate-limit bucket name |
| subject | TEXT | No | — | Rate-limited subject (user/ip) |
| inserted_at | TIMESTAMPTZ | No | now() | Creation time |

## github_webhook_deliveries

Durable first layer of webhook replay dedupe (`X-GitHub-Delivery`); the second layer is the Oban unique key on the delivery id.

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | gen_random_uuid() | Primary key |
| delivery_id | TEXT | No | — | GitHub delivery id (unique, 030) |
| event | TEXT | Yes | — | GitHub event name |
| inserted_at | TIMESTAMPTZ | No | now() | Creation time |
