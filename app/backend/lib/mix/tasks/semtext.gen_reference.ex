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
      mix semtext.gen_reference --web <web> --seed-claude-examples
      mix semtext.gen_reference --seed-claude-examples

  `--seed-claude-examples` (after the refresh, or alone) runs
  `app/scripts/seed-claude-examples.mjs`: every tag without a hand-polished
  entry in `priv/data/claude-examples.json` is (re)seeded from its spec
  example, normalised to the sem-text-author conventions, and the whole
  file is validated with `bin/semtext-validate.mjs`. `"source": "hand"`
  entries are never touched. A tag without an entry fails the build
  (`Semtext.Reference.Tags`); when a new tag has already broken the build,
  run the script directly — `node app/scripts/seed-claude-examples.mjs` —
  it needs no compile. Procedure: `docs/reference-refresh.md`.

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
    # OptionParser.parse!/2 returns {opts, invalid} on Elixir 1.20+ and
    # {opts, args, invalid} before it. Dispatching on the tuple shape
    # draws a "will never match" warning from the gradual type checker
    # on whichever toolchain sees the other shape, so index from the
    # END instead: the last element is always `invalid`, and whatever
    # sits between opts and it is positional args.
    parsed = OptionParser.parse!(args, strict: [web: :string, seed_claude_examples: :boolean])
    [opts | rest] = Tuple.to_list(parsed)
    positional = tl(rest)
    invalid = List.last(rest)
    clean = positional == [] and invalid == []
    web = if clean, do: opts[:web]
    seed = clean and opts[:seed_claude_examples] == true

    if web == nil and not seed, do: raise_usage()
    if web, do: refresh(web)
    if seed, do: seed_claude_examples()
  end

  defp seed_claude_examples do
    script = Path.expand("../../../../scripts/seed-claude-examples.mjs", __DIR__)
    Mix.shell().info("==> Running #{script}")

    case Mix.shell().cmd("node #{script}", quiet: false) do
      0 -> Mix.shell().info("==> claude-examples.json seeded; rebuild + mix test to validate")
      code -> Mix.raise("seed-claude-examples.mjs failed with exit code #{code}")
    end
  end

  defp refresh(web) do
    # lib/mix/tasks -> app/backend -> app: the script lives at app/scripts/.
    script = Path.expand("../../../../scripts/gen-reference.mjs", __DIR__)
    Mix.shell().info("==> Running #{script} --web #{web}")

    case Mix.shell().cmd("node #{script} --web #{web}", quiet: false) do
      0 ->
        Mix.shell().info(
          "==> Reference data refreshed (priv/data + glossary.ex); rebuild to pick it up"
        )

      code ->
        Mix.raise("gen-reference.mjs failed with exit code #{code} (is node >= 23 installed?)")
    end
  end

  defp raise_usage do
    Mix.raise(
      "usage: mix semtext.gen_reference [--web <path-to-landing-preview/web>] [--seed-claude-examples]"
    )
  end
end
