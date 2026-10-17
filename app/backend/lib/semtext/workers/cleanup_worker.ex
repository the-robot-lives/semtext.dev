defmodule Semtext.Workers.CleanupWorker do
  use Oban.Worker, queue: :cleanup, max_attempts: 1

  import Ecto.Query

  @impl Oban.Worker
  # <REMOVED UUID HERE> perform :: auto-generated pointer for public function perform
  def perform(_job) do
    cutoff = DateTime.utc_now() |> DateTime.add(-30, :day)

    from(s in Semtext.Schema.Users.Sessions.UserSession,
      where: s.inserted_at < ^cutoff
    )
    |> Semtext.Repo.delete_all()

    :ok
  end
end
