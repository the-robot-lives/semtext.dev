#!/usr/bin/env node
/**
 * scripts/sync-bundles.mjs — copy a freshly built runtime bundle set from
 * the npl-enhanced-content build into the site's public/semtext/ and
 * regenerate data/bundles.json. Run by hand after an upstream build:
 *
 *   node scripts/sync-bundles.mjs --from <npl-build-dir> [--site <web-root>] [--version <semver>] [--dry-run]
 *
 *   --from     REQUIRED. The build out dir. Since upstream stamps its
 *              builds (scripts/stamp-version.mjs) this can be the npl
 *              repo's dist/ — the versioned snapshot dist/v<semver>/ and
 *              dist/version.json travel with it.
 *   --site     Web root to sync into. Default: this checkout's web/ (the
 *              parent of scripts/).
 *   --version  Override the version tag (normally read from
 *              <from>/version.json, written by the upstream stamp step).
 *   --dry-run  Print the plan (copy/same/skip/delete/regen) without writing.
 *
 * URL scheme this maintains (see nginx.conf for the matching cache policy):
 *
 *   /semtext/v<semver>/…   immutable snapshot of one released state — a
 *                          NEW directory per version; existing ones are
 *                          never rewritten in place (a re-sync of the SAME
 *                          version with changed bytes wipes + republishes
 *                          that one directory and says so loudly)
 *   /semtext/stable/…      mirror of the newest NON-prerelease (short cache)
 *   /semtext/latest/…      mirror of the newest version incl. prereleases
 *   /semtext/…             unversioned alias of stable (short cache; the
 *                          pre-versioning URL, kept for existing embeds)
 *   /semtext/versions.json index: { stable, latest, versions[] }
 *   /semtext/VERSION.md    human-readable provenance note
 *
 * Idempotent: a file is copied only when its sha256 differs from the
 * destination. Chunk dirs are mirrored: hash-named files the incoming dirs
 * no longer carry are deleted as stale; anything not hash-named is reported
 * and left alone. The retired `semtext-fallback.js` is gone as of runtime
 * 0.9.0: old version directories keep their published copies, but no new
 * snapshot (and no refreshed mirror) carries it.
 *
 * After the copies it re-runs scripts/build-bundle-map.mjs so
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
  writeFileSync,
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
  console.log('see the header comment in scripts/sync-bundles.mjs');
  process.exit(0);
}

const webRoot = resolve(
  argOf('--site') ?? dirname(dirname(fileURLToPath(import.meta.url))),
);
const from = argOf('--from');
const versionOverride = argOf('--version');
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

/** The runtime set one URL family carries: full bundles + lazy loaders +
 *  manifests + chunk dirs + stylesheets. `srcBase` is a dist root (the
 *  upstream build layout); `dstBase` is the directory serving it. */
function copyRuntimeSet(srcBase, dstBase, label) {
  for (const f of [
    'semtext.js',
    'semtext.css',
    'semtext-lazy.js',
    'semtext-manifest.json',
    'npl.js',
    'npl-lazy.js',
    'npl-manifest.json',
    'semtext-js-shell.js',
    'semtext-js-shell-manifest.json',
    'semtext-editor.js',
  ]) {
    copyFile(join(srcBase, f), join(dstBase, f), `${label}/${f}`);
  }
  mirrorDir(join(srcBase, 'chunks'), join(dstBase, 'chunks'), `${label}/chunks`);
  mirrorDir(join(srcBase, 'npl-chunks'), join(dstBase, 'npl-chunks'), `${label}/npl-chunks`);
  mirrorDir(join(srcBase, 'themes'), join(dstBase, 'themes'), `${label}/themes`);

  // Site-facing theme names, INSIDE every published tree: the layout and
  // the viewers load `themes/_vocabulary.css` + `themes/minimal-tech-light.css`;
  // upstream ships the latter under its `semtext-theme-` prefix. Without
  // this alias a pinned /semtext/v<ver>/themes/minimal-tech-light.css 404s.
  const themeDir = join(dstBase, 'themes');
  if (existsSync(themeDir)) {
    const up = readdirSync(themeDir).find((f) => /minimal-tech-light/.test(f));
    if (up && up !== 'minimal-tech-light.css') {
      copyFile(join(themeDir, up), join(themeDir, 'minimal-tech-light.css'), `${label}/themes/minimal-tech-light.css (site name)`);
    }
  }
}

// ---------------------------------------------------------------- versions --

