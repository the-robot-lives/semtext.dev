# TAG-RENDERS — per-tag render reference for the semtext mod

> The ```screen renders below are the DESIGN CONTRACT the mod implements
> (v0.3 in flight). Screen-level compositions live in
> `assets/screens/`; this file is per-tag (atomic). Fence width is a
> hard 72 columns; dim spans are named in prose (the mod dims: chips,
> ids, counters, gutters, hint rows). Glyph vocabulary is fixed and
> identical to the screens set; class-form aliases (`div.<tag>` +
> `data-*` params) render identically to tag form — one entry each.

## Contents

- Document chrome — sem-enhanced-document · sem-reader · agent metadata
- Callouts & disclosure — sem-note · sem-reveal
- Facts & recall — sem-facts · sem-fact · incorrect-statement ·
  sem-details · sem-detail · sem-highlight
- Procedures — sem-procedure · sem-step
- Properties & views — sem-properties · sem-property · sem-views ·
  sem-view
- Chronology — sem-chronology · sem-event
- Code & source — sem-code · sem-source · sem-md
- References — sem-references · sem-reference
- Tables & lists — sem-table · sem-list
- Structure — sem-section · sem-break · sem-progress
- Quiz — sem-question · sem-option
- Audiences — sem-audiences · sem-profile
- Containers — sem-tldr · sem-summary · sem-kb · sem-runbook ·
  sem-howto · sem-requirement · sem-threat-model · sem-guard-rails ·
  sem-guard-rail · sem-mockup · sem-rubric · sem-eval · sem-philosophy ·
  sem-plan · sem-tsgs · sem-tsg · sem-faqs · sem-faq · sem-changelogs ·
  sem-changelog
- Interactive & data — sem-workflow · sem-site-tree · sem-file-tree ·
  sem-browser · sem-data-source · sem-data-query · sem-data-join ·
  sem-data-visualizer · sem-api-call · sem-api-param · sem-tag-def ·
  sem-tag-attr
- Out of scope for v0.3 — semext-* · agent-kit-* · npl-*

## Document chrome

### sem-enhanced-document
Required root wrapper — exactly one per doc; renders as the pane's
document header line and nothing else.

```html
<sem-enhanced-document role="main">
  …entire document…
</sem-enhanced-document>
```

```screen
◫ CLAUDE.sem · sem v0.7 · 12 records minted
```

### sem-reader
Reading chrome declaration; mints nothing, extraction skips it whole.
Renders as one dim chrome line; controls beyond outline/progress list
as chips.

```html
<sem-reader controls="outline,progress" outline-depth="3"></sem-reader>
```

```screen
📖 outline · progress · depth 3
```

### agent metadata (agent / name / bio / instructions)
Document-level agent metadata — machine-facing; renders as a dim
header block, never body content.

```html
<agent>
  <name>Guide</name>
  <bio>Runbook assistant</bio>
  <instructions>Answer from sem-fact ids.</instructions>
</agent>
```

```screen
❍ agent Guide — Runbook assistant
  instructions · answer from sem-fact ids
```

## Callouts & disclosure

### sem-note
Callout. Variant maps to glyph: info/tip → 📌 (variant chip differs),
warning/danger → ⚠ (danger adds the chip). `collapsed` shows the
10-word teaser with ▸.

```html
<sem-note variant="warning" id="n-session-exception">
  <strong>Active-development exception:</strong> session
  registration may break while tooling is in development —
  notify, then proceed without a session id.
</sem-note>
```

```screen
⚠ warning · n-session-exception
  Active-development exception: session registration may break
  while tooling is in development — notify, then proceed
  without a session id.
```

variant: collapsed

```html
<sem-note collapsed>Status reports longer than a few lines go to
/tmp, opened in code — echo the first lines only.</sem-note>
```

```screen
▸ 📌 note
  status reports longer than a few lines go to …
```
space expand ▸ / collapse ▾

### sem-reveal
Q→A disclosure; non-assertive counterpart to sem-fact. `collapsed`
absent = open. Summary = first body line ≤60 chars when not authored.

```html
<sem-reveal summary="Why BOTH the ledger and the tool?" collapsed>
  The ledger is durable (answered at leisure); the tool is the
  interrupt (answered now). Both, always.
