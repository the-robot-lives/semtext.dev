# SemText — Format Spec & Conventions

**DRAFT v0.6 — tag form canonical.** SemText is an HTML vocabulary of
**custom elements**: `<sem-enhanced-document>`, `<sem-note variant="tip">`,
`<sem-facts view-as="quiz">`, `<sem-fact>` with `<statement>` and
`<conclusion>`, `<sem-step status="done">`, `<sem-property key="…">`. Element
names say what content *is*; **attributes are attributes** (`view-as`,
`status`, `key`, `kind`, `tags`, `controls`), never `data-*`. That is the
form every example in this spec, the schemas, and the reference documents
use, and the form every tier — theme CSS, the vanilla fallback core, the
reading and Markdown bundles, the Lit upgrade, extraction and the JS-off
artifact — accepts as its first-class input.

The v0.4 baseline rendered the same vocabulary as **classes on plain
elements** with `data-*` parameters (`<div class="sem-note"
data-variant="tip">`). That spelling is retained as a **compatibility
alias**: the mechanical mapping is in **Appendix A**, every tier keeps
accepting it, and a document may mix the two forms. New documents and new
tooling write the tag form.

CSS and script layering (§7): a portable document carries **exactly two
asset links** — `semtext/latest/semtext.css` (the vocabulary base, every
shipped theme, and the v0.6 structural additions, consolidated so themes
switch by attribute alone) and `semtext/latest/semtext.js` (the runtime:
the Lit upgrade, the vanilla fallback and reading behaviours, and the
semtext.dev v0.6 extension layer, in one file). No embedded fallback
script, no per-theme stylesheet, no `_vocabulary.css` link, no page-local
CSS or JS beyond a small layout layer. Extraction never depends on any of
it: an agent reads the file raw. The **single-file** form inlines the same
two assets in `<head>` (the build's `sem:inline` markers). `❓` = open
questions (§10).

---

## Outline

0. [Model](#0-model)
1. [Document skeleton](#1-document-skeleton)
2. [Attribute catalog](#2-attribute-catalog)
3. [NPL notation inside tags](#3-npl-notation-inside-tags)
4. [Fallback handler & degradation rules](#4-fallback-handler--degradation-rules)
5. [Element entries](#5-element-entries)
6. [Theme conventions](#6-theme-conventions)
7. [Distribution forms](#7-distribution-forms)
8. [Machine-readability contract](#8-machine-readability-contract)
9. [NPL XML-variant alignment](#9-npl-xml-variant-alignment)
10. [Open questions](#10-open-questions)
- [Appendix A — Class-form alias (v0.4 compatibility)](#appendix-a--class-form-alias-v04-compatibility)

---

## 0. Model

One file, three consumers — human/browser (double-click, styled, interactive),
LLM/non-visual (the same HTML read structurally; attributes qualify every
datum; same XML vocabulary NPL's MCP server already speaks), terminal (browser
or DOM-text extraction). Element names are **semantic** (`sem-fact`,
`sem-detail`) — what content *is*; presentation is parameterized
(`view-as="quiz|flashcards|list"`) — how it *renders*. NPL conventions live
inside the tags, never as a pre-HTML grammar.

A SemText element is a **custom element** in the `sem-` namespace. Custom
elements are valid HTML whether or not a script ever defines them: the
browser parses `<sem-fact>` as an unknown element, the vocabulary CSS gives
it a block box (`sem-*:not(:defined)` base, §6), and the fallback core
drives it without `customElements.define`. The Lit bundle, when present,
defines the interactive ones and upgrades them in place (§4 rule 2).

## 1. Document skeleton

```html
<!doctype html>
<html lang="en" data-sem-theme="minimal-tech-light">
<head>
  <meta charset="utf-8">
  <title>Authoring Guide</title>
  <link rel="stylesheet" href="semtext/latest/semtext.css">
  <script src="semtext/latest/semtext.js"></script>
</head>
<body>
<sem-enhanced-document>

  <sem-reader controls="outline,progress,focus,type,color,print,audience"></sem-reader>

  <!-- document-level metadata: bare semantic children -->
  <agent>
    <name>Infra Guide</name>
    <bio>Deployment runbook assistant</bio>
    <instructions>Answer from sem-fact ids only.</instructions>
  </agent>

  <h1 data-kind="title">Authoring Guide</h1>

  <sem-note variant="warning">Rotation is <sem-highlight>per session</sem-highlight>.</sem-note>

  <sem-facts view-as="flashcards">
    <sem-fact id="f-jwt" kind="concept">
      <statement>JWTs rotate per session</statement>
      <conclusion>Short-lived access; the refresh grant issues a new pair.</conclusion>
    </sem-fact>
  </sem-facts>

  <!-- content: sem-* vocabulary + ordinary semantic HTML -->

</sem-enhanced-document>
</body>
</html>
```

The head carries **exactly two asset tags** (v0.6): the consolidated
stylesheet and the runtime script. `data-sem-theme` is optional — when the
attribute is absent every theme token falls back to the default,
`minimal-tech-light` (§6). Older documents linking `themes/_vocabulary.css`
plus a per-theme file, or carrying an embedded `<script id="sem-fallback">`,
remain **valid compatibility inputs** — every tier still accepts them — but
they are no longer the authoring form this spec teaches, and the fallback
script is never *required*: extraction and structural reading never depend
on JS (§4).

- `<sem-enhanced-document>` is the required root wrapper (fallback handler
  scopes to it; Lit components register against it). It may carry a
  landmark role (`role="main"`) — it is the document. The alias form may
  use `<main class="sem-enhanced-document">` for the native landmark; the
  tag form trades that for one element that is the same in every consumer,
  and states the landmark with `role`.
- `<sem-reader>`, when used, is the wrapper's first child (one per
  document; §5).
- Metadata children (`agent`, and future `org`, `context`, `audience`) are
  **bare semantic tags** — machine-facing, unstyled. ❓ **Q1** keep bare vs
  `sem-`-prefix them?
- Record **parts** are bare semantic children too: `<statement>`,
  `<conclusion>`, `<sem-distractor>` inside `sem-fact`; `<sem-highlight>`
  (sugar alias `<highlight>`) inside any prose element; `<name>`, `<bio>`,
  `<instructions>` inside `agent`.
- Ordinary semantic HTML is always valid content; `sem-*` enhances where
  interactivity pays. Plain HTML carrying `data-kind` or `data-tags` is a
  record too (extraction §3) — on a standard element the qualifier keeps
  the `data-*` spelling, which is the only valid custom attribute HTML5
  allows there (§2).

## 2. Attribute catalog

Global attributes (any `sem-*` element), spelled **bare**:

| Attribute | Values | Machine meaning |
| :-- | :-- | :-- |
| `kind` | free token (`concept`, `anti-pattern`, `caveat`, …) | what the data IS |
| `tags` | comma list | classification |
| `view-as` | element-defined modes | presentation parameter (identity unchanged) |
| `status` | `done`, `current`, `todo`, `blocked`, `pass`, `fail` | lifecycle/verdict |
| `controls` | comma flags: `shuffle`, `filter`, `retry`, `picker` | which controls render |
| `collapsed` | boolean | pre-collapse state |
| `audience` | profile spec: `a`, `a, b`, `!a` (profiles from `sem-audiences`) | who the datum is for — **`spec/schema/sem-audiences.md`**; carried verbatim by extraction, never suppresses a record |
| `id` | doc-unique | stable anchor, cite target — a `#id` or `#container/child` hash reaches it through any closed reveal, collapsed note, inactive view or non-current card (fallback `target`) |
| `data-*` | free | extension point; also the **alias spelling** of every parameter above (Appendix A) |

Element-specific parameters (`variant`, `key`, `name`, `summary`, `value`,
`label`, `when`, `until`, `lang`, `filename`, `mark`, `wrap`, `href`,
`cite`, `implies`, `sticky`, `outline-depth`) follow the same rule: bare on
the element, documented per schema.

**Scope of the bare spelling.** Bare attributes are canonical on `sem-*`
custom elements and their bare part children (`<statement>`, `<highlight>`,
`<agent>` › `<name>`), where any attribute name is valid. On a **standard
HTML element** (`<h2>`, `<p>`, `<a>`, `<td>`) a global qualifier keeps the
`data-*` spelling — `<h2 data-kind="section" data-tags="auth">`,
`<p data-audience="operator">`, `<td data-value="900">` — because HTML5
allows no other custom attribute there and §8 promises tool-parseable
documents. Every tier reads both spellings on either kind of element.

**Alias spelling.** `data-<name>` is accepted everywhere `<name>` is, and
wins when both are present (extraction §3.6; the fallback core copies each
bare parameter to its `data-*` twin before any handler runs, §4 rule 1).
Writing both spellings on one element is an **authoring error** — the
precedence exists so extraction stays stable and the mirror is a no-op,
not so an author can mean two things; a `sem-source` fence always shows
the markup as authored, so a mixed element would display a parameter the
tiers do not use.

**Runtime state** the tiers write is always `data-*` — `data-active` on
the shown view, `data-view-as` rewritten by a `sem-source` / `sem-md`
toggle, `data-sem-fallback` / `data-sem-upgraded` tier markers — so an
authored bare attribute is never overwritten and a `sem-source` fence
still shows the markup as written.

`view-as` is the core inversion: `<sem-fact>` is a fact in every view;
`view-as` only selects rendering. Unknown `view-as` ⇒ falls back to `list`/
plain + fallback-handler warning. CSS-only modes exist too:
`sem-note view-as="margin"` (right-gutter aside on wide viewports),
`sem-chronology view-as="timeline|list"`. `sem-properties
view-as="glossary"` adds term previews from the reading bundle.

**Hash state.** The hash is `&`-joined segments (`src/shared/state.ts`):
bare `id` / `container/child` deep links, and `name=value` parameters
(`sem-audience=<profile>`). Every writer edits its own segment only, so
`#deploy/argocd&sem-audience=operator` survives a tab switch.

**Class namespace.** Each element owns exactly the class namespace
`.sem-<element>` and `.sem-<element>-*`: the alias form's identity class
(Appendix A) and the element's generated chrome (`.sem-facts-chrome`,
`.sem-note-summary`, `.sem-code-line`). No other element may reuse that
bare class name for its own chrome. `.sem-progress` names only the progress
element — a facts-chrome label needing similar styling is `.sem-facts-meter`,
never `.sem-progress` borrowed from another element.

## 3. NPL notation inside tags

Compact notation is legal inside element text where the schema allows;
**attributes are canonical, notation is sugar**:

| Notation | Meaning | Where |
| :-- | :-- | :-- |
| `<sem-highlight>` (alias `<highlight>`) | recall target — occludes in quiz/flashcard views, emphasised in plain view | any prose element |
| `[[cloze]]` | inline occlusion sugar (equivalent to `<sem-highlight>`) | `sem-detail`, `sem-fact` |
| `*text*` | inline emphasis sugar — renders as `<em>`; never crosses a code block, a `sem-code`/`sem-md` element, or an attribute | any prose text |
| `term :: value` | pair | `sem-property` text, `sem-fact` compact form |
| `✅ …` / `✗ …` | correct / distractor | `sem-option` sugar |
| `→ …` | current | `sem-step` status sugar |
| `[hint \| reveal]` | agent-facing instruction, human-rendered hint | instruction-bearing elements (define in `sem-note` schema first) |

Markdown-flavoured line sugar (v0.6): a `sem-list` whose text is `- item` /
`1. item` lines and a `sem-table` whose text is a pipe table are the
authoring forms for those elements (§5); the runtime renders real
`<ul>/<ol>/<li>` and `<table>` from them.

`<statement>`/`<conclusion>` children always win over `::` compact form when
both present; authors pick one per fact.

### 3.1 Authoring style (v0.6)

Normative guidance; the validator warns on each violation:

- **Plain text over `<p>`.** Do not wrap a lone line in `<p>` unless
  paragraph semantics matter (grouping, spacing a distinct block, a
  `<p>-anchored citation`). Bare text nodes inside the root wrapper or a
  section element are first-class content.
- **No `<br>`.** Line breaks are a presentation concern; start a new
  element (a new line of bare text, a `sem-list` item) instead.
- **No `<b>`, `<strong>`, `<i>`, `<em>`.** An important term is
  `<sem-highlight>` (§3); any other emphasis is the `*text*` sugar. The
  four raw tags still parse — documents carrying them are valid — but new
  authoring does not use them.
- **No `<hr>`.** A visual break is `<sem-break>`; a structural block
  boundary is `<sem-section>` (§5).
- **Inline code is `<sem-code>` flat form** — the element's own text is
  the code (§5, sem-code). Raw `<code>` still parses.
- Never encode meaning in presentation: emphasis sugar and highlights
  qualify prose for readers; `kind` / `tags` qualify it for machines.

## 4. Fallback handler & degradation rules

1. **No document carries an embedded fallback script (v0.6).** The
   `<script id="sem-fallback">` requirement is retired: interactivity lives
   in `semtext/latest/semtext.js`, which carries the vanilla fallback
   behaviours (`dist/semtext-fallback.js`, ≤14 KB raw), the prose-reading
   behaviours (`dist/semtext-reading.js`, ≤19.5 KB raw, marker
   `<!-- sem:inline reading -->`) and the Markdown renderer
   (`dist/semtext-md.js`, ≤8.5 KB raw, marker `<!-- sem:inline md -->`,
   global `SemTextMd`) alongside the Lit upgrade, plus the semtext.dev
   extension layer for the v0.6 authoring forms (`sem-list` lines,
   `sem-table` pipe tables, `*emphasis*` sugar, `sem-reference` auto-ids,
   flat `sem-code`). Rationale: extraction must not depend on JS anyway —
   an agent reads the file raw — so a document that never loads a script
   still extracts, reads structurally, and renders styled-but-static via
   the stylesheet alone. Every handler selects both authoring forms from
   one selector (`:is(sem-x, .sem-x)`, the child parts
   `:is(conclusion, .sem-conclusion)`) and skips elements the Lit tier has
   already upgraded. The fallback's first handler snapshots every
   `sem-source` wrapper's markup (a DOM clone in an inert
   `template.sem-source-raw` child) before any other handler runs; the
   reading bundle renders that copy. Its second mirrors each bare tag-form
   parameter (`view-as`, `variant`, `name`, `active`, `summary`, `value`,
   `label`, `key`) to its `data-*` twin when the twin is absent, so the
   gated CSS rules and every later handler read one spelling. The list is
   exactly the parameters a core handler or a gated CSS rule reads;
   `controls`, `sticky`, `lang`, `filename`, `mark`, `wrap`,
   `outline-depth`, `href`, `cite`, `implies`, `when`, `until`, `status`,
   `kind` and `tags` are read in both spellings by the bundle or CSS rule
   that consumes them and need no mirror. `status` in particular is never
   read by a script: its only consumers are the no-script CSS rules of
   `sem-step`, `sem-event` and `sem-progress`, each written
   `:is([data-status="x"], [status="x"])`, which select on a *value*
   rather than render an `attr()` — both spellings of the same value
   produce the same declaration, so no `:not([data-status])` guard is
   needed and the alias precedence of §2 cannot be observed unless an
   element carries two different values, which is the authoring error §2
   already names.
2. `semtext/latest/semtext.js` (the runtime: Lit 3 components +
   fallback/reading/md behaviours + v0.6 extension layer) defines the
   interactive elements (`sem-note`, `sem-facts`, `sem-details`,
   `sem-properties`, `sem-code`, `sem-references`, `sem-reader`,
   `sem-table`, `sem-source`, `sem-md`) and upgrades them in place when
   reachable; component implementations supersede fallback behaviors.
   Handoff contract: fallback sets `data-sem-fallback` on elements it
   enhanced; components remove it on upgrade and set `data-sem-upgraded`.
   Both tiers also stamp their marker on `<html>` once they have run, for
   hide rules whose host element is deliberately unmarked (a list-view
   deck's distractors). The zero-JS elements (`sem-procedure`,
   `sem-chronology`, `sem-audiences`, and the v0.6 `sem-list`,
   `sem-section`, `sem-break` before the extension renders their
   markdown/pipe forms) and the fallback-only ones (`sem-views`,
   `sem-reveal`, `sem-progress`) define no custom element: they are
   `:not(:defined)` in every tier, by design. BDD asserts both tiers + the
   handoff.
3. Theme CSS styles **both authoring forms from one rule** —
   `:is(sem-x, .sem-x)` throughout `themes/_vocabulary.css` (D10). Rules
   that must hold with **no script** read the bare and the `data-*`
   spelling (`[status="done"]`, `[data-status="done"]`; `attr(name)`,
   `attr(data-name)`), and a bare-spelling rule is guarded with
   `:not([data-<name>])` so `data-*` still wins when both are present
   (§2). Rules that only apply once a tier is driving the element key on
   the `data-*` spelling alone, which rule 1 guarantees is present. A tag-form
   document is therefore presentable before and without any script, with
   no layout shift on upgrade where feasible.
4. **Every hide rule is gated** on `:is([data-sem-fallback],
   [data-sem-upgraded])` (D12). With no script in the page nothing is
   hidden: distractors render labelled, views stack under their names,
   collapsed bodies and every conclusion show, audience-qualified content
   is all visible. `dist/demo/*.nojs.html` and `dist/spec/*.nojs.html` are
   the artifacts that prove it.
5. Content lives in light DOM (searchable, copyable); shadow DOM carries
   interactive chrome only. Generated chrome is classed (`.sem-facts-chrome`,
   `.sem-views-tabs`, `.sem-note-summary`) so extraction can skip it; a
   collapsed note's body is the element's own content, wrapped in
   `.sem-note-body` by the tier that hides it.
6. Cross-cutting, also in the vocabulary CSS: `@media print` shows
   everything a reader could open and no chrome (`beforeprint` opens reveal
   disclosures; CSS cannot); `prefers-reduced-motion` drops transitions and
   smooth scrolling.

## 5. Element entries

Each entry shows the canonical markup; the class-form alias for every
element is one row of Appendix A.

### Tier 0

**sem-note** — callout.
**Normative: `spec/schema/sem-note.md`.**
```html
<sem-note variant="warning">Rotation is <sem-highlight>per session</sem-highlight>.</sem-note>
<sem-note variant="tip" collapsed>Shuffle flashcards before each review session.</sem-note>
```
`variant="info|warning|tip|danger"`; the body is the element's content;
`collapsed` ⇒ ten-word teaser, click to expand (the tier wraps the body in
`.sem-note-body` to hide it); `view-as="margin"` ⇒ CSS-only right-gutter
aside on wide viewports, inline otherwise. Light DOM, `role="note"`.

**sem-audiences / sem-profile** — reader profiles; metadata, mints nothing.
**Normative: `spec/schema/sem-audiences.md`.**
```html
<sem-audiences>
  <sem-profile id="reader" label="Reader"></sem-profile>
  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>
</sem-audiences>
<sem-note audience="operator">…</sem-note>
```
Active profile = hash `sem-audience` param, else `audience` on the root
wrapper / `data-audience` on `<html>`. Fallback sets native `hidden` on
non-matching elements; JS-off everything shows; fail-open on unknown tokens.

**sem-fact** — the atomic unit; assertable Q/A pair.
```html
<sem-fact id="f-jwt" kind="concept">
  <statement>JWTs rotate per session</statement>
  <conclusion>Short-lived access; refresh grants a new pair.</conclusion>
</sem-fact>
```
Compact form: `<sem-fact>JWT rotation :: short-lived access</sem-fact>`.
Machine view: statement+conclusion = structured assertion.

**sem-facts** — collection; the flagship surface.
**Normative: `spec/schema/sem-facts.md`.**
```html
<sem-facts view-as="quiz" controls="shuffle,filter">
  <sem-fact>…</sem-fact>
  <sem-fact>…<sem-distractor>decoy conclusion</sem-distractor></sem-fact>
</sem-facts>
```
- `view-as="list"` (default): filter box, tag chips.
- `view-as="flashcards"`: front = statement (+`<highlight>` prompt), back =
  conclusion; flip click/Space; ←/→/swipe; progress `3/12`; `shuffle`.
- `view-as="quiz"`: statement shown; candidates = sibling conclusions,
  `<sem-distractor>` children win when present; accuracy on `sem-complete`.
- Events: `sem-navigate {index}`, `sem-flip {face}`, `sem-complete {correct,total,ms}`.

**sem-detail / sem-details** — prose with occludable content.
**Normative: `spec/schema/sem-details.md`.**
```html
<sem-details view-as="quiz">
  <sem-detail>
    The OIDC token travels in the <highlight>Authorization</highlight> header.
  </sem-detail>
</sem-details>
```
Plain view: `<highlight>` renders `<em>`. Quiz view: occluded (`▮▮▮`), reveal
per item, self-check or auto-check.

**sem-procedure / sem-step** — ordered, status-annotated procedure.
**Normative: `spec/schema/sem-procedure.md`.**
```html
<sem-procedure kind="runbook">
  <sem-step status="done">provision Infisical path</sem-step>
  <sem-step status="current">port-forward MinIO</sem-step>
  <sem-step>run migrations</sem-step>
  <sem-step status="blocked">cut release</sem-step>
</sem-procedure>
```
`status`: `done|current|todo` (default) `|blocked`; DOM order =
execution order (ordinals positional, CSS counters); status sugar
(`✅/→/❌`) is display-only — `status` canonical. **Roles are presentation,
not authoring** (v0.6): the theme CSS supplies the list/listitem
presentation, `role="list"` / `role="listitem"` are optional, and
documents that carry them stay valid. **Zero-JS element.**

**sem-properties / sem-property** — definition/properties block.
**Normative: `spec/schema/sem-properties.md`.**
```html
<sem-properties kind="config">
  <sem-property key="token ttl" role="definition" aria-label="token ttl">15m</sem-property>
</sem-properties>
```
`key` = the term, property text = the value. Zero-JS: key column
renders via CSS `attr(key)`; AT gets the pair via
`role="definition"` + `aria-label` = key. Compact `term :: value` sugar
(conventions §3) is display-only — `key` canonical. Renders
`<dl>`-equivalent grid; **Q2 resolved v1: pure definition list, no
copy/search chrome.**

**sem-views / sem-view** — same content, switchable perspectives.
**Normative: `spec/schema/sem-views.md`.**
```html
<sem-views id="deploy">
  <sem-view name="Helm" active role="tabpanel">content…</sem-view>
  <sem-view name="ArgoCD" role="tabpanel">content…</sem-view>
</sem-views>
```
`name` unique per container; `active` marks initial view (first wins if
absent; the tier keeps the shown view in `data-active`); fallback builds
the tab bar (`.sem-views-tabs`, `role="tab"` buttons), arrow-key roving
focus; deep-link `#deploy/argocd`; fires `sem-navigate {id, name, index}`.
JS-off: all views stacked, `name`-headed. **Q3 resolved v1: `sem-views`.**

**sem-reveal** — Q→A disclosure, `<details>`-backed.
**Normative: `spec/schema/sem-reveal.md`.**
```html
<sem-reveal summary="Why not localStorage?" collapsed>
  Tokens in localStorage are readable by any script on the page…
</sem-reveal>
```
`summary` optional — first body line (≤60 chars) derives it, by the
one rule in `src/shared/summary.ts` that render and extraction share;
`collapsed` starts hidden, otherwise open. Fallback wraps in native
`<details>/<summary>`; JS-off: fully visible (summary as small-caps
heading). Non-assertive counterpart to `sem-fact` Q/A shape.

**sem-chronology / sem-event** — dated, ordered events; CSS-only timeline.
**Normative: `spec/schema/sem-chronology.md`.**
```html
<sem-chronology kind="release-history" role="list">
  <sem-event role="listitem" when="2026-03-02" status="done">
    <time datetime="2026-03-02">2 Mar 2026</time> v0.1 tagged.</sem-event>
</sem-chronology>
```
`when`/`until` canonical; `<time>` child is the visible label
(else CSS renders `when`); `status` optional, same vocabulary as
`sem-step`; `view-as="timeline|list"`. DOM order = chronological order;
ordinals positional. **Zero-JS element.**

**sem-code** — verbatim listing with provenance and copy / wrap; also the
canonical **inline code** form (v0.6).
**Normative: `spec/schema/sem-code.md`.**
```html
<sem-code lang="ts" filename="src/rotate.ts" mark="2,4-5" controls="copy,wrap">
<pre><code>export function rotate(pair: Pair): Pair {
  const next = mint();
  retire(pair.refresh);
  return next;
}</code></pre>
</sem-code>
```
**Inline flat form (v0.6, preferred over raw `<code>`):** a `sem-code`
whose own text is the code — `<sem-code>npm run validate</sem-code>` —
renders as inline code wherever phrasing content flows. Flat elements
carrying `filename`, `lang`, `mark` or `controls`, or multi-line text,
are block listings: the runtime wraps the text in a `<pre><code>` and the
reading chrome attaches. Raw `<code>` still parses everywhere.
Reading bundle adds `.sem-code-chrome` (filename, lang, buttons, status
region), wraps lines (`span|mark.sem-code-line`, text byte-identical),
`tabindex="0"` on an overflowing `<pre>`. JS-off: plain `<pre>` with a
CSS caption. Extraction keeps `source` **verbatim**.

**sem-source** — a section that flips between rendered and authored markup.
**Normative: `spec/schema/sem-source.md`.**
```html
<sem-source label="Facts — flashcards">
  <h2>Facts — flashcards</h2>
  <sem-facts view-as="flashcards">…</sem-facts>
</sem-source>
```
Chrome `Rendered | Source` (`aria-pressed`); `view-as="source"` starts in
source mode, showing the literal markup in a `sem-code` (copy, wrap) built
from the core's pre-enhancement snapshot; the toggle rewrites
`data-view-as`. Transparent to extraction; JS-off: the rendered children,
nothing else.

**sem-md** — a Markdown block, rendered in the browser.
**Normative: `spec/schema/sem-md.md`.**
```html
<sem-md label="Token lifetimes">
  | Token   | Lifetime | Rotates |
  | :------ | -------: | :-----: |
  | access  | 15 min   | no      |
</sem-md>
```
The element's text is Markdown (GFM tables, headings, lists, emphasis,
links, code, quotes, rules; raw HTML renders as text). The Markdown bundle
adds `.sem-md-chrome` (label, `Markdown` toggle with `aria-pressed`, copy,
status region), renders into `.sem-md-body` (real `<table>` with
`th[scope="col"]`, alignment row honoured) and keeps the normalised source
in a `sem-code` fence (`.sem-md-raw`); `view-as="rendered|raw"` picks the
initial mode and the toggle rewrites `data-view-as`. JS-off: the source
reads as pre-wrapped text. Extraction keeps `source` **normalised**
(dedented), never the rendering.

**sem-references / sem-reference** — numbered citable entries.
**Normative: `spec/schema/sem-references.md`.**
```html
<p>…per use<a href="#refs-rfc-6749">[1]</a>.</p>
<sem-references id="refs" kind="bibliography">
  <sem-reference cite="https://www.rfc-editor.org/rfc/rfc6749">RFC 6749 — The OAuth 2.0 Authorization Framework, §10.4.</sem-reference>
</sem-references>
```
**Canonical authoring (v0.6):** `cite` is **required** and is the locator
(a path or URL); `href` is accepted as a compat alias of the same idea
but not authored; `id` is **not authored** — the runtime materializes it
as the parent block's id (default `refs`) + `-` + slug(cite), slug =
lowercase, every non-alphanumeric run collapsed to one `-`
(`Projects/github-tools/docs/gh-wait.md` →
`refs-projects-github-tools-docs-gh-wait-md`). Authored `id`s and `href`s
remain valid. CSS-counter numbering in every tier; reading bundle adds
hover / focus previews on citing anchors (`.sem-references-ref`, popover
`role="tooltip"`, `Esc` closes), backlinks (`aria-label="Back to citation
N"`) and an external link. Citations mint nothing; print shows `(cite)`
inside the block only.

**sem-reader** — reading chrome: outline, progress, focus, type, colour,
print, audience. **Normative: `spec/schema/sem-reader.md`.**
```html
<sem-reader controls="outline,progress,focus,type,color,print,audience" outline-depth="3">
  <nav aria-label="Contents">…optional, used verbatim…</nav>
</sem-reader>
```
One per document, first child of the wrapper. Reading bundle inserts
`.sem-reader-chrome` (`role="region"`), generates the outline from
`h2…h<depth>` when no nav is authored (`aria-current="location"` tracks
the heading in view), and writes `data-sem-mode|type|font` and
`data-color-mode` on `<html>` — persisted via `localStorage`, fail-open.
Audience writes the `sem-audience` hash parameter. No global key
shortcuts. **Mints nothing**; extraction skips it whole (extraction §3
rule 7). The `theme` control is R/W3.

**sem-table** — sortable, filterable authored table.
**Normative: `spec/schema/sem-table.md`.**
```html
<sem-table controls="sort,filter" sticky>
  <table><caption>…</caption><thead><tr><th scope="col">…</th></tr></thead>
  <tbody><tr><td data-value="900">15 min</td></tr></tbody></table>
</sem-table>
```
**Markdown authoring form (v0.6):** the element's text may instead be a
GFM pipe table —
```html
<sem-table controls="sort,filter" label="Token lifetimes">
  | Token  | Lifetime | Rotates |
  | ------ | -------- | ------- |
  | access | 15 min   | no      |
</sem-table>
```
— which the runtime renders into a real `<table>` (header row from the
delimiter row, body rows after it) before the sort/filter chrome attaches.
`controls="sort,filter"` semantics are identical in both forms. Legacy
documents with a real `<table>` child keep parsing unchanged. The
rendered `<table>` is the contract (no JSON payload). Reading bundle stamps
every body row `data-sem-source-index` once, wraps headers in
`button.sem-table-sort` (`aria-sort` cycle), filters with native `hidden`,
announces via `.sem-table-status`. Extraction returns
`{caption, columns[], rows[][]}` in **authored** order from the stamp —
the recorded §5 exception. `sticky` header and `kind="comparison"`
first column are CSS in every tier. (`td[data-value]` is a sort key on a
plain HTML cell, not a vocabulary parameter — it stays `data-*`.)

**sem-list** — authored list from markdown-style lines (v0.6).
**Normative: `spec/schema/sem-list.md`.**
```html
<sem-list ordered>
  1. Port-forward MinIO
  2. Run migrations
     - auth schema first
     - then tokens
</sem-list>
```
The attribute is bare: `ordered` or `unordered` (default `unordered`).
Content is plain text lines: `- item` / `* item` / `1. item`; two-space
indentation nests (`Item 2.a` style sub-items become a nested list of
the parent item). The runtime renders real `<ul>/<ol>/<li>`. A
`sem-list` whose children are already real `<ul>/<ol>` elements keeps
parsing (compat; the runtime leaves it alone). Zero-JS: the source lines
read as pre-wrapped text, like `sem-md`.

**sem-section** — block wrapper with a divider between adjacent sections
(v0.6). **Normative: `spec/schema/sem-section.md`.**
```html
<sem-section kind="setup">…</sem-section>
<sem-section kind="verify">…</sem-section>
```
Transparent to extraction and to the fallback's snapshot; CSS draws a
divider between two adjacent `sem-section` siblings.

**sem-break** — an EMPTY visual divider; the `<hr>` replacement (v0.6).
**Normative: `spec/schema/sem-break.md`.**
```html
<sem-break></sem-break>
```
Authors never write `<hr>` (§3.1; the validator warns). CSS renders the
break as a horizontal rule in every tier; the element carries no content,
so it mints nothing and extraction skips it.

**sem-progress** — completion meter.
**Normative: `spec/schema/sem-progress.md`.**
```html
<sem-progress value="0.62" label="coverage"
     role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.62"></sem-progress>
```
`value` canonical 0..1 (render clamps, attr untouched); `label`
default `progress`; fallback renders track + fill + `label :: N%`; JS-off:
text-only via CSS `attr()` — no fake bar; the caption is gated on the
tier marker (`data-sem-fallback` / `data-sem-upgraded` on the element),
so it never duplicates the fallback text. `status="done"` ⇔ 1 by
convention.

### Tier 1 — flagship buildout

- `sem-facts` full build (filter, shuffle, swipe, quiz scoring).
- `sem-question` — 7 TRP renderers inside quiz views:
```html
<sem-question type="mc">
  <p data-kind="prompt">Which header carries the OIDC token?</p>
  <sem-option correct>Authorization</sem-option>
  <sem-option>Cookie</sem-option>
</sem-question>
```
Types `mc|multi|blank|match|order|tf|short`; `correct` attr canonical,
`✅` sugar; `retry` control; results block; machine view = assertable Q/A.

### Tier 2

- `sem-chronology` / `sem-event when` — ✅ shipped (R/W1, Tier 0 above).
- `sem-table` — ✅ shipped (R/W2, Tier 0 above); `sem-query` deferred.
- `sem-themes controls="picker"` — subsumed by `sem-reader`'s `theme`
  control (R/W3, after Track T).
- `sem-md` — ✅ shipped (R/W2.2, Tier 0 above): Markdown *inside* a
  SemText document. A whole-document md→SemText authoring aid remains
  optional and never required.

## 6. Theme conventions

- `data-sem-theme="<slug>"` on `<html>`; one theme per doc; `--sem-*`
  tokens; the vocabulary base gives every `sem-*` element its box before
  any definition (`sem-*:not(:defined)` and the never-defined zero-JS
  elements alike — custom elements are inline by default, the vocabulary
  is block-level).
- **Consolidated stylesheet (v0.6).** `semtext/latest/semtext.css` ships
  the vocabulary base, the v0.6 structural additions and **every shipped
  theme**, each scoped under `html[data-sem-theme="<slug>"]` — switching
  themes is one attribute, never a second `<link>`. **Default theme:**
  when the attribute is absent the tokens fall back to
  `minimal-tech-light`, so a two-tag document is fully styled.
- Shadow components read tokens via fallback indirection — zero-JS theme flips.
- Ship **5** themes (v0.6): `minimal-tech-light` (default),
  `nocturne-console`, `organic-warm`, `editorial-settings`, and
  `newsprint` (serif, print-like paper aesthetic); auto light/dark via
  `prefers-color-scheme`, `data-color-mode` forces. Per-theme token files
  remain available under `semtext/latest/themes/<slug>.css` for pinned
  documents.

## 7. Distribution forms

1. **Folder** — `doc.html` + relative `semtext/latest/` (`semtext.css` +
   `semtext.js`, the two-tag head of §1).
2. **Single-file** — the two assets + data all inlined; one file
   shares anywhere.
3. **MHTML** — multi-page bundle.
4. Hard rules: no ES-module scripts; no runtime fetch in portable docs;
   **no embedded fallback script** — the runtime bundle is the only
   script a document links, and no consumer ever needs it for extraction
   or structural reading (§4).

## 8. Machine-readability contract

- Semantic children (`<statement>`, `<conclusion>`, `<highlight>`) + attrs
  (`kind`, `status`, `tags`, `view-as`) qualify every datum.
- Well-formed, correctly nested HTML — parseable by XML/HTML tooling; the same
  vocabulary is the XML variant of NPL (§9). Custom elements with bare
  attributes are what an XML consumer sees: `<sem-fact kind="concept">`
  is one element with one attribute, no class list to tokenise and no
  `data-` prefix to strip. The document stays **valid HTML5** as well:
  bare attributes appear only on custom elements, and a standard element
  carries its qualifier as `data-*` (§2).
- Events + attrs documented per schema = agent integration surface.
- "Text extraction" reference recipe (DOM → annotated plain text) ships with
  the lib for terminal/LLM pipelines.

### The extraction invariant (normative)

For any document `D`, where `E` is extraction, `R(D)` is `D` after the
fallback handler or the Lit upgrade has run, and `I(D)` is `D` after any
sequence of user interactions the vocabulary supports (tab switches, card
flips, reveals, table sorts and filters, audience profile switches,
`sem-source` / `sem-md` view toggles, reader chrome changes):

```
E(D) = E(R(D)) = E(I(R(D)))
```

Equality is deep equality of the record array, including `sourceOrder`, and
the same guarantee covers every `view-as` mode. This is the format's central
promise: the machine consumer does not get a degraded reading of what the
human consumer saw. The full formal statement — the three refusal rules that
make it hold (extraction never looks at generated chrome, runtime state, or
presentation attributes: `data-view-as`, `data-active`, `collapsed`) and the
one recorded exception (`sem-table` row reordering, made safe by the
`data-sem-source-index` stamp) — is normative and lives in
`spec/extraction.md` §5; this section does not weaken or restate it.

### What a consumer may rely on

Normative, each item enforced by the tests named below:

- The record array: flat, document-ordered, `sourceOrder` = array index,
  containment a `parent` index tree; record shape fixed
  (`type`, `id`, `kind`, `tags`, `audience`, `parent`, `fields`, `text`,
  `sourceOrder` — `spec/extraction.md` §2).
- `audience` is carried verbatim on every record and never removes one;
  filtering by audience is a consumer operation on the extracted array.
- The annotated plain-text tier (`extractText` / `renderRecordsAsText`) is a
  pure function of the records, so it inherits the invariant unchanged.
- Extraction itself is a total, pure function: no configuration, no I/O, no
  DOM mutation (`spec/extraction.md` §9).

### Best-effort only (not guaranteed)

- Which view an author meant to show first: `data-active` is a state marker,
  excluded from extraction by design. An author marks a primary perspective
  with a durable qualifier (`kind`, `tags`) on the view.
- Live presentation state (quiz answers, current sort, reader font/mode,
  disclosure state): invisible to extraction. If a consumer needs it, the
  vocabulary must carry it as a durable qualifier instead.
- Element families without a schema entry extract as plain records
  (`fields: {}`, prose `text`); their payloads are best-effort until a
  schema defines them.

Evidence (each bullet is asserted, not aspirational):
`test/e2e/extraction.cy.js` (invariant core: JS-off = JS-on, every
`view-as`, before/after interaction), `test/e2e/extraction-reading.cy.js`
(reading elements; sort + filter deep-equal baseline),
`test/e2e/sem-table.cy.js` (the recorded reordering exception),
`test/e2e/sem-audiences.cy.js` (invariant across profile switches),
`test/e2e/spec-pages.cy.js` (this document itself: records identical JS-off,
JS-on, and after interaction).

## 9. NPL XML-variant alignment

This vocabulary is the **XML variant of NPL**: NPL yaml already models agents
(name/bio/instructions), instructions, and structured prompt sections via the
MCP server; this format is its document-shaped rendering target. Alignment
tasks (tracked, not blocking M1): map `<agent>` children to NPL agent schema;
map `sem-fact` to NPL fact/knowledge records; define `sem-enhanced-document`
as a valid MCP `NPLLoad`/render target. ❓ **Q4** who owns the mapping — this
repo exports it, or NPL MCP consumes a schema file we publish?

## 10. Open questions

| # | Question | My lean |
| :-- | :-- | :-- |
| Q1 | bare `<agent>` metadata children vs `sem-`-prefixed | bare (per your example; matches NPL yaml shape) |
| Q2 | `sem-properties` pure `<dl>` v1 | **resolved (this branch)** — pure `<dl>`, chrome only if a consumer demands it |
| Q3 | tabs-family name: `sem-views` vs `sem-perspectives` | **resolved (this branch)** — `sem-views` |
| Q4 | NPL MCP alignment ownership | we publish the schema file; MCP consumes |
| Q5 | fallback handler scope: baseline interactivity only vs full quiz logic | full logic v1 — it's small and makes single-file form Lit-free |
| Q6 | class-form alias lifetime: keep indefinitely, or retire once every reference document is tag-form | keep — it costs one `:is()` per rule and lets HTML generators that cannot emit custom elements participate |

## Appendix A — Class-form alias (v0.4 compatibility)

The v0.4 baseline spelled the vocabulary as **classes on plain elements**
with `data-*` parameters. Every tier still accepts that spelling and a
document may mix forms; it is an alias, not a second vocabulary. The
mapping is mechanical: identity = `class="sem-<element>"` on a `div`
(or `span` for inline parts), every bare parameter = `data-<parameter>`,
every bare child part = a `div`/`span` classed `.sem-<part>`.

| Canonical tag form | Class-form alias |
| :-- | :-- |
| `<sem-enhanced-document>` | `div.sem-enhanced-document` |
| `<agent>` + name/bio/instructions | `div.sem-agent` › `.sem-agent-name/-bio/-instructions` |
| `<sem-note variant="warning">` body | `div.sem-note[data-variant="warning"]` › `.sem-note-body`; `collapsed` attr |
| `<sem-audiences>` / `<sem-profile id label implies>` | `div.sem-audiences` › `div.sem-profile[id][data-label][data-implies]`; `audience="…"` → `data-audience` |
| `<sem-facts view-as="quiz">` | `div.sem-facts[data-view-as="quiz"]` |
| `<sem-fact>` › `<statement>` / `<conclusion>` | `div.sem-fact` › `.sem-statement`, `.sem-conclusion` |
| `<sem-distractor>` | `div.sem-distractor` |
| `<sem-details>` / `<sem-detail>` | `div.sem-details` › `div.sem-detail` |
| `<highlight>` | `span.sem-highlight` (occluded form: `.sem-occluded`) |
| `<sem-procedure>` / `<sem-step status>` | `div.sem-procedure` › `div.sem-step[data-status]` |
| `<sem-properties>` / `<sem-property key>` | `div.sem-properties` › `div.sem-property[data-key]` |
| `<sem-properties view-as="glossary">` | `div.sem-properties[data-view-as="glossary"]` › `div.sem-property[id][data-key]`; term anchors `<a href="#id">`, `<dfn>` optional |
| `<sem-views>` / `<sem-view name active>` | `div.sem-views[id]` › `div.sem-view[data-name]`, `data-active` marker |
| `<sem-reveal summary>` | `div.sem-reveal[data-summary]`, `collapsed` attr |
| `<sem-progress value label>` | `div.sem-progress[data-value][data-label]` |
| `<sem-chronology view-as>` / `<sem-event when until status>` | `div.sem-chronology[data-view-as]` › `div.sem-event[data-when][data-until][data-status]` (+ `<time datetime>`) |
| `<sem-code lang filename mark wrap controls>` › `<pre><code>` | `div.sem-code[data-lang][data-filename][data-mark][data-controls]` › `<pre><code>` |
| `<sem-references kind>` / `<sem-reference id href cite>` | `div.sem-references[data-kind]` › `div.sem-reference[id][data-href][data-cite]`; citations are plain `<a href="#id">` |
| `<sem-source label view-as="html\|source">` › any content | `div.sem-source[data-label][data-view-as]` › any content; transparent wrapper, mints nothing |
| `<sem-reader controls outline-depth>` › optional `<nav aria-label="Contents">` | `div.sem-reader[data-controls][data-outline-depth]` › same optional nav; chrome, mints nothing |
| `<sem-md label view-as="rendered\|raw" controls>` › Markdown text | `div.sem-md[data-label][data-view-as][data-controls]` › Markdown text |
| `<sem-table controls sticky>` › `<table>` | `div.sem-table[data-controls][data-sticky]` › authored `<table>` (`<th scope="col">`, `td[data-value]` sort keys) |

Rules the alias inherits unchanged: a `data-*` parameter wins over a bare
one on the same element (§2); the hide rules, tier markers and events are
identical (§4); extraction yields the **same records** from either form
(`spec/extraction.md`, the cross-form equality test in
`test/e2e/sem-source.cy.js`). Reference class-form documents:
`web/demo/index.html`, `web/demo/reading.html`.
