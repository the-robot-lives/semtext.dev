#!/usr/bin/env node
/**
 * scripts/sync-bundles.mjs — copy a freshly built runtime bundle set from
 * the npl-enhanced-content build into the site's public/semtext/ and
 * regenerate data/bundles.json. PREPARED FOR PHASE 2 (the lead's bundle
 * sync); run by hand, not wired into any npm script yet:
 *
 *   node scripts/sync-bundles.mjs --from <npl-build-dir> [--site <web-root>] [--dry-run]
 *
 *   --from     REQUIRED. The build out dir (`scripts/build.mjs --out <dir>`
 *              in the npl epic worktree; artifacts sit directly in it, no
 *              nested dist/). The npl repo's dist/ works too — same layout.
 *   --site     Web root to sync into. Default: this checkout's web/ (the
 *              parent of scripts/).
 *   --dry-run  Print the plan (copy/same/skip/delete/regen) without writing.
 *
 * Idempotent: a file is copied only when its sha256 differs from the
 * destination. Chunk dirs are mirrored: hash-named files the incoming dirs
 * no longer carry are deleted as stale; anything not hash-named is reported
 * and left alone. `semtext-fallback.js` is copied only when the build still
 * emits it (retired upstream — the site's frozen legacy copy is otherwise
 * preserved). After the copy it re-runs scripts/build-bundle-map.mjs so
 * data/bundles.json (shipped/cssOnly/aliasRuntime) always describes exactly
 * what was just synced.
 */

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// ------------------------------------------------------------------ args --

const argv = process.argv.slice(2);
const argOf = (flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(
    import.meta.url.endsWith('sync-bundles.mjs')
      ? 'see the header comment in scripts/sync-bundles.mjs'
      : '',
  );
  process.exit(0);
}

const webRoot = resolve(
  argOf('--site') ?? dirname(dirname(fileURLToPath(import.meta.url))),
);
const from = argOf('--from');
const dry = argv.includes('--dry-run');
if (!from || !existsSync(from)) {
  console.error('sync-bundles: --from <npl-build-dir> is required and must exist');
  process.exit(2);
}

const pub = resolve(webRoot, 'public', 'semtext');
const pubSpec = resolve(webRoot, 'public', 'spec');
const MAP_SCRIPT = resolve(webRoot, 'scripts', 'build-bundle-map.mjs');
/** Vite chunk/artifact names: `base-<8 hash chars>.<ext>`. */
const HASHED = /-[A-Za-z0-9_-]{8}\.(js|css|map)$/;
const plan = [];

// ------------------------------------------------------------- mechanics --

const sha256 = (p) => createHash('sha256').update(readFileSync(p)).digest('hex');

function copyFile(src, dst, label) {
  const rel = relative(webRoot, dst);
  if (!existsSync(src)) {
    plan.push(`skip   ${label ?? rel} (absent in --from)`);
    return;
  }
  if (existsSync(dst) && sha256(src) === sha256(dst)) {
    plan.push(`same   ${rel}`);
    return;
  }
  plan.push(`copy   ${rel}  (${statSync(src).size} B)`);
  if (dry) return;
  mkdirSync(dirname(dst), { recursive: true });
  cpSync(src, dst);
}

function mirrorDir(srcDir, dstDir, label) {
  const incoming = existsSync(srcDir) ? new Set(readdirSync(srcDir)) : new Set();
  if (incoming.size === 0 && !existsSync(srcDir)) {
    plan.push(`skip   ${label}/ (absent in --from)`);
    return;
  }
  if (!existsSync(dstDir)) {
    plan.push(`copy   ${label}/  (new, ${incoming.size} files)`);
    if (!dry) {
      mkdirSync(dstDir, { recursive: true });
      cpSync(srcDir, dstDir, { recursive: true });
    }
    return;
  }
  for (const name of readdirSync(dstDir)) {
    if (incoming.has(name)) continue;
    if (!HASHED.test(name)) {
      plan.push(`keep   ${label}/${name} (not hash-named — review by hand)`);
      continue;
    }
    plan.push(`delete ${label}/${name} (stale hash-named extra)`);
    if (!dry) rmSync(join(dstDir, name));
  }
  for (const name of incoming) {
    copyFile(join(srcDir, name), join(dstDir, name), `${label}/${name}`);
  }
}

// ------------------------------------------------------------------ copy --

for (const f of [
  'semtext-lazy.js',
  'semtext-manifest.json',
  'npl.js',
  'npl-lazy.js',
  'npl-manifest.json',
  'semtext-js-shell.js',
  'semtext-js-shell-manifest.json',
  'semtext.js',
  'semtext-fallback.js', // retired upstream — copied only when --from still emits it
]) {
  copyFile(join(from, f), join(pub, f));
}

mirrorDir(join(from, 'chunks'), join(pub, 'chunks'), 'chunks');
mirrorDir(join(from, 'npl-chunks'), join(pub, 'npl-chunks'), 'npl-chunks');

// Themes: the vocabulary sheet verbatim, the theme file under the site's
// own name. A build that only carries the flattened sheet still gets its
// content under the themes/ path the example viewer fetches.
const vocabUp = join(from, 'themes', '_vocabulary.css');
const vocabFlat = join(from, 'semtext.css');
if (existsSync(vocabUp)) {
  copyFile(vocabUp, join(pub, 'themes', '_vocabulary.css'));
} else if (existsSync(vocabFlat)) {
  copyFile(
    vocabFlat,
    join(pub, 'themes', '_vocabulary.css'),
    'themes/_vocabulary.css (from flattened semtext.css)',
  );
} else {
  plan.push('skip   themes/_vocabulary.css (no upstream sheet — STALE COPY STAYS)');
}
const themeUp = existsSync(join(from, 'themes'))
  ? readdirSync(join(from, 'themes')).find((f) =>
      /minimal-tech-light/.test(f),
    )
  : undefined;
if (themeUp) {
  copyFile(
    join(from, 'themes', themeUp),
    join(pub, 'themes', 'minimal-tech-light.css'),
    'themes/minimal-tech-light.css',
  );
} else {
  plan.push('skip   themes/minimal-tech-light.css (absent in --from)');
}

// Spec pages (schema reference the element pages link to), when built.
if (existsSync(join(from, 'spec'))) {
  plan.push('sync   public/spec/ <- from/spec/ (recursive)');
  if (!dry) {
    mkdirSync(pubSpec, { recursive: true });
    cpSync(join(from, 'spec'), pubSpec, { recursive: true });
  }
} else {
  plan.push('skip   public/spec/ (absent in --from — site copy untouched)');
}

// --------------------------------------------- regenerate data/bundles.json --

plan.push('regen  data/bundles.json (scripts/build-bundle-map.mjs)');
if (!dry) {
  execFileSync(process.execPath, [MAP_SCRIPT], { stdio: 'inherit' });
}

console.log(
  `sync-bundles: ${dry ? 'DRY RUN — nothing written\n' : ''}${plan.join('\n')}`,
);
