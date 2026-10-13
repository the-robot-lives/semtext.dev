/*
 * Extra authored examples per tag: the view modes and variants a tag's
 * reference page shows alongside its primary example — a `sem-note`
 * variant per `variant` value, a `sem-facts` example per `view-as` mode,
 * a `sem-details` occluded/open pair, and so on.
 *
 * This file is the extension point the per-tag reviewers fill: add one
 * entry per variant; the element page renders each in its own viewer under
 * the primary example, in array order, with the label in the viewer chrome
 * and a stable `#example-<id>` anchor. The mechanism ships empty — no
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
      code: '<npl-section type="alg-pseudo">\n  for each authored section:\n    resolve the type, then insert the labelled header\n</npl-section>',
    },
    {
      id: "diagram",
      label: 'variant: type="diagram"',
      note: "The Diagram label; diagrams stay authored content — the component never draws.",
      code: '<npl-section type="diagram">\n  <pre>header ─┬─ label\n         └─ body (untouched)</pre>\n</npl-section>',
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
      code: '<npl-section type="logic">\n  known(type) → header + derived class\n  unknown(type) → warning class, no header\n</npl-section>',
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
};
