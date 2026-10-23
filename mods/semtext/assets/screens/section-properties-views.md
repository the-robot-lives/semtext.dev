## section-properties-views — key/value pairs with view tabs

Purpose: render `sem-properties` as aligned 🔑 key ──▸ value rows, plus the section's 👁 view tab bar (summary / rules / raw) with the active tab marked ● and inactive ◦.

State notes:
- **rules view** — keys left-aligned in a fixed column, `──▸` connectors vertically aligned, values wrap with a hanging indent aligned to the value column; keys longer than the column truncate with … (full key visible in raw view).
- **raw view** — the underlying semtext markup, wrapped; for copy-fidelity checks, not editing.

### state: rules view (active tab ●)

```screen
semtext › CLAUDE.sem › 🗂 ledger-rules                                 ✕
────────────────────────────────────────────────────────────────────────
👁  ◦ summary  │  ● rules  │  ◦ raw

  🔑 Path                  ──▸ relative to the repo root of the
                                primary working dir — monorepo root
                                for monorepo work, submodule root
                                when the session lives in one
  🔑 Filename              ──▸ registration slug · resumed ⇒
                                append · new task ⇒ new slug ⇒ new
                                ledger · never two per workstream
  🔑 Create                ──▸ at registration or first open
                                question, whichever comes first
  🔑 Append-only in spirit ──▸ OPEN → ANSWERED, never deleted ·
                                ids Q1, Q2 … monotonic · answering
                                appends **A:** + applied: only
  🔑 Not the system record ──▸ decisions land where the work
                                lives — doc, prompt, memory,
                                commit — named in applied:
  🔑 Distinct from § Stat… ──▸ /tmp status render = throwaway;
                                ledger = durable Q&A — never merge
────────────────────────────────────────────────────────────────────────
  tab switch view · /semtext close
```

### state: raw view (active tab ●)

```screen
semtext › CLAUDE.sem › 🗂 ledger-rules                                 ✕
────────────────────────────────────────────────────────────────────────
👁  ◦ summary  │  ◦ rules  │  ● raw

  <sem-properties kind="rules" id="props-ledger-rules">
    <sem-property key="Path">Relative to the primary
      working dir's repo root…</sem-property>
    <sem-property key="Filename">Uses the registration
      slug; resumed ⇒ append to existing file…
      </sem-property>
    <sem-property key="Create">At registration or first
      open question, whichever first.</sem-property>
  </sem-properties>
────────────────────────────────────────────────────────────────────────
  tab switch view · y copy markup · /semtext close
```
