defmodule Mix.Tasks.Semtext.GenReference do
  @moduledoc """
  Refresh the compile-time reference data from the Next.js landing-preview
  checkout (design v2 §2.3). Shells `app/scripts/gen-reference.mjs`, which

    * copies `elements.json` + `bundles.json` (generated upstream — never
      hand-edit either side),
    * converts `reference-example-variants.ts` -> `priv/data/example-variants.json`,
    * re-emits `lib/semtext/reference/glossary.ex` from
      `reference-glossary.ts`.

  Usage:

      mix semtext.gen_reference --web /path/to/semtext.dev/.claude/worktrees/landing-preview/web

  Requires `node` (>= 23, native TS type stripping) on PATH. The Elixir
  reference modules declare the JSON files as `@external_resource`, so the
  next compile picks the refresh up; no other step is needed. After a
  `public/semtext/` bundle sync, regenerate BEFORE building so bundle
  provenance (badges, render panes, RuntimeLine) matches the shipped files.
  """

  use Mix.Task

  @shortdoc "Refresh reference data from the landing-preview web/ checkout"

  @impl Mix.Task
  def run(args) do
    web =
      # OptionParser.parse!/2 returns {opts, invalid} on Elixir 1.20+ and
      # {opts, args, invalid} before it. tuple_size dispatch keeps both
      # toolchains' gradual type checker quiet (a literal 3-tuple clause
      # draws a "will never match" warning on 1.20, and vice versa).
      case OptionParser.parse!(args, strict: [web: :string]) do
        parsed when tuple_size(parsed) == 2 ->
          {opts, invalid} = parsed
          if invalid == [], do: opts[:web]

        parsed when tuple_size(parsed) == 3 ->
          {opts, args, invalid} = parsed
          if args == [] and invalid == [], do: opts[:web]

        _ ->
          nil
      end

    web || raise_usage()

    # lib/mix/tasks -> app/backend -> app: the script lives at app/scripts/.
    script = Path.expand("../../../../scripts/gen-reference.mjs", __DIR__)
    Mix.shell().info("==> Running #{script} --web #{web}")

    case Mix.shell().cmd("node #{script} --web #{web}", quiet: false) do
      0 ->
        Mix.shell().info("==> Reference data refreshed (priv/data + glossary.ex); rebuild to pick it up")

      code ->
        Mix.raise("gen-reference.mjs failed with exit code #{code} (is node >= 23 installed?)")
    end
  end

  defp raise_usage do
    Mix.raise("usage: mix semtext.gen_reference --web <path-to-landing-preview/web>")
  end
end
