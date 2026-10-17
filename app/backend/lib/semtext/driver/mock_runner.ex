defmodule Semtext.Driver.MockRunner do
  @moduledoc """
  ETS-backed mock job store + simulated run loop for `Semtext.Driver`.

  A tiny GenServer owns a public, named `:set` ETS table so job reads are
  lock-free from request processes and the table survives runner-task
  crashes. `enqueue/3` inserts a `queued` job and spawns ONE background task
  that walks it `queued → running → passed/failed`, appending a deterministic
  per-check result line after a short sleep per check (app env
  `check_delay_ms`, default 250ms; 3–6 checks keeps the total under ~2s).

  The plan — check count, names, durations, and the terminal state — derives
  purely from the md5 of `script_ref`: identical refs produce identical
  results on every call. Only the single runner task writes a job after
  enqueue, so its read-modify-writes never race. Nothing here logs job
  payloads (script refs stay out of logs) and no job is created before
  `Semtext.Driver` validation passes.
  """

  use GenServer

  @delay_default 250
  @delay_cap 300
  @check_names [
    "load spec",
    "launch runner",
    "run assertions",
    "collect results",
    "write artifacts",
    "teardown"
  ]

  # -- supervision ----------------------------------------------------------

  def start_link(opts \\ []) do
    GenServer.start_link(__MODULE__, :ok, Keyword.put_new(opts, :name, __MODULE__))
  end

  @impl true
  def init(:ok) do
    {:ok, :ets.new(table(), [:named_table, :public, :set, read_concurrency: true])}
  end

  # -- job API --------------------------------------------------------------

  @doc "Inserts a queued job and starts its (mock) background run."
  def enqueue(suite, script_ref, target) do
    id = Ecto.UUID.generate()

    job = %{
      id: id,
      suite: suite,
      script_ref: script_ref,
      target: target,
      state: :queued,
      started_at: nil,
      finished_at: nil,
      results: [],
      mode: :mock
    }

    :ets.insert(table(), {id, job})
    Task.start(fn -> run(id) end)
    job
  end

  @doc "`{:ok, job}` when the id exists, `:error` otherwise."
  def get(id) do
    case :ets.lookup(table(), id) do
      [{^id, job}] -> {:ok, job}
      [] -> :error
    end
  end

  @doc """
  Deterministic check plan for a `script_ref`: 3–6 lines whose statuses and
  simulated durations come from the md5 of the ref (~20% of refs end in a
  failed check). Same ref ⇒ same plan, always.
  """
  def plan(script_ref) do
    <<a::unsigned-32, b::unsigned-32, _rest::binary>> = :crypto.hash(:md5, script_ref)
    count = 3 + rem(a, 4)
    fail_at = if rem(b, 5) == 0, do: rem(div(b, 5), count), else: nil

    @check_names
    |> Enum.take(count)
    |> Enum.with_index(fn name, i ->
      %{
        name: name,
        status: if(fail_at == i, do: :failed, else: :passed),
        duration_ms: 40 + rem(a + b * (i + 1), 211)
      }
    end)
  end

  # -- the mock run loop (one Task per job; sole writer after enqueue) ------

  defp run(id) do
    update(id, fn job -> %{job | state: :running, started_at: DateTime.utc_now()} end)

    checks =
      case get(id) do
        {:ok, job} -> plan(job.script_ref)
        :error -> []
      end

    Enum.each(checks, fn check ->
      Process.sleep(check_delay())
      append(id, check)
    end)

    finish(id)
  rescue
    # Unreachable in practice (the plan cannot raise on a validated ref);
    # kept so a surprise can never strand a job mid-run.
    _e ->
      append(id, %{name: "runner", status: :failed, duration_ms: 0})
      finish(id)
  end

  defp append(id, check), do: update(id, fn job -> %{job | results: job.results ++ [check]} end)

  defp finish(id) do
    update(id, fn job ->
      failed? = Enum.any?(job.results, &(&1.status == :failed))
      %{job | state: if(failed?, do: :failed, else: :passed), finished_at: DateTime.utc_now()}
    end)
  end

  defp update(id, fun) do
    case get(id) do
      {:ok, job} -> :ets.insert(table(), {id, fun.(job)})
      :error -> :ok
    end
  end

  defp check_delay do
    :semtext
    |> Application.get_env(__MODULE__, [])
    |> Keyword.get(:check_delay_ms, @delay_default)
    |> min(@delay_cap)
  end

  defp table, do: __MODULE__
end
