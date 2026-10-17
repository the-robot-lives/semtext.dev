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
 * `renderable: false` pins a variant to Source-only when no shipped runtime
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
  /** Pin to Source-only when no shipped runtime renders this shape. */
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
      id: "mixed-spec",
      label: "variant: authoring error — mixed positive and negated terms",
      note: '"operator, !reader" mixes `!` with plain terms: warned once, and the positive terms decide — the negated one is ignored. So with the bundle running this note is hidden when no profile is active (a positive term never matches without one) and shown as `operator` — never as `reader`, because the `!reader` plays no part. As rendered here the note shows: this pane has no audience gating, the same all-visible state as JS-off. Unknown tokens fail a spec open instead — see the next variant.',
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-note audience="operator, !reader">Warned spec: the positive terms decide, the negated one is ignored.</sem-note>',
    },
    {
      id: "unknown-profile",
      label: "variant: unknown profile token",
      note: 'A token no sem-audiences block declares is an authoring error: warned, and the content shows anyway — fail-open, because a typo must never hide content.',
      code: '<sem-note audience="reviewer">No reviewer profile is declared: warned, and shown regardless.</sem-note>',
    },
  ],
  "sem-profile": [
    {
      id: "id-chip",
      label: "variant: chip without a label",
      note: "A chip carries the profile's `label` when present, else its `id`. The strip is inert on its own: declarations gate nothing — visibility is decided by the `audience` qualifier against the active profile, which `<sem-audiences>` documents. The strip renders from the attributes alone; no script is involved.",
      code: '<sem-audiences>\n  <sem-profile id="operator"></sem-profile>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n</sem-audiences>',
    },
    {
      id: "implies-closure",
      label: "variant: implies closure",
      note: "`implies` is how one profile subsumes another: an operator sees reader content, and a profile implying operator sees it too — the closure is transitive. The strip does not draw the edges; gating demonstrates them. With the bundle running and no active profile this note hides; as operator it shows (operator implies reader); as reader it hides. As rendered here — this pane carries no audience gating, the same all-visible state as JS-off — it shows.",
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-note audience="reader">Planning context every working profile sees through the closure.</sem-note>',
    },
  ],
  "sem-code": [
    {
      id: "defaults",
      label: "variant: defaults (no lang, filename or mark)",
      note: "With `lang`, `filename` and `mark` all unauthored and `controls` left at its default, the chrome bar still renders but carries a single Copy control — nothing is invented. This is the smallest valid listing: the source is the element's own text; the element wraps it in `<pre><code>` when it enhances.",
      code: '<sem-code>npm run build</sem-code>',
    },
    {
      id: "long-line",
      label: "variant: a line wider than the pane",
      note: "A single long line with default controls (Copy only). The listing overflows horizontally, so the `<pre>` becomes keyboard-scrollable (`tabindex=\"0\"`, labelled with the filename or `code`). This is the case `controls=\"copy,wrap\"` exists to soften.",
      code: '<sem-code lang="sh">curl -sS -X POST "$TOKEN_ENDPOINT" -d grant_type=refresh_token -d refresh_token="$REFRESH" -d client_id="$CLIENT_ID" -d code_verifier="$VERIFIER" -H \'Accept: application/json\' | jq -r \'.access_token\'</sem-code>',
    },
    {
      id: "wrap-start",
      label: "variant: wrap from the start",
      note: "The `wrap` attribute starts the listing soft-wrapped and the Wrap control renders pressed (`aria-pressed=\"true\"`). Toggling it off removes the attribute and restores horizontal scroll — `wrap` is presentation, never content.",
      code: '<sem-code lang="json" filename="config.json" wrap controls="copy,wrap">{ "retry": { "attempts": 5, "backoffMs": 250, "jitter": true }, "endpoint": "https://api.example.com/v1/rotate" }</sem-code>',
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
      note: "The compact form — rows only, no state or triggered lines. Renderable: the element upgrades from the npl runtime, not the semtext bundle.",
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
      id: "inline-plus-source",
      label: "variant: authoring error — inline payload with source=",
      note: "An inline body and a `source` attribute together are contradictory declarations. The source renders a `role=alert` naming both and keeps its place in the container; the pair is never silently resolved to one or the other.",
      code: '<sem-data-visualizer id="dv-bad">\n  <sem-data-source data-name="broken" data-format="table" source="data/services.csv">\n    | name | port |\n    | :--- | ---: |\n    | api  | 8443 |\n  </sem-data-source>\n</sem-data-visualizer>',
    },
  ],
  "sem-facts": [
    {
      id: "list",
      label: 'view-as omitted — read mode, every fact open',
      note: "The deck above read as a list: `list` is the default `view-as`, so the attribute is simply absent. Every fact renders in document order with statement AND conclusion visible, and there is no chrome — nothing interactive. The `incorrect-statement` children are quiz decoys, not assertions: hidden once the script drives the document, and with JS off they stay visible, prefixed \"incorrect statement\".",
      code: '<sem-facts id="auth-facts">\n  <sem-fact id="f-rotate">\n    <statement>JWTs rotate per session</statement>\n    <conclusion>Short-lived access tokens; the refresh\n      grant issues a new pair.</conclusion>\n    <incorrect-statement>Store tokens in localStorage.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-expiry">\n    <statement>Access tokens expire after 15 minutes</statement>\n    <conclusion>The client mints a new pair from the refresh\n      grant; the user never re-signs-in mid-session.</conclusion>\n    <incorrect-statement>The user must sign in again every 15\n      minutes.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-secret">\n    <statement>Client secrets never reach the browser</statement>\n    <conclusion>The confidential client holds the secret\n      server-side; the browser only ever sees tokens.</conclusion>\n    <incorrect-statement>Embed the client secret in the SPA\n      bundle.</incorrect-statement>\n  </sem-fact>\n</sem-facts>',
    },
    {
      id: "flashcards",
      label: 'view-as="flashcards" — one card at a time, keyboard-flippable',
      note: "The same three facts as a self-test deck. Only the current card (`.sem-current`) shows: front is the statement, the flip reveals the conclusion. The current card is the deck's single tab stop (`tabindex=\"0\"`, siblings `-1`) and flips on click or Enter/Space — `aria-expanded` tracks the reveal, and the focused card shows a visible focus ring. Prev/next chrome wraps and the meter reports position only, e.g. `2/3`. `view-as` is display-only: every view extracts the same pairs.",
      code: '<sem-facts id="auth-facts" view-as="flashcards">\n  <sem-fact id="f-rotate">\n    <statement>JWTs rotate per session</statement>\n    <conclusion>Short-lived access tokens; the refresh\n      grant issues a new pair.</conclusion>\n    <incorrect-statement>Store tokens in localStorage.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-expiry">\n    <statement>Access tokens expire after 15 minutes</statement>\n    <conclusion>The client mints a new pair from the refresh\n      grant; the user never re-signs-in mid-session.</conclusion>\n    <incorrect-statement>The user must sign in again every 15\n      minutes.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-secret">\n    <statement>Client secrets never reach the browser</statement>\n    <conclusion>The confidential client holds the secret\n      server-side; the browser only ever sees tokens.</conclusion>\n    <incorrect-statement>Embed the client secret in the SPA\n      bundle.</incorrect-statement>\n  </sem-fact>\n</sem-facts>',
    },
    {
      id: "quiz",
      label: 'view-as="quiz" — scored recall',
      note: "The same three facts under `view-as=\"quiz\"`: every question renders with prev/next chrome, and each conclusion stays hidden until you pick it. `.sem-quiz-options` is generated — buttons shuffled from a seed derived from the container id (stable across reloads), one option per candidate: the fact's explicit `incorrect-statement` children plus sibling conclusions up to three, and the conclusion itself marked `data-correct`. One answer per question; the meter then reads `N/M · score C/A`, a correct pick marks green, and a miss marks both the wrong pick and the correct option — a miss teaches.",
      code: '<sem-facts id="auth-facts" view-as="quiz">\n  <sem-fact id="f-rotate">\n    <statement>JWTs rotate per session</statement>\n    <conclusion>Short-lived access tokens; the refresh\n      grant issues a new pair.</conclusion>\n    <incorrect-statement>Store tokens in localStorage.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-expiry">\n    <statement>Access tokens expire after 15 minutes</statement>\n    <conclusion>The client mints a new pair from the refresh\n      grant; the user never re-signs-in mid-session.</conclusion>\n    <incorrect-statement>The user must sign in again every 15\n      minutes.</incorrect-statement>\n  </sem-fact>\n  <sem-fact id="f-secret">\n    <statement>Client secrets never reach the browser</statement>\n    <conclusion>The confidential client holds the secret\n      server-side; the browser only ever sees tokens.</conclusion>\n    <incorrect-statement>Embed the client secret in the SPA\n      bundle.</incorrect-statement>\n  </sem-fact>\n</sem-facts>',
    },
  ],
  "sem-note": [
    {
      id: "variant-info",
      label: "variant: info (default)",
      note: "`variant` unauthored: the info accent and its `info ·` label come from the default, set as `data-variant` on upgrade.",
      code: '<sem-note>Access tokens live 15 minutes; the refresh grant issues a replacement pair without a new consent prompt.</sem-note>',
    },
    {
      id: "variant-tip",
      label: "variant: tip",
      note: "Tip accent — a practice hint set beside the flow. A note emphasises; it never occludes its body or moves the reader off the page.",
      code: '<sem-note variant="tip">Pin the chart version in the same PR as the values bump so the two ship together.</sem-note>',
    },
    {
      id: "variant-danger",
      label: "variant: danger",
      note: "Danger accent for destructive consequences. Emphasis only: the body stays fully readable — occlusion belongs to the spoiler/quiz tags, not to a note.",
      code: '<sem-note variant="danger">The rotation drops the previous key set at once — snapshot the store before you trigger it.</sem-note>',
    },
    {
      id: "view-as-margin",
      label: "variant: view-as margin",
      note: "Presentation only. On viewports of 64rem or more the note floats right beside the prose that follows it; at the 390px capture, and in print, it reads inline as an ordinary callout. Extraction never sees `view-as` — a margin note and an inline note yield the same record.",
      code: '<sem-note variant="info" view-as="margin">The port-forward dies with the terminal session — re-run it before each apply.</sem-note>\n<p>Deployment prose continues here. On a wide viewport the margin note floats beside this paragraph; here it reads inline, ahead of it.</p>',
    },
    {
      id: "audience-scoped",
      label: "variant: audience-scoped",
      note: "`audience` follows the sem-audiences contract: the operator note hides for every other profile and the negated note hides for operators, via the native `hidden` attribute under the widened `[hidden]` guard. JS-off — and in this Render pane, whose wiring deliberately excludes the audience handler until the bundle sync — both notes stay visible.",
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-note audience="operator">Operators: start the MinIO port-forward before the migration apply.</sem-note>\n<sem-note audience="!operator">Everyone else: ask an operator to run the migration for you.</sem-note>',
    },
    {
      id: "hint-reveal-notation",
      label: "variant: [hint | reveal] authoring",
      note: "The agent-instruction notation (conventions.md §3), first defined on this element's schema. v1 renders it as plain body text — the schema defers the parse until a handler ships it; agent readers still see the instruction in the source view.",
      code: '<sem-note variant="info">[hint | reveal] Check the ArgoCD sync status before assuming the deploy regressed.</sem-note>',
    },
  ],
  "sem-step": [
    {
      id: "status-vocabulary",
      label: "variant: every status, one runbook",
      note: "One step per `status` — `done` ✓, `current` →, `blocked` ⛔, `todo` ○ (dashed rail) — plus the fourth step carrying no attribute at all: the schema default IS `todo`, and it renders exactly like the explicit spelling. A blocked step mutes its text; every step stays fully readable — the glyphs annotate, never redact. Status sugar inside step text (conventions §3) is display-only: `status` is canonical and is what extraction reads.",
      code: '<sem-procedure kind="runbook" role="list">\n  <sem-step role="listitem" status="done">snapshot the secret store</sem-step>\n  <sem-step role="listitem" status="current">drain the old replicas</sem-step>\n  <sem-step role="listitem" status="todo">rotate the signing key</sem-step>\n  <sem-step role="listitem">flip traffic to the new pool</sem-step>\n  <sem-step role="listitem" status="blocked">retire the legacy endpoint — waiting on the client release</sem-step>\n</sem-procedure>',
      renderable: true,
    },
  ],
  "sem-properties": [
    {
      id: "glossary",
      label: "variant: glossary view",
      note: "`view-as=\"glossary\"` (R/W1): the same closed set as a glossary — each property stacks term over definition, and every property carries an `id` prose can link with a plain anchor. With the bundle live, each such anchor gets a hover/focus preview popover showing the pair (`Esc` closes, the anchor still navigates); with no script it stays a definition list with a `:target` highlight and nothing hidden. Extraction is unchanged: a glossary property is still a `sem-property` record.",
      code: '<p>The service accepts <dfn>token ttl</dfn>, <dfn>refresh rotation</dfn> and <dfn>storage</dfn> settings — see <a href="#g-token-ttl">token ttl</a> and <a href="#g-refresh-rotation">refresh rotation</a>.</p>\n\n<sem-properties kind="config" view-as="glossary">\n  <sem-property id="g-token-ttl" key="token ttl" role="definition" aria-label="token ttl">15m</sem-property>\n  <sem-property id="g-refresh-rotation" key="refresh rotation" role="definition" aria-label="refresh rotation">per use</sem-property>\n  <sem-property id="g-storage" key="storage" role="definition" aria-label="storage">httpOnly cookie</sem-property>\n</sem-properties>',
    },
    {
      id: "compact-sugar",
      label: "variant: compact `term :: value` sugar",
      note: "The conventions §3 pair sugar is legal in the property text; `key` stays canonical and wins when both are present. The runtime does not parse `::`, so the value column shows the property text verbatim until a parser ships — which is why the sugar author also writes `key`: sugar without it renders an empty key column.",
      code: '<sem-properties kind="config">\n  <sem-property key="token ttl" role="definition" aria-label="token ttl">token ttl :: 15m</sem-property>\n  <sem-property key="refresh rotation" role="definition" aria-label="refresh rotation">refresh rotation :: per use</sem-property>\n</sem-properties>',
    },
  ],
  "sem-property": [
    {
      id: "sugar-keyless",
      label: "variant: compact `::` sugar without `key`",
      note: "`<sem-property>storage :: httpOnly cookie</sem-property>` is legal authoring, and the runtime does not parse `::` — the text renders verbatim in the value column and no term is drawn. Sugar authors therefore also write `key` (conventions §3); the second row shows that pair, where the `key` attribute is the term and wins.",
      code: '<sem-properties kind="config">\n  <sem-property>storage :: httpOnly cookie</sem-property>\n  <sem-property key="token ttl" role="definition" aria-label="token ttl">ttl :: 15m</sem-property>\n</sem-properties>',
    },
    {
      id: "multiline-value",
      label: "variant: multi-line value",
      note: "A value keeps its authored whitespace (schema: keys wrap, values keep whitespace): each authored line renders as its own line. The preserve-whitespace rule ships with the next vocabulary sync — today's shipped render still collapses the line breaks here.",
      code: '<sem-properties kind="env">\n  <sem-property key="cors origins" role="definition" aria-label="cors origins">https://app.noizu.com\nhttps://admin.noizu.com</sem-property>\n  <sem-property key="session store" role="definition" aria-label="session store">redis, db 2,\nkey prefix sess:</sem-property>\n</sem-properties>',
    },
    {
      id: "glossary-term",
      label: "variant: glossary term with prose anchor",
      note: "Inside `view-as=\"glossary\"` a property is a term: it stacks definition under term and its `id` is a plain-anchor target. With the reading bundle live the prose link gains a hover/focus preview of the pair (`Esc` closes; the anchor still navigates); with no script the block stays a definition list and the link highlights the property via `:target` — nothing hidden either way.",
      code: '<p>Both issuer settings are defined in the glossary: see <a href="#g-pkce">PKCE</a> and <a href="#g-confidential">confidential client</a>.</p>\n\n<sem-properties kind="spec" view-as="glossary">\n  <sem-property id="g-pkce" key="PKCE" role="definition" aria-label="PKCE">Proof Key for Code Exchange — binds the authorization code to the verifier that minted it.</sem-property>\n  <sem-property id="g-confidential" key="confidential client" role="definition" aria-label="confidential client">A client able to hold its secret server-side; the browser never sees it.</sem-property>\n</sem-properties>',
    },
  ],
  "sem-reference": [
    {
      id: "footnotes",
      label: 'variant: kind="footnotes"',
      note: "The footnote contract: the same authoring shape with `kind=\"footnotes\"` on the container — the schema styles footnotes as a compact list and bibliography as a hanging indent. The second entry carries no `href`: a footnote with no external target stays a plain numbered note in every tier. JS-off, entries number by CSS counter in DOM order and the authored citation text (`¹` here, `[1]` there) is never renumbered. The schema's distinct compact-list treatment for footnotes is owed by the container block — today's shipped vocabulary styles both kinds as the same numbered list.",
      code: '<p>The refresh grant rotates per use<a href="#fn-rfc">[1]</a>, and the presented token is retired<a href="#fn-rotation">¹</a>.</p>\n\n<sem-references id="fn" kind="footnotes" role="list">\n  <sem-reference id="fn-rfc" role="listitem" href="https://www.rfc-editor.org/rfc/rfc9700" cite="RFC 9700">\n    OAuth 2.0 Security Best Current Practice, §4.14 — refresh token rotation.\n  </sem-reference>\n  <sem-reference id="fn-rotation" role="listitem">\n    Rotation is a SHOULD, not a MUST: a client holding a token in two places can invalidate its own sibling session.\n  </sem-reference>\n</sem-references>',
    },
    {
      id: "citation-previews",
      label: "variant: two anchors citing one reference — previews and backlinks",
      note: "The reading bundle at work: every citing anchor gains a hover and focus preview popover of the entry (`Esc` closes it, the anchor still navigates, `aria-describedby` points at the popover while it is open), and the entry appends one labelled backlink per citing anchor plus the external `↗` link its `href` asks for. Two anchors citing one `id` is the case backlinks exist for. JS-off the same markup is a paragraph and a numbered list: anchors navigate and the `:target` entry highlights — nothing more.",
      code: '<p>Refresh tokens rotate per use<a href="#pr-rfc">[1]</a>, and each rotation retires the presented grant<a href="#pr-rfc">[1]</a>.</p>\n\n<sem-references id="pr" kind="bibliography" role="list">\n  <sem-reference id="pr-rfc" role="listitem" href="https://www.rfc-editor.org/rfc/rfc9700" cite="RFC 9700">\n    OAuth 2.0 Security Best Current Practice, §4.14 — refresh token rotation.\n  </sem-reference>\n</sem-references>',
    },
  ],
  "sem-progress": [
    {
      id: "default-label",
      label: "variant: default label",
      note: "No `label` authored: the caption names itself — `progress :: 42%`. The runtime default applies in every tier; JS-off the CSS `attr()` caption reads the same default. ARIA is unchanged: `role=\"meter\"` with `aria-valuenow` = the authored value.",
      code: '<sem-progress value="0.42" role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="0.42"></sem-progress>',
    },
    {
      id: "clamp",
      label: "variant: out-of-range value clamps",
      note: "`value=\"1.4\"` is outside the canonical 0..1: the render clamps to 100% while the raw attribute — and `aria-valuenow`, which assistive tech reads — stay exactly as authored. JS-off the caption shows the raw `1.4` too: the render clamps, the data never lies.",
      code: '<sem-progress value="1.4" label="cache warm" role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="1.4"></sem-progress>',
    },
    {
      id: "done",
      label: "variant: status=\"done\"",
      note: "`status=\"done\"` pairs with value 1 by convention: the fill reads full and the sem-step checkmark joins the caption. The status attribute is runtime-independent (no script reads it) — the no-script CSS rule renders the check in either attribute spelling.",
      code: '<sem-progress value="1" label="cutover" status="done" role="meter" aria-valuemin="0" aria-valuemax="1" aria-valuenow="1"></sem-progress>',
    },
  ],
  "sem-reader": [
    {
      id: "in-document",
      label: "variant: in a document",
      note: "The reader in its habitat: first child of the root wrapper, all seven controls. The outline derives from the document's h2–h3 headings (one link per heading, `aria-current=\"location\"` on the topmost one in view); the progress bar fills with the document scroll; focus, type and colour write session attributes on `<html>`, persisted per control via localStorage — fail-open. This page's pane is not a long document, so the full chrome is honest only in a real document (see the site's demo build).",
      code: '<sem-enhanced-document>\n  <sem-reader controls="outline,progress,focus,type,color,print,audience" outline-depth="3"></sem-reader>\n  <h1>Token rotation runbook</h1>\n  <h2>Before you start</h2>\n  <p>Port-forward to the admin bucket and confirm replica lag is zero.</p>\n  <h2>Run the rotation</h2>\n  <h3>Dry run</h3>\n  <p>Print the next grant and check the audience list, apply nothing.</p>\n  <h3>Apply</h3>\n  <p>Rotate the pair, then verify the new hash validates a live session.</p>\n  <h2>After</h2>\n  <p>Revoke the old grant and close the change ticket.</p>\n</sem-enhanced-document>',
    },
    {
      id: "authored-nav",
      label: "variant: authored contents nav",
      note: "An authored `<nav aria-label=\"Contents\">` IS the outline: used verbatim — no ids are minted, no list is generated, nothing inside is rewritten. This is the JS-off table of contents; with the bundle, the toggle still opens it and an outline link closes the panel again.",
      code: '<sem-reader controls="outline,progress">\n  <nav aria-label="Contents">\n    <ol>\n      <li><a href="#before">Before you start</a></li>\n      <li>\n        <a href="#apply">Run the rotation</a>\n        <ol>\n          <li><a href="#dry">Dry run</a></li>\n          <li><a href="#apply-step">Apply</a></li>\n        </ol>\n      </li>\n      <li><a href="#after">After</a></li>\n    </ol>\n  </nav>\n</sem-reader>',
    },
    {
      id: "outline-depth-2",
      label: "variant: outline only, depth 2",
      note: "`outline-depth=\"2\"` caps the outline at h2: the h3 headings still render in the document but stay out of the contents. `controls=\"outline\"` drops the progress bar and every preference control — only the Contents toggle renders.",
      code: '<sem-enhanced-document>\n  <sem-reader controls="outline" outline-depth="2"></sem-reader>\n  <h1>Token rotation runbook</h1>\n  <h2>Before you start</h2>\n  <p>Port-forward to the admin bucket.</p>\n  <h3>Replica lag</h3>\n  <p>Confirm zero lag before touching the grants.</p>\n  <h2>Run the rotation</h2>\n  <p>Rotate the pair and verify a live session.</p>\n</sem-enhanced-document>',
    },
    {
      id: "audience-control",
      label: "variant: audience control",
      note: "The audience select renders only when the document declares profiles: it lists every `sem-profile` (label, else id) under a leading `Everyone`, and the choice writes the shareable `sem-audience` hash parameter — the audience handler applies it on `hashchange`; the reader never hides anything itself. No declared profiles, no control.",
      code: '<sem-audiences>\n  <sem-profile id="reader" label="Reader"></sem-profile>\n  <sem-profile id="operator" label="Operator" implies="reader"></sem-profile>\n</sem-audiences>\n\n<sem-reader controls="outline,audience"></sem-reader>',
    },
  ],
  "sem-reveal": [
    {
      id: "default-open",
      label: "variant: starts open",
      note: "No `collapsed` authored: the reveal starts open — the answer shows, the summary bar reads as its heading. State is the native `<details>` attribute the runtime presets; there is no script-maintained open flag to drift.",
      code: '<sem-reveal summary="What wraps the reveal itself?">\n  A native &lt;details&gt;/&lt;summary&gt; pair, preset open. Click and keyboard toggling belong to the platform — no script-maintained state, so nothing to drift.\n</sem-reveal>',
    },
    {
      id: "derived-summary",
      label: "variant: derived summary",
      note: "No `summary` attribute: `src/shared/summary.ts` derives the closed-state label from the leading body text (max 60 chars, cut at the last word boundary) — the summary a reader sees is the summary a machine extracts, one shared rule. JS-off with no `summary` there is no caption at all: plain prose, nothing hidden.",
      code: '<sem-reveal collapsed>\n  Why derive the label at all? Because the summary a reader sees is the summary a machine extracts.\n</sem-reveal>',
    },
  ],
  "sem-references": [
    {
      id: "default-kind",
      label: "variant: no kind — the plain numbered list",
      note: "The base display: CSS counters number the entries 1-based in DOM order in every tier, JS-off included. The container here carries no `kind`, so it gets the default spacing rather than the bibliography hanging indent. The second entry has no `href` — a note with no external target, which never grows the external-link chrome.",
      code: '<p>Rotation follows the provider guidance<a href="#r-oidc">[1]</a>.</p>\n\n<sem-references id="refs-default" role="list">\n  <sem-reference id="r-oidc" role="listitem" href="https://openid.net/specs/openid-connect-core-1_0.html" cite="OIDC Core 1.0">\n    OpenID Connect Core 1.0, §3.1.3.7 — rotating refresh tokens.\n  </sem-reference>\n  <sem-reference id="r-internal" role="listitem">\n    Internal runbook: token rotation window, ops wiki.\n  </sem-reference>\n</sem-references>',
    },
    {
      id: "footnotes",
      label: "variant: kind=\"footnotes\" — compact list",
      note: "The compact display for notes tied to nearby prose: tighter margins than the default, unlike the hanging-indent bibliography. Authored citation text is never renumbered — `[a]` and `[b]` stay as written; only the entries themselves carry the CSS counter. Rendered panes also append backlinks (`↩`) to any entry the prose cites; JS-off the list still numbers and `:target` still highlights.",
      code: '<p>Migrations run before the swap<a href="#r-fn-1">[a]</a>; the drain window is 90 seconds<a href="#r-fn-2">[b]</a>.</p>\n\n<sem-references id="refs-notes" kind="footnotes" role="list">\n  <sem-reference id="r-fn-1" role="listitem">Schema first, image second — the Liquibase changeset lands in the same release train.</sem-reference>\n  <sem-reference id="r-fn-2" role="listitem">Readiness gate holds at 90 s; the zero-ready window is expected under a Recreate rollout.</sem-reference>\n</sem-references>',
    },
  ],
  "sem-view": [
    {
      id: "default-active",
      label: "variant: no authored active — the first view shows",
      note: "No view carries `active`: the runtime activates the first and mirrors that into `data-active`, exactly as if it were authored there. Switching moves only the `data-active` mirror — view content is never rewritten, so switching a hundred times loses nothing. JS-off every view renders stacked under its `name`.",
      code: '<sem-views id="incident">\n  <sem-view name="Summary">Replica lag breached its alert threshold at 02:14; one node fell behind and was re-seeded.</sem-view>\n  <sem-view name="Timeline">02:12 lag rises · 02:14 alert pages the operator · 02:31 replica re-seeded · 02:40 lag back to zero.</sem-view>\n</sem-views>',
    },
    {
      id: "deep-link",
      label: "variant: views with ids — deep links and sem-navigate",
      note: "A view may carry its own `id`: the deep link `#shipping/helm` (container id / view id, or the lowercased `name` when the view has none) activates that view on load and on every hashchange, so a view is citable like any anchor. Every activation — click, arrow key or hash — dispatches `sem-navigate {id, name, index}` for readers that want to follow along.",
      code: '<sem-views id="shipping">\n  <sem-view id="helm" name="Helm">The chart bump is committed by CI; ArgoCD is not in the loop.</sem-view>\n  <sem-view id="argocd" name="ArgoCD">Auto-sync pulls the chart repo; a drifted tag means a red sync.</sem-view>\n</sem-views>',
    },
    {
      id: "rich-content",
      label: "variant: any content inside a view",
      note: "A view is a container, not a paragraph: any content is legal inside it, including other SemText elements. This one carries a `sem-note`, which enhances (collapse toggle and all) whether or not its parent view is the active one — the pane keeps the whole family alive so a switch is instant and content-preserving.",
      code: '<sem-views id="runbook">\n  <sem-view name="Plan">\n    <p>Rotate the pair, then verify a live session before closing the ticket.</p>\n    <sem-note variant="warning">Dry-run first: the rotation is not reversible past the first use.</sem-note>\n  </sem-view>\n  <sem-view name="Checklist">\n    <p>Dry run · Rotate · Verify · Close the ticket.</p>\n  </sem-view>\n</sem-views>',
    },
  ],
  "sem-source": [
    {
      id: "source-first",
      label: "variant: authored view-as=\"source\" — the section opens in source mode",
      note: "An authored `view-as=\"source\"` (either spelling) builds the fence at enhance time and starts in source mode; the rendered children stay one click away and the fence is built once, then only shown and hidden. JS-off the children render as ordinary flow — the hide rule is gated on the upgrade marker, so nothing authored-visible is ever hidden without scripts.",
      code: '<sem-source id="s-source-initial" label="Authored source first" view-as="source">\n  <h3>Facts — flashcards</h3>\n  <sem-facts id="s-source-deck" view-as="list">\n    <sem-fact id="s-source-f1">\n      <statement>The fence text comes from a snapshot of the children</statement>\n      <conclusion>Nodes are cloned before any enhancement runs — never serialised and re-parsed.</conclusion>\n    </sem-fact>\n  </sem-facts>\n</sem-source>',
    },
    {
      id: "no-label",
      label: "variant: no label — the chrome without a caption",
      note: "`label` is optional: the chrome then shows only the Rendered/Source pair. The wrapper still mints nothing — this paragraph extracts as if the wrapper were not there, and with scripts off it is the whole story.",
      code: '<sem-source id="s-source-plain">\n  <p>Any SemText content may sit inside the wrapper: headings, prose, vocabulary elements. Flip to Source to read exactly this markup as parsed, with the chrome and the fence absent from it.</p>\n</sem-source>',
    },
    {
      id: "nested-unsupported",
      label: "variant: authoring error — nested wrappers",
      note: "A `sem-source` must not nest inside another: the snapshot pass skips the inner wrapper with a console warning and the outer wrapper owns the section, so the inner chrome is undefined and must not be relied on. The fence of the outer wrapper contains the inner wrapper's markup verbatim — which is why the inner one must not toggle. Fix the document: one wrapper per section.",
      code: '<sem-source id="s-source-outer" label="Outer wrapper">\n  <h3>Facts — flashcards</h3>\n  <sem-source id="s-source-inner" label="Inner wrapper">\n    <p>The inner wrapper has no chrome of its own here: the outer wrapper snapshotted it as content and owns the whole section.</p>\n  </sem-source>\n</sem-source>',
    },
  ],
  "sem-table": [
    {
      id: "controls-filter",
      label: "variant: filter without sort",
      note: "`controls=\"filter\"` drops the sort buttons: the chrome carries the labelled search box and the live status only, and the headers render as plain header cells. Typing hides every row whose text does not match (native `hidden`, so the rows leave the accessibility tree with the visual) and announces \"n of m rows\" about 200 ms after typing settles — not on every keystroke.",
      code: '<sem-table id="t-sessions" controls="filter">\n  <table>\n    <caption>Active sessions</caption>\n    <thead><tr><th scope="col">Device</th><th scope="col">Last seen</th><th scope="col">Region</th></tr></thead>\n    <tbody>\n      <tr><td>MacBook Pro</td><td data-value="2026-10-14">today</td><td>EU</td></tr>\n      <tr><td>iPhone</td><td data-value="2026-10-13">yesterday</td><td>EU</td></tr>\n      <tr><td>k8s CI runner</td><td data-value="2026-10-09">5 days ago</td><td>US</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
    {
      id: "controls-default",
      label: "variant: no attributes at all — sort is the default",
      note: "Bare `<sem-table>`: `controls` defaults to `sort`, and with no filter input and an empty status the chrome hides itself, so the reader sees only the table. Activating Count sorts numerically (3 < 9 < 14) even though the cells are plain text — a column of pure numbers is compared as numbers; a third activation restores the authored order.",
      code: '<sem-table id="t-builds">\n  <table>\n    <caption>Build failures by cause</caption>\n    <thead><tr><th scope="col">Cause</th><th scope="col">Count</th></tr></thead>\n    <tbody>\n      <tr><td>flaky e2e</td><td data-value="14">14</td></tr>\n      <tr><td>type error</td><td data-value="3">3</td></tr>\n      <tr><td>timeout</td><td data-value="9">9</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
    {
      id: "sticky-long",
      label: "variant: sticky over a long body",
      note: "`sticky` caps the element at 24rem so a long table scrolls inside itself and the header sticks while it scrolls — a stick needs an internal scroll container to engage; without the cap a page-level table never gains one and the header would scroll away with the page. CSS only: the header still sticks with scripts off. Sort by When — ties keep the authored order.",
      code: '<sem-table id="t-deploys" controls="sort,filter" sticky>\n  <table>\n    <caption>Recent deploys</caption>\n    <thead><tr><th scope="col">Service</th><th scope="col">When</th><th scope="col">Result</th></tr></thead>\n    <tbody>\n      <tr><td>edge-gateway</td><td data-value="2">2 h ago</td><td>ok</td></tr>\n      <tr><td>api-core</td><td data-value="5">5 h ago</td><td>ok</td></tr>\n      <tr><td>web</td><td data-value="9">9 h ago</td><td>rolled back</td></tr>\n      <tr><td>worker</td><td data-value="24">1 d ago</td><td>ok</td></tr>\n      <tr><td>docs</td><td data-value="26">1 d ago</td><td>ok</td></tr>\n      <tr><td>cdn</td><td data-value="48">2 d ago</td><td>ok</td></tr>\n      <tr><td>mail</td><td data-value="72">3 d ago</td><td>ok</td></tr>\n      <tr><td>billing</td><td data-value="76">3 d ago</td><td>ok</td></tr>\n      <tr><td>auth</td><td data-value="96">4 d ago</td><td>ok</td></tr>\n      <tr><td>search</td><td data-value="120">5 d ago</td><td>ok</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
    {
      id: "comparison-wide",
      label: "variant: kind=\"comparison\" — first column pinned on narrow screens",
      note: "`kind=\"comparison\"` (on the element or on a plain `<table>`) pins the first column while the remaining columns scroll horizontally — shrink the window (or read at phone width) and the plan names stay in place against the columns that slide. CSS only, works with scripts off; with `sticky` it also holds while the header is stuck.",
      code: '<sem-table id="t-plans" kind="comparison">\n  <table>\n    <caption>Hosting plans</caption>\n    <thead><tr><th scope="col">Plan</th><th scope="col">Rows</th><th scope="col">Storage</th><th scope="col">Backups</th><th scope="col">Regions</th><th scope="col">Support</th></tr></thead>\n    <tbody>\n      <tr><td>Dev</td><td>10k</td><td>1 GB</td><td>weekly</td><td>1</td><td>community</td></tr>\n      <tr><td>Team</td><td>1M</td><td>50 GB</td><td>daily</td><td>3</td><td>business hours</td></tr>\n      <tr><td>Scale</td><td>unlimited</td><td>500 GB</td><td>hourly</td><td>6</td><td>24/7</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
    {
      id: "text-sort-keys",
      label: "variant: data-value carries a hidden sort key",
      note: "`td[data-value]` is the sort key when the visible text is not it: Shipped sorts chronologically (Jan, Feb, Mar) though the cells read \"12 Jan 2026\" …, and Release sorts \"v2.10\" after \"v2.9\" because text comparison is locale-aware with numeric runs. Two numeric keys compare numerically; anything else compares as text.",
      code: '<sem-table id="t-releases" controls="sort">\n  <table>\n    <caption>Release train</caption>\n    <thead><tr><th scope="col">Release</th><th scope="col">Shipped</th></tr></thead>\n    <tbody>\n      <tr><td>v2.9</td><td data-value="2026-01-12">12 Jan 2026</td></tr>\n      <tr><td>v2.10</td><td data-value="2026-03-02">2 Mar 2026</td></tr>\n      <tr><td>v3.0</td><td data-value="2026-02-20">20 Feb 2026</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
    {
      id: "no-thead",
      label: "variant: no thead — the plain-table floor",
      note: "A table without a thead has no header row to sort by: no sort buttons are wired, the chrome stays empty and hides itself, and what remains is the authored table exactly as written. This is the element's floor — it degrades to plain HTML, never to a broken control.",
      code: '<sem-table id="t-labels" controls="sort">\n  <table>\n    <caption>Row labels</caption>\n    <tbody>\n      <tr><td>alpha</td><td>first</td></tr>\n      <tr><td>beta</td><td>second</td></tr>\n    </tbody>\n  </table>\n</sem-table>',
    },
  ],
};

/*
 * The views family serves one contract on two reference pages: the
 * container page (`sem-views`) and the view page (`sem-view`) present the
 * same variants — default active, deep links, nested content, class form —
 * because neither half is readable without the other.
 */
EXAMPLE_VARIANTS["sem-views"] = EXAMPLE_VARIANTS["sem-view"];