</sem-reveal>
```

```screen
▸ 💡 Why BOTH the ledger and the tool?
```

state: shown

```screen
▾ 💡 Why BOTH the ledger and the tool?
  The ledger is durable (answered at leisure); the tool is
  the interrupt (answered now). Both, always.
```
space reveal ▸ / hide ▾

## Facts & recall

### sem-facts
Fact collection — the flagship surface. `view-as` selects the recall
interaction: list (default), quiz, flashcards; `controls` shuffle and
filter appear as hint chips.

```html
<sem-facts view-as="quiz" controls="shuffle,filter">
  <sem-fact id="f-cap">…</sem-fact>
  <sem-fact id="f-rotate">…</sem-fact>
</sem-facts>
```

variant: view-as list (default)

```screen
❓ facts · 4 facts
  ❍ #facts/f-cap The 5-hour cap is per account, not per
    model.
  ❍ #facts/f-rotate 2+ glm agents alternate bare / -alt —
    never a whole fan-out on one z.ai account.
```

variant: view-as quiz — see section-quiz screen for the full
interaction

```screen
❓ Q1/2 · session registration                    score 0/0

    The 5-hour cap is per account, not per ___?

    ▢  A)  model
    ▢  B)  repo
    ▰▱  1 of 2                      skip ▸   next ▸
```

variant: view-as flashcards — see section-flashcards screen

```screen
🃏 card 1/2 · facts                        f flip

  ┌────────────────────────────────────────────┐
  │  The 5-hour cap is per account, not per…   │
  └────────────────────────────────────────────┘
```
v view-as switch · shuffle/filter via controls

### sem-fact
Atomic assertable Q/A pair; id is the citation token.

```html
<sem-fact id="f-cap" kind="concept">
  <statement>The 5-hour cap is per account.</statement>
  <conclusion>Not per model — rotation exists because the
  bucket is the account.</conclusion>
</sem-fact>
```

```screen
❍ #facts/f-cap · concept
  Q  The 5-hour cap is per account.
  A  Not per model — rotation exists because the bucket is
     the account.
```

### incorrect-statement
Explicit wrong quiz candidate (v0.7 rename of sem-distractor; no
alias). Never extracted as a claim — it renders ONLY inside a quiz
view, as an option; picked → ✗.

```html
<sem-fact id="f-store">
  <statement>Where do refresh tokens live?</statement>
  <conclusion>HttpOnly cookie, scoped path.</conclusion>
  <incorrect-statement>localStorage.</incorrect-statement>
  <incorrect-statement>a JS variable.</incorrect-statement>
</sem-fact>
```

```screen
❓ Q1/1 · where do refresh tokens live?          score 0/1

    ✗  A)  localStorage.
    ✓  B)  HttpOnly cookie, scoped path.
    ▢  C)  a JS variable.
```

### sem-details
Recall-oriented prose container. `view-as plain` (default) shows
passages with highlights emphasised; `view-as quiz` occludes every
highlight into cloze prompts.

```html
<sem-details view-as="quiz">
  <sem-detail>tokens ride the
  <sem-highlight>Authorization</sem-highlight> header</sem-detail>
</sem-details>
```

variant: view-as plain (default)

```screen
  tokens ride the Authorization header  (emph.)
```

variant: view-as quiz (occluded)

```screen
❓ cloze · 1 passage

    tokens ride the ▢▢▢▢▢▢▢▢▢▢▢▢▢▢ header

    ▰▱  1 of 1                        reveal ▸  next ▸
```
v view-as switch

### sem-detail
One prose passage — renders inline; the recall target is its
sem-highlight child (no chrome of its own).

```html
<sem-detail>verify the guard by breaking it — dev-vs-test
env, fixtures-vs-shipped</sem-detail>
```

```screen
  verify the guard by breaking it — dev-vs-test env,
  fixtures-vs-shipped
```

### sem-highlight
Recall target — emphasised in plain views, occluded in quiz/flashcard
views. `<highlight>` sugar alias parses to the same render.

```html
<p>issuer is <sem-highlight>auth.derobot.is</sem-highlight>,
never auth.noizu.com</p>
```

```screen
plain     issuer is auth.derobot.is, never auth.noizu.com
                                          └ emphasized
