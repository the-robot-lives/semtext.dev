## help — hotkey and glyph reference card

Purpose: single `/semtext help` card — every hotkey grouped by concern, every glyph in the vocabulary with its meaning. The card is the authority the screens defer to; it renders identically at any pane height (scrolls as one block).

State notes:
- **card** — KEYS section lists bindings (screen-agnostic; bindings not present in a screen render nothing there); KINDS / STRUCTURE / CHROME sections mirror the glyph vocabulary one-to-one. Footer hints how to jump from a glyph to a screen that uses it.

### state: reference card

```screen
semtext › help                                                         ✕
────────────────────────────────────────────────────────────────────────
KEYS
  ↑↓ navigate        enter open/close     space expand ▸ / collapse ▾
  a–d quiz answer    s skip · sort        n next
  f flip card        1 known · 2 again    r restart · refresh
  j jump heading     g goto line          y copy
  v switch view-as   t toast history      p pause/resume pubsub
  /semtext close     /pubsub status

KINDS
  📌 note        ⚠ warning     🧭 procedure   → step
  ▦ table        ⌨ code        ❓ facts/quiz   🃏 flashcards
  💡 reveal      🔑 property   🗂 properties   👁 views
  ◦ view         📖 reader     ◫ source       § section
  ❍ fact

STRUCTURE
  ├── └── │ tree   › breadcrumb   ▸ ▾ toggle
  ▌ quote bar      ▢ option       ▰▱ progress meter
  ✓ correct/yes    ✗ wrong/no     … (+N) more
  ● active tab     ✕ close

NOTES
  · dim rendering: count badges, line numbers, # heading
    markers, footers, toast countdowns, … (+N) rows
  · every screen's footer hotkeys are authoritative for
    that screen; this card is the union
────────────────────────────────────────────────────────────────────────
  enter on a glyph → jump to a screen using it · /semtext close
```