/** Loose semver: `1.2.3` plus optional `-prerelease`/`+build` (build metadata
 *  is ignored for ordering, per semver). Returns null when unparseable. */
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/.exec(v ?? '');
  if (!m) return null;
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ?? null };
}
const isPrerelease = (v) => parseSemver(v)?.pre != null;

/** semver precedence: numeric fields, then prerelease (absence wins; a
 *  numeric identifier compares numerically and ranks below alphanumeric). */
function semverGt(a, b) {
  const A = parseSemver(a);
  const B = parseSemver(b);
  if (!A || !B) return false;
  for (const k of ['major', 'minor', 'patch']) {
    if (A[k] !== B[k]) return A[k] > B[k];
  }
  if (A.pre === null) return B.pre !== null; // release > any prerelease
  if (B.pre === null) return false;
  const ids = (s) => s.split('.').map((id) => (/^\d+$/.test(id) ? { n: +id } : { s: id }));
  const xa = ids(A.pre);
  const xb = ids(B.pre);
  for (let i = 0; i < Math.max(xa.length, xb.length); i++) {
    if (xa[i] === undefined) return true; // longer prerelease set wins
    if (xb[i] === undefined) return false;
    if (xa[i].n !== undefined && xb[i].n !== undefined && xa[i].n !== xb[i].n) return xa[i].n > xb[i].n;
    if (xa[i].n !== undefined) return false; // numeric < alphanumeric
    if (xb[i].n !== undefined) return true;
    if (xa[i].s !== xb[i].s) return xa[i].s > xb[i].s;
  }
  return false;
}

// --------------------------------------------------------- resolve version --

const versionJsonPath = join(from, 'version.json');
let version = versionOverride ?? null;
if (!version && existsSync(versionJsonPath)) {
  try {
    version = JSON.parse(readFileSync(versionJsonPath, 'utf8')).version ?? null;
  } catch {
    /* fall through to the v* scan */
  }
}
if (!version) {
  // Upstream without a stamp step: take the highest semver among dist/v*/
  const stamped = readdirSync(from)
    .filter((d) => parseSemver(d.startsWith('v') ? d.slice(1) : d))
    .sort((a, b) => (semverGt(a, b) ? -1 : 1));
  if (stamped.length > 0) version = stamped[0].startsWith('v') ? stamped[0].slice(1) : stamped[0];
}
if (!version || !parseSemver(version)) {
  console.error(
    'sync-bundles: no version — <from>/version.json missing (run the upstream `npm run build`, which stamps it) or pass --version <semver>',
  );
  process.exit(2);
}

/** Source of the copy: a stamped snapshot when --from carries one, else the
 *  dist root itself (same layout, unstamped). */
const stampDir = join(from, `v${version}`);
const srcBase = existsSync(stampDir) ? stampDir : from;
if (existsSync(stampDir)) plan.push(`note   source snapshot: ${relative(from, stampDir)}/`);
else plan.push(`note   no stamped v${version}/ in --from — copying the dist root (unstamped source)`);

// ------------------------------------------------------------ version index --

const versionsPath = join(pub, 'versions.json');
let index = { stable: null, latest: null, versions: [] };
if (existsSync(versionsPath)) {
  try {
    const parsed = JSON.parse(readFileSync(versionsPath, 'utf8'));
    index = {
      stable: parsed.stable ?? null,
      latest: parsed.latest ?? null,
      versions: Array.isArray(parsed.versions) ? parsed.versions : [],
    };
  } catch {
    plan.push('warn   public/semtext/versions.json unparseable — starting a fresh index');
  }
}
const firstPublish = index.versions.length === 0;
/** Re-syncing a tag that is already published wipes + republishes its
 *  directory — so any mirror pointing at that same version must refresh
 *  too, or it silently keeps the stale copy. */
const republished = index.versions.includes(version);
if (republished) {
  plan.push(
    `warn   version ${version} already published — re-syncing the same tag; the v${version}/ directory is wiped and republished (immutable in principle, same-tag refresh is a bootstrap-phase move)`,
  );
} else {
  index.versions.push(version);
}
index.versions.sort((a, b) => (semverGt(a, b) ? -1 : 1));

// --------------------------------------------------------- 1. versioned dir --

const vDir = join(pub, `v${version}`);
if (!dry && index.versions.includes(version)) rmSync(vDir, { recursive: true, force: true });
copyRuntimeSet(srcBase, vDir, `semtext/v${version}`);

// ------------------------------------------------------ 2. stable / latest --