occluded  issuer is ▢▢▢▢▢▢▢▢▢▢▢▢▢▢, never auth.noizu.com
```

## Procedures

### sem-procedure
Ordered status-annotated procedure; DOM order = execution order.
Renders as 🧭 with one → row per step.

```html
<sem-procedure kind="runbook" id="p-session-registration" role="list">
  <sem-step role="listitem">npl-scope get --json</sem-step>
  <sem-step role="listitem">ToolCall(Session_Create, {…})</sem-step>
  <sem-step role="listitem">capture session UUID → context</sem-step>
</sem-procedure>
```

```screen
🧭 runbook · p-session-registration
  ├── → npl-scope get --json
  ├── → ToolCall(Session_Create, {…})
  └── → capture session UUID → context
```

### sem-step
One step. `status` maps: todo → (default), current → ▸, done → ✓,
blocked → ✗.

```html
<sem-step status="done">provision Infisical path</sem-step>
<sem-step status="current">rotate the token</sem-step>
<sem-step status="blocked">drop column — waiting on user</sem-step>
<sem-step>verify key-set parity</sem-step>
```

```screen
  ✓  provision Infisical path          done
  ▸  rotate the token                  current
  ✗  drop column — waiting on user     blocked
  →  verify key-set parity
```

## Properties & views

### sem-properties
Key/value definition list; duplicate key = warned error. `view-as
glossary` promotes ids to term anchors.

```html
<sem-properties kind="rules" id="props-ledger-rules">
  <sem-property key="Path">…</sem-property>
</sem-properties>
```

```screen
🗂 ledger-rules · rules · 6 keys
  🔑 Path ──▸ relative to the repo root of the primary
             working dir
  🔑 Create ──▸ at registration or first open question
```
(see section-properties-views screen for the full column layout)

### sem-property
One key/value assertion; key required, text = value.

```html
<sem-property key="token ttl" role="definition"
  aria-label="token ttl">15m</sem-property>
```

```screen
🔑 token ttl ──▸ 15m
```

### sem-views
Same content, switchable named perspectives — renders as the 👁 tab
bar; id is the deep-link prefix.

```html
<sem-views id="deploy">
  <sem-view name="ArgoCD" active>…</sem-view>
  <sem-view name="Helm">…</sem-view>
</sem-views>
```

```screen
👁 deploy   [ ● ArgoCD │ ◦ Helm ]
```

### sem-view
One perspective; `name` unique per container, `active` sets the
initial tab (first wins if absent). Content renders under the bar
when its tab is ●.

```html
<sem-view name="Helm" role="tabpanel">helm-upgrade --list</sem-view>
```

```screen
👁 deploy   [ ◦ ArgoCD │ ● Helm ]
  helm-upgrade --list
```
tab / number keys switch views

## Chronology

### sem-chronology
Dated ordered events; DOM order = chronological. `view-as timeline`
(default) prefixes each row with the date and status glyph; `list`
drops the rail.

```html
<sem-chronology kind="release-history" view-as="timeline" role="list">
  <sem-event role="listitem" when="2026-03-02" status="done">
    <time datetime="2026-03-02">2 Mar 2026</time> v0.1 tagged.
  </sem-event>
  <sem-event role="listitem" when="2026-10-17" status="current">
    v0.7 spec cut.
  </sem-event>
</sem-chronology>
```

```screen
▦ release-history · timeline
  2026-03-02  ✓  v0.1 tagged.
  2026-06-30  ✓  v0.6 — sem-list, sem-section.
  2026-10-17  ▸  v0.7 spec cut.
```

### sem-event
One dated assertion; `when` recommended, `until` renders a range,
absent status = unannotated (no glyph).

```html
<sem-event role="listitem" when="2026-10-12"
  until="2026-10-24">alibaba quota exhausted — qwen+deepseek
  429</sem-event>
```

```screen
  2026-10-12 → 2026-10-24  alibaba quota exhausted —
                             qwen+deepseek 429
