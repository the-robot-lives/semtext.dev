defmodule Mix.Tasks.Semtext.GrantModerator do
  @shortdoc "Grant (or revoke) the site moderator role by GitHub login"

  @moduledoc """
  `require_role(:moderator)` membership grant (design v2 §4).

      mix semtext.grant_moderator <github_login>          # grant
      mix semtext.grant_moderator <github_login> --revoke # back to 'user'

  Thin wrapper over `Semtext.Auth.Roles.set_moderator/2` (the `users.role`
  column). Exits non-zero when no such user exists.
  """

  use Mix.Task

  @impl Mix.Task
  def run(args) do
    {opts, argv, _invalid} = OptionParser.parse(args, strict: [revoke: :boolean])

    case argv do
      [login] when is_binary(login) and login != "" ->
        # Real CLI boots the app here. In an already-booted VM (ExUnit tests
        # running the task in-process) Mix's app.start can raise — the app is
        # up either way, so ignore failures.
        try do
          Mix.Task.run("app.start", [])
        rescue
          _ -> :ok
        end

        case Semtext.Auth.Roles.set_moderator(login, !Keyword.get(opts, :revoke, false)) do
          {:ok, user} ->
            Mix.shell().info("#{user.github_login} is now role=#{user.role}")

          {:error, :not_found} ->
            Mix.shell().error("No user found with github_login=#{String.trim(login)}")
            exit({:shutdown, 1})
        end

      _ ->
        Mix.shell().error("Usage: mix semtext.grant_moderator <github_login> [--revoke]")
        exit({:shutdown, 1})
    end
  end
end
