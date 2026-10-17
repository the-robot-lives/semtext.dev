defmodule SemtextWeb.AssetVersion do
  @moduledoc """
  Compile-time content hash for static assets, appended as `?v=<hash>` so a
  changed stylesheet is refetched immediately instead of living in browser
  caches (Plug.Static sends `cache-control: public` with no max-age, i.e.
  heuristic freshness). Call it from a module attribute so the result is a
  string literal and the template stays client-transpilable.
  """

  @static Path.expand("../../priv/static", __DIR__)

  @doc "Absolute path of a file under priv/static (for @external_resource)."
  def file(path), do: Path.join(@static, path)

  @doc ~S|"css/x.css" -> "/css/x.css?v=<8 hex of md5>"|
  def url(path) do
    hash =
      path
      |> file()
      |> File.read!()
      |> then(&:crypto.hash(:md5, &1))
      |> Base.encode16(case: :lower)
      |> binary_part(0, 8)

    "/" <> path <> "?v=" <> hash
  end
end