```

## Code & source

### sem-code
Verbatim listing with provenance — and the canonical inline code
element. Block form: lang badge right in the top border, `filename`
caption, `mark` lines flagged ▸ in the gutter. Inline flat form
(single line, no attrs) renders as a chip.

```html
<sem-code lang="bash" filename="register.sh" mark="2">
<pre><code>npl-scope get --json
ToolCall(Session_Create, {organization, project, slug})</code></pre>
</sem-code>
```

```screen
┌─ register.sh ─────────────────────────────── bash ─┐
│ 1  npl-scope get --json                            │
▸│ 2  ToolCall(Session_Create, {organization,        │
│ 3    project, slug})                               │
└────────────────────────────────────────────────────┘
```

variant: inline

```html
<p>validate with <sem-code>npm run validate</sem-code></p>
```

```screen
validate with ⌨ npm run validate
```
y copy · wrap per controls

### sem-source
Wrapper flipping rendered section ↔ its markup as parsed; mints
nothing. Renders the toggle bar; view-as html (default) | source.

```html
<sem-source label="Facts"><h2>Facts</h2>
<sem-facts view-as="flashcards">…</sem-facts></sem-source>
```

```screen
◫ Facts   [ ● rendered │ ◦ markup ]
  🃏 flashcards — 4 cards
```
space flips rendered / markup

### sem-md
Markdown block rendered in-browser; pane renders the GFM subset —
tables as ▦, prose wrapped; `view-as raw` shows the source.

```html
<sem-md label="Token lifetimes">| Token | Lifetime |
| --- | --- |
| access | 15m |</sem-md>
```

```screen
◫ Token lifetimes   [ ● rendered │ ◦ raw ]
┌────────┬──────────┐
│ Token  │ Lifetime │
├────────┼──────────┤
│ access │ 15m      │
└────────┴──────────┘
```
space rendered / raw · y copy

## References

### sem-references
Numbered citable entries; `kind` styles the chip. Inline `[1]`
citations mint nothing.

```html
<sem-references id="refs" kind="bibliography">
  <sem-reference cite="…/rfc6749">The OAuth 2.0 Framework,
  §10.4.</sem-reference>
</sem-references>
```

```screen
§ refs · bibliography
  [1] The OAuth 2.0 Framework, §10.4.
      › refs-rfc-6749
```

### sem-reference
One citable entry — `cite` required; id auto-mints as
`<block-id>-<slug(cite)>` (authored id wins).

```html
<sem-reference cite="Projects/github-tools/docs/gh-wait.md">
  gh-wait — exit codes and snapshot flags.</sem-reference>
```

```screen
  [2] gh-wait — exit codes and snapshot flags.
      › refs-projects-github-tools-docs-gh-wait-md
```

## Tables & lists

### sem-table
Sortable/filterable table; the rendered table IS the contract. Both
child forms (authored `<table>`; markdown pipes) render identically
as ▦ — see section-table screen for computed widths, wrapping and
the `… (+N more)` fold. `sticky` and `kind="comparison"` stick the
first column (├ rail on the left).

```html
<sem-table label="Token lifetimes">| Token | Lifetime |
| --- | --- |
| access | 15m |</sem-table>
```

```screen
▦ Token lifetimes · 1 row × 2 cols · sort
┌────────┬──────────┐
│ TOKEN  │ LIFETIME │
├────────┼──────────┤
│ access │ 15m      │
└────────┴──────────┘
```
s sort · f filter (per controls)

### sem-list
Authored list as one tag of plain text lines; runtime renders real
list structure. Ordered keeps its numbers; nesting renders as tree
rails; unordered drops numbers for tree rails.

```html
<sem-list ordered id="deploy-steps">1. Port-forward MinIO
2. Run migrations
   - auth schema first
3. Cut release</sem-list>
```

```screen
1. Port-forward MinIO
2. Run migrations
   └── auth schema first
3. Cut release
```

variant: unordered (bare `unordered` attr or `- item` lines)

```screen
├── Port-forward MinIO
├── Run migrations
│   └── auth schema first
└── Cut release
```

## Structure

### sem-section
Block wrapper — pure structure; renders as a titled divider carrying
its kind chip. Nests; extraction-transparent.

```html
<sem-section kind="setup"><h2 data-kind="title">Setup</h2>…
</sem-section>
```

```screen
§ setup ──────────────────────────────────────────────
```

### sem-break
Empty visual divider — the `<hr>` replacement; renders one full-width
rule. Any child or text is an error.

```html
…end of part one.<sem-break></sem-break>Part two begins.
```

```screen
──────────────────────────────────────────────────────
```

### sem-progress
Completion meter; value clamps at render, attr untouched;
status="done" ⇔ 1.

```html
<sem-progress value="0.62" label="coverage" role="meter"
  aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.62">
