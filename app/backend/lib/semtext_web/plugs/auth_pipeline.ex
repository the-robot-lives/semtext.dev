defmodule SemtextWeb.AuthPipeline do
  use Guardian.Plug.Pipeline,
    otp_app: :semtext,
    module: Semtext.Guardian,
    error_handler: SemtextWeb.AuthErrorHandler

  plug Guardian.Plug.VerifyHeader, scheme: "Bearer"
  plug Guardian.Plug.EnsureAuthenticated
  plug Guardian.Plug.LoadResource
  # Last: the invite gate covers every current and future authenticated route.
  plug SemtextWeb.Plugs.RequireInvite
end
