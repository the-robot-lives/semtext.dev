defmodule SemtextWeb.EditorExampleController do
  @moduledoc """
  JSON feed for the /editor island (site-editor lane, P3 of the
  npl-enhanced-content editor build): one tag's authored reference example —
  the primary example, or a named variant with `?variant=<id>` — plus the
  shipped-runtime pane spec the editor preview boots with.

  The /editor page itself carries NO document markup in page state or the
  hydration payload (the payload-leak rule from the 83c34cd lesson):
  documents reach the browser only through this endpoint, fetched
  client-side after load as a standalone JSON response. The source data is
  compile-time reference data (`Semtext.Reference.*`), never user input;
  the params are map-lookup keys only.
  """

  use SemtextWeb, :controller

  alias Semtext.Reference.{Tags, Variants}

  def show(conn, %{"tag" => tag} = params) do
    case Tags.get(tag) do
      nil ->
        not_found(conn, "unknown tag: #{tag}")

      tag_record ->
        serve_example(conn, tag_record, params["variant"])
    end
  end

  # Primary example. Tags without an authored example answer 404 (the
  # editor shows a fresh document instead) — honest, not a silent empty.
  defp serve_example(conn, tag_record, nil) do
    if tag_record.example == "" do
      not_found(conn, "#{tag_record.name} has no authored example")
    else
      render_spec(conn, tag_record, tag_record.example, nil, nil)
    end
  end

  defp serve_example(conn, tag_record, variant_id) do
    case Enum.find(Variants.for_tag(tag_record.name), &(&1.id == variant_id)) do
      nil ->
        not_found(conn, "unknown variant #{variant_id} for #{tag_record.name}")

      v ->
        render_spec(conn, tag_record, v.code, v.id, v.label)
    end
  end

  defp render_spec(conn, tag_record, source, variant, label) do
    spec = Tags.viewer_spec(tag_record, source, false)

    json(conn, %{
      tag: tag_record.name,
      slug: Tags.tag_slug(tag_record.name),
      variant: variant,
      label: label,
      source: source,
      renderable: spec["renderable"],
      lazy: spec["lazy"],
      files: spec["files"],
      themeCss: spec["themeCss"]
    })
  end

  defp not_found(conn, detail) do
    conn
    |> put_status(:not_found)
    |> json(%{errors: %{detail: detail}})
  end
end