</sem-progress>
```

```screen
▰▰▰▰▰▰▱▱▱▱  0.62 · coverage
```

## Quiz

### sem-question
Quiz renderer, 7 TRP types (mc|multi|blank|match|order|tf|short) —
same interaction shell as sem-facts view-as quiz; type picks the
option rendering (mc ▢ single, multi ▢ toggle, blank ▢ fill, order →
rows, tf ▢ two, match ▢ pairs, short free text).

```html
<sem-question type="mc">
  <p data-kind="prompt">Which header carries the token?</p>
  <sem-option correct>Authorization</sem-option>
  <sem-option>X-Forwarded-For</sem-option>
</sem-question>
```

```screen
❓ mc · which header carries the token?      score 0/0

    ▢  A)  Authorization
    ▢  B)  X-Forwarded-For

    ▰▱                                   next ▸
```
a–b answer · retry per controls

### sem-option
One candidate answer; `correct` is canonical (✅ sugar is
display-only). Unpicked ▢ · picked-correct ✓ · picked-wrong ✗.

```html
<sem-option correct>Authorization</sem-option>
```

```screen
unpicked   ▢  A)  Authorization
correct    ✓  A)  Authorization
wrong      ✗  B)  X-Forwarded-For
```

## Audiences

### sem-audiences
Profile declaration block — metadata, mints nothing; renders as one
dim line naming the declared profiles.

```html
<sem-audiences>
  <sem-profile id="operator" label="Operator" implies="reader"/>
  <sem-profile id="reviewer" label="Reviewer"/>
</sem-audiences>
```

```screen
👁 audiences · operator ⇒ reader · reviewer
```

### sem-profile
One reader profile (declaration, not content); `implies` chains
transitively; cycles = warned error.

```html
<sem-profile id="operator" label="Operator" implies="reader"/>
```

```screen
👁 profile operator · Operator ⇒ reader
```

## Containers

All 20 container tags share one card anatomy — `§ kind-chip` header
row, chips dim, body prose wrapped at the gutter. They differ only in
chips and children; renders below show the differences.

### sem-tldr
Light skim block at the top of a document.

```html
<sem-tldr>Register the session before any other action;
resolve slugs first — the MCP layer never expands env vars.
</sem-tldr>
```

```screen
§ tldr
  Register the session before any other action; resolve
  slugs first — the MCP layer never expands env vars.
```

### sem-summary
Heavier document-level wrap — the close-out counterpart of tldr.

```html
<sem-summary><sem-tldr>Shipped v0.7.</sem-tldr>…</sem-summary>
```

```screen
§ summary
  Shipped v0.7. Four families end to end; distractor
  renamed with no alias.
```

### sem-kb
Knowledge-base article container.

```html
<sem-kb kind="reference">…article…</sem-kb>
```

```screen
§ kb · reference
```

### sem-runbook
Runbook container; steps land via sem-procedure / sem-workflow.

```html
<sem-runbook kind="release">…procedures…</sem-runbook>
```

```screen
§ runbook · release
```

### sem-howto
How-to guide; optional `<name>` heading + `<tags>` child.

```html
<sem-howto><name>Rotate a token</name><tags>auth</tags>…</sem-howto>
```

```screen
§ howto · Rotate a token · auth
```

### sem-requirement
Requirement container; kind / status / priority chips.

```html
<sem-requirement kind="functional" status="approved"
  priority="high">Schema verify before every release.
</sem-requirement>
```

```screen
§ requirement · functional · approved · high
  Schema verify before every release.
```

### sem-threat-model
Threat-model container; kind = threat class, scope names the surface.

```html
<sem-threat-model kind="spoofing" scope="edge ingress">…
</sem-threat-model>
```

```screen
§ threat-model · spoofing · scope edge ingress
```

### sem-guard-rails
Guard-rail collection — renders its entries with severity glyphs.

```html
<sem-guard-rails>
  <sem-guard-rail severity="block" scope="prod">Never drop a
  column without approval.</sem-guard-rail>
  <sem-guard-rail severity="warn">Verify key-set parity
  first.</sem-guard-rail>
