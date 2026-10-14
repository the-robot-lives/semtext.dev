defmodule SemtextWeb.Parity.Manifest do
  @moduledoc """
  Loader for the route parity manifest (`app/scripts/parity/parity-routes.json`).

  The manifest is the parity contract the whole harness shares: every route
  the Next.js site serves (status, title, h1, key text) plus the reference
  tag list. The Node driver (`scripts/parity/parity-check.mjs`) and the
  Cypress layer (`app/e2e`) read the same file; this module is the ExUnit
  access path. A missing/diverging route is a GAP — reported, never a
  failure to run the suite.
  """

  @manifest_path (Path.expand("../../..", __DIR__)
                  |> Path.join("scripts/parity/parity-routes.json"))

  @doc "Absolute path of the manifest file (raises when the lane's file is absent)."
  def path, do: @manifest_path

  @doc "Parsed manifest as a map."
  def manifest do
    @manifest_path
    |> File.read!()
    |> Jason.decode!()
  end

  @doc """
  Concrete routes: static pages with the `/reference/<tag>/` template
  expanded to one entry per tag.
  """
  def routes do
    manifest = manifest()

    Enum.flat_map(manifest["routes"], fn route ->
      case route["kind"] do
        "template" ->
          Enum.map(manifest["referenceTags"], fn tag ->
            %{
              "path" => "/reference/#{tag}/",
              "kind" => "page",
              "owner" => route["owner"],
              "title" => String.replace(route["title"], "<{tag}>", "<#{tag}>"),
              "h1" => String.replace(route["h1"], "<{tag}>", "<#{tag}>"),
              "keyText" => route["keyText"] || [],
              "tag" => tag
            }
          end)

        _ ->
          [Map.put(route, "tag", nil)]
      end
    end)
  end

  @doc "Static resources the app must serve (not pages; status-only checks)."
  def static_paths, do: manifest()["nonRoutes"]["static"] || []
end
