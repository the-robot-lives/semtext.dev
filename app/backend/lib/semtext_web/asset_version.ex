defmodule SemtextWeb.AssetVersion do
  @moduledoc """
  Content-hash cache busting for static assets: `css/x.css` is served as
  `/css/x.css?v=<8 hex of md5>` so a changed stylesheet is refetched
  immediately instead of living in browser caches (Plug.Static sends
  `cache-control: public` with no max-age, i.e. heuristic freshness).

  Digests are computed once at boot (`warm/0`, called from
  `Semtext.Application.start/2`) from the release-safe app priv dir
  (`Application.app_dir(:semtext, "priv/static")`) and cached in
  `:persistent_term`, so request-time `url/1` never touches the
  filesystem. (The previous implementation baked a source-tree path via
  `Path.expand(..., __DIR__)` at compile time; in an OTP release that
  literal pointed at the build stage's `/app/priv/static`, which does not
  exist in the assembled release, and every runtime call site 500'd.)

  Compile-time call sites (module attributes / prop defaults) evaluate
  before boot warm and fall back to reading the app priv dir directly.
  A missing file never crashes: `url/1` returns the bare un-hashed path.
  """

  @doc "Release-safe root of the app's shipped static assets."
  def static_root, do: Application.app_dir(:semtext, "priv/static")

  @doc "Absolute path of a file under priv/static (for @external_resource)."
  def file(path), do: Path.join(static_root(), path)

  @doc """
  Compute digests for every file under priv/static into `:persistent_term`.
  Best-effort: any failure leaves the cache empty and `url/1` falls back to
  per-call computation (or bare paths) — boot never crashes on it.
  """
  def warm do
    :persistent_term.put(__MODULE__, walk(static_root()))
    :ok
  rescue
    _ -> :ok
  end

  @doc ~S|"css/x.css" -> "/css/x.css?v=<8 hex of md5>"; missing file -> bare path|
  def url(path) do
    case digest(path) do
      nil -> "/" <> path
      hash -> "/" <> path <> "?v=" <> hash
    end
  end

  defp digest(path) do
    case :persistent_term.get(__MODULE__, :unset) do
      :unset -> compute(path)
      map -> Map.get(map, path) || compute(path)
    end
  end

  defp compute(path) do
    case File.read(file(path)) do
      {:ok, body} -> md5_prefix(body)
      _ -> nil
    end
  rescue
    _ -> nil
  end

  defp walk(root) do
    case File.ls(root) do
      {:ok, entries} ->
        Enum.reduce(entries, %{}, fn entry, acc ->
          abs = Path.join(root, entry)

          if File.dir?(abs) do
            Map.merge(acc, walk(abs))
          else
            Map.put(acc, Path.relative_to(abs, root), md5_prefix(File.read!(abs)))
          end
        end)

      _ ->
        %{}
    end
  end

  defp md5_prefix(body) do
    :crypto.hash(:md5, body)
    |> Base.encode16(case: :lower)
    |> binary_part(0, 8)
  end
end
