/**
 * Guard: the consolidated latest/ bundle must carry the v0.6 extension layer.
 *
 * Vendor syncs (scripts/sync-bundles.mjs) overwrite latest/semtext.{js,css}
 * with the plain runtime snapshot; twice this silently dropped the layer
 * assembled by scripts/build-latest.mjs (0.8.3 in #107, 0.9.5/0.9.6 in
 * #202/#238). These tests pin the layer's presence in the shipped bundle:
 * a missing layer fails the count checks, a re-appended layer (VENDORED
 * ever pointing at latest/) fails the exactly-once checks.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SEMTEXT = 'app/backend/priv/static/semtext';

const jsBundle = readFileSync(resolve(repo, SEMTEXT, 'latest/semtext.js'), 'utf8');
const cssBundle = readFileSync(resolve(repo, SEMTEXT, 'latest/semtext.css'), 'utf8');
const layerJs = readFileSync(resolve(repo, 'runtime/semtext-v06.js'), 'utf8');
const layerCss = readFileSync(resolve(repo, 'themes/_v06.css'), 'utf8');

const count = (hay, needle) => hay.split(needle).length - 1;

describe('latest/ semtext.js — v0.6 extension layer', () => {
  it('ships runtime/semtext-v06.js verbatim, exactly once', () => {
    expect(count(jsBundle, layerJs.trim()), 'double-append (layer present twice)').toBe(1);
    expect(jsBundle.includes(layerJs.trim()), 'layer missing from bundle').toBe(true);
  });

  it('defines the SemTextV06 global and stamp marker exactly as often as the layer source', () => {
    for (const marker of ['window.SemTextV06', 'data-sem-v06']) {
      expect(count(jsBundle, marker), marker).toBeGreaterThan(0);
      expect(count(jsBundle, marker), marker).toBe(count(layerJs, marker));
    }
  });

  it('carries the vendored runtime the snapshot dir ships', () => {
    const vendored = readFileSync(resolve(repo, SEMTEXT, 'v0.9.6/semtext.js'), 'utf8');
    expect(jsBundle.includes(vendored.trim()), 'stale vendored base').toBe(true);
  });
});

describe('latest/ semtext.css — _v06 rules', () => {
  it('ships themes/_v06.css verbatim, exactly once', () => {
    expect(count(cssBundle, layerCss.trim()), 'double-append (layer present twice)').toBe(1);
    expect(cssBundle.includes(layerCss.trim()), 'layer missing from bundle').toBe(true);
  });

  it('has sem-section rules only from the layer (count parity)', () => {
    expect(count(cssBundle, 'sem-section'), 'sem-section count')
      .toBe(count(layerCss, 'sem-section'));
  });
});
