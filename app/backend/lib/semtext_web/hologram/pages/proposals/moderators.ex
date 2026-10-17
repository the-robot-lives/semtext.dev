defmodule SemtextWeb.Hologram.Pages.Proposals.Moderators do
  @moduledoc """
  Moderator detection + viewer construction for the proposals surface.

  `Semtext.Hologram.Auth.serialize_user/2` derives `is_moderator` from
  `user.role`, but the Noizu user entity does not carry the `role`
  column (schema-only field), so the session-serialized user can never
  claim it. Until the entity layer grows the field (auth lane), the
  proposals pages fall back to one primary-key schema read — acceptable
  for a moderator-gated surface, and sandbox-safe in tests.
  """

  alias Semtext.Repo
  alias Semtext.Schema.Users.User

  @doc "True when the serialized user is a moderator (entity flag or schema role)."
  def moderator?(user)

  def moderator?(nil), do: false

  def moderator?(user) when is_map(user) do
    flag?(user, :is_moderator) or flag?(user, "is_moderator") or schema_role?(user)
  end

  @doc "Context viewer for `Semtext.Proposals` visibility calls."
  def viewer(nil), do: nil

  def viewer(user) when is_map(user) do
    if moderator?(user) do
      %{user_id: user_id(user), moderator: true}
    else
      %{user_id: user_id(user), moderator: false}
    end
  end

  # ── private ──────────────────────────────────────────────────

  defp flag?(user, key) when is_map(user), do: Map.get(user, key) == true
  defp flag?(_, _), do: false

  defp schema_role?(user) do
    case user_id(user) do
      nil ->
        false

      id ->
        case Repo.get(User, id) do
          nil -> false
          %{role: "moderator"} -> true
          _ -> false
        end
    end
  end

  defp user_id(user) when is_map(user) do
    case Map.get(user, :id) || Map.get(user, "id") do
      id when is_binary(id) -> id
      _ -> nil
    end
  end
end
