#!/usr/bin/env node
/**
 * scripts/build-bundle-map.mjs — derive per-tag runtime provenance from the
 * SHIPPED bundle artefacts.
 *
 *   node scripts/build-bundle-map.mjs
 *
 * Reads:
 *   public/semtext/semtext-manifest.json   tag -> chunk path (from the
 *                                          npl-enhanced-content lazy build)
 *   public/semtext/semtext-fallback.js     the shipped fallback bundle; its
 *                                          selector helpers name the tags the
 *                                          enhancement tier handles
 *   data/elements.json + data/reference-glossary.ts
 *                                          the tag universe (every name the
 *                                          reference renders a page for)
 *
 * Writes data/bundles.json: for every reference tag, which shipped JS file(s)
 * provide it — `semtext-lazy.js` (plus which chunk), `semtext-fallback.js`, or
 * none. Companion/alias names (a file's non-primary tags: `sem-detail`,
 * `sem-fact`, `statement`, …) inherit their primary's list via `sharedWith`.
 * Nothing here is hand-maintained: re-run after every sync of
 * public/semtext/ (the lead's bundle sync should run this right after the
 * copy).
 *
 * Not shipped on this site (upstream npl-enhanced-content build targets,
 * never copied into public/semtext/): semtext.js (the full single-file
 * bundle), npl.js + npl-lazy.js + npl-chunks/ (the npl-* namespace),
 * semtext-js-shell.js (the sem-shell/sem-terminal terminal bundle),
 * semtext-agent.js (CLI-only). Tag pages say so instead of implying a
 * runtime exists.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = resolve(root, 'public/semtext/semtext-manifest.json');
const FALLBACK = resolve(root, 'public/semtext/semtext-fallback.js');
const ELEMENTS = resolve(root, 'data/elements.json');
const GLOSSARY = resolve(root, 'data/reference-glossary.ts');
const OUT = resolve(root, 'data/bundles.json');

// ---------- tag universe ----------

const index = JSON.parse(readFileSync(ELEMENTS, 'utf8'));
/** Hand-authored entries: name + schema source, in field order. */
const glossaryEntries = [...readFileSync(GLOSSARY, 'utf8').matchAll(
  /name: "([a-z0-9-]+)",\s*\n\s*family: "sem",\s*\n\s*source: "([^"]+)"/g,
)].map((m) => ({ name: m[1], source: m[2] }));
if (glossaryEntries.length === 0) {
  console.error('build-bundle-map: no entries parsed from data/reference-glossary.ts — field layout changed?');
  process.exit(1);
}
const byName = new Map(index.tags.map((t) => [t.name, t]));
for (const g of glossaryEntries) {
  if (byName.has(g.name)) {
    console.error(`build-bundle-map: ${g.name} is both generated and hand-authored`);
    process.exit(1);
  }
  byName.set(g.name, { name: g.name, family: 'sem', source: g.source, optionsIn: undefined });
}

// ---------- shipped artefacts ----------

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'));
const fallbackSrc = readFileSync(FALLBACK, 'utf8');

/** Tags the fallback enhancement tier names. Two extraction passes, both
 * intersected with the tag universe so the bundle's internal state/class
 * names (sem-fallback, sem-upgraded, sem-quiz-options, sem-note-body, …)
 * drop out:
 *   1. its selector helpers — d("x") builds ":is(sem-x, .sem-x)", M("x")
 *      builds ":is(x, .sem-x)" — cover names it assembles at runtime;
 *   2. a boundary-bounded occurrence of the whole tag name covers direct
 *      selector literals ("sem-enhanced-document, .sem-enhanced-document").
 * A name that passes neither is genuinely absent from the bundle. */
const fallbackTags = new Set();
const tagBoundary = (name) =>
  new RegExp(`(^|[^a-z0-9-])${name}(?![a-z0-9-])`).test(fallbackSrc);
for (const name of byName.keys()) {
  if (tagBoundary(name)) fallbackTags.add(name);
}
for (const m of fallbackSrc.matchAll(/\bd\("([a-z0-9-]+)"\)/g)) {
  const t = `sem-${m[1]}`;
  if (byName.has(t)) fallbackTags.add(t);
}
for (const m of fallbackSrc.matchAll(/\bM\("([a-z0-9-]+)"\)/g)) {
  if (byName.has(m[1])) fallbackTags.add(m[1]);
}
const lazyTags = new Set(Object.keys(manifest));

// ---------- per-tag provenance ----------

/** Runtime provided to a generated primary tag: chunk first (the Lit
 * component), then the fallback enhancement tier — the same order a reader
 * should care about. */
function primaryBundles(name) {
  const out = [];
  if (manifest[name]) {
    out.push({ file: 'semtext-lazy.js', detail: `loads ${manifest[name]}` });
  }
  if (fallbackTags.has(name)) {
    out.push({ file: 'semtext-fallback.js', detail: 'enhancement tier' });
  }
  return out;
}

/** A non-primary name inherits its primary's runtime: `optionsIn` when the
 * generator recorded one, else the first sibling in the same schema file
 * that carries a runtime. */
function sharedWith(name, rec) {
  if (rec.optionsIn) return rec.optionsIn;
  const siblings = index.tags.filter((t) => t.source === rec.source && t.name !== name);
  return siblings.find((t) => manifest[t.name] || fallbackTags.has(t.name))?.name;
}

const tags = {};
const unbundled = [];
for (const [name, rec] of byName) {
  if (rec.family === 'npl') {
    tags[name] = {
      shipped: false,
      note:
        'not in the shipped site bundles — the npl-* namespace ships upstream as npl.js / npl-lazy.js + npl-chunks/, not copied into public/semtext/',
    };
    continue;
  }
  const own = primaryBundles(name);
  if (own.length) {
    tags[name] = { shipped: true, bundles: own };
  } else {
    const primary = sharedWith(name, rec);
    if (primary && (manifest[primary] || fallbackTags.has(primary))) {
      tags[name] = { shipped: true, sharedWith: primary, bundles: primaryBundles(primary) };
    } else {
      tags[name] = {
        shipped: false,
        note: 'no shipped runtime — the authored example renders as plain HTML',
      };
      unbundled.push(name);
    }
  }
}

const out = {
  $comment:
    'Generated by scripts/build-bundle-map.mjs from public/semtext/* — do not edit by hand; re-run after syncing public/semtext/.',
  generatedFrom: {
    manifest: 'public/semtext/semtext-manifest.json',
    fallback: 'public/semtext/semtext-fallback.js',
  },
  notShippedUpstream: ['semtext.js', 'npl.js', 'npl-lazy.js', 'npl-chunks/', 'semtext-js-shell.js', 'semtext-agent.js'],
  tags,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `bundles.json: ${Object.keys(tags).length} tags — ` +
    `${lazyTags.size} lazy chunks, ${fallbackTags.size} fallback-covered, ${unbundled.length} with no shipped runtime ` +
    `(${unbundled.join(', ') || 'none'})`,
);
