/*
 * Extra authored examples per tag: the view modes and variants a tag's
 * reference page shows alongside its primary example — a `sem-note`
 * variant per `variant` value, a `sem-facts` example per `view-as` mode,
 * a `sem-details` occluded/open pair, and so on.
 *
 * This file is the extension point the per-tag reviewers fill: add one
 * entry per variant; the element page renders each in its own viewer under
 * the primary example, in array order, with the label in the viewer chrome
 * and a stable `#example-<id>` anchor.
 *
 * A variant whose example IS the tag's primary example is not rendered
 * twice: the page drops it in favour of the primary figure (which of the
 * pair is primary is the generator's choice). Carry pairs like
 * <highlight>'s plain+quiz whole, in spec order. The mechanism ships empty — no
 * invented content.
 *
 * `renderable: false` pins a variant to Source-only when the fallback tier
 * does not render that shape; omitted, it inherits the tag family's
 * default. Markdown-authored variants are out of scope here — the sem-md
 * Render path is per-block and only the primary sem-md example carries a
 * pre-rendered HTML half.
 */

export interface ExampleVariant {
  /** Anchor-safe id, unique within the tag's page (`#example-<id>`). */
  id: string;
  /** Variant label, shown above the viewer (e.g. "variant: warning"). */
  label: string;
  /** Optional one-line note under the label. */
  note?: string;
  /** The authored example (SemText/HTML, source view + optional Render). */
  code: string;
  /** Pin to Source-only when the fallback tier does not render this shape. */
  renderable?: boolean;
}

