defmodule SemtextWeb.Hologram.Layouts.SiteLayout do
  @moduledoc """
  Site layout for the ported semtext.dev pages (port-docs lane) — a port of
  the Next site's root layout (`web/app/layout.tsx`): dark docs chrome,
  skip link, site header (search + mobile menu) and footer.

  The starter's `MainLayout` (style-guide viewer chrome) stays for the
  scaffold/app pages; every ported site page declares this layout instead.
  Port-landing's `/` cutover can adopt it the same way.

  The `no-js` class on <html> gates the interactive chrome (search
  combobox, generator openers, carousel controls) the way the Next site's
  hidden-until-hydration pattern does; `/js/site-chrome.js` removes it
  when scripts run. Zero-JS readers get the plain link fallbacks exactly
  as upstream.
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.AnnotateWidget

  alias SemtextWeb.Hologram.Components.Site.Footer
  alias SemtextWeb.Hologram.Components.Site.Header

  @site_url "https://semtext.dev"
  @default_title "SemText — one HTML file, in place of Markdown"
  @default_description """
  SemText: one HTML file that models read and write instead of Markdown. \
  Readable as text as-is; opened in a browser, the same markup becomes \
  working web components. Part of The Robot Lives portfolio.\
  """

  # Content-hashed stylesheet URLs (cache busting; see SemtextWeb.AssetVersion).
  prop :site_css, :string, default: SemtextWeb.AssetVersion.url("css/semtext-site.css")
  prop :reference_css, :string, default: SemtextWeb.AssetVersion.url("css/reference.css")
  prop :page_title, :string, default: @default_title
  prop :description, :string, default: @default_description
  # The Next site's og:description is the site-wide tagline on EVERY page,
  # never the per-page description (which goes only in name=description).
  # Without this, pages whose copy mentions "data-sem-theme" (e.g. /themes/)
  # carry an extra attribute mention the export does not have.
  prop :og_description, :string, default: @default_description
  # Per-page social card (cache-busted filenames — bump the name when the
  # art changes, e.g. /og-editor-0.8.2.jpg for the Instrument editor page).
  prop :og_image, :string, default: "/og.jpg"
  prop :canonical, :string, default: @site_url
  # /docs loads the SemText bundle without the off-switches so the page's
  # live SemText blocks auto-wire (the current next/script behavior).
  prop :load_semtext_bundle, :boolean, default: false
  # /reference pages (port-reference lane): section CSS + the island bridge
  # (auto-boots the example render panes; runs the index filter).
  prop :reference_assets, :boolean, default: false
  # /editor (Instrument lane): the editor fills the viewport below the
  # header, so the footer is dropped (app tools chrome, not a content page).
  prop :hide_footer, :boolean, default: false

  # Content-hashed island URL (cache busting; compile-time prop default —
  # remote calls are not client-transpilable inside templates).
  prop :island_js, :string, default: SemtextWeb.AssetVersion.url("js/semtext-island.js")

  def template do
    ~HOLO"""
    <!DOCTYPE html>
    <html lang="en" class="no-js">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{@page_title}</title>
        <meta name="description" content={@description} />
        <meta name="application-name" content="semtext" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={@canonical} />
        <meta property="og:title" content={@page_title} />
        <meta property="og:description" content={@og_description} />
        <meta property="og:url" content={@canonical} />
        <meta property="og:site_name" content="semtext" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={@og_image} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="theme-color" content="#0f172a" />
        {%if @load_semtext_bundle}
          <script defer src="/semtext/semtext.js"></script>
        {/if}
        <link rel="stylesheet" href="/semtext/themes/_vocabulary.css" />
        <link rel="stylesheet" href="/semtext/themes/minimal-tech-light.css" />
        <link rel="stylesheet" href={@site_css} />
        {%if @reference_assets}
          <link rel="stylesheet" href={@reference_css} />
          <script defer src={@island_js}></script>
        {/if}
        <script defer src="/js/site-chrome.js"></script>
        <script src="/js/keep-location.js"></script>
        <Hologram.UI.Runtime />
      </head>
      <body class="docs-bg min-h-screen antialiased">
        <a class="skip-link" href="#main">Skip to docs</a>
        <Header />
        <slot />
        {%if @hide_footer}{%else}
        <Footer />
        {/if}
        <AnnotateWidget />
      </body>
    </html>
    """
  end
end
