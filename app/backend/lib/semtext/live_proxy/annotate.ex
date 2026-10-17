defmodule Semtext.LiveProxy.Annotate do
  @moduledoc """
  Upstream client for the annotate page-comments service (vocabulary epic
  Phase 5): the thread collection behind `GET /api/v1/annotate/threads`.

  Why a proxy at all — the embed today calls
  `https://annotate-srv.therobotlives.com/api/v1` straight from the browser:
  going through this backend puts the upstream under one rate limit, and
  lets non-public sites keep their threads un-listable from arbitrary
  origins. Anonymous read (the annotate service's own policy for the
  collection endpoint) — no credentials involved, none forwarded.

  Config (app env, wired in `config/runtime.exs`; the default is the public
  service URL the widget's CSP already pins):

      config :semtext, Semtext.LiveProxy.Annotate,
        base_url: "https://annotate-srv.therobotlives.com/api/v1",
        http_client: Semtext.LiveProxy.ReqClient   # injectable for tests

  ## Contract — passthrough, and the text-only rendering rule

  `threads/2` passes the upstream JSON collection through UNMODIFIED (the
  embed already speaks the annotate schema; `?site=&page=` map 1:1 onto the
  service's own query params). NOTHING on this route sanitizes visitor
  content, because nothing here renders it: the embed MUST render every
  visitor-written field (comment bodies, author names, page titles, quoted
  text, URLs) as plain TEXT — never innerHTML/HTML injection, never
  executable content, never automated link-following. That contract is
  enforced at the embed layer (vocabulary epic Phase 7); this module's job
  is to state it where the data enters our stack.

  Results mirror `Semtext.LiveProxy.AgentKit`:

      {:ok, upstream_json}
      {:error, :not_configured}                  # base_url blank (default never is)
      {:error, {:upstream_status, status}}
      {:error, {:upstream_unreachable, reason}}
  """

  @collection_path "/threads"
  @default_base "https://annotate-srv.therobotlives.com/api/v1"

  @doc """
  Thread collection for `site` (slug) at `page` (site-relative path, e.g.
  "/docs/intro") — the annotate service's `GET /threads?site=&page=`.
  """
  @spec threads(String.t(), String.t()) :: {:ok, term()} | {:error, term()}
  def threads(site, page) do
    url =
      "#{base_url()}#{@collection_path}" <>
        "?site=" <> URI.encode_www_form(String.trim(site)) <>
        "&page=" <> URI.encode_www_form(String.trim(page))

    case http_client().get(url, []) do
      {:ok, status, body} when status in 200..299 -> {:ok, body}
      {:ok, status, _body} -> {:error, {:upstream_status, status}}
      {:error, reason} -> {:error, {:upstream_unreachable, reason}}
    end
  end

  # -- plumbing ------------------------------------------------------------

  defp base_url do
    (cfg(:base_url) || @default_base)
    |> String.trim()
    |> String.replace_trailing("/", "")
  end

  defp cfg(key, default \\ nil) do
    Application.get_env(:semtext, __MODULE__, [])
    |> Keyword.get(key, default)
  end

  defp http_client, do: cfg(:http_client, Semtext.LiveProxy.ReqClient)
end