export const EXAMPLE_VARIANTS: Record<string, ExampleVariant[]> = {
  "sem-audiences": [
    {
      id: "qualifier",
      label: "variant: audience qualifier on content",
      note: "Both halves in one document. The active profile is the `sem-audience` hash parameter (`#…&sem-audience=operator`), else the author's default. Fallback running: with no profile the operator note and the shared paragraph carry the native `hidden` and the negated note shows; as operator the note and paragraph show (operator implies reader) and the negated note hides. JS-off everything is visible — and that is also the state this site's Render pane shows today: its pane wiring deliberately excludes the audience handler until the bundle sync, so nothing here carries `hidden` in the screenshot.",
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-note audience="operator">Operators: the token endpoint answers behind the MinIO port-forward — start it before the migration step.</sem-note>\n<sem-note audience="!operator">Everyone except operators: ask an operator to run the migration for you.</sem-note>\n<p data-audience="reader, operator">Shared planning notes for both working profiles.</p>',
    },
    {
      id: "class-form",
      label: "variant: class form",
      note: "The class spelling of the declaration block (conventions Appendix A): `div.sem-audiences` › `div.sem-profile[id][data-label][data-implies]` — parameters read as `data-*` first, then bare. Both spellings render the same muted chip strip.",
      code: '<div class="sem-audiences">\n  <div class="sem-profile" id="reader" data-label="Reader"></div>\n  <div class="sem-profile" id="operator" data-label="Operator" data-implies="reader"></div>\n</div>',
    },
    {
      id: "mixed-spec",
      label: "variant: authoring error — mixed positive and negated terms",
      note: '"operator, !reader" mixes `!` with plain terms: warned once, and the positive terms decide — the negated one is ignored. So with the fallback running this note is hidden when no profile is active (a positive term never matches without one) and shown as `operator` — never as `reader`, because the `!reader` plays no part. As rendered here the note shows: this pane has no audience gating, the same all-visible state as JS-off. Unknown tokens fail a spec open instead — see the next variant.',
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-note audience="operator, !reader">Warned spec: the positive terms decide, the negated one is ignored.</sem-note>',
    },
    {
      id: "unknown-profile",
      label: "variant: unknown profile token",
      note: 'A token no sem-audiences block declares is an authoring error: warned, and the content shows anyway — fail-open, because a typo must never hide content.',
      code: '<sem-note audience="reviewer">No reviewer profile is declared: warned, and shown regardless.</sem-note>',
    },
  ],
  "sem-code": [
    {
      id: "defaults",
      label: "variant: defaults (no lang, filename or mark)",
      note: "With `lang`, `filename` and `mark` all unauthored and `controls` left at its default, the chrome bar still renders but carries a single Copy control — nothing is invented. This is the smallest valid listing.",
      code: '<sem-code><pre><code>npm run build</code></pre></sem-code>',
    },
    {
      id: "long-line",
      label: "variant: a line wider than the pane",
      note: "A single long line with default controls (Copy only). The listing overflows horizontally, so the `<pre>` becomes keyboard-scrollable (`tabindex=\"0\"`, labelled with the filename or `code`). This is the case `controls=\"copy,wrap\"` exists to soften.",
      code: '<sem-code lang="sh">\n<pre><code>curl -sS -X POST "$TOKEN_ENDPOINT" -d grant_type=refresh_token -d refresh_token="$REFRESH" -d client_id="$CLIENT_ID" -d code_verifier="$VERIFIER" -H \'Accept: application/json\' | jq -r \'.access_token\'</code></pre>\n</sem-code>',
    },
    {
      id: "wrap-start",
      label: "variant: wrap from the start",
      note: "The `wrap` attribute starts the listing soft-wrapped and the Wrap control renders pressed (`aria-pressed=\"true\"`). Toggling it off removes the attribute and restores horizontal scroll — `wrap` is presentation, never content.",
      code: '<sem-code lang="json" filename="config.json" wrap controls="copy,wrap">\n<pre><code>{ "retry": { "attempts": 5, "backoffMs": 250, "jitter": true }, "endpoint": "https://api.example.com/v1/rotate" }</code></pre>\n</sem-code>',
    },
    {
      id: "class-form",
      label: "variant: class-form alias",
      note: "The alias spelling (conventions Appendix A): `div.sem-code` reads the same parameters as `data-*` first, then bare. It renders one chrome and the marked line identically to the element form — both forms are one runtime.",
      code: '<div class="sem-code" data-lang="py" data-filename="rotate.py" data-mark="2" data-controls="copy,wrap">\n<pre><code>def rotate(pair):\n    return mint(pair.refresh)</code></pre>\n</div>',
    },
    {
      id: "author-markup",
      label: "variant: author-side markup in <code>",
      note: "When the `<code>` already holds element children the listing is left exactly as authored — only the chrome is added. Line spans and `<mark>` are never generated over author-side highlighting, so the markup the author wrote survives verbatim.",
      code: '<sem-code lang="ts" filename="highlighted.ts" controls="copy">\n<pre><code><span class="tok-kw">const</span> next = <span class="tok-fn">mint</span>();</code></pre>\n</sem-code>',
    },
  ],
  "sem-data-source": [
    {
      id: "format-csv",
      label: 'variant: data-format="csv"',
      note: "An RFC 4180 payload: quoted fields, `\"\"` escapes, embedded commas and newlines, CRLF. The first record is the header; ragged rows pad with empty cells and drop extras. The table renders with the same caption, typed sort and schema JSON as the default `table` form.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Service ports" data-format="csv">\n    svc,port,ready\n    gateway,443,true\n    search,7700,true\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "format-csv-noheader",
      label: 'variant: data-format="csv" data-header="false"',
      note: "`data-header=\"false\"` (csv only): the first row is data and headers synthesize `col-<n>` — the payload below gains a third row and columns named col-1…col-3. Default is `true`.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Ad-hoc extract" data-format="csv" data-header="false">\n    access,200,15 min\n    id,1000,1 hour\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "format-yaml",
      label: 'variant: data-format="yaml"',
      note: "The YAML subset (block mappings and sequences, comments, quoted scalars, flow sequences of scalars) — a row payload must be a sequence of mappings; columns are the key union in first-seen order. Flow mappings, anchors, tags and block scalars reject with a clear error naming the construct.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Service ports" data-format="yaml">\n    - svc: gateway\n      port: 443\n      ready: true\n    - svc: search\n      port: 7700\n      ready: false\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "format-json",
      label: 'variant: data-format="json" with data-path',
      note: "A JSON array of objects is rows; with `data-path=\"data.items\"` the tier first descends the dot/bracket path (`rows[2].entries` indexes too) into the nested response. An unknown path or out-of-range index is a clear error, never a silent blank.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Services (API shape)" data-format="json" data-path="data.items">\n    {\n      "status": "ok",\n      "data": {\n        "items": [\n          { "svc": "gateway", "port": 443, "ready": true },\n          { "svc": "search", "port": 7700, "ready": false }\n        ]\n      }\n    }\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "format-sql",
      label: 'variant: data-format="sql" (result-shape declaration)',
      note: "A `sql` payload is not a result — it declares the shape of one: the projection column names, so the bucket exists for queries and joins before any rows do. The table renders headers-only by design; a non-SELECT statement rejects, and `SELECT *` mirrors the FROM bucket\'s columns when one is declared in the same container.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Services" data-format="sql">\n    SELECT name, port FROM services WHERE ready = true ORDER BY port LIMIT 5\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "rows-declaration",
      label: 'variant: data-type="rows" with data-columns',
      note: "The structure declaration `rows` pins columns with `data-columns=\"name[:type][?]\"` (`?` = nullable). Declared types override per-column inference — `metrics` has an empty `ready` cell, so `ready:boolean?` pins what inference would guess; columns the declaration omits keep their inferred type.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Service ports" data-format="csv" data-type="rows" data-columns="name:string, port:integer, ready:boolean?">\n    name,port,ready\n    gateway,443,true\n    metrics,9090,\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "yaml-schema",
      label: 'variant: data-type="yaml-schema"',
      note: "A `yaml-schema` payload is an OpenAPI-style document: `schema:` declares the row (nested `properties:` flatten to dotted column paths — endpoint.host, endpoint.port), `data:` carries the records. A required property missing from a record warns and leaves the cell null.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Endpoints" data-format="yaml" data-type="yaml-schema">\n    schema:\n      type: array\n      items:\n        type: object\n        properties:\n          svc:\n            type: string\n          endpoint:\n            type: object\n            properties:\n              host:\n                type: string\n              port:\n                type: integer\n    data:\n      - svc: gateway\n        endpoint:\n          host: edge.noizu.com\n          port: 443\n      - svc: search\n        endpoint:\n          host: query.noizu.com\n          port: 7700\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "view-core-default",
      label: 'variant: data-view="core" (named view on first paint)',
      note: "Same payload as the primary, defaulting to the `core` view instead of `all`: only the Token and Max uses columns paint, and every column stays in the DOM with the native `hidden` on excluded cells. Two declared views render the `aria-pressed` button group above the table — pressing All reveals the rest.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Token lifetimes" data-views="core=token,max-uses; all=*" data-view="core">\n    | Token | Max uses | Lifetime | Rotates | Since      |\n    | :---- | -------: | :------- | :------ | :--------- |\n    | access | 200     | 15 min   | true    | 2026-01-05 |\n    | id     | 1000    | 1 hour   | false   | 2026-02-14 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "class-form",
      label: "variant: class-form alias",
      note: "The alias spelling (conventions Appendix A): `div.sem-data-visualizer` wrapping `div.sem-data-source` reads the same parameters (`data-*` first, then bare). Every selector is `:is(tag, .tag)`, so both spellings render the identical bordered table box.",
      code: '<div class="sem-data-visualizer">\n  <div class="sem-data-source" data-name="Token lifetimes" data-format="csv">\n    token,rotate\n    access,true\n    id,false\n  </div>\n</div>',
    },
    {
      id: "source-file-load",
      label: "variant: file/API source (empty body + source)",
      note: 'An empty body plus `source` is the file/API form: the enhance renders a `role="status"` pending region, fetches (one fetch per URL per page load unless `data-cache="no"`), resolves the format (explicit `data-format` wins, then file extension, then sniffing) and renders the table — or a `role="alert"` error naming the cause (fetch failure, non-2xx, parse, CORS). `javascript:`/`data:`/`blob:` schemes are refused; a `file://` document refuses to fetch. Kept Source-only: this deployment serves no /data/tokens.csv, and a 404 would stand in for the success path.',
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Token lifetimes" source="/data/tokens.csv" data-format="csv" data-views="core=token,max-uses; all=*" data-view="all"></sem-data-source>\n</sem-data-visualizer>',
      renderable: false,
    },
    {
      id: "error-inline-plus-source",
      label: "variant: authoring error — inline payload with source",
      note: 'A non-empty body together with `source` is an authoring error and renders a clear `role="alert"` error naming the conflict ("an inline payload and source=… are mutually exclusive — keep one") — never silently resolved. An unknown `data-format` is a clear inline error the same way, never a silent blank.',
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="Token lifetimes" source="/data/tokens.csv">\n    | Token | Lifetime |\n    | :---- | :------- |\n    | access | 15 min  |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
  ],
  "highlight": [
    {
      id: "plain",
      label: "Plain reading (default) \u2014 emphasized, fully legible",
      note: "The same <sem-details> prose in the view-as mode the schema states as the default \u2014 the <highlight> is emphasized and fully legible, nothing occluded. Shown as its own figure: which of the pair the generator presents as the primary example is the schema file's choice.",
      code: "<sem-details id=\"oidc-docs\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
    {
      id: "quiz",
      label: "Quiz view \u2014 occluded, reveals per item",
      note: "The same <sem-details> prose in the view-as mode the schema states as the self-check view \u2014 each <highlight> is occluded and revealed per item. Shown as its own figure: which of the pair the generator presents as the primary example is the schema file's choice.",
      code: "<sem-details id=\"oidc-details\" view-as=\"quiz\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
  ],
  "sem-detail": [
    {
      id: "plain",
      label: "Plain reading (default) — the passage, fully legible",
      note: "One <sem-detail> passage in its container with `view-as` omitted. The prose is identical to the quiz figure's — the <highlight> targets stay emphasized and readable, nothing is occluded. Shown as its own figure: which of the pair the generator presents as the primary example is the schema file's choice.",
      code: "<sem-details id=\"oidc-docs\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
    {
      id: "quiz",
      label: "Quiz view — same passage, targets occluded",
      note: "The same passage under the container's `view-as=\"quiz\"`: each <highlight> becomes an occluded chip, keyboard-reachable (role=button), revealed per item on click or Enter/Space. Revealing changes nothing about the passage's content.",
      code: "<sem-details id=\"oidc-details\" view-as=\"quiz\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
    {
      id: "multi-passage",
      label: "variant: two passages in one container",
      note: "The item role of <sem-detail>: a <sem-details> container holds one or more passages, each an independent prose unit with its own <highlight> targets (plain view shown). The passage itself is never a control — reveals happen on its chips.",
      code: "<sem-details id=\"rotate-docs\">\n  <sem-detail>\n    Access tokens expire after\n    <highlight>15 minutes</highlight>; the client mints a new one from the refresh grant.\n  </sem-detail>\n  <sem-detail>\n    Refresh tokens <highlight>never reach the browser</highlight> — they live in the server-side session.\n  </sem-detail>\n</sem-details>",
    },
  ],
  "sem-fact": [
    {
      id: "list",
      label: "view-as omitted — list (default): every fact readable, no chrome",
      note: "`<sem-fact>` is the atomic unit; a container stacks its facts in document order with `view-as` omitted. Each fact shows its `<statement>` (the claim) then its `<conclusion>` (the assertion the claim resolves to). Nothing is interactive and no chrome is added, so the default view reads as an ordinary document.",
      code: "<sem-facts id=\"token-facts\">\n  <sem-fact id=\"f-rotate\">\n    <statement>Refresh tokens rotate on every use</statement>\n    <conclusion>Each exchange retires the presented token; a replayed one is rejected.</conclusion>\n  </sem-fact>\n  <sem-fact id=\"f-scope\">\n    <statement>Scope is the durable control, not token lifetime</statement>\n    <conclusion>Tight scopes outlive short expiries; extending an expiry only widens the blast radius.</conclusion>\n  </sem-fact>\n</sem-facts>",
    },
    {
      id: "flashcards",
      label: "view-as=\"flashcards\" — one fact at a time, the flip reveals its conclusion",
      note: "The same pair as a self-test card. Only the current `<sem-fact>` shows: front is the statement, back is the conclusion, revealed by a click (the flip). Prev/next walk the deck and wrap; the meter reports position only, e.g. `2/2`. Not part of the fact's stored data — `view-as` is display-only, and every fact extracts the same pair.",
      code: "<sem-facts id=\"oauth-facts\" view-as=\"flashcards\">\n  <sem-fact id=\"f-device\">\n    <statement>OAuth device flow targets input-constrained devices</statement>\n    <conclusion>TVs, consoles and CLIs poll the token endpoint with a device code.</conclusion>\n  </sem-fact>\n  <sem-fact id=\"f-pkce\">\n    <statement>PKCE binds the authorization code to the client</statement>\n    <conclusion>The code exchange proves possession of the verifier, so a stolen code is inert.</conclusion>\n  </sem-fact>\n</sem-facts>",
    },
    {
      id: "quiz",
      label: "view-as=\"quiz\" — the fact as a scored question, conclusion as the answer",
      note: "Quiz turns each fact into one answerable question: the statement is the prompt, the `<conclusion>` is the correct option, and the `<incorrect-statement>` children are the decoys. One pick per question; the meter then reports position and score, e.g. `1/1 · score 1/1`. With no `<incorrect-statement>`, sibling conclusions fill the decoy slots.",
      code: "<sem-facts id=\"quiz-facts\" view-as=\"quiz\">\n  <sem-fact id=\"f-header\">\n    <statement>The OIDC token travels in which header?</statement>\n    <conclusion>Authorization</conclusion>\n    <incorrect-statement>Cookie</incorrect-statement>\n    <incorrect-statement>X-Auth-Token</incorrect-statement>\n  </sem-fact>\n</sem-facts>",
    },
  ],
  "sem-details": [
    {
      id: "plain",
      label: "view-as omitted — plain reading, highlights emphasized",
      note: "The container's default view: the prose reads whole, each `<highlight>` emphasized with an accent tint and fully legible — nothing occluded. `view-as` omitted IS `plain`; the attribute selects only the interaction model, never the words. Shown as its own figure: which of the pair the generator presents as the primary example is the schema file's choice.",
      code: "<sem-details id=\"oidc-docs\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
    {
      id: "quiz",
      label: 'view-as="quiz" — each highlight occluded, revealed per item',
      note: "The same prose under `view-as=\"quiz\"`: every `<highlight>` becomes a keyboard-reachable occluded chip (`role=\"button\"`, `aria-label=\"reveal\"`) — click or Enter/Space reveals that one target and leaves its siblings occluded. Prose identical to plain; the attribute is display-only.",
      code: "<sem-details id=\"oidc-details\" view-as=\"quiz\">\n  <sem-detail>\n    The OIDC token travels in the\n    <highlight>Authorization</highlight> header.\n  </sem-detail>\n</sem-details>",
    },
    {
      id: "class-form",
      label: "variant: class-form alias",
      note: "The class spelling of the container (conventions Appendix A): `div.sem-details[data-view-as=\"quiz\"]` › `div.sem-detail` › `span.sem-highlight`. Parameters read as `data-*`; the same occlusion and per-item reveal apply.",
      code: '<div class="sem-details" data-view-as="quiz">\n  <div class="sem-detail">\n    The OIDC token travels in the\n    <span class="sem-highlight">Authorization</span> header.\n  </div>\n</div>',
    },
  ],
  "npl-agent": [
    {
      id: "no-extends",
      label: "variant: no parent agent",
      note: "With `extends` unauthored the header omits the parent part — the source form's header carries no parent field either.",
      code: '<npl-agent name="coder" type="coder" version="1.0">\nImplements the assigned task in the named worktree and reports the diff.\n</npl-agent>',
    },
  ],
  "npl-declaration": [
    {
      id: "extension",
      label: 'variant: type="extension"',
      note: "An extension spells the extend mark and names the vocabulary it extends — the banner mark switches to ⌜extend:NPL@…⌝ and the target renders beside it.",
      code: '<npl-declaration version="0.6" type="extension" extend-target="npl-core">This extension adds the session-ledger contract on top of npl-core.</npl-declaration>',
    },
  ],
  "npl-directive": [
    {
      id: "prefix",
      label: 'variant: kind="prefix"',
      note: "The prefix form of the source grammar — the ➤ arrow renders between glyph and instruction.",
      code: '<npl-directive glyph="⚡" kind="prefix">cite sources</npl-directive>',
    },
    {
      id: "minimal",
      label: "variant: minimal",
      note: "Glyph and instruction only — no qualifier, no elaboration.",
      code: '<npl-directive glyph="🔒">never print secret values</npl-directive>',
    },
  ],
  "npl-mindread": [
    {
      id: "no-confidence",
      label: "variant: confidence absent",
      note: "With no confidence authored the meter is not fabricated — the reading renders as its labelled sections only, and unauthored inferred fields simply do not appear.",
      code: '<npl-mindread>\n  <subject>Collaborator — Dana</subject>\n  <signals><signal type="omission">No deadline given; skipped the usual scope note.</signal></signals>\n  <inferred>\n    <motive>Wants the shape agreed before effort is committed.</motive>\n    <unspoken>Whether this is worth their quarter.</unspoken>\n  </inferred>\n  <adaptation>Sketch the data shape on one screen; ask for sign-off before building.</adaptation>\n</npl-mindread>',
    },
    {
      id: "confidence-clamped",
      label: 'variant: confidence="1.4" (out of range)',
      note: "Values outside 0..1 are clamped for display; the meter carries the authored value verbatim and the host is marked with `data-confidence-out-of-range`.",
      code: '<npl-mindread confidence="1.4">\n  <subject>Agent — reviewer</subject>\n  <signals><signal type="pattern">Every note cites a line number.</signal></signals>\n  <inferred>\n    <motive>Concrete fixes, not general advice.</motive>\n  </inferred>\n  <adaptation>Reply per line item with the changed diff.</adaptation>\n</npl-mindread>',
    },
    {
      id: "signal-unknown",
      label: 'variant: unknown signal type',
      note: 'A type outside the vocabulary (tone | pattern | omission | context | contradiction | expertise) keeps its chip, marked unknown — shown, never dropped.',
      code: '<npl-mindread confidence="0.6">\n  <subject>User</subject>\n  <signals>\n    <signal type="tone">Three follow-ups in one message.</signal>\n    <signal type="urgency">"before standup" — a type outside the vocabulary.</signal>\n  </signals>\n  <inferred>\n    <mood>Anxious about the slot, not the work</mood>\n    <cognitive>Time-boxed — what fits before 9:30.</cognitive>\n  </inferred>\n  <adaptation>Lead with the one line they need for standup; detail after.</adaptation>\n</npl-mindread>',
    },
  ],
  "npl-mode": [
    {
      id: "default",
      label: "variant: default (no primary mark)",
      note: "Without `primary` the same chips render unmarked — the declaration lists an agent's lenses; `primary` flags the lens set the agent leads with. Class-form authors spell the mark `data-primary` (`<npl-mode data-primary>` renders identically).",
      code: '<npl-mode>\n  <mode type="planner"></mode>\n  <mode type="executing"></mode>\n  <mode type="reviewing"></mode>\n</npl-mode>',
    },
  ],
  "npl-poa": [
    {
      id: "td",
      label: 'variant: direction="td"',
      note: "The top-down flow — the fence's own `graph TD` line stays the renderer's source of truth; `direction` declares the intended flow and mirrors to `data-direction`.",
      code: '<npl-poa direction="td">\n  <pre><code class="language-mermaid">graph TD\n  A{Decision} -->|"70%"| B[Path B]\n  A -->|"30%"| C[Path C]</code></pre>\n  <reasoning>\n    A --[70%]--> B: highest expected value\n    A --[30%]--> C: fallback if B is blocked\n  </reasoning>\n  <selected>Path B — 70% weight; highest expected value.</selected>\n</npl-poa>',
    },
  ],
  "npl-example": [
    {
      id: "default-label",
      label: "variant: default label",
      note: "With no label authored, the resolved label is the tag name — the default renders the same generated label element first, then the authored children untouched.",
      code: "<npl-example>authored children ride with the default label</npl-example>",
    },
  ],
  "npl-flag": [
    {
      id: "freq-in-range",
      label: 'variant: name contains "freq"',
      note: "A name containing freq checks the value against [0.0, 1.0]; 0.25 is in range, so the value span renders clean.",
      code: '<npl-flag name="tick_frequency" value="0.25"></npl-flag>',
    },
    {
      id: "factor-out-of-range",
      label: "variant: out-of-range value",
      note: "factor checks [-10, 10] — 42 is out of range. This is not an error: the value renders verbatim with the npl-flag-invalid warning class and stays fully readable.",
      code: '<npl-flag name="calm_factor" value="42"></npl-flag>',
    },
    {
      id: "threshold-unbounded",
      label: 'variant: name contains "threshold"',
      note: "A threshold must be numeric but is unbounded — any number renders clean, only non-numeric values are marked invalid.",
      code: '<npl-flag name="panic_threshold" value="999"></npl-flag>',
    },
    {
      id: "free-form",
      label: "variant: free-form name (never validated)",
      note: "No freq/factor/threshold in the name — pump switches and meta flags take any value verbatim, with no range check.",
      code: '<npl-flag name="pump_switch" value="on"></npl-flag>',
    },
    {
      id: "data-alias",
      label: "variant: data-* alias spelling",
      note: "The class/dual form of the contract: data-name and data-value are the same parameters, and the data-* spelling wins when both are authored.",
      code: '<npl-flag data-name="calm_factor" data-value="0.5"></npl-flag>',
    },
    {
      id: "in-container",
      label: "variant: inside npl-flags",
      note: "The usual context — flags as children of a preset-flagged npl-flags container, with note text beside them. Each flag stays individually click-to-apply.",
      code: '<npl-flags preset="production">\n  <npl-flag name="calm_factor" value="0.5"></npl-flag>\n  <npl-flag name="tick_frequency" value="0.25"></npl-flag>\n  Tuning for long-running sessions; apply per flag as the run proceeds.\n</npl-flags>',
    },
  ],
  "npl-flags": [
    {
      id: "preset-tireless",
      label: 'variant: preset="tireless"',
      note: "Another preset value — the badge always renders the resolved preset as preset:<name> ahead of the authored flags.",
      code: '<npl-flags preset="tireless">\n  <npl-flag name="max_iterations" value="25"></npl-flag>\n  Run until the budget is spent, not until the task looks finished.\n</npl-flags>',
    },
    {
      id: "source-spelling",
      label: 'variant: preset="preset:minimal"',
      note: "The NPL flag source spells presets preset:<name>; the attribute accepts that spelling and normalizes it for display.",
      code: '<npl-flags preset="preset:minimal">\n  <npl-flag name="verbosity" value="low"></npl-flag>\n</npl-flags>',
    },
    {
      id: "unknown-preset",
      label: 'variant: preset="turbo"',
      note: "An unknown preset is not an error — the author-facing channel warns and the badge renders with the npl-flags-preset-invalid warning class.",
      code: '<npl-flags preset="turbo">\n  <npl-flag name="boost" value="on"></npl-flag>\n  Unknown preset — the badge falls back to the invalid form.\n</npl-flags>',
    },
    {
      id: "no-preset",
      label: "variant: no preset",
      note: "With no preset authored the container renders no badge — just the authored flags and note text.",
      code: '<npl-flags>\n  <npl-flag name="pump_switch" value="on"></npl-flag>\n  No preset: the flags stand on their own.\n</npl-flags>',
    },
  ],
  "npl-hormones": [
    {
      id: "bars",
      label: 'variant: variant="bars"',
      note: "The compact form — rows only, no state or triggered lines. Renderable: the element upgrades from the npl runtime, not the fallback tier.",
      renderable: true,
      code: '<npl-hormones variant="bars">\n  <panel>\n    <h name="Momentum"     symbol="MTM" value="6"   delta="+2" trigger="Tests passed first try"></h>\n    <h name="Tension"      symbol="TNS" value="3"   delta="0"  trigger="Complexity"></h>\n    <h name="Restlessness" symbol="RST" value="8.5" delta="-1" trigger="Strategy failed"></h>\n  </panel>\n</npl-hormones>',
    },
    {
      id: "alert",
      label: 'variant: variant="alert"',
      note: "Alerts only — each authored alert renders as a threshold card; rows, state and triggered lines are omitted.",
      renderable: true,
      code: '<npl-hormones variant="alert">\n  <alert hormone="RST" value="8.5" threshold="7" behavior="strategy-switch">\n    Restlessness threshold crossed. Initiating plan-of-action.\n  </alert>\n  <alert hormone="FTG" value="9" threshold="8" behavior="session-handoff">\n    Fatigue threshold crossed. Handing the session off before quality drifts.\n  </alert>\n</npl-hormones>',
    },
    {
      id: "clamped",
      label: "variant: out-of-range values",
      note: 'Values outside [-10, 10] clamp for display and the row is marked data-clamped (dotted underline on the readout); the authored text is mirrored verbatim to data-value. triggered="none" highlights no row.',
      renderable: true,
      code: '<npl-hormones>\n  <panel>\n    <h name="Fatigue" symbol="FTG" value="12"  delta="+1" trigger="Session long"></h>\n    <h name="Tension" symbol="TNS" value="-15" delta="0"  trigger="Complexity"></h>\n  </panel>\n  <state>Long session winding down</state>\n  <triggered>none</triggered>\n</npl-hormones>',
    },
  ],
  "npl-ref": [
    {
      id: "compact",
      label: 'variant: compact',
      note: "One emoji line per section; the authored sections are hidden from the render (kept in the source). The glanceable form for a finished turn.",
      renderable: true,
      code: '<npl-ref variant="compact">\n  <assessment>the approach held; one gap in the eval loop</assessment>\n  <improvements>add a regression harness before the next run</improvements>\n  <validation>checked against three traces</validation>\n  <eval>quality 0.82 vs 0.71 baseline</eval>\n  <fine-tune>retrain on the two rejected traces</fine-tune>\n</npl-ref>',
    },
    {
      id: "class-form",
      label: "variant: class-form sections",
      note: "Sections authored as `.npl-<name>` classes on plain elements — same dual-form contract as the tag spelling; the upgrade labels both identically.",
      renderable: true,
      code: '<npl-ref>\n  <div class="npl-assessment">held up under review; the eval loop skipped two failure paths</div>\n  <div class="npl-improvements">add the failure-path fixtures to the regression harness</div>\n  <div class="npl-eval">quality 0.82 vs 0.71 baseline</div>\n</npl-ref>',
    },
  ],
  "npl-rubric": [
    {
      id: "computed",
      label: "variant: computed overall",
      note: "With no overall-score child the component computes the weighted average — sum(weight · score) ÷ sum(weight) — and marks the figure (computed).",
      code: '<npl-rubric title="Deployment readiness">\n  <npl-criterion name="Rollback plan" weight="2" score="5"></npl-criterion>\n  <npl-criterion name="Alerting" weight="1" score="4"></npl-criterion>\n  <npl-criterion name="Runbook" weight="1" score="5"></npl-criterion>\n</npl-rubric>',
    },
    {
      id: "excluded",
      label: "variant: excluded criteria",
      note: "A criterion whose weight or score is missing or non-numeric is marked, kept visible, and left out of the average — its empty cell reads as an em dash and a flag sits beside its name.",
      code: '<npl-rubric title="Triage">\n  <npl-criterion name="Impact" weight="2" score="4"></npl-criterion>\n  <npl-criterion name="Confidence" score="5"></npl-criterion>\n  <npl-criterion name="Urgency" weight="high" score="3"></npl-criterion>\n  <npl-criterion name="Cost" weight="1"></npl-criterion>\n</npl-rubric>',
    },
    {
      id: "class-form",
      label: 'variant: class-form (data-title)',
      note: "The dual-form spelling: an authored data-title names the caption, and a criterion or the overall-score element may be authored as a block container with its .npl- class alias and data-* parameters.",
      code: '<npl-rubric data-title="Class-form rubric">\n  <div class="npl-criterion" data-name="Correctness" data-weight="3" data-score="4"></div>\n  <div class="npl-criterion" data-name="Clarity" data-weight="1" data-score="5"></div>\n  <div class="npl-overall-score" data-value="4.25"></div>\n</npl-rubric>',
    },
    {
      id: "overall-only",
      label: "variant: overall without criteria",
      note: "A rubric with no criteria still renders — the caption and the stated overall figure stand on their own.",
      code: '<npl-rubric title="Sign-off">\n  <npl-overall-score value="4.6"></npl-overall-score>\n</npl-rubric>',
    },
  ],
  "npl-section": [
    {
      id: "alg",
      label: 'variant: type="alg"',
      note: "The generated header reads Algorithm — same chrome as every known type; only the label and the derived `npl-section-alg` host class differ.",
      code: '<npl-section type="alg">\n  <ol>\n    <li>Resolve the type in either spelling.</li>\n    <li>Insert the labelled header as the first child.</li>\n  </ol>\n</npl-section>',
    },
    {
      id: "alg-pseudo",
      label: 'variant: type="alg-pseudo"',
      note: "The Pseudocode label; the body prose is never rewritten.",
      code: '<npl-section type="alg-pseudo">\n  <p>for each authored section:\n  <p>resolve the type, then insert the labelled header</p>\n</npl-section>',
    },
    {
      id: "diagram",
      label: 'variant: type="diagram"',
      note: "The Diagram label; diagrams stay authored content — the component never draws.",
      code: '<npl-section type="diagram">\n  <pre>header ─┬─ label\n         └─ body (untouched)</pre>\n</npl-section>',
    },
    {
      id: "example",
      label: 'variant: type="example"',
      note: "The Example header.",
      code: '<npl-section type="example">\n  <p>A worked case authored in the body; the header names it without restating it.</p>\n</npl-section>',
    },
    {
      id: "format",
      label: 'variant: type="format"',
      note: "The Format label.",
      code: '<npl-section type="format">\n  <p>Header: generated. Body: authored HTML, untouched.</p>\n</npl-section>',
    },
    {
      id: "logic",
      label: 'variant: type="logic"',
      note: "The Logic label.",
      code: '<npl-section type="logic">\n  <p>known(type) → header + derived class\n  <p>unknown(type) → warning class, no header</p>\n</npl-section>',
    },
    {
      id: "note",
      label: 'variant: type="note"',
      note: "A known type that stays a plain labelled section — callout behaviour (collapse, role, variant) belongs to sem-note and is not duplicated here.",
      code: '<npl-section type="note">\n  Renders as a plain labelled section; nothing hides and nothing collapses.\n</npl-section>',
    },
    {
      id: "syntax",
      label: 'variant: type="syntax"',
      note: "The Syntax label — code bodies stay copyable text beneath the label.",
      code: '<npl-section type="syntax">\n  <pre><code>section := "&lt;npl-section" type "&gt;" body "&lt;/npl-section&gt;"</code></pre>\n</npl-section>',
    },
    {
      id: "template",
      label: 'variant: type="template"',
      note: "The Template label.",
      code: '<npl-section type="template">\n  &lt;npl-section type="<em>known-type</em>"&gt;…body…&lt;/npl-section&gt;\n</npl-section>',
    },
    {
      id: "unknown-type",
      label: "variant: unknown type",
      note: "An unknown value is never fatal: no header renders, `npl-section-warning` lands on the host, the body reads as plain prose, and one author-facing console warning names the value.",
      code: '<npl-section type="mnemonic">\n  Content renders plain — the unknown value affects only chrome and the console warning.\n</npl-section>',
    },
    {
      id: "class-form",
      label: "variant: class-form (data-type)",
      note: "The dual-form spelling: `.npl-section` plus `data-type` resolves like the element form, and `data-type` wins when both spellings are authored.",
      code: '<div class="npl-section" data-type="logic">\n  The class-form spelling resolves identically to the element form.\n</div>',
    },
  ],
  "npl-thought": [
    {
      id: "classification",
      label: "variant: the canonical classified thought",
      note: "One container per thought-set; each typed child names its own type and applies its own `.npl-thought-<type>` class, so a theme tells observation from question from relation without inventing structure.",
      code: '<npl-thought id="t1">\n  <npl-thought type="observation">Cache misses cluster on Mondays, right after the weekly fleet redeploy.</npl-thought>\n  <npl-thought type="question">Is the redeploy flushing the warm set, or is it the Monday traffic spike?</npl-thought>\n  <npl-thought type="relation">The spike lines up with the 09:00 Europe log-in surge.</npl-thought>\n</npl-thought>',
    },
    {
      id: "unknown-type",
      label: "variant: unknown type degrades to plain text",
      note: "An unknown value is never fatal and never rendered as structure: the warning class `npl-thought-unknown` lands on the child and its content is flattened to plain text.",
      code: '<npl-thought>\n  <npl-thought type="observation">The retry budget held at 4% this week.</npl-thought>\n  <npl-thought type="balloon">An unknown type: this child degrades to plain text.</npl-thought>\n</npl-thought>',
    },
    {
      id: "sub-container",
      label: "variant: no type — a nested sub-container",
      note: "A child with no `type` is a sub-container: nothing is applied to it and its own children survive — grouping is expressed by nesting, not by a type.",
      code: '<npl-thought>\n  <npl-thought type="concern">Two regions report stale reads.</npl-thought>\n  <npl-thought>\n    <npl-thought type="observation">us-east-1 read lag 40 ms.</npl-thought>\n    <npl-thought type="observation">eu-west-1 read lag 12 ms.</npl-thought>\n  </npl-thought>\n</npl-thought>',
    },
    {
      id: "class-form",
      label: "variant: class-form (data-type)",
      note: "The dual-form spelling: `.npl-thought` plus `data-type` resolves like the element form, and `data-type` wins when both spellings are authored.",
      code: '<div class="npl-thought">\n  <div class="npl-thought" data-type="affirmation">Rebuild in place — the migration is additive and reversible.</div>\n</div>',
    },
  ],
  "sem-chronology": [
    {
      id: "view-list",
      label: 'variant: view-as="list"',
      note: "The list mode: no rail, events stack as plain rows and the date label sits inline with the prose. All four `status` values in one changelog — `todo` is the dashed marker; colour never carries the meaning alone.",
      code: '<sem-chronology kind="changelog" view-as="list" role="list">\n  <sem-event role="listitem" when="2026-02-11" status="done"><time datetime="2026-02-11">11 Feb 2026</time> Export pipeline lands.</sem-event>\n  <sem-event role="listitem" when="2026-05-04" status="done"><time datetime="2026-05-04">4 May 2026</time> Quiz-occlusion reveal ships.</sem-event>\n  <sem-event role="listitem" when="2026-08" status="blocked"><time datetime="2026-08">Aug 2026</time> Offline pack — blocked on the storage budget.</sem-event>\n  <sem-event role="listitem" when="2026-09" status="current"><time datetime="2026-09">Sep 2026</time> Reading-experience overhaul.</sem-event>\n  <sem-event role="listitem" when="2026-11" status="todo"><time datetime="2026-11">Nov 2026</time> Theme marketplace.</sem-event>\n</sem-chronology>',
    },
    {
      id: "bare-when",
      label: "variant: bare when/until — no <time>",
      note: "With no `<time>` authored the CSS renders `when` — plus ` – until` for a period — as the date label via `attr()`; `view-as` omitted means the default `timeline`.",
      code: '<sem-chronology kind="roadmap" role="list">\n  <sem-event role="listitem" when="2026-Q1" until="2026-Q2" status="done">Lit vocabulary consolidated.</sem-event>\n  <sem-event role="listitem" when="2026-Q3" status="current">Docs-overhaul waves.</sem-event>\n  <sem-event role="listitem" when="2026-Q4">Theme pipeline.</sem-event>\n</sem-chronology>',
    },
    {
      id: "class-form",
      label: "variant: class form (div.sem-chronology)",
      note: "Conventions Appendix A: the same contract authored as `div.sem-*` classes with `data-*` parameters — the CSS keys on both spellings and renders identically. The third event deliberately mixes `data-when` with a bare `until`: the period must still read as one range.",
      code: '<div class="sem-chronology" data-kind="incident-log" data-view-as="timeline" role="list">\n  <div class="sem-event" role="listitem" data-when="2026-08-14T09:12Z" data-status="blocked"><time datetime="2026-08-14T09:12Z">14 Aug 09:12</time> Queue drain stalls on the shard rebalance.</div>\n  <div class="sem-event" role="listitem" data-when="2026-08-14T11:40Z" data-status="done"><time datetime="2026-08-14T11:40Z">14 Aug 11:40</time> Rebalance clears; the backlog drains.</div>\n  <div class="sem-event" role="listitem" data-when="2026-08-15" until="2026-08-16" data-status="todo">Post-incident review window.</div>\n</div>',
    },
  ],
  "sem-event": [
    {
      id: "status-vocabulary",
      label: "variant: every status value, in DOM (chronological) order",
      note: "One event per `status` — `done` ✓, `current` →, `blocked` ⛔, `todo` ○ (dashed marker) — plus an unannotated event, which reads neutral and is NOT `todo`: an event records what happened, not what is due. Dates order the list; the vocabulary never sorts.",
      code: '<sem-chronology kind="release-log" view-as="timeline" role="list">\n  <sem-event role="listitem" when="2026-02-03" status="done"><time datetime="2026-02-03">3 Feb 2026</time> Query console ships.</sem-event>\n  <sem-event role="listitem" when="2026-06-22" status="current"><time datetime="2026-06-22">22 Jun 2026</time> Reading-experience overhaul.</sem-event>\n  <sem-event role="listitem" when="2026-07"><time datetime="2026-07">Jul 2026</time> Extraction API stabilised.</sem-event>\n  <sem-event role="listitem" when="2026-08" status="blocked"><time datetime="2026-08">Aug 2026</time> Offline pack — blocked on the storage budget.</sem-event>\n  <sem-event role="listitem" when="2026-11" status="todo"><time datetime="2026-11">Nov 2026</time> Theme marketplace.</sem-event>\n</sem-chronology>',
      renderable: true,
    },
    {
      id: "date-labels",
      label: "variant: where the date label comes from",
      note: "First event: no `<time>` — CSS renders `when` verbatim. Second: a `when`/`until` period with no `<time>` — CSS joins them with an en dash. Third: both authored — the reader sees the `<time>` text, the attribute stays machine-facing.",
      code: '<sem-chronology kind="release-log" role="list">\n  <sem-event role="listitem" when="2026-05-19" status="done">Quiz-occlusion reveal ships.</sem-event>\n  <sem-event role="listitem" when="2026-Q3" until="2026-Q4">Docs-overhaul waves.</sem-event>\n  <sem-event role="listitem" when="2026-11" status="todo"><time datetime="2026-11">Nov 2026</time> Theme marketplace.</sem-event>\n</sem-chronology>',
      renderable: true,
    },
    {
      id: "class-form",
      label: "variant: class form (div.sem-event)",
      note: "Conventions Appendix A: the same contract authored as `div.sem-event` with `data-*` parameters — the CSS keys on both spellings. The second event mixes `data-when` with a bare `until` and carries no `<time>`: the period must still read as one range.",
      code: '<div class="sem-chronology" data-kind="incident-log" role="list">\n  <div class="sem-event" role="listitem" data-when="2026-08-14T09:12Z" data-status="blocked"><time datetime="2026-08-14T09:12Z">14 Aug 09:12</time> Queue drain stalls on the shard rebalance.</div>\n  <div class="sem-event" role="listitem" data-when="2026-08-15" until="2026-08-16" data-status="todo">Post-incident review window.</div>\n</div>',
      renderable: true,
    },
  ],
  "npl-vos": [
    {
      id: "phase-exit",
      label: 'variant: phase="exit"',
      note: "The exit half of the bracket: same five parts, the leading label now reads exit. One component renders one half; author both halves when the vector-of-self brackets a whole response.",
      code: '<npl-vos phase="exit">\n  <p data-vos="id">raw impulse — what the first instinct wanted to do</p>\n  <p data-vos="ego">reality-tested approach — what was actually done and why</p>\n  <p data-vos="mood">🔥 — energized by the profiling work</p>\n  <p data-vos="super-ego">internalized standards — what was upheld here</p>\n</npl-vos>',
    },
    {
      id: "no-phase",
      label: "variant: no phase — the label is absent, never empty",
      note: "With no phase authored the bracket renders the part rows only. No empty phase mark is fabricated, and the element carries no data-phase for the `.npl-vos[data-phase]` alias to match.",
      code: '<npl-vos>\n  <p data-vos="id">raw impulse — what the first instinct wants to do</p>\n  <p data-vos="ego">reality-tested approach — what is actually done and why</p>\n  <p data-vos="collective">system-level observation from outside the persona</p>\n</npl-vos>',
    },
  ],
  "sem-data-query": [
    {
      id: "star-order-desc",
      label: "variant: SELECT * with ORDER BY … DESC",
      note: "The whole-row form — `SELECT *` returns every column in bucket order and `ORDER BY port DESC` sorts the results table descending. No WHERE or LIMIT: both optional clauses are genuinely optional.",
      code: '<sem-data-visualizer id="dv-services">\n  <sem-data-source data-name="services" data-format="table">\n    | name    | port | ready | owner |\n    | :------ | ---: | :---- | :---- |\n    | api     | 8443 | true  | alice |\n    | web     | 8080 | true  |       |\n    | metrics | 9090 | false | bob   |\n  </sem-data-source>\n  <sem-data-query>SELECT * FROM services ORDER BY port DESC</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "where-clauses",
      label: "variant: WHERE with AND and IS NULL",
      note: "Conditions combine with AND / OR (AND binds tighter) and compare against boolean, numeric or string literals. `IS NULL` matches the empty cell, which no `=` comparison ever can.",
      code: '<sem-data-visualizer id="dv-services">\n  <sem-data-source data-name="services" data-format="table">\n    | name    | port | ready | owner |\n    | :------ | ---: | :---- | :---- |\n    | api     | 8443 | true  | alice |\n    | web     | 8080 | true  |       |\n    | metrics | 9090 | false | bob   |\n  </sem-data-source>\n  <sem-data-query>SELECT name, port FROM services WHERE owner IS NULL AND ready = true</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "join-bucket",
      label: "variant: a query over a declarative join bucket",
      note: "The grammar has no JOIN — a `sem-data-join` materializes an extra bucket a query then addresses by name. Here `user-orders` is the inner join of `users` and `orders` on `user-id`: carol (no orders) drops, alice appears twice.",
      code: '<sem-data-visualizer id="dv-orders">\n  <sem-data-source data-name="users" data-format="table">\n    | user-id | name  |\n    | :------ | :---- |\n    | 1       | alice |\n    | 2       | bob   |\n    | 3       | carol |\n  </sem-data-source>\n  <sem-data-source data-name="orders" data-format="table">\n    | user-id | total |\n    | :------ | ----: |\n    | 1       |   120 |\n    | 1       |    80 |\n    | 3       |   200 |\n  </sem-data-source>\n  <sem-data-join name="user-orders" left="users" right="orders" on="user-id"></sem-data-join>\n  <sem-data-query>SELECT name, total FROM user-orders ORDER BY total DESC</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "unknown-bucket",
      label: "variant: authoring error — a bucket that does not resolve",
      note: "A query naming a bucket the visualizer does not declare renders an inline `role=alert` naming the miss; the authored statement is preserved. The same alert appears for an unknown column, a syntax error or a mutating statement.",
      code: '<sem-data-visualizer id="dv-services">\n  <sem-data-source data-name="services" data-format="table">\n    | name | port |\n    | :--- | ---: |\n    | api  | 8443 |\n  </sem-data-source>\n  <sem-data-query>SELECT name FROM hosts</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "class-form",
      label: "variant: class form (div.sem-data-query)",
      note: "Conventions Appendix A: the declaration authored as `div.sem-*` classes with the query as the element's text. The container and source are spelled in class form too; the chrome keys on both spellings.",
      code: '<div class="sem-data-visualizer" id="dv-services">\n  <div class="sem-data-source" data-name="services" data-format="table">\n    | name | port |\n    | :--- | ---: |\n    | api  | 8443 |\n    | web  | 8080 |\n  </div>\n  <div class="sem-data-query">SELECT name, port FROM services ORDER BY port</div>\n</div>',
    },
  ],
  "sem-data-join": [
    {
      id: "declaration-only",
      label: "variant: the bare declaration",
      note: "The element itself, outside a working visualizer. It renders nothing in any tier — a declaration with nothing to read; the joined bucket surfaces only through a sem-data-query results table.",
      code: '<sem-data-join name="user-orders" left="Users" right="Orders" on="user-id">\n</sem-data-join>',
      renderable: false,
    },
    {
      id: "class-form",
      label: "variant: class form",
      note: "The class spelling (conventions Appendix A) inside its working visualizer: parameters read as data-* first, then bare. Like every join it stays invisible — the query renders the result.",
      code: '<sem-data-visualizer id="dv-class-join">\n  <sem-data-source data-name="Users">| user-id | name |\n|---|---|\n| u1 | Ada |\n| u2 | Bao |</sem-data-source>\n  <sem-data-source data-name="Orders">| order | user-id | total |\n|---|---|---|\n| o-101 | u2 | 120 |\n| o-102 | u1 | 80 |</sem-data-source>\n  <div class="sem-data-join" data-name="user-orders" data-left="Users" data-right="Orders" data-on="user-id"></div>\n  <sem-data-query>SELECT name, total FROM user-orders</sem-data-query>\n</sem-data-visualizer>',
      renderable: false,
    },
    {
      id: "column-collision",
      label: "variant: colliding right column is qualified",
      note: "Orders also carries a name column — the product, not the person. The join exposes the right side as orders.name, so SELECT * shows both names side by side. u3 has no orders and drops (inner join).",
      code: '<sem-data-visualizer id="dv-qualified">\n  <sem-data-source data-name="Users">| user-id | name |\n|---|---|\n| u1 | Ada |\n| u2 | Bao |\n| u3 | Cleo |</sem-data-source>\n  <sem-data-source data-name="Orders">| order | user-id | name | total |\n|---|---|---|---|\n| o-101 | u2 | Desk lamp | 120 |\n| o-102 | u1 | Footrest | 80 |</sem-data-source>\n  <sem-data-join name="user-orders" left="Users" right="Orders" on="user-id"></sem-data-join>\n  <sem-data-query>SELECT * FROM user-orders ORDER BY total DESC</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "unknown-bucket",
      label: "variant: authoring error — unknown bucket",
      note: "right names no bucket in the visualizer: the join renders .sem-data-error (role=alert), registers no bucket, and heals on its own when a late file or API source supplies the missing one.",
      code: '<sem-data-visualizer id="dv-unknown">\n  <sem-data-source data-name="Users">| user-id | name |\n|---|---|\n| u1 | Ada |</sem-data-source>\n  <sem-data-join name="user-orders" left="Users" right="Ordres" on="user-id"></sem-data-join>\n</sem-data-visualizer>',
    },
    {
      id: "missing-key",
      label: "variant: authoring error — key column missing",
      note: "on names a column neither bucket declares: the same alert treatment, with the message naming the offending bucket and the key.",
      code: '<sem-data-visualizer id="dv-missing-key">\n  <sem-data-source data-name="Users">| user-id | name |\n|---|---|\n| u1 | Ada |</sem-data-source>\n  <sem-data-source data-name="Orders">| order | user-id | total |\n|---|---|---|\n| o-101 | u1 | 80 |</sem-data-source>\n  <sem-data-join name="user-orders" left="Users" right="Orders" on="account-id"></sem-data-join>\n</sem-data-visualizer>',
    },
    {
      id: "shadowed-name",
      label: "variant: authoring error — join name shadows a source",
      note: "A result bucket must not overwrite a source bucket: name colliding with an existing data-name is an authoring error, never a silent rebind.",
      code: '<sem-data-visualizer id="dv-shadowed">\n  <sem-data-source data-name="Users">| user-id | name |\n|---|---|\n| u1 | Ada |</sem-data-source>\n  <sem-data-join name="Users" left="Users" right="Users" on="user-id"></sem-data-join>\n</sem-data-visualizer>',
    },
  ],
  "sem-data-visualizer": [
    {
      id: "multi-source",
      label: "variant: two buckets, one tools row",
      note: "The container is the enhance unit: each direct `sem-data-source` renders its own captioned table with typed sort, and the container contributes one tools row above them all. With no `sem-data-query` child the buckets render as authored and nothing else is added.",
      code: '<sem-data-visualizer id="dv-fleet">\n  <sem-data-source data-name="services" data-format="table">\n    | name    | port | ready |\n    | :------ | ---: | :---- |\n    | api     | 8443 | true  |\n    | web     | 8080 | true  |\n    | metrics | 9090 | false |\n  </sem-data-source>\n  <sem-data-source data-name="regions" data-format="table">\n    | zone      | latency_ms |\n    | :-------- | ---------: |\n    | eu-west-1 |         24 |\n    | us-east-1 |         81 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "bucket-link-fallback",
      label: "variant: no id — the sole source names the link",
      note: "`id` is optional. With no id the container is still linkable when it has exactly one named source: `Copy link` mints `#bucket=<data-name>` instead of `#dv=<id>`. With two or more sources and no id there is no name to mint, so the `Copy link` button is absent and `Expand` stands alone.",
      code: '<sem-data-visualizer>\n  <sem-data-source data-name="services" data-format="table">\n    | name | port |\n    | :--- | ---: |\n    | api  | 8443 |\n    | web  | 8080 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "query-chrome",
      label: "variant: query chrome + results",
      note: "A `sem-data-query` child turns the container into a query workspace: an editable default query, a `Run` control and a row-count status, with the results table beneath. The declaration stays the document's record of the default query — the chrome is generated around it, never a replacement for it.",
      code: '<sem-data-visualizer id="dv-services">\n  <sem-data-source data-name="services" data-format="table">\n    | name    | port | ready | owner |\n    | :------ | ---: | :---- | :---- |\n    | api     | 8443 | true  | alice |\n    | web     | 8080 | true  |       |\n    | metrics | 9090 | false | bob   |\n  </sem-data-source>\n  <sem-data-query>SELECT * FROM services ORDER BY port DESC</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "join-and-query",
      label: "variant: join bucket + query",
      note: "Shared container state: a `sem-data-join` materializes an extra bucket from two sources and the query then addresses it by name. All three declarations live inside the one container, which is what makes the derived bucket addressable at all.",
      code: '<sem-data-visualizer id="dv-orders">\n  <sem-data-source data-name="users" data-format="table">\n    | user-id | name  |\n    | :------ | :---- |\n    | 1       | alice |\n    | 2       | bob   |\n    | 3       | carol |\n  </sem-data-source>\n  <sem-data-source data-name="orders" data-format="table">\n    | user-id | total |\n    | :------ | ----: |\n    | 1       |   120 |\n    | 1       |    80 |\n    | 3       |   200 |\n  </sem-data-source>\n  <sem-data-join name="user-orders" left="users" right="orders" on="user-id"></sem-data-join>\n  <sem-data-query>SELECT name, total FROM user-orders ORDER BY total DESC</sem-data-query>\n</sem-data-visualizer>',
    },
    {
      id: "deep-link-modal",
      label: "variant: modal viewer (deep link)",
      note: "`Expand` teleports the container's own children into a modal dialog — same enhance output, still live, with Esc and a focus trap. The same state is addressable as a link: `#dv=dv-modal&modal=1` reopens the viewer on load, and `#dv=dv-modal&view=operators` pins a declared view. The Render pane shows the container closed, so this state is captured from the fixture build rather than the pane.",
      renderable: false,
      code: '<sem-data-visualizer id="dv-modal">\n  <sem-data-source data-name="Fleet" data-format="table" data-views="all=*; operators=name, replicas" data-view="all">\n    | name    | region | port | replicas |\n    | :------ | :----- | ---: | -------: |\n    | auth    | eu     | 8080 |        3 |\n    | billing | us     | 8443 |        2 |\n    | pages   | ap     | 3000 |        2 |\n    | search  | eu     | 9200 |        5 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
    {
      id: "class-form",
      label: "variant: class form",
      note: "Conventions Appendix A: the container and its declarations authored as `div.sem-*` classes. Every container selector reads `:is(sem-data-visualizer, .sem-data-visualizer)`, so both spellings wire the same children, tools row and modal.",
      code: '<div class="sem-data-visualizer" id="dv-orders">\n  <div class="sem-data-source" data-name="users" data-format="table">\n    | user-id | name  |\n    | :------ | :---- |\n    | 1       | alice |\n  </div>\n  <div class="sem-data-source" data-name="orders" data-format="table">\n    | user-id | total |\n    | :------ | ----: |\n    | 1       |   120 |\n  </div>\n  <div class="sem-data-query">SELECT * FROM users</div>\n</div>',
    },
    {
      id: "inline-plus-source",
      label: "variant: authoring error — inline payload with source=",
      note: "An inline body and a `source` attribute together are contradictory declarations. The source renders a `role=alert` naming both and keeps its place in the container; the pair is never silently resolved to one or the other.",
      code: '<sem-data-visualizer id="dv-bad">\n  <sem-data-source data-name="broken" data-format="table" source="data/services.csv">\n    | name | port |\n    | :--- | ---: |\n    | api  | 8443 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
  ],
};
