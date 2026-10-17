"use client";

import { useEffect, useMemo, useState } from "react";
import { CodeViewer } from "@/components/code-viewer";

/*
 * The two generators behind /extend/:
 *
 *   - VocabScaffoldWizard  — step-by-step scaffold for a third-party
 *     vocabulary namespace: a CSS base, one light-DOM custom element per
 *     entry, a manifest, a hosted-lazy loader (the spec §7 "Hosted lazy"
 *     contract applied to a foreign namespace), and a demo page.
 *
 *   - VocabProposalWizard  — drafts a vocabulary proposal and opens it as
 *     a prefilled GitHub issue on noizu-labs-ml/npl-enhanced-content.
 *     (Submit target assumed per the docs-overhaul brief — a prefilled
 *     issue on that repo; pending a user decision on the final target.)
 *
 * Zero-JS: until hydration each wizard renders a short static note (the
 * house pattern) — generation needs JavaScript; the notes point at the
 * spec section the generator implements.
 */

const ISSUE_BASE =
  "https://github.com/noizu-labs-ml/npl-enhanced-content/issues/new";

interface NsFiles {
  css: { name: string; code: string };
  elements: Array<{ name: string; code: string }>;
  manifest: { name: string; code: string };
  loader: { name: string; code: string };
  demo: { name: string; code: string };
}

const NAME_RE = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

function parseNamespace(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Lowercase, trim, hyphen-normalise; [] when nothing usable remains. */
function parseElements(raw: string, ns: string): string[] {
  const out: string[] = [];
  for (const line of raw.split("\n")) {
    const name = line.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!name || !NAME_RE.test(name)) continue;
    const tag = name.startsWith(`${ns}-`) ? name : `${ns}-${name}`;
    if (!out.includes(tag)) out.push(tag);
  }
  return out;
}

function pascal(tag: string): string {
  return tag
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
}

function buildFiles(ns: string, tags: string[]): NsFiles {
  const className = (tag: string) => "Sem" + pascal(tag);

  const css = {
    name: `${ns}.css`,
    code: `/* ${ns}.css — vocabulary base for the ${ns} namespace.
 * One rule per element: a block box before any definition, so the
 * document presents before (and without) the loader — the same
 * presentation-without-script contract as the core's semtext.css
 * (spec/conventions.md §6).
 */
${tags.map((t) => `${t}:not(:defined) { display: block; }`).join("\n")}

/* Tokens a host theme can override. */
:root {
  --${ns}-accent: #7c3aed;
  --${ns}-surface: #0f172a;
  --${ns}-ink: #e2e8f0;
}`,
  };

  const elements = tags.map((tag) => ({
    name: `elements/${tag}.js`,
    code: `/* elements/${tag}.js — the <${tag}> element.
 * Light DOM on purpose: the authored content stays searchable, copyable
 * and extractable — the same rule the core vocabulary follows
 * (spec/conventions.md §4 rule 5).
 */
class ${className(tag)} extends HTMLElement {
  connectedCallback() {
    if (this.dataset.upgraded) return;
    this.dataset.upgraded = "true";
    // Read the authored children and render the widget in place.
    // this.querySelector(...) / this.textContent ...
  }
}

customElements.define("${tag}", ${className(tag)});`,
  }));

  const manifest = {
    name: `${ns}-manifest.json`,
    code: JSON.stringify(
      Object.fromEntries(tags.map((t) => [t, `./elements/${t}.js`])),
      null,
      2,
    ),
  };

  const loader = {
    name: `${ns}-lazy.js`,
    code: `/* ${ns}-lazy.js — namespace loader for the ${ns} vocabulary.
 * The spec's "Hosted lazy" contract (spec/conventions.md §7) applied to a
 * foreign namespace: scan the document for this namespace's tags, import
 * only the chunks those tags need, mark what upgraded, and report a
 * failed chunk as a role="alert" note beside its elements — never only in
 * the console. Components not on the page never download.
 */
const MANIFEST = {
${tags.map((t) => `  "${t}": "./elements/${t}.js",`).join("\n")}
};

const MARK = "data-${ns}-upgraded";

function reportFailure(tag, error, first) {
  const note = document.createElement("p");
  note.setAttribute("role", "alert");
  note.style.whiteSpace = "pre-wrap";
  note.textContent = tag + ": upgrade failed — " + error.message;
  first.parentNode.insertBefore(note, first);
}

async function upgrade(root) {
  root = root || document;
  for (const tag of Object.keys(MANIFEST)) {
    const found = root.querySelectorAll(tag);
    if (found.length === 0) continue;
    try {
      await import(MANIFEST[tag]);
      for (const el of found) el.setAttribute(MARK, "");
    } catch (error) {
      reportFailure(tag, error, found[0]);
    }
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", function () { upgrade(); });
} else {
  upgrade();
}`,
  };

  const demo = {
    name: "demo.html",
    code: `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${ns} demo</title>
  <link rel="stylesheet" href="./${ns}.css">
  <!-- The loader scans and imports only what this page uses.
       Server-hosted only: dynamic import needs a server, so this page
       is not the portable single-file form (spec/conventions.md §7). -->
  <script src="./${ns}-lazy.js"></script>
</head>
<body>
${tags.map((t) => `  <${t}>\n    …authored content…\n  </${t}>`).join("\n\n")}
</body>
</html>`,
  };

  return { css, elements, manifest, loader, demo };
}

