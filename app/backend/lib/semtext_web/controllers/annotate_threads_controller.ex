defmodule SemtextWeb.AnnotateThreadsController do
  @moduledoc """
  Read-only proxy for the annotate thread collection
  (`GET /api/v1/annotate/threads?site=<slug>&page=<path>`; contract overview
  in `Semtext.LiveProxy`).

  Why proxy: puts the annotate upstream under one rate limit, and keeps
  threads of non-public sites un-listable from arbitrary browser origins.
  Anonymous read — no credentials exist on this path.

  ## UNTRUSTED VISITOR CONTENT — text-only rendering contract

  Everything inside the passthrough JSON (comment bodies, author names,
  page titles, quoted text, URLs) is VISITOR-WRITTEN and untrusted. This
  route sanitizes NOTHING: nothing here renders HTML, and the embed MUST
  render all such fields as plain text only — no innerHTML, no markup
  interpretation, no executable content, no automatic link-following.
  Enforced at the embed layer (vocabulary epic Phase 7); stated here where
  the data enters our stack.

  Upstream trouble is fail-soft (stay-cached contract) via
  `SemtextWeb.LiveProxyResponse`.
  """

  use SemtextWeb, :controller

  alias Semtext.LiveProxy.Annotate
  alias SemtextWeb.LiveProxyResponse

  @site_regex ~r/^[a-z0-9][a-z0-9-]{0,63}$/
  @max_page_length 2048

  def index(conn, params) do
    site = params["site"]
    page = params["page"]

    with :ok <- validate_site(site),
         :ok <- validate_page(page) do
      case Annotate.threads(site, page) do
        {:ok, body} ->
          # Passthrough: Req hands back decoded JSON when the upstream sent
          # a JSON content-type; a binary body means the upstream said JSON
          # but decode was skipped — forward its bytes as-is.
          case body do
            payload when is_binary(payload) ->
              conn
              |> put_resp_content_type("application/json")
              |> send_resp(200, payload)

            payload ->
              conn
              |> put_resp_content_type("application/json")
              |> json(payload)
          end

        {:error, reason} ->
          LiveProxyResponse.render_error(conn, reason)
      end
    else
      {:invalid, msg} -> LiveProxyResponse.fail_soft(conn, :invalid_request, msg)
    end
  end

  # -- plumbing ------------------------------------------------------------

  defp validate_site(site) when is_binary(site) do
    if Regex.match?(@site_regex, String.trim(site)) do
      :ok
    else
      {:invalid, "site must be a slug matching #{@site_regex.source}"}
    end
  end

  defp validate_site(_), do: {:invalid, "site is required"}

  defp validate_page(page) when is_binary(page) do
    trimmed = String.trim(page)

    cond do
      trimmed == "" ->
        {:invalid, "page is required"}

      byte_size(trimmed) > @max_page_length ->
        {:invalid, "page exceeds #{@max_page_length} bytes"}

      not String.starts_with?(trimmed, "/") ->
        {:invalid, "page must be a site-relative path starting with /"}

      true ->
        :ok
    end
  end

  defp validate_page(_), do: {:invalid, "page is required"}
end
