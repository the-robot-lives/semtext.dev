## section-code — framed code block

Purpose: render a `sem-code` block as a framed box — language badge right-aligned in the top border, dim right-aligned line numbers, `… (+N lines)` fold affordance in the bottom border.

State notes:
- **top of block** — first 11 of 17 lines visible; bottom border folds the rest with a count. Line numbers dim and right-aligned to a fixed 2-column gutter; the block id sits in the section caption above the frame.
- **scrolled to end** — last 6 lines visible, no fold affordance; footer carries the position (lines 12–17 of 17). First visible line keeps its real number — the frame never renumbers.

### state: top of block

```screen
semtext › CLAUDE.sem › ⌨ p-session-registration                       ✕
────────────────────────────────────────────────────────────────────────
  ⌨ p-session-registration · session runbook
┌─ register-session ──────────────────────────────────────────── bash ─┐
│  1  # 1 — resolve org+project for the cwd                            │
│  2  npl-scope get --json                                             │
│  3  #    ⇒ {"org":{…},"project":{…}} · null ⇒ ask, not guess         │
│  4  # 2 — create the session (resolved literals, never env)          │
│  5  ToolCall(Session_Create, {                                       │
│  6    organization: "the-robot-lives",                               │
│  7    project:      "infrastructure",                                │
│  8    title:  "SemText pane mockups",                                │
│  9    slug:   "semtext-pane-mockups", status: "active"})             │
│ 10  # 3 — ledger at registration or first open question              │
│ 11  ./.tmp/sessions/2026-10-18-semtext-pane-mockups.md               │
└──────────────────────────── … (+6 lines) ────────────────────────────┘
────────────────────────────────────────────────────────────────────────
  ↓ scroll · g goto line · y copy · /semtext close
```

### state: scrolled to end

```screen
semtext › CLAUDE.sem › ⌨ p-session-registration                       ✕
────────────────────────────────────────────────────────────────────────
  ⌨ p-session-registration · session runbook
┌─ register-session ──────────────────────────────────────────── bash ─┐
│ 12  # 4 — capture UUID → context ∀ artifacts/tickets/rooms           │
│ 13  # stale env (noizu-infra → "Project not found") ⇒ use            │
│ 14  #   the defaults + direnv reload · npl-scope which shows         │
│ 15  #   the full chain if a value looks wrong                        │
│ 16  uuid=6fbf5cbd-9fc0 … a3da2ab15e12  # ∀ follow-ups                │
│ 17  # ¬task until session exists & ID captured                       │
└──────────────────────────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────
  lines 12–17 of 17 · g goto line · y copy · /semtext close
```
