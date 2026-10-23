## toast — transient notifications, top-right

Purpose: the semtext toast stack — transient confirmations and warnings that overlay the pane's top-right corner, newest outermost (top-right), older toasts stepping down-left; each carries a dim countdown; the stack collapses past three with `… (+N)`.

State notes:
- **stack over context** — underlying rows (here the outline) render dim and truncate with … where a toast covers them; toasts are 23 columns wide, right-aligned toward the pane edge, stepping down-left as they age.
- **lifecycle** — countdown dim on the toast's last row; expiry dismisses upward; `t` opens the history list; `✕` on the toast itself dismisses early (hover/focus only — toasts never steal the cursor).

### state: three toasts stacked (over outline)

```screen
semtext › CLAUDE.sem › outline                                         ✕
────────────────────────────────────────────────────────────────────────
  🧭 First Action — Register…                    ┌─────────────────────┐
  ▦ Cheap-model tier ladder                      │ ✓ quiz set complete │
  ❓ Knowledge check — sessi…                    │ 4/4 · scored        │
                                                 │           … 4s   ✕ │
  🃏 Slug flashcards                             └─────────────────────┘
  💡 Why a ledger AND the tool              ┌─────────────────────┐
  📌 Status reports → tmp fi…               │ ⚠ missing summaries │
                                            │ → /semtext validate │
                                            │          … 12s   ✕ │
                                            └─────────────────────┘
                                      ┌─────────────────────┐
                                      │ 📌 note pinned:     │
                                      │ ASK ME! trigger     │
                                      │          … 28s   ✕ │
                                      └─────────────────────┘
                     … (+1 older toast · t history)
────────────────────────────────────────────────────────────────────────
  t toast history · /semtext close
```
