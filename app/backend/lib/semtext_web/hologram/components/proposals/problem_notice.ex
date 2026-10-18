defmodule SemtextWeb.Hologram.Components.Proposals.ProblemNotice do
  @moduledoc """
  Accessible rendering of a problem+json problem map
  (docs/proposals/API.md §4): `role="alert"`, the human title as the
  heading, the detail sentence, per-field errors as a list, and a wait
  note when `retry_after` (429) is present.

  The map is the exact string-keyed catalogue serialisation — string-key
  bracket access in the template, no client-side key rewriting.

  Stateless: render nothing when `problem` is empty/nil.
  """

  use Hologram.Component

  prop :problem, :map, default: %{}

  def template do
    ~HOLO"""
    {%if has_problem(@problem)}
      <div class="mt-4 border border-red-400 px-4 py-3" role="alert" data-cy="problem-notice">
        <div class="font-semibold text-red-400">
          {title(@problem)}{status_suffix(@problem)}
        </div>
        {%if @problem["detail"] != nil and @problem["detail"] != ""}
          <div class="mt-1 text-sm leading-relaxed text-ink-mute">{@problem["detail"]}</div>
        {/if}
        {%if field_errors(@problem) != []}
          <ul class="mt-2 list-disc pl-5 text-sm text-ink-mute">
            {%for pair <- field_errors(@problem)}
              <li data-cy="problem-error">{Enum.at(pair, 0)}: {Enum.at(pair, 1)}</li>
            {/for}
          </ul>
        {/if}
        {%if retry_seconds(@problem) > 0}
          <div class="mt-1 font-mono text-xs text-ink-faint" data-cy="problem-retry">
            Try again in {retry_seconds(@problem)} seconds.
          </div>
        {/if}
      </div>
    {/if}
    """
  end

  # ── client-transpilable helpers (no regex, no atoms from data) ──

  defp has_problem(problem) do
    is_map(problem) and map_size(problem) > 0
  end

  defp title(problem) do
    case problem["title"] do
      nil -> "Something went wrong"
      "" -> "Something went wrong"
      t -> t
    end
  end

  defp status_suffix(problem) do
    status = problem["status"]

    if is_integer(status) do
      " (" <> to_string(status) <> ")"
    else
      ""
    end
  end

  # `errors` is %{field => [msg, ...]}; flatten to [[field, msg], ...] pairs
  # for the template's Enum.at reads.
  defp field_errors(problem) do
    errors = problem["errors"]

    if is_map(errors) do
      Enum.flat_map(errors, fn pair ->
        field = elem(pair, 0)
        msgs = elem(pair, 1) || []

        Enum.map(msgs, fn msg -> [field, msg] end)
      end)
    else
      []
    end
  end

  defp retry_seconds(problem) do
    retry = problem["retry_after"]

    if is_integer(retry) and retry > 0 do
      retry
    else
      0
    end
  end
end
