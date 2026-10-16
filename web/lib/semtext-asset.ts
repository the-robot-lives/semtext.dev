/**
 * SemText asset URLs — THE one helper. Every place the site references a
 * runtime bundle, theme stylesheet or manifest under /semtext/ goes through
 * these functions; no component hard-codes a version or an asset path.
 *
 * URL scheme (served with the matching cache policy in the repo-root
 * nginx.conf; maintained by scripts/sync-bundles.mjs):
 *
 *   /semtext/v<semver>/<file>?v=<epoch>   pinned snapshot of the stable
 *                                         release + this site build's
 *                                         epoch. The path addresses an
 *                                         immutable directory (cacheable
 *                                         forever); the ?v= additionally
 *                                         revalidates per site deploy.
 *   /semtext/stable/<file>                newest non-prerelease (short cache)
 *   /semtext/latest/<file>                newest incl. prereleases (short cache)
 *   /semtext/<file>                       unversioned alias of stable
 *                                         (short cache; pre-versioning URLs)
 *
 * Pages pin: anything THIS site loads itself uses semtextAsset(). The
 * stable/latest/alias forms exist for documentation copy and for embeds we
 * do not control (demo fixtures under public/demo use semtextStable so they
 * always run current stable without re-publishing).
 */

import { BUILD_EPOCH, SEMTEXT_VERSION } from "./semtext-build-info";

export { BUILD_EPOCH, SEMTEXT_VERSION };

/** Base of the immutable snapshot this build pins, e.g. `/semtext/v0.1.0`. */
export const SEMTEXT_PINNED_BASE = `/semtext/v${SEMTEXT_VERSION}`;

/**
 * Pinned asset URL for a file inside the synced runtime set
 * (`semtext.js`, `semtext-lazy.js`, `chunks/sem-note.js`,
 * `themes/_vocabulary.css`, …). Relative names resolve inside the
 * versioned directory, so hash-named lazy chunks stay co-located with
 * the loader that imports them.
 */
export function semtextAsset(file: string): string {
  return `${SEMTEXT_PINNED_BASE}/${file.replace(/^\//, "")}?v=${BUILD_EPOCH}`;
}

/** Newest non-prerelease, refreshable mirror (short cache). */
export function semtextStable(file: string): string {
  return `/semtext/stable/${file.replace(/^\//, "")}`;
}

/** Newest version including prereleases (short cache). */
export function semtextLatest(file: string): string {
  return `/semtext/latest/${file.replace(/^\//, "")}`;
}

/** Unversioned alias of stable (short cache; the pre-versioning URLs). */
export function semtextAlias(file: string): string {
  return `/semtext/${file.replace(/^\//, "")}`;
}
