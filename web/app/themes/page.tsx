import type { Metadata } from "next";
import { ThemeGenerator } from "@/components/theme-generator";

export const metadata: Metadata = {
  title: "Themes — SemText",
  description:
    "SemText themes: token files behind a data-sem-theme attribute, light and dark from one definition, zero-JS theming — plus a generator that emits a complete theme file.",
  alternates: { canonical: "https://semtext.dev/themes/" },
};

/*
 * The Themes page — the standalone home for theme creation (the landing
 * section's generator lives here in full). The copy states the spec's
 * conventions (spec/conventions.md §6, v0.6): the five shipped themes ride
 * in the consolidated /semtext/latest/ bundle and render side by side on
 * /themes/showcase/; this site's own rendered examples keep loading the
 * pinned /semtext/themes/ files, and the page says so rather than implying
 * otherwise.
 */

export default function ThemesPage() {
  return (
    <div className="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p className="g-eyebrow">Platform</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Themes
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          A SemText theme is a token file, not a stylesheet fork: every{" "}
          <code className="font-mono">--sem-*</code> custom property a
          component or a handler reads, defined once per theme and switched
          by one attribute —{" "}
          <code className="font-mono">data-sem-theme="&lt;slug&gt;"</code>.
          Structural rules live in the vocabulary base; a theme only sets the
          values.
        </p>

        <h2 id="how" className="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          How theming works
        </h2>
        <ul className="mt-4 flex max-w-3xl flex-col gap-2.5 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code className="font-mono">data-sem-theme</code> goes on{" "}
            <code className="font-mono">&lt;html&gt;</code> for a document —
            one theme per document — or on any subtree, which is how the
            examples on this site theme themselves inside an unthemed page.
          </li>
          <li>
            The vocabulary base gives every{" "}
            <code className="font-mono">sem-*</code> element its box before
            any theme is defined; a theme file only carries the{" "}
            <code className="font-mono">--sem-*</code> values.
          </li>
          <li>
            Light and dark come from one definition: a{" "}
            <code className="font-mono">[data-color-mode="dark"]</code> block,
            plus a{" "}
            <code className="font-mono">prefers-color-scheme</code> fallback
            the attribute can force either way.
          </li>
          <li>
            Shadow components read tokens through fallback indirection, so
            switching a theme needs no script — theming is zero-JS, like
            everything else that carries meaning.
          </li>
          <li>
            v0.6 ships the themes consolidated: one stylesheet,{" "}
            <code className="font-mono">
              semtext/latest/semtext.css
            </code>
            , carries the vocabulary base and{" "}
            <strong>every shipped theme</strong>, each scoped under{" "}
            <code className="font-mono">
              html[data-sem-theme="&lt;slug&gt;"]
            </code>{" "}
            — and when the attribute is absent the default (
            <code className="font-mono">minimal-tech-light</code>) applies.
            The conventions are §6 of{" "}
            <a
              href="/spec/semtext.html"
              className="text-violet-soft underline-offset-4 hover:underline"
            >
              the spec
            </a>
            .
          </li>
        </ul>

        <h2 id="shipped" className="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          What ships here
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          v0.6 ships <strong>five</strong> themes:{" "}
          <code className="font-mono">minimal-tech-light</code> (default),{" "}
          <code className="font-mono">nocturne-console</code>,{" "}
          <code className="font-mono">organic-warm</code>,{" "}
          <code className="font-mono">editorial-settings</code> and{" "}
          <code className="font-mono">newsprint</code> — all in the
          consolidated <code className="font-mono">/semtext/latest/</code>{" "}
          bundle. See them render the same sample document on{" "}
          <a
            href="/themes/showcase/"
            className="text-violet-soft underline-offset-4 hover:underline"
          >
            the theme showcase
          </a>
          . This site&apos;s own rendered examples still load the pinned{" "}
          <code className="font-mono">/semtext/themes/</code> files;{" "}
          <code className="font-mono">minimal-tech-light</code> remains the
          default theme.
        </p>

        <h2 id="create" className="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          Create a theme
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          Pick a name, background, text and accent; the generator emits a
          complete theme file with light and dark variants and the{" "}
          <code className="font-mono">prefers-color-scheme</code> fallback.
          Drop it in your document&apos;s{" "}
          <code className="font-mono">themes/</code> folder (the distribution
          folder form), link it after{" "}
          <code className="font-mono">semtext.css</code>, and set the{" "}
          <code className="font-mono">data-sem-theme</code> attribute to your
          name.
        </p>
        <ThemeGenerator />
      </main>
    </div>
  );
}
