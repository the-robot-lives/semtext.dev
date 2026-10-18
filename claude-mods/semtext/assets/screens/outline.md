## outline — file-tree document map

Purpose: default `/semtext` pane view — every semtext section in the open file as a navigable file-tree, one kind icon per node, dim child-count badge on the right, selected row marked ▸.

State notes:
- **browsing** — cursor on `🗂 Ledger rules` (▸ marker + full-bright text; unselected rows render dimmer). Count badges always dim. Leaves with no children carry no badge.
- **expanded** — `🧭 First Action` opened in place: node toggle flips ▸ → ▾, steps render as `→` rows under a `│` rail, wrapped step lines keep the rail. The `⚠` child is a warning note with a validation badge.
- **validation** — validator problems pin a `⚠` line under the header rule; offending nodes carry a trailing dim ⚠ badge; enter jumps to the node.

### state: browsing (roots only, cursor on Ledger rules)

```screen
semtext › CLAUDE.sem › outline                                         ✕
────────────────────────────────────────────────────────────────────────
  🧭 First Action — Register Session                          4 §
  ▦ Cheap-model tier ladder                                   4 rows
▸ 🗂 Ledger rules                                             6 🔑
  ❓ Knowledge check — session registration                    4 ❓
  🃏 Slug flashcards                                          3 🃏
  💡 Why a ledger AND the question tool
  📌 Status reports → tmp file, open in code
────────────────────────────────────────────────────────────────────────
  ◫ CLAUDE.sem · 12 sections · 9 kinds
────────────────────────────────────────────────────────────────────────
  ↑↓ navigate · enter open · /semtext close
```

### state: expanded (procedure node opened in place)

```screen
semtext › CLAUDE.sem › outline                                         ✕
────────────────────────────────────────────────────────────────────────
▸ 🧭 First Action — Register Session                          ▾
  │   → npl-scope get --json
  │   → ToolCall(Session_Create, {organization, project,
  │   │   title, description, status, slug})
  │   → capture session UUID → context ∀ artifacts
  │   ⚠ active-development exception                    1 ⚠
  ▦ Cheap-model tier ladder                                   4 rows
  🗂 Ledger rules                                             6 🔑
  ❓ Knowledge check — session registration                    4 ❓
  🃏 Slug flashcards                                          3 🃏
  💡 Why a ledger AND the question tool
  📌 Status reports → tmp file, open in code
────────────────────────────────────────────────────────────────────────
  ↑↓ navigate · enter open · /semtext close
```

### state: validation (2 problems found)

```screen
semtext › CLAUDE.sem › outline                                         ✕
────────────────────────────────────────────────────────────────────────
  ⚠ n-session-exception: missing summary · props-ledger-rules:
    0 answers recorded on 6 keys — enter to jump
────────────────────────────────────────────────────────────────────────
  🧭 First Action — Register Session                          4 §
  │   ⚠ active-development exception                    1 ⚠
  ▦ Cheap-model tier ladder                                   4 rows
▸ 🗂 Ledger rules                                             6 🔑 ⚠
  ❓ Knowledge check — session registration                    4 ❓
  🃏 Slug flashcards                                          3 🃏
  💡 Why a ledger AND the question tool
  📌 Status reports → tmp file, open in code
────────────────────────────────────────────────────────────────────────
  ↑↓ navigate · enter open · /semtext close
```