function FileBlock({ file }: { file: { name: string; code: string } }) {
  return (
    <CodeViewer
      code={file.code}
      filename={file.name}
      caption="generated"
      label={`Generated ${file.name}`}
    />
  );
}

export function VocabScaffoldWizard() {
  const [mounted, setMounted] = useState(false);
  const [ns, setNs] = useState("yelp-sem");
  const [raw, setRaw] = useState("org-chart\nsystem-status");

  useEffect(() => setMounted(true), []);

  const namespace = parseNamespace(ns);
  const tags = parseElements(raw, namespace);
  const tagKey = tags.join("|");
  const files = useMemo(
    () => (namespace && tags.length > 0 ? buildFiles(namespace, tags) : null),
    [namespace, tagKey], // eslint-disable-line react-hooks/exhaustive-deps
  );

  if (!mounted) {
    return (
      <p className="text-sm leading-relaxed text-ink-mute">
        The generator needs JavaScript. The shape it produces is the spec&apos;s
        hosted-lazy contract (<code className="font-mono">spec/conventions.md</code>{" "}
        §7): a CSS base, one light-DOM element per tag, a manifest, and a
        loader that imports only the chunks the page uses.
      </p>
    );
  }

  return (
    <div>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="wiz-ns" className="block font-mono text-sm text-violet-soft">
            Namespace prefix
          </label>
          <input
            id="wiz-ns"
            type="text"
            value={ns}
            onChange={(e) => setNs(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder="yelp-sem"
          />
        </div>
        <div>
          <label htmlFor="wiz-elements" className="block font-mono text-sm text-violet-soft">
            Elements — one per line
          </label>
          <textarea
            id="wiz-elements"
            rows={3}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder={"org-chart\nsystem-status"}
          />
        </div>
      </div>
      <p className="mt-2 font-mono text-xs leading-5 text-ink-faint">
        Tags are validated as custom-element names and prefixed with the
        namespace unless they already carry it.
        {namespace && tags.length > 0 && (
          <>
            {" "}Currently: {tags.map((t) => (
              <code key={t} className="font-mono">&lt;{t}&gt; </code>
            ))}
          </>
        )}
      </p>

      {!files ? (
        <p className="mt-6 max-w-3xl rounded-md border border-white/15 px-4 py-3 text-sm text-ink-mute" role="status">
          Name a namespace and at least one valid element to generate the
          scaffold.
        </p>
      ) : (
        <div className="mt-6 flex max-w-3xl flex-col gap-4">
          <FileBlock file={files.css} />
          {files.elements.map((f) => (
            <FileBlock key={f.name} file={f} />
          ))}
          <FileBlock file={files.manifest} />
          <FileBlock file={files.loader} />
          <FileBlock file={files.demo} />
        </div>
      )}
    </div>
  );
}

export function VocabProposalWizard() {
  const [mounted, setMounted] = useState(false);
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [motivation, setMotivation] = useState("");
  const [attrs, setAttrs] = useState("");
  const [example, setExample] = useState("");

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <p className="text-sm leading-relaxed text-ink-mute">
        The proposal drafter needs JavaScript. Proposals are vocabulary
        additions to the SemText spec — the element&apos;s name, what it is,
        why it cannot be authored with the existing vocabulary, its options,
        and a worked example.
      </p>
    );
  }

  const tag = parseNamespace(name);
  const ready = NAME_RE.test(tag) && tag.includes("-") && summary.trim() !== "" && motivation.trim() !== "";

  const body = [
    "## Element",
    `\`${tag}\``,
    "",
    "## Summary",
    summary.trim(),
    "",
    "## Motivation",
    motivation.trim(),
    "",
    "## Options",
    attrs.trim() || "_(none proposed)_",
    "",
    "## Example",
    "```html",
    example.trim(),
    "```",
    "",
    "— drafted on semtext.dev/extend/",
  ].join("\n");

  const issueUrl =
    ISSUE_BASE +
    `?title=${encodeURIComponent(`Vocabulary proposal: ${tag}`)}` +
    `&body=${encodeURIComponent(body)}`;

  return (
    <div>
      <div className="grid max-w-3xl gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="prop-name" className="block font-mono text-sm text-violet-soft">
            Element name
          </label>
          <input
            id="prop-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder="yelp-sem-review-summary"
          />
        </div>
        <div>
          <label htmlFor="prop-summary" className="block font-mono text-sm text-violet-soft">
            One-line summary
          </label>
          <input
            id="prop-summary"
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder="A roll-up of review scores with per-source counts."
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="prop-motivation" className="block font-mono text-sm text-violet-soft">
            Why the existing vocabulary cannot express it
          </label>
          <textarea
            id="prop-motivation"
            rows={3}
            value={motivation}
            onChange={(e) => setMotivation(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="prop-attrs" className="block font-mono text-sm text-violet-soft">
            Options — one per line, <code>name — meaning</code>
          </label>
          <textarea
            id="prop-attrs"
            rows={2}
            value={attrs}
            onChange={(e) => setAttrs(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder={"source — where the scores come from\nkind — summary | histogram"}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="prop-example" className="block font-mono text-sm text-violet-soft">
            Worked example
          </label>
          <textarea
            id="prop-example"
            rows={4}
            value={example}
            onChange={(e) => setExample(e.target.value)}
            className="mt-2 w-full rounded border border-code-border bg-slate-900 px-3 py-2 font-mono text-sm text-ink"
            placeholder={`<yelp-sem-review-summary source="yelp" kind="summary">\n  4.2 across 3,140 reviews\n</yelp-sem-review-summary>`}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {ready ? (
          <a
            href={issueUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center bg-violet px-5 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Open the drafted proposal as a GitHub issue
          </a>
        ) : (
          <span className="font-mono text-xs text-ink-faint" role="status">
            Name, summary and motivation make the draft openable.
          </span>
        )}
        <a
          href={ISSUE_BASE}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center border border-code-border px-4 py-2 font-mono text-sm text-ink hover:border-violet-soft"
        >
          Blank issue instead
        </a>
      </div>
      <p className="mt-2 font-mono text-[0.68rem] leading-5 text-ink-faint">
        Opens a prefilled issue on noizu-labs-ml/npl-enhanced-content — the
        spec&apos;s repository. Very long examples may exceed the URL limit;
        the draft is also reproducible by hand from the fields above.
      </p>
    </div>
  );
}