/** Publish `srcDir` as the named mirror (stable/ or latest/): exact
 *  replacement, so a refreshed mirror can never keep stale hash-named
 *  chunks from a previous build. */
function refreshMirror(name, srcDir) {
  const dst = join(pub, name);
  plan.push(`sync   public/semtext/${name}/ <- v${version}/ (mirror refresh)`);
  if (dry) return;
  rmSync(dst, { recursive: true, force: true });
  cpSync(srcDir, dst, { recursive: true });
}

if (!isPrerelease(version)) {
  if (
    firstPublish ||
    index.stable === null ||
    semverGt(version, index.stable) ||
    (republished && index.stable === version)
  ) {
    index.stable = version;
    refreshMirror('stable', vDir);
  } else {
    plan.push(`keep   stable/ (${index.stable} — incoming ${version} is not newer)`);
  }
} else {
  plan.push(`keep   stable/ (${index.stable ?? 'unset'} — ${version} is a prerelease)`);
}
if (firstPublish || index.latest === null || semverGt(version, index.latest) || (republished && index.latest === version)) {
  index.latest = version;
  refreshMirror('latest', vDir);
} else {
  plan.push(`keep   latest/ (${index.latest} — incoming ${version} is not newer)`);
}

// ------------------------------------------------------ 3. versions.json --

const epoch = Math.floor(Date.now() / 1000);
plan.push('write  public/semtext/versions.json (index)');
if (!dry) {
  writeFileSync(versionsPath, JSON.stringify({ stable: index.stable, latest: index.latest, versions: index.versions }, null, 2) + '\n');
}

// --------------------------------------- 4. unversioned alias of stable --

/** The alias mirrors STABLE — never the incoming build when that is a
 *  prerelease. Falls back to the incoming snapshot before the first final
 *  release (with a warning), so a first prerelease sync still serves. */
const aliasSrcVersion = index.stable ?? version;
if (!index.stable) {
  plan.push(`warn   no stable version yet — the alias mirrors ${version} until the first final release`);
}
if (aliasSrcVersion === version) {
  copyRuntimeSet(srcBase, pub, 'semtext');
} else {
  copyRuntimeSet(join(pub, `v${aliasSrcVersion}`), pub, 'semtext');
}

// Themes: the site's own names on top of the copied set — the vocabulary
// sheet verbatim (also as themes/_vocabulary.css), the theme file under the
// site's name. A build that only carries the flattened sheet still gets its
// content under the themes/ path the example viewer fetches. (The versioned
// mirror above already carries the upstream names; these keep the alias
// stable for embeds that never moved off them.)
const vocabUp = join(srcBase, 'themes', '_vocabulary.css');
const vocabFlat = join(srcBase, 'semtext.css');
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
const themeUp = existsSync(join(srcBase, 'themes'))
  ? readdirSync(join(srcBase, 'themes')).find((f) => /minimal-tech-light/.test(f))
  : undefined;
if (themeUp) {
  copyFile(
    join(srcBase, 'themes', themeUp),
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

// ------------------------------------------------------ 5. VERSION.md --

plan.push('write  public/semtext/VERSION.md (provenance note)');
if (!dry) {
  writeFileSync(
    join(pub, 'VERSION.md'),
    [
      '# SemText runtime — synced bundles',
      '',
      `- stable: ${index.stable ?? '(none yet)'}`,
      `- latest: ${index.latest ?? '(none yet)'}`,
      `- this unversioned directory mirrors stable ${aliasSrcVersion}`,
      `- last sync: ${new Date(epoch * 1000).toISOString()} (epoch ${epoch}), source ${relative(webRoot, from) || from}`,
      '',
      'URL scheme: `/semtext/v<semver>/` is an immutable per-release snapshot;',
      '`/semtext/stable/` and `/semtext/latest/` are refreshable mirrors;',
      '`/semtext/` (this directory) is the unversioned alias of stable.',
      'Index: `/semtext/versions.json`. See `scripts/sync-bundles.mjs` and `nginx.conf`.',
      '',
    ].join('\n'),
  );
}

// --------------------------------------------- regenerate data/bundles.json --

plan.push('regen  data/bundles.json (scripts/build-bundle-map.mjs)');
if (!dry) {
  execFileSync(process.execPath, [MAP_SCRIPT], { stdio: 'inherit' });
}

console.log(
  `sync-bundles: version ${version} (stable ${index.stable ?? '—'}, latest ${index.latest ?? '—'}) ${dry ? 'DRY RUN — nothing written\n' : ''}${plan.join('\n')}`,
);
