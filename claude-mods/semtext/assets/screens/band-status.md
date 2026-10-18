## band-status — AbovePrompt band and ui.status

Purpose: the one-line semtext band rendered above the prompt, and the shorter `ui.status` statusline variants. The band is the always-on summary; ui.status is the compact form for tight statuslines.

State notes:
- **band in context** — sits directly above the prompt input; kind counts are `icon N`, quiz progress is a 4-slot meter, 📖 names the last-open section. The prompt row below is Claude Code's own chrome, shown dim for context only.
- **ui.status variants** — active / paused / none found; paused keeps the last sync time so staleness is visible; "none found" points at the rescan command.

### state: AbovePrompt band — active, in context

```screen
────────────────────────────────────────────────────────────────────────
semtext ▸ CLAUDE.sem · 🧭1 ▦1 🗂6 ❓4 🃏3 · ▰▰▱▱ · 📖 ledger-rules
────────────────────────────────────────────────────────────────────────
› _
```

### state: ui.status variants

```screen
active   semtext ▸ CLAUDE.sem · 12 § · quiz 2/4 ✓
paused   semtext ▸ paused · last sync 14:32:08 · r resume
none     semtext ▸ no semtext sections found · /semtext rescan
```
