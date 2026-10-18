defmodule SemtextWeb.Hologram.Pages.ThemesPage do
  @moduledoc """
  /themes/ — port of the Next site's `app/themes/page.tsx`: the standalone
  home for theme creation. The copy states the spec's conventions
  (spec/conventions.md §6) and what this site actually ships:
  public/semtext/themes/ carries the vocabulary base and minimal-tech-light
  (the default) — the other spec-named ports are not shipped here yet, and
  the page says so rather than implying otherwise. The generator is the
  `Site.ThemeGenerator` component at the bottom.
  """

  use Hologram.Page

  alias SemtextWeb.Hologram.Components.Site.ThemeGenerator
  alias SemtextWeb.Hologram.Layouts.SiteLayout

  route "/themes"
  layout SiteLayout,
    page_title: "Themes — SemText",
    description:
      "SemText themes: token files behind a data-sem-theme attribute, light and dark from one definition, zero-JS theming — plus a generator that emits a complete theme file.",
    canonical: "https://semtext.dev/themes/"

  def template do
    ~HOLO"""
    <div class="mx-auto w-full max-w-docs px-4 pb-24 pt-12 sm:px-6">
      <main id="main">
        <p class="g-eyebrow">Platform</p>
        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Themes
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-ink-mute">
          A SemText theme is a token file, not a stylesheet fork: every{" "}
          <code class="font-mono">--sem-*</code> custom property a component
          or a handler reads, defined once per theme and switched by one
          attribute —{" "}
          <code class="font-mono">data-sem-theme="&lt;slug&gt;"</code>.
          Structural rules live in the vocabulary base; a theme only sets the
          values.
        </p>

        <h2 id="how" class="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          How theming works
        </h2>
        <ul class="mt-4 flex max-w-3xl flex-col gap-2.5 text-sm leading-6 text-ink-mute" role="list">
          <li>
            <code class="font-mono">data-sem-theme</code> goes on{" "}
            <code class="font-mono">&lt;html&gt;</code> for a document — one
            theme per document — or on any subtree, which is how the examples
            on this site theme themselves inside an unthemed page.
          </li>
          <li>
            The vocabulary base gives every{" "}
            <code class="font-mono">sem-*</code> element its box before any
            theme is defined; a theme file only carries the{" "}
            <code class="font-mono">--sem-*</code> values.
          </li>
          <li>
            Light and dark come from one definition: a{" "}
            <code class="font-mono">[data-color-mode="dark"]</code> block,
            plus a <code class="font-mono">prefers-color-scheme</code>{" "}
            fallback the attribute can force either way.
          </li>
          <li>
            Shadow components read tokens through fallback indirection, so
            switching a theme needs no script — theming is zero-JS, like
            everything else that carries meaning.
          </li>
          <li>
            Themes are compiled from TRP-format YAML into{" "}
            <code class="font-mono">
              semtext/themes/semtext-theme-&lt;slug&gt;.css
            </code>
            ; the conventions are §6 of{" "}
            <a href="/spec/semtext.html" class="text-violet-soft underline-offset-4 hover:underline">
              the spec
            </a>
            .
          </li>
        </ul>

        <h2 id="shipped" class="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          What ships here
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          This site serves the vocabulary base and{" "}
          <code class="font-mono">minimal-tech-light</code>, the default
          theme, from <code class="font-mono">/semtext/themes/</code> — every
          rendered example on /reference/ and /showcase/ uses it. The spec
          names three further ports (
          <code class="font-mono">nocturne-console</code>,{" "}
          <code class="font-mono">organic-warm</code>,{" "}
          <code class="font-mono">editorial-settings</code>); they are not
          built here yet.
        </p>

        <h2 id="create" class="mt-14 scroll-mt-24 text-2xl font-semibold tracking-tight text-ink">
          Create a theme
        </h2>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-ink-mute">
          Pick a name, background, text and accent; the generator emits a
          complete theme file with light and dark variants and the{" "}
          <code class="font-mono">prefers-color-scheme</code> fallback. Drop
          it in your document&apos;s <code class="font-mono">themes/</code>{" "}
          folder (the distribution folder form), link it after{" "}
          <code class="font-mono">semtext.css</code>, and set the{" "}
          <code class="font-mono">data-sem-theme</code> attribute to your
          name.
        </p>
        <ThemeGenerator cid="theme_generator" />
      </main>
    </div>
    """
  end
end
