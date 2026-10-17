/**
 * build-latest — assemble the consolidated v0.6 `latest` bundle.
 *
 * Emits, to every surface serving static assets:
 *   <out>/semtext.css   vocabulary base + _default + v0.6 additions + ALL
 *                       five themes (each scoped under
 *                       html[data-sem-theme="<slug>"]; default = tokens on
 *                       html:not([data-sem-theme]))
 *   <out>/semtext.js    the vendored runtime (app/backend/priv/static/
 *                       semtext/v0.9.0/semtext.js, COPIED VERBATIM — never
 *                       edited) + runtime/semtext-v06.js (this repo's
 *                       extension layer)
 *   <out>/themes/*.css  the per-theme token files (for pinned documents)
 *
 * The vocabulary base is the SYNCED 0.8.3 vocabulary
 * (web/public/semtext/themes/_vocabulary.css, refreshed by sync-bundles),
 * not the stale root themes/ copy — the v0.6 layer (_v06.css + themes +
 * runtime/semtext-v06.js) is authored to layer additively on top of it.
 *
 * Outputs: web/public/semtext/latest/ and
 * app/backend/priv/static/semtext/latest/. The rest of each latest/
 * directory (chunks, lazy, manifests — the sync-bundles.mjs output) is
 * left untouched; re-running sync-bundles.mjs overwrites semtext.css /
 * semtext.js with the plain 0.9.0 sync, so re-run this script after any
 * such sync.
 *
 * Usage: node scripts/build-latest.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const repo = resolve(here, '..');

const VENDORED = resolve(repo, 'app/backend/priv/static/semtext/v0.9.0/semtext.js');
const OUTS = [
  resolve(repo, 'web/public/semtext/latest'),
  resolve(repo, 'app/backend/priv/static/semtext/latest'),
];

// [source path, name under <out>/themes/]. The vocabulary base is the
// synced 0.9.0 vocabulary so the layer tracks future sync-bundles
// refreshes; every other part is this repo's v0.6 layer.
const CSS_PARTS = [
  ['web/public/semtext/themes/_vocabulary.css', '_vocabulary.css'],
  ['themes/_default.css', '_default.css'],
  ['themes/_v06.css', '_v06.css'],
  ['themes/minimal-tech-light.css', 'minimal-tech-light.css'],
  ['themes/nocturne-console.css', 'nocturne-console.css'],
  ['themes/organic-warm.css', 'organic-warm.css'],
  ['themes/editorial-settings.css', 'editorial-settings.css'],
  ['themes/newsprint.css', 'newsprint.css'],
];
const THEME_FILES = [
  ...CSS_PARTS,
];

const banner = (title, note) => `/* SemText — ${title}
   Assembled by scripts/build-latest.mjs (spec v0.6). ${note}
   Do not hand-edit: change the sources and rebuild. */
`;

for (const [src] of CSS_PARTS) {
  if (!readFileSync(resolve(repo, src), 'utf8')) throw new Error(`empty theme part: ${src}`);
}

const css = banner('consolidated stylesheet (latest)',
  '0.8.3 vocabulary base, default theme, v0.6 structural additions, and all five themes.') +
  CSS_PARTS.map(([src]) => readFileSync(resolve(repo, src), 'utf8').trim()).join('\n\n') + '\n';

const vendored = readFileSync(VENDORED, 'utf8');
const extension = readFileSync(resolve(repo, 'runtime/semtext-v06.js'), 'utf8');
const js = banner('runtime bundle (latest)',
  `vendored runtime v0.8.3 (verbatim) + semtext.dev v0.6 extension layer (global SemTextV06, v${'0.6'}).`) +
  vendored.trimEnd() + '\n\n' + extension + '\n';

for (const out of OUTS) {
  mkdirSync(resolve(out, 'themes'), { recursive: true });
  writeFileSync(resolve(out, 'semtext.css'), css);
  writeFileSync(resolve(out, 'semtext.js'), js);
  for (const [src, name] of THEME_FILES) {
    writeFileSync(resolve(out, 'themes', name), readFileSync(resolve(repo, src), 'utf8'));
  }
  console.log(`built ${out}`);
}
console.log(`semtext.css ${(css.length / 1024).toFixed(1)} KB, semtext.js ${(js.length / 1024).toFixed(1)} KB`);
