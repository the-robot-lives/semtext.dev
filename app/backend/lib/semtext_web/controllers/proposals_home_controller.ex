defmodule SemtextWeb.ProposalsHomeController do
  @moduledoc """
  P0 stubs for the proposals host. Browse/detail/dashboard pages and the
  proposals API replace these in P1 (design v2 §5, §8). Every stub states
  its own not-yet-implemented contract so nothing can be mistaken for a
  working endpoint.
  """
  use SemtextWeb, :controller

  def index(conn, _params) do
    json(conn, %{
      host: "proposals.semtext.dev",
      service: "semtext-proposals",
      status: "skeleton",
      note: "Proposals browse lands in P1 (design v2 §8)."
    })
  end

  def show(conn, %{"slug" => slug}) do
    conn
    |> put_status(:not_found)
    |> json(%{
      error: "not_implemented",
      slug: slug,
      note: "Proposal detail pages land in P1 (design v2 §8)."
    })
  end

  def health(conn, _params) do
    json(conn, %{status: "ok"})
  end
end
