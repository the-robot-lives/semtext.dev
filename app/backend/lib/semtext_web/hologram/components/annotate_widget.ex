defmodule SemtextWeb.Hologram.Components.AnnotateWidget do
  @moduledoc """
  The annotate page-comments widget (tobor-kit `noizu-page-comments`).

  Loaded from a pinned tobor-kit release loader
  (`https://cdn.derobot.is/tobor-kit/sha-cd2ec4a1259af49acabc19367ed749fbe92fb736/annotate.js`),
  which registers
  `<noizu-page-comments>` itself (it re-exports components/page-comments/
  page-comments.js from the same release; its lazy chunks are relative imports
  on the same CDN origin). Pinned to the immutable release sha — never
  `latest/`, whose files can lag the `latest.json` pointer (they did: the
  pointer advertised the pe:none fix while latest/* still served the Oct-20
  mouse-dead build). Rendered once from each public layout (Site,
  Landing, Main) at the end of `<body>`; the element is part of the static
  template, never Hologram page state. No `enabled` attribute, so the widget
  starts collapsed (the pill expands it). Not used by ProposalsLayout:
  `proposals.semtext.dev` is not in the `semtext` annotate site's
  allowed_origins.

  CSP: semtext sends none, so nothing to extend. If one is ever added it needs
  script-src https://cdn.derobot.is; connect-src
  https://annotate-srv.therobotlives.com wss://annotate-srv.therobotlives.com
  https://annotate-files.therobotlives.com https://cdn.derobot.is; img-src
  https://annotate-files.therobotlives.com data: blob:.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <script type="module" src="https://cdn.derobot.is/tobor-kit/sha-cd2ec4a1259af49acabc19367ed749fbe92fb736/annotate.js"></script>
    <noizu-page-comments site="semtext" api-base="https://annotate-srv.therobotlives.com"></noizu-page-comments>
    """
  end
end
