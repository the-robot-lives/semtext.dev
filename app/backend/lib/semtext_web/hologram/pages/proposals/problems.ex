defmodule SemtextWeb.Hologram.Pages.Proposals.Problems do
  @moduledoc """
  Maps `Semtext.Proposals` results onto the problem+json catalogue
  (docs/proposals/API.md §4) as plain string-keyed maps — the same
  serialisation the REST surface would emit, so the Hologram commands can
  hand the renderer one shape (`{:error, problem_map}`) and the
  `ProblemNotice` component renders it accessibly.

  Server-side only (called from `command/3`s and page `init`s — never
  transpiled), so it may use Ecto freely.
  """

  @base "https://proposals.semtext.dev/problems/"

  @catalogue %{
    unauthenticated: %{"status" => 401, "title" => "Sign in required"},
    forbidden: %{"status" => 403, "title" => "Not allowed"},
    banned: %{"status" => 403, "title" => "Account suspended"},
    "turnstile-failed": %{"status" => 403, "title" => "Human check failed"},
    "not-found": %{"status" => 404, "title" => "Not found"},
    "invalid-status-transition": %{"status" => 409, "title" => "Not in the right state"},
    "validation-failed": %{"status" => 422, "title" => "Check the highlighted fields"},
    "rate-limited": %{"status" => 429, "title" => "Too many attempts"},
    "internal-error": %{"status" => 500, "title" => "Something went wrong"}
  }

  @doc "problem map for a catalogue type + optional detail/extensions."
  def problem(type) when is_atom(type), do: problem(Atom.to_string(type), nil, %{})

  def problem(type) when is_binary(type), do: problem(type, nil, %{})

  def problem(type, detail) when is_atom(type) and is_binary(detail),
    do: problem(Atom.to_string(type), detail, %{})

  def problem(type, extensions) when is_atom(type) and is_map(extensions),
    do: problem(Atom.to_string(type), nil, extensions)

  def problem(type, detail, extensions)
      when is_binary(type) and (is_binary(detail) or is_nil(detail)) and is_map(extensions) do
    base = Map.get(@catalogue, String.to_atom(type), %{"status" => 500, "title" => "Error"})

    %{"type" => @base <> type, "status" => base["status"], "title" => base["title"]}
    |> put_detail(detail)
    |> Map.merge(extensions)
  end

  @doc """
  Normalise a `Semtext.Proposals` result:
  `{:ok, value}` passes through; `{:ok, value, :replayed}` flattens the
  replay marker away (the UI treats replays and first-writes identically);
  errors become problem maps.
  """
  def from_result({:ok, value, :replayed}), do: {:ok, value}
  def from_result({:ok, value}), do: {:ok, value}
  def from_result({:error, %Ecto.Changeset{} = cs}), do: {:error, from_changeset(cs)}
  def from_result({:error, :not_found}), do: {:error, problem("not-found")}
  def from_result({:error, :invalid_transition}), do: {:error, problem("invalid-status-transition")}

  def from_result({:error, {:limited, secs}}) when is_integer(secs),
    do: {:error, problem("rate-limited", nil, %{"retry_after" => secs})}

  def from_result({:error, :forbidden}), do: {:error, problem("forbidden")}
  def from_result({:error, :unauthenticated}), do: {:error, problem("unauthenticated")}

  def from_result({:error, {:turnstile, reason}}) when is_binary(reason),
    do: {:error, problem("turnstile-failed", turnstile_detail(reason))}

  def from_result(_other), do: {:error, problem("internal-error")}

  @doc "422 validation-failed problem map from a changeset (API.md §4 extensions shape)."
  def from_changeset(%Ecto.Changeset{} = cs) do
    errors =
      cs.errors
      |> Enum.map(fn {field, {msg, _opts}} -> {field, msg} end)
      |> Enum.group_by(fn {field, _} -> Atom.to_string(field) end, fn {_, msg} -> msg end)

    problem("validation-failed", first_sentence(errors), %{"errors" => errors})
  end

  @doc "First user-facing sentence from an errors map (detail for the 422 body)."
  def first_sentence(errors) when errors == %{}, do: "Some fields need attention."

  def first_sentence(errors) do
    {field, msgs} = Enum.at(errors, 0)
    msg = Enum.at(msgs, 0) || "is invalid"
    human_field(String.replace(field, "_", " ")) <> " " <> String.trim_trailing(msg, ".") <> "."
  end

  # ── private ──────────────────────────────────────────────────

  defp put_detail(map, nil), do: map
  defp put_detail(map, detail), do: Map.put(map, "detail", detail)

  defp turnstile_detail("missing"),
    do: "Complete the human check before sending a report."

  defp turnstile_detail(_), do: "The human check could not be verified. Try again."

  defp human_field(field) do
    String.upcase(String.at(field, 0) || "") <> String.slice(field, 1..1000)
  end
end
