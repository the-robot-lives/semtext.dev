## section-note-reveal — collapsible note and hidden reveal

Purpose: render `sem-note` (📌) and `sem-reveal` (💡) — collapsed state shows title plus a dim 10-word summary with a ▸ affordance; expanded flips to ▾ and shows the full body; reveals start hidden and open on demand.

State notes:
- **note collapsed** — one row: ▸ + 📌 + title; the summary line beneath is the first 10 words of the body, dim, one line only (truncates with …).
- **note expanded** — ▾ marker; full body wraps at the pane gutter; collapse returns to the summary.
- **reveal hidden** — 💡 + question-form title + ▸ reveal; no body visible.
- **reveal shown** — body visible; closing re-hides (study mode: hidden again on reopen).

### state: note — collapsed

```screen
semtext › CLAUDE.sem › 📌 notes                                        ✕
────────────────────────────────────────────────────────────────────────
▸ 📌 Status reports — tmp file, open in code
  status reports longer than a few lines go to /tmp …
────────────────────────────────────────────────────────────────────────
  space expand ▸ · ↑↓ notes · /semtext close
```

### state: note — expanded

```screen
semtext › CLAUDE.sem › 📌 notes                                        ✕
────────────────────────────────────────────────────────────────────────
▾ 📌 Status reports — tmp file, open in code
  Status/update report longer than a few lines ⇒ write
  /tmp/<repo>-<session-slug>-status.md, code <file>, echo
  only the first few lines in chat, then .. [opening in
  code] .. Short answers stay in chat — never dump long
  reports into the conversation.
────────────────────────────────────────────────────────────────────────
  space collapse ▾ · ↑↓ notes · /semtext close
```

### state: reveal — hidden

```screen
semtext › CLAUDE.sem › 💡 reveals                                      ✕
────────────────────────────────────────────────────────────────────────
▸ 💡 Why BOTH the ledger and the question tool?
────────────────────────────────────────────────────────────────────────
  space reveal ▸ · ↑↓ reveals · /semtext close
```

### state: reveal — shown

```screen
semtext › CLAUDE.sem › 💡 reveals                                      ✕
────────────────────────────────────────────────────────────────────────
▾ 💡 Why BOTH the ledger and the question tool?
  The ledger is the durable record — answered at leisure.
  AskUserQuestion is the interrupt — answered now. A
  question asked only via the tool and never written down
  is lost once the user steps away; asked only in the
  file never interrupts. Both, always.
────────────────────────────────────────────────────────────────────────
  space hide ▾ · ↑↓ reveals · /semtext close
```
