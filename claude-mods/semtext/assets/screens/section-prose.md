## section-prose — headings, paragraphs, quotes

Purpose: reader rendering of a plain semtext section — dim `#`/`##` heading markers, wrapped paragraphs, `▌` quote bars for emphasized policy lines.

State notes:
- **reading (top)** — heading markers `#`/`##` render dim, heading text emphasized; body wraps at the pane gutter (col 4) with a 2-space paragraph gap.
- **reading (scrolled)** — when the viewport starts mid-paragraph, the first visible line carries a dim `…` continuation marker; footer shows the scroll position in § units.

### state: reading — top of section

```screen
semtext › CLAUDE.sem › 📖 § first-action                               ✕
────────────────────────────────────────────────────────────────────────
#   FIRST ACTION — Register Session (b4 anything else)

    B4 reading files, planning, or any action: register work
    session w/ NoizuPromptLingo proj via tobor-sessions MCP.
    MCP layer does NOT expand env vars — resolve slugs 1st &
    substitute literal values.

##  New task mid-conversation

    New task mid-conversation ⇒ new session with a NEW slug;
    use that UUID from then on (old session stays the record
    of the old task). Reuse a slug (→ resume) ONLY when
    continuing the same workstream after a break.

▌   ¬task until session exists & ID captured. Call fails ⇒
▌   stop; report error loudly w/ emoji b4 proceeding.

    Begin with the end in mind.
────────────────────────────────────────────────────────────────────────
  j jump heading · ↑↓ scroll · /semtext close
```

### state: reading — scrolled into the body

```screen
semtext › CLAUDE.sem › 📖 § be-frugal                                  ✕
────────────────────────────────────────────────────────────────────────
…   to taskers (default npl-tasker-glm-flash /
    npl-coder-glm-flash + -alt twins, npl-scout-glm-flash for
    read-only; routing ⇒ § Cheap models): say exactly what to
    run + what to report; batch related cmds into one
    delegation; they summarize, never dump raw output.

    Main-thread bash exceptions only: env-var resolution for
    session registration; tiny (≤1-2 line) output the next
    tool call directly consumes; user says "run it here".

▌   Main-thread identity = Loom (the weaver); delegated
▌   scouts/taskers carry the threads.
────────────────────────────────────────────────────────────────────────
  § 2 of 7 · j jump heading · ↑↓ scroll · /semtext close
```
