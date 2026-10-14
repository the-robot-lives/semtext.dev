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
 *   public/semtext/npl-manifest.json       npl-* tag -> npl-chunks/ path;
 *                                          absent before the first npl sync
 *   public/semtext/semtext-fallback.js     the shipped fallback bundle; its
 *                                          selector helpers name the tags the
 *                                          enhancement tier handles
 *   data/elements.json + data/reference-glossary.ts
 *                                          the tag universe (every name the
 *                                          reference renders a page for)
 *
 * Writes data/bundles.json: for every reference tag, which shipped JS file(s)
 * provide it — `semtext-lazy.js` (plus which chunk), `npl-lazy.js` (plus
 * which npl-chunks/ chunk), `semtext-fallback.js`, or none. Companion/alias
 * names (a file's non-primary tags: `sem-detail`, `sem-fact`, `statement`,
 * …) inherit their primary's list via `sharedWith`. Nothing here is
 * hand-maintained: re-run after every sync of public/semtext/ (the lead's
 * bundle sync should run this right after the copy).
 *
 * Not shipped on this site: semtext-agent.js (CLI-only upstream build
 * target). semtext-fallback.js ships as a frozen legacy artifact the build
 * no longer emits; semtext.js, semtext-js-shell.js and the npl namespace
 * (npl.js / npl-lazy.js / npl-chunks/) ship since the 2026-10-14 sync.
 * semtext-agent.js (CLI-only). Tag pages say so instead of implying a
 * runtime exists.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MANIFEST = resolve(root, 'public/semtext/semtext-manifest.json');
const FALLBACK = resolve(root, 'public/semtext/semtext-fallback.js');
const VOCAB = resolve(root, 'public/semtext/themes/_vocabulary.css');
const THEME = resolve(root, 'public/semtext/themes/minimal-tech-light.css');
const FULL_BUNDLE = resolve(root, 'public/semtext/semtext.js');
const NPL_BUNDLE = resolve(root, 'public/semtext/npl.js');
const NPL_MANIFEST = resolve(root, 'public/semtext/npl-manifest.json');
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
/** npl-* tag -> npl-chunks/ chunk path, once the npl sync has landed.
 * Null before the first npl sync — the honest per-tag notes then say so. */
const nplManifest = existsSync(NPL_MANIFEST)
  ? JSON.parse(readFileSync(NPL_MANIFEST, 'utf8'))
  : null;
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

// ---------- theme-CSS provenance (cssOnly) ----------

/** Selector text of the shipped theme stylesheets: comments stripped, every
 * rule's selector run joined. A missing sheet (not yet synced) contributes
 * nothing instead of failing the map — the shipped copy is the truth about
 * what the site can paint today, and the phase-2 sync regenerates the map
 * with the fresh sheet. */
function selectorCorpus(files) {
  const parts = [];
  for (const f of files) {
    let src = '';
    try {
      src = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    const css = src.replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of css.matchAll(/(^|\})([^{}@]+)\{/g)) parts.push(m[2]);
  }
  return parts.join('\n');
}

/** Tags the shipped theme stylesheets paint with zero JavaScript: the tag's
 * name (element or class form — both are the same name token) appears in a
 * selector. Boundary-bounded like the fallback pass, so `.sem-md-label`
 * never matches `sem-md` and `sem-details` never matches `sem-detail`. The
 * vocabulary sheet carries the structural paint, the theme file the
 * colours; the render pane loads both for every example, so a tag matched
 * here renders truthfully in a JS-off browser (the sem-event /
 * sem-chronology / sem-procedure / sem-step family — and any display-only
 * npl-* tag once the vocabulary sync lands its blocks). */
const cssPainted = new Set();
const cssCorpus = selectorCorpus([VOCAB, THEME]);
if (cssCorpus) {
  for (const name of byName.keys()) {
    if (new RegExp(`(^|[^a-z0-9-])${name}(?![a-z0-9-])`).test(cssCorpus)) {
      cssPainted.add(name);
    }
  }
}

/** Class-form alias wiring for the example pane. The sem lazy tier's scan
 * is tag-shaped (custom-element names only), so a `div.sem-<tag>` class
 * host enhances only under the FULL bundle, whose reading-tier selectors
 * cover both spellings. The npl namespace needs no entry: its class-form
 * aliases upgrade under npl-lazy.js as well as npl.js, so an npl tag's own
 * runtime already covers them. A namespace appears here only while the
 * extra file actually ships in public/semtext/ — until the bundle sync
 * lands, class-form examples keep the honest note instead of a dead
 * script tag. */
const aliasRuntime = {};
if (existsSync(FULL_BUNDLE)) aliasRuntime.sem = 'semtext.js';

// ---------- per-tag provenance ----------

/** Runtime provided to a generated primary tag: chunk first (the Lit
 * component), then the fallback enhancement tier — the same order a reader
 * should care about. */
function primaryBundles(name) {
  const out = [];
  if (manifest[name]) {
    out.push({
      file: 'semtext-lazy.js',
      detail: `loads ${manifest[name]}`,
      chunk: manifest[name],
    });
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
    if (nplManifest && nplManifest[name]) {
      // The npl namespace ships since the 2026-10-14 sync: the pane loads
      // the chunk directly (never npl-lazy.js, which document-scans with
      // no off switch) — same entry shape as the sem lazy tier.
      tags[name] = {
        shipped: true,
        bundles: [
          { file: 'npl-lazy.js', detail: `loads ${nplManifest[name]}`, chunk: nplManifest[name] },
        ],
      };
    } else if (cssPainted.has(name)) {
      tags[name] = {
        shipped: false,
        cssOnly: true,
        note: 'no shipped runtime — the shipped theme CSS (themes/_vocabulary.css) paints the authored example',
      };
    } else {
      tags[name] = {
        shipped: false,
        note: 'no shipped runtime — the npl-* namespace has not been synced into public/semtext/',
      };
      unbundled.push(name);
    }
    continue;
  }
  const own = primaryBundles(name);
  if (own.length) {
    tags[name] = { shipped: true, bundles: own };
  } else {
    const primary = sharedWith(name, rec);
    if (primary && (manifest[primary] || fallbackTags.has(primary))) {
      tags[name] = { shipped: true, sharedWith: primary, bundles: primaryBundles(primary) };
    } else if (cssPainted.has(name)) {
      // Zero-JS by contract, painted by the shipped theme CSS: the render
      // pane mounts for these (the vocabulary sheet styles the authored
      // markup), so the gate and the RuntimeLine must not claim the example
      // "renders as plain HTML".
      tags[name] = {
        shipped: false,
        cssOnly: true,
        note: 'no shipped runtime — the shipped theme CSS (themes/_vocabulary.css) paints the authored example',
      };
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
    nplManifest: 'public/semtext/npl-manifest.json',
    fallback: 'public/semtext/semtext-fallback.js',
    themeCss: 'public/semtext/themes/_vocabulary.css',
  },
  notShippedUpstream: ['semtext-agent.js'],
  // Class-form alias wiring for the render pane (see the aliasRuntime
  // section above). Non-empty while the full bundle ships in public/semtext/
  // — the sync derives it, never hand-set.
  aliasRuntime,
  tags,
};

writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
console.log(
  `bundles.json: ${Object.keys(tags).length} tags — ` +
    `${lazyTags.size} lazy chunks, ${fallbackTags.size} fallback-covered, ${unbundled.length} with no shipped runtime ` +
    `(${unbundled.join(', ') || 'none'})`,
);
