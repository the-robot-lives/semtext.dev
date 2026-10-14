defmodule SemtextWeb.ConfigController do
  use SemtextWeb, :controller

  # <REMOVED UUID HERE> features :: auto-generated pointer for public function features
  def features(conn, _params) do
    flags = Semtext.FeatureFlags.all()
    conn |> put_status(:ok) |> json(%{features: flags})
  end
end
