## section-quiz — facts / quiz interaction

Purpose: render `sem-facts view-as quiz` as an interactive question set — ❓ prompt, ▢ options, ✓/✗ answer states, ▰ progress meter, score as correct/attempts, skip and next affordances, and a set-complete end state.

State notes:
- **asking** — options all ▢; meter ▰ = answered count (here 1 of 4); score column shows correct/attempts.
- **answered correct** — picked option becomes `✓` + emphasized; unpicked options dim; next ▸ promoted into the meter row.
- **answered wrong** — picked option becomes `✗`; the correct option renders a dim `✓` reveal line directly beneath; 💡 carries a one-line explanation; score records the attempt.
- **set complete** — terminal card: final score, full meter, missed-question review pointer; r restarts.
- **facts as list** — `view-as list` rendering of the same fact set: one ❍ row per fact, no interaction beyond the view switcher.

### state: asking (Q2 of 4)

```screen
semtext › CLAUDE.sem › ❓ knowledge-check                              ✕
────────────────────────────────────────────────────────────────────────
❓ Q2/4 · session registration                          score 1/1

    The monorepo default for session registration
    resolves to which org › project?

    ▢  A)  noizu-labs-inc › noizu-infra
    ▢  B)  the-robot-lives › infrastructure
    ▢  C)  the-robot-lives › NoizuPromptLingo
    ▢  D)  semtext › agentonomi.com

    ▰▰▱▱  2 of 4                        skip ▸    next ▸
────────────────────────────────────────────────────────────────────────
  ↑↓ move · a–d answer · s skip · /semtext close
```

### state: answered — correct pick

```screen
semtext › CLAUDE.sem › ❓ knowledge-check                              ✕
────────────────────────────────────────────────────────────────────────
❓ Q2/4 · session registration                          score 2/2

    The monorepo default for session registration
    resolves to which org › project?

    ▢  A)  noizu-labs-inc › noizu-infra
    ✓  B)  the-robot-lives › infrastructure
    ▢  C)  the-robot-lives › NoizuPromptLingo
    ▢  D)  semtext › agentonomi.com

    ▰▰▱▱  2 of 4                                   next ▸
────────────────────────────────────────────────────────────────────────
  n next · /semtext close
```

### state: answered — wrong pick + reveal

```screen
semtext › CLAUDE.sem › ❓ knowledge-check                              ✕
────────────────────────────────────────────────────────────────────────
❓ Q2/4 · session registration                          score 1/2

    The monorepo default for session registration
    resolves to which org › project?

    ▢  A)  noizu-labs-inc › noizu-infra
    ✓  B)  the-robot-lives › infrastructure
    ✗  C)  the-robot-lives › NoizuPromptLingo
    ▢  D)  semtext › agentonomi.com

    💡 noizu-infra and NoizuPromptLingo-as-project both 404;
       memory: org the-robot-lives · project infrastructure

    ▰▰▱▱  2 of 4                                   next ▸
────────────────────────────────────────────────────────────────────────
  n next · /semtext close
```

### state: set complete

```screen
semtext › CLAUDE.sem › ❓ knowledge-check                              ✕
────────────────────────────────────────────────────────────────────────
✓ set complete · 4/4 · ▰▰▰▰

    missed along the way: none — clean sweep.

    deck review: 🃏 slug-flashcards · 📌 ledger rules
────────────────────────────────────────────────────────────────────────
  r restart · d review deck · /semtext close
```

### state: same facts, view-as list

```screen
semtext › CLAUDE.sem › ❓ knowledge-check                              ✕
────────────────────────────────────────────────────────────────────────
❓ facts · session-registration                         4 facts

    ❍ The 5-hour cap is per account, not per model.
    ❍ Rotation is zai-only — alibaba is one key, no -alt
       twin, so a whole fan-out there is fine.
    ❍ z.ai 502 / connection reset ⇒ resume once; dies again
       ⇒ relaunch the brief on the -alt twin.
    ❍ Escalate tier on demonstrated failure, never on
       importance — fast is the default.

  v view-as: list ▸ quiz ▸ flashcards
────────────────────────────────────────────────────────────────────────
  v switch view · /semtext close
```