</sem-guard-rails>
```

```screen
§ guard-rails
  ✗ block · prod — never drop a column without approval.
  ⚠ warn — verify key-set parity first.
```

### sem-guard-rail
One entry; severity maps info → ·, warn → ⚠, block → ✗.

```html
<sem-guard-rail severity="block" scope="prod">Never drop a
column without approval.</sem-guard-rail>
```

```screen
✗ block · prod — never drop a column without approval.
```

### sem-mockup
UI mockup container — the mockup IS its content. `mode text`
renders the ASCII wireframe verbatim in a frame; `mode html` offers
the authored markup via the ◫ toggle.

```html
<sem-mockup mode="text">+----+--------+
| ✕  |  band  |
+----+--------+</sem-mockup>
```

```screen
◫ mockup · text
┌─────────────────────┐
│ +----+--------+     │
│ | ✕  |  band  |     │
│ +----+--------+     │
└─────────────────────┘
```

### sem-rubric
Scoring rubric; `max-score` renders as the top-of-scale chip;
criterion lines authored prose.

```html
<sem-rubric max-score="10">extraction fidelity — 6
brevity — 4</sem-rubric>
```

```screen
§ rubric · max 10
  ├── extraction fidelity — 6
  └── brevity — 4
```

### sem-eval
Evaluation container; kind + status chips.

```html
<sem-eval kind="regression" status="pass">…</sem-eval>
```

```screen
§ eval · regression · pass ✓
```

### sem-philosophy
Philosophy/charter container (spelled with the h).

```html
<sem-philosophy>Begin with the end in mind.</sem-philosophy>
```

```screen
§ philosophy
  Begin with the end in mind.
```

### sem-plan
Planning container — a static plan document, NOT a workflow engine.

```html
<sem-plan kind="quarter">…</sem-plan>
```

```screen
§ plan · quarter
```

### sem-tsgs
Troubleshooting-guide collection.

```html
<sem-tsgs><sem-tsg>…</sem-tsg></sem-tsgs>
```

```screen
§ tsgs · 3 entries
```

### sem-tsg
One troubleshooting entry; optional name/title/description/tags/
when parts, then solution prose.

```html
<sem-tsg><title>502 on edge</title><when>after deploy
</when>Check the upstream pool.</sem-tsg>
```

```screen
▸ tsg · 502 on edge · when after deploy
  Check the upstream pool.
```

### sem-faqs
FAQ collection — answers are ALWAYS in the record; never a
disclosure (occlusion is sem-reveal's job).

```html
<sem-faqs><sem-faq>…</sem-faq></sem-faqs>
```

```screen
§ faqs · 2 entries
```

### sem-faq
One Q/A pair — `<question>` + `<answer>` both required; renders open
by contract.

```html
<sem-faq><question>Why not localStorage?</question>
<answer>XSS reads it.</answer></sem-faq>
```

```screen
❓ Why not localStorage?
  XSS reads it.
```

### sem-changelogs
Changelog collection.

```html
<sem-changelogs><sem-changelog>…</sem-changelog></sem-changelogs>
```

```screen
§ changelogs · 4 entries
```

### sem-changelog
One dated change; date/name/title/impacted chips (or a `<tags>`
child).

```html
<sem-changelog date="2026-10-18" name="v0.7"
  title="Four families" impacted="authoring">…</sem-changelog>
```

```screen
2026-10-18 · v0.7 · Four families · authoring
```

## Interactive & data

### sem-workflow
Interactive procedure engine over sem-step — the executable
counterpart of sem-procedure. Renders as 🧭 with per-step action /
gate / check / if-no / output chips (workflow context only).

```html
<sem-workflow kind="release" duration="20m">
  <sem-step action="merge" check="gh-wait deploy"
    if-no="fix CI, re-run">merge to stage</sem-step>
</sem-workflow>
```

```screen
🧭 release · workflow · 20m
  → merge to stage              action merge
    check gh-wait deploy · if-no fix CI, re-run
```

### sem-site-tree
Nested site/path tree — renders with the shared tree engine (same
rails as the outline); dirs carry trailing /, collapsed nodes ▸.

```html
<sem-site-tree mode="structured">
  <node path="/" kind="dir">
    <node path="/app" label="App"/>
  </node>
