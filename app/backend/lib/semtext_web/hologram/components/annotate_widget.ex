defmodule SemtextWeb.Hologram.Components.AnnotateWidget do
  @moduledoc """
  The annotate page-comments widget (tobor-kit `noizu-page-comments`).

  Rendered once from each public layout (Site, Landing, Main) at the end of
  `<body>`; the element is part of the static template, never Hologram page
  state. The bundle URL is pinned to an immutable tobor-kit sha. Not used by
  ProposalsLayout: `proposals.semtext.dev` is not in the `semtext` annotate
  site's allowed_origins.

  CSP: semtext sends none, so nothing to extend. If one is ever added it needs
  script-src https://cdn.derobot.is; connect-src
  https://annotate-srv.therobotlives.com wss://annotate-srv.therobotlives.com
  https://annotate-files.therobotlives.com https://cdn.derobot.is; img-src
  https://annotate-files.therobotlives.com data: blob:.
  """

  use Hologram.Component

  def template do
    ~HOLO"""
    <script type="module" src="https://cdn.derobot.is/tobor-kit/sha-0e5a20e04fefcb400f9f395795c438a7312f27ec/components/page-comments/page-comments.js"></script>
    <noizu-page-comments site="semtext" api-base="https://annotate-srv.therobotlives.com" enabled></noizu-page-comments>
    """
  end
end
