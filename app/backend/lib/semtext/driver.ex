defmodule Semtext.Driver do
  @moduledoc """
  Driver run affordance (vocabulary epic Phase 6) — a WORKING MOCK backend
  for the `POST /api/v1/driver/run` + `GET /api/v1/driver/runs/:id` contract
  (the real cypress/cucumber runner is a follow-up lane).

  Contract:

    * `POST /api/v1/driver/run` — body `{"suite": "cypress" | "cucumber",
      "script_ref": "<path-or-url>", "target": "<string, optional>"}`.
      Validation runs synchronously BEFORE any job is created; invalid input
      is a 400 with `{"error": "invalid_request", "errors": %{field =>
      [messages]}}` and no job exists. Valid input is a 201 with the queued
      run envelope (below).
    * `GET /api/v1/driver/runs/:id` — the run envelope: `id`, `suite`,
      `script_ref`, `target`, `state` (`queued | running | passed | failed`),
      `started_at`, `finished_at` (present only once terminal), `mode`
      and `results` (per-check lines: `name`, `status` `passed | failed`,
      `duration_ms`). Unknown id → 404 `{"error": "not_found"}`.
    * EVERY payload carries `mode: "mock"` — consumers must treat the
      results as simulated, never as real runner output.

  Simulation (`Semtext.Driver.MockRunner`): an in-process ETS-backed job
  store plus one background task per run; 3–6 structured per-check lines
  derived deterministically from the `script_ref` hash (same ref ⇒ same
  results and same terminal state), a short sleep per simulated check
  (production default 250ms; 3–6 checks keeps the total under ~2s).

  Posture: no auth (read-only mock — same posture as the Phase 5
  live-fetch proxy routes, which share the `proxy_read` rate limit);
  no secrets involved anywhere; only a script REFERENCE is accepted (never
  contents) and nothing about a job is logged.
  """

  alias Semtext.Driver.MockRunner

  @suites ~w(cypress cucumber)

  @doc "Accepted `suite` values."
  def suites, do: @suites

  @doc """
  Validates a run request and enqueues a mock job.

  Returns `{:ok, job}` or `{:error, errors}` where `errors` is a map of
  `field => [messages]` (the 400 body's `errors` key).
  """
  def create_run(params) when is_map(params) do
    case validate(params) do
      errors when errors == %{} ->
        {:ok,
         MockRunner.enqueue(params["suite"], params["script_ref"], Map.get(params, "target"))}

      errors ->
        {:error, errors}
    end
  end

  # Non-object JSON bodies (arrays, strings, numbers) never create a job.
  def create_run(_params), do: {:error, %{"body" => ["must be a JSON object"]}}

  @doc "Fetches a run by id. `:error` when unknown."
  def get_run(id), do: MockRunner.get(id)

  @doc """
  JSON envelope for a run. `finished_at` is present only once the run is
  terminal; `mode` is always `"mock"`.
  """
  def render_run(job) do
    base = %{
      "id" => job.id,
      "suite" => job.suite,
      "script_ref" => job.script_ref,
      "target" => job.target,
      "state" => Atom.to_string(job.state),
      "started_at" => iso8601(job.started_at),
      "mode" => "mock",
      "results" =>
        Enum.map(job.results, fn check ->
          %{
            "name" => check.name,
            "status" => Atom.to_string(check.status),
            "duration_ms" => check.duration_ms
          }
        end)
    }

    if job.finished_at,
      do: Map.put(base, "finished_at", iso8601(job.finished_at)),
      else: base
  end

  # -- validation -----------------------------------------------------------

  defp validate(params) do
    %{}
    |> validate_suite(params)
    |> validate_script_ref(params)
    |> validate_target(params)
  end

  defp validate_suite(errors, params) do
    case params["suite"] do
      suite when suite in @suites ->
        errors

      nil ->
        put_error(errors, "suite", "is required")

      suite when is_binary(suite) ->
        put_error(errors, "suite", "must be one of: cypress, cucumber")

      _other ->
        put_error(errors, "suite", "must be a string")
    end
  end

  defp validate_script_ref(errors, params) do
    case params["script_ref"] do
      ref when is_binary(ref) ->
        cond do
          String.trim(ref) == "" ->
            put_error(errors, "script_ref", "must be a non-empty path or URL")

          path_or_url?(ref) ->
            errors

          true ->
            put_error(errors, "script_ref", "must be a path or URL")
        end

      nil ->
        put_error(errors, "script_ref", "is required")

      _other ->
        put_error(errors, "script_ref", "must be a string")
    end
  end

  # Paths (POSIX or Windows) and URLs all contain a slash; bare tokens are
  # rejected. Deliberately permissive beyond that — the mock never opens it.
  defp path_or_url?(ref), do: String.contains?(ref, "/") or String.contains?(ref, "\\")

  defp validate_target(errors, params) do
    case Map.get(params, "target") do
      nil ->
        errors

      target when is_binary(target) ->
        if String.trim(target) == "" do
          put_error(errors, "target", "must be a non-empty string when present")
        else
          errors
        end

      _other ->
        put_error(errors, "target", "must be a string")
    end
  end

  defp put_error(errors, field, message),
    do: Map.update(errors, field, [message], &[message | &1])

  defp iso8601(nil), do: nil
  defp iso8601(%DateTime{} = dt), do: DateTime.to_iso8601(dt)
end
