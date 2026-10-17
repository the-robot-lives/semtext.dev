// Unit spec — the image ships every asset the spec snapshot page needs
//
// Feature: /spec/semtext.html must not ship broken asset links
//   Scenario: every asset path the snapshot page references resolves inside
//     web/public/ — the tree that becomes the image's web root (web/out).
//
// History: the pre-web image served the vite-built dist/spec/conventions.html
// and a regression let the Dockerfile drop one of its cross-dist COPYs; nginx's
// SPA fallback then silently served the landing page instead of the asset. The
// old guard parsed the old Dockerfile COPY lines against the old built page.
// The web/ export replaced that build (fix/ship-web), so the invariant moved:
// the snapshot page (web/public/spec/semtext.html) must resolve every ref
// within web/public/ itself — absolute refs (/semtext/…) against web/public/,
// relative refs (spec.css) against web/public/spec/. A missing file is a real
// 404 now, which is exactly why the guard still exists.
//
// The carry of old spec/spec.css into web/public/spec/ is pinned separately:
// it has no authoring source under web/ and was copied in by the ship lane,
// so a cleanup that deletes it must fail here, not in production.

import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { specAssetRefs } from '../../scripts/standalone-lib.mjs';

const ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SPEC_PAGE = path.join(ROOT, 'web/public/spec/semtext.html');
const SPEC_PUBLIC = path.join(ROOT, 'web/public');
const DOCKERFILE = path.join(ROOT, 'Dockerfile');

/** Asset refs only (css/js/images/fonts) — what shipping a broken link to
 * means here. Page links (<a href="/reference/…">) target app routes that the
 * export generates into out/, not web/public/ files, so they are not checked
 * against the public tree. */
const ASSET_RE = /\.(css|js|mjs|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot)$/i;

/** Every ASSET ref the snapshot page makes, as a web/public/-relative path. */
function specPageAssetRefs() {
  const html = readFileSync(SPEC_PAGE, 'utf8');
  return specAssetRefs(html).map((r) => r.rel).filter((rel) => ASSET_RE.test(rel));
}

describe('Dockerfile ships the web/ export and the spec snapshot resolves inside it', () => {
  it('production stage COPYs the export to the nginx html root', () => {
    const dockerfile = readFileSync(DOCKERFILE, 'utf8');
    expect(dockerfile).toMatch(/COPY --from=web-builder \/app\/out\/\s+\/usr\/share\/nginx\/html\/$/m);
    // The final stage name is fleet tooling contract (build-push-action target).
    expect(dockerfile).toMatch(/AS production$/m);
  });

  it('every asset ref the snapshot page makes exists under web/public/', () => {
    const refs = specPageAssetRefs();
    expect(refs.length).toBeGreaterThan(0);
    const missing = refs.filter((rel) => !existsSync(path.join(SPEC_PUBLIC, rel)));
    expect(missing, `spec snapshot references assets missing from web/public/ (they will 404 from the image): ${missing.join(', ')}`).toEqual([]);
  });

  it('sanity: the snapshot page actually references the runtime + themes', () => {
    // Guards the guard: if the page ever stops referencing these, the check
    // above would trivially pass with an empty ref set.
    const refs = specPageAssetRefs();
    expect(refs).toContain('semtext/semtext.js');
    expect(refs.some((r) => r.startsWith('semtext/themes/'))).toBe(true);
  });

  it('the carried spec.css is present (no authoring source under web/ — pinned)', () => {
    expect(existsSync(path.join(SPEC_PUBLIC, 'spec/spec.css'))).toBe(true);
  });
});
