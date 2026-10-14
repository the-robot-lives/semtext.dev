defmodule Semtext.Repo do
  use Ecto.Repo,
    otp_app: :semtext,
    adapter: Ecto.Adapters.Postgres
end
