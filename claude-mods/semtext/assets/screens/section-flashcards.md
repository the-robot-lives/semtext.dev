## section-flashcards — card flip interaction

Purpose: render `sem-facts view-as flashcards` as a deck — one card at a time in a framed box, front = prompt, flip reveals the conclusion; known/again marking and deck position live on the chrome lines.

State notes:
- **front** — prompt only; `f flip` is the primary affordance; right edge of the chrome line carries the mark actions.
- **flipped** — conclusion fills the card; footer row inside the box shows running known/again tallies and next ▸; the card stays until n advances.

### state: front (card 2 of 3)

```screen
semtext › CLAUDE.sem › 🃏 slug-flashcards                              ✕
────────────────────────────────────────────────────────────────────────
🃏 card 2/3 · deck session-registration       1 known · 0 again

       ┌────────────────────────────────────────────────┐
       │                                                │
       │                                                │
       │      Repeating a session slug within ~4h       │
       │      does what?                                │
       │                                                │
       │                                                │
       └────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────
  f flip · 1 known · 2 again · n next · /semtext close
```

### state: flipped (conclusion shown)

```screen
semtext › CLAUDE.sem › 🃏 slug-flashcards                              ✕
────────────────────────────────────────────────────────────────────────
🃏 card 2/3 · deck session-registration · flipped

       ┌────────────────────────────────────────────────┐
       │  Resumes that session instead of creating a    │
       │  new one — resumed: true. One slug per         │
       │  workstream; a new task mid-conversation       │
       │  gets a NEW slug and a new ledger file.        │
       │                                                │
       │  deck: known 1 · again 0            next ▸ 3/3 │
       └────────────────────────────────────────────────┘
────────────────────────────────────────────────────────────────────────
  f flip back · 1 known · 2 again · n next · /semtext close
```
