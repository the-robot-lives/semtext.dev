## section-table — box-drawn data table

Purpose: render a `sem-table` as a box-drawn grid — column widths computed from content (header, longest unbreakable token, wrap budget), cells wrap at spaces, header row emphasized.

State notes:
- **fits (tier ladder)** — 5 columns; widths computed as tier 7 / use-for 22 / glm 12 / qwen 14 / deepseek 11. Multi-word cells wrap at spaces; a row is as tall as its tallest cell. Header row renders inverse-video (caps here stand in). Caption line is dim and carries the table id + controls.
- **scrolled (+N more)** — viewport shorter than the table: remaining rows collapse into one spanning `… (+N more)` row; the footer names the hidden rows so scanning doesn't require scrolling.

### state: fits — cheap-model tier ladder

```screen
semtext › CLAUDE.sem › ▦ tier-ladder                                   ✕
────────────────────────────────────────────────────────────────────────
┌───────┬──────────────────────┬────────────┬──────────────┬───────────┐
│ TIER  │ USE FOR              │ GLM        │ QWEN         │ DEEPSEEK  │
├───────┼──────────────────────┼────────────┼──────────────┼───────────┤
│ haiku │ lookups, extraction, │ flash      │ qwen3.8-flash│ v4.1-flash│
│       │ format-exact output, │ (sub, low) │ (low)        │ (low)     │
│       │ simple edits         │            │              │           │
│ sonnet│ ordinary code, docs —│ flash      │ qwen3.8-flash│ v4.1-flash│
│       │ default              │ (sub, high)│ (medium)     │ (medium)  │
│ opus  │ hard work where      │ flash      │ qwen3.8-max  │ v4-pro    │
│       │ depth beats speed    │ (sub, max) │ (high)       │ (high)    │
│ fable │ hardest multi-step   │ glm-5.3    │ qwen3.8-max  │ v4-pro    │
│       │ work                 │ (sub, max) │ (max)        │ (max)     │
└───────┴──────────────────────┴────────────┴──────────────┴───────────┘
  ▦ t-tier-ladder · comparison · 4 rows × 5 cols · widths computed
  stub = npl-<role>-glm-<tier>[-alt] · rotate zai / zai-alt
────────────────────────────────────────────────────────────────────────
  s sort · enter cell detail · /semtext close
```

### state: scrolled — rows below the fold

```screen
semtext › CLAUDE.sem › ▦ release-posture                               ✕
────────────────────────────────────────────────────────────────────────
┌───────────┬───────────────────────┬──────────────────────────────────┐
│ POSTURE   │ ROBOT REVIEW          │ STAGE → MAIN                     │
├───────────┼───────────────────────┼──────────────────────────────────┤
│ sandbox   │ post-merge ok         │ agent may complete               │
│ internal  │ post-merge ok         │ agent may complete               │
│ … (+2 more: pilot, live · ↓ to scroll)                               │
└───────────┴───────────────────────┴──────────────────────────────────┘
  ▦ release-posture · hidden rows: pilot (user approval · resolve
  before merge) · live (user approval, staged rollout)
────────────────────────────────────────────────────────────────────────
  ↓ next row · s sort · /semtext close
```
