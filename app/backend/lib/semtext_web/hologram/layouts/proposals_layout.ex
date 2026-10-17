defmodule SemtextWeb.Hologram.Layouts.ProposalsLayout do
  @moduledoc """
  Layout for the `proposals.semtext.dev` host pages (design v2 §3.1).

  Deliberately NOT the main site's `SiteLayout`: the proposals host is a
  separate route namespace with its own (host-only) session, so it gets its
  own slim chrome — brand link back to browse, the three primary
  destinations, and the auth lane's `UserMenu` (self-contained; renders the
  GitHub login button for anonymous visitors and the avatar + logout for
  signed-in users).

  `load_turnstile` swaps in the Cloudflare Turnstile script for pages that
  render the report form; the site key itself is public and travels with
  the report component's state.

  Zero-JS readers get full SSR content; every action has a plain-HTML
  fallback where it matters (search is a GET form, pagination is a link).
  """

  use Hologram.Component

  alias SemtextWeb.Hologram.Components.Auth.UserMenu

  @site_url "https://proposals.semtext.dev"
  @default_title "SemText Proposals"
  @default_description """
  Propose additions to the SemText vocabulary: browse, discuss and track \
  element proposals between this site and the spec's GitHub repository.\
  """

  prop :page_title, :string, default: @default_title
  prop :description, :string, default: @default_description
  prop :canonical, :string, default: @site_url
  prop :load_turnstile, :boolean, default: false

  def template do
    ~HOLO"""
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{@page_title}</title>
        <meta name="description" content={@description} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={@canonical} />
        <meta property="og:title" content={@page_title} />
        <meta property="og:site_name" content="semtext" />
        <meta property="og:type" content="website" />
        <link rel="icon" href="/favicon.ico" sizes="48x48" />
        <link rel="stylesheet" href="/semtext/themes/_vocabulary.css" />
        <link rel="stylesheet" href="/semtext/themes/minimal-tech-light.css" />
        <link rel="stylesheet" href="/css/semtext-site.css" />
        {%if @load_turnstile}
          <script defer src="https://challenges.cloudflare.com/turnstile/v0/api.js"></script>
        {/if}
        <Hologram.UI.Runtime />
      </head>
      <body class="docs-bg min-h-screen antialiased">
        <a class="skip-link" href="#main">Skip to content</a>
        <header class="border-b border-code-border">
          <div class="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <a href="/" class="font-mono text-sm font-semibold text-ink" data-cy="proposals-home">
              semtext<span class="text-violet-soft">/proposals</span>
            </a>
            <nav class="flex items-center gap-4 font-mono text-xs" aria-label="Proposals">
              <a href="/" class="text-ink-mute hover:text-ink" data-cy="nav-browse">Browse</a>
              <a href="/dashboard" class="text-ink-mute hover:text-ink" data-cy="nav-dashboard">
                Dashboard
              </a>
              <a href="/moderation" class="text-ink-mute hover:text-ink" data-cy="nav-moderation">
                Moderation
              </a>
            </nav>
            <UserMenu cid="proposals-user-menu" />
          </div>
        </header>
        <main id="main" class="mx-auto max-w-5xl px-4 py-8">
          <slot />
        </main>
        <footer class="mx-auto max-w-5xl px-4 pb-10 pt-4 font-mono text-[0.68rem] leading-5 text-ink-faint">
          SemText vocabulary proposals — discussed here, resolved on GitHub.
        </footer>
      </body>
    </html>
    """
  end
end
