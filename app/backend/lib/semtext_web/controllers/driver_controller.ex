defmodule SemtextWeb.DriverController do
  @moduledoc """
  REST surface for the Phase 6 driver mock (`Semtext.Driver`): `POST /run`
  validates + enqueues a simulated run, `GET /runs/:id` returns its current
  envelope. Thin by design — validation and lifecycle live in the Driver
  context. Every response carries `mode: "mock"`; no auth (read-only mock,
  same posture as the Phase 5 live-fetch proxies).
  """

  use SemtextWeb, :controller

  alias Semtext.Driver

  def create(conn, params) do
    case Driver.create_run(params) do
      {:ok, job} ->
        conn
        |> put_status(:created)
        |> json(Driver.render_run(job))

      {:error, errors} ->
        conn
        |> put_status(:bad_request)
        |> json(%{error: "invalid_request", errors: errors})
    end
  end

  def show(conn, %{"id" => id}) do
    case Driver.get_run(id) do
      {:ok, job} ->
        json(conn, Driver.render_run(job))

      :error ->
        conn
        |> put_status(:not_found)
        |> json(%{error: "not_found"})
    end
  end
end
