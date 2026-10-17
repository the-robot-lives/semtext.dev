defmodule Semtext.Reference.SemMd do
  @moduledoc """
  The one tag whose authored example is Markdown. Carries the build-time
  render of the /reference sem-md example, verbatim from the Next site's
  `components/sem-md-rendered.ts`:

    * `source/0` — the authored block, read from the generated inventory at
      runtime (the `sem_md_source_sync_test` asserts it equals
      `Elements.get("sem-md").example` — one source of truth, no copy).
    * `rendered/0` — two views of the same block: `div.ref-md-static`, the
      rendered table for the zero-JS HTML (and the visible render until the
      chunk arrives), and the authored `<sem-md>` element itself, which
      chunks/sem-md.js upgrades with its own chrome + table; the CSS swap
      keys on the element's upgrade marker, so there is no timing race and
      no double render.
  """

  # The TS literal, byte-for-byte (except indentation, which HTML ignores
  # between block elements and which the heredoc would otherwise bake in).
  @rendered """
  <div class="ref-md-static">
    <div class="ref-md-static-label">Token lifetimes</div>
    <table>
      <thead>
        <tr>
          <th scope="col" style="text-align: left">Token</th>
          <th scope="col" style="text-align: right">Lifetime</th>
          <th scope="col" style="text-align: center">Rotates</th>
        </tr>
      </thead>
      <tbody>
        <tr><td>access</td><td style="text-align: right">15 min</td><td style="text-align: center">no</td></tr>
        <tr><td>refresh</td><td style="text-align: right">30 days</td><td style="text-align: center">yes</td></tr>
      </tbody>
    </table>
  </div>
  <sem-md id="m-lifetimes" label="Token lifetimes" controls="toggle,copy">| Token   | Lifetime | Rotates |
  | :------ | -------: | :-----: |
  | access  | 15 min   | no      |
  | refresh | 30 days  | yes     |</sem-md>
  """
  |> String.replace_suffix("\n", "")

  @doc "The authored block, verbatim from the generated inventory."
  @spec source() :: String.t()
  def source do
    case Semtext.Reference.Elements.get("sem-md") do
      %{example: example} when is_binary(example) and example != "" ->
        example

      _ ->
        raise "elements.json no longer carries a sem-md example"
    end
  end

  @doc "Build-time render of the same block (static table + authored element)."
  @spec rendered() :: String.t()
  def rendered, do: @rendered

  @doc "Chrome label above the sem-md figure."
  @spec chrome_label() :: String.t()
  def chrome_label, do: "sem-md — the authored block, rendered"
end