</sem-site-tree>
```

```screen
├── /
▸ └── app/
```
space collapse ▸ / expand ▾ · / find

### sem-file-tree
File-tree renderer — the indented `<pre>` IS the record; renders
verbatim in a frame.

```html
<sem-file-tree><pre>app/
  main.ts</pre></sem-file-tree>
```

```screen
┌──────────────────────────────────────────────────────┐
│ app/                                                  │
│   main.ts                                             │
└──────────────────────────────────────────────────────┘
```

### sem-browser
Embedded browser frame — the pane renders a link card only (never
fetches); authored fallback prose stays visible.

```html
<sem-browser src="/demo/preview.html" label="Preview">
Fallback prose.</sem-browser>
```

```screen
◫ /demo/preview.html · Preview
  Fallback prose.
```

### sem-data-source
Named inline typed dataset — renders a ▦ head preview + format chip;
body XOR source path.

```html
<sem-data-source data-name="tokens" format="csv">
name,ttl
access,15m</sem-data-source>
```

```screen
▦ tokens · csv · 2 rows
┌─────────┬─────┐
│ name    │ ttl │
├─────────┼─────┤
│ access  │ 15m │
└─────────┴─────┘
```

### sem-data-query
Read-only SQL-subset query over a named source; mints nothing —
renders as ⌨ text.

```html
<sem-data-query>SELECT * FROM tokens LIMIT 10</sem-data-query>
```

```screen
⌨ SELECT * FROM tokens LIMIT 10
```

### sem-data-join
Inner join of two named datasets — renders as one 🔑 row; mints
nothing.

```html
<sem-data-join name="joined" left="tokens" right="leases"
  on="token_id"></sem-data-join>
```

```screen
🔑 joined ──▸ tokens + leases · on token_id
```

### sem-data-visualizer
Visualizer container over source/query/join — renders the 👁 bar
naming the bound data elements; modal viewer is web-only.

```html
<sem-data-visualizer>
  <sem-data-query>SELECT * FROM tokens</sem-data-query>
</sem-data-visualizer>
```

```screen
👁 visualizer   [ ● tokens · query ]
```

### sem-api-call
API endpoint documentation card — method + endpoint headline, params
as ▦ rows.

```html
<sem-api-call name="Run spec" method="POST"
  endpoint="/api/v1/driver/run">
  <sem-api-param name="mode" in="body" type="string"
    allowed="mock">run mode</sem-api-param>
</sem-api-call>
```

```screen
§ Run spec · POST /api/v1/driver/run
┌──────┬──────┬────────┬─────────┐
│ name │ in   │ type   │ allowed │
├──────┼──────┼────────┼─────────┤
│ mode │ body │ string │ mock    │
└──────┴──────┴────────┴─────────┘
```

### sem-api-param
One parameter row — anatomy of the ▦ row above.

```html
<sem-api-param name="mode" in="body" type="string"
  allowed="mock">run mode</sem-api-param>
```

```screen
│ mode │ body │ string │ mock │ run mode
```

### sem-tag-def
Vocabulary definition card — mirrors an elements.json entry; renders
as 🔑 rows (tag, name, group, children).

```html
<sem-tag-def tag="sem-tldr" group="containers">
  <sem-tag-attr name="kind">display chip</sem-tag-attr>
</sem-tag-def>
```

```screen
🗂 sem-tldr · containers
  🔑 tag ──▸ sem-tldr
  🔑 group ──▸ containers
  🔑 attrs ──▸ kind
```

### sem-tag-attr
One attribute row of a sem-tag-def.

```html
<sem-tag-attr name="kind" type="string" required="false">
display chip</sem-tag-attr>
```

```screen
🔑 kind · string · optional ──▸ display chip
```

## Out of scope for v0.3

`semext-*` (9 service-backed embeds — SigNoz snapshots, annotate
threads, doc pointers, media prompts, styleguide tokens),
`agent-kit-*` (22 project-tracking records), and `npl-*` (20 prompt
blocks, spec §6) are NOT part of this contract yet: until their
per-tag renders land, the mod renders any of them through the
generic record-card fallback — chip line (tag + key/state) + body
prose — and the validator still passes them through untouched.
