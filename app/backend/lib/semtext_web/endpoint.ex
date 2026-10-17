defmodule SemtextWeb.Endpoint do
  use Phoenix.Endpoint, otp_app: :semtext

  socket "/socket", SemtextWeb.UserSocket,
    websocket: [timeout: 45_000],
    longpoll: false

  # www -> apex 301 before anything else (static assets included).
  plug SemtextWeb.Plugs.CanonicalHost

  # Style-guide CSS + Hologram client bundles + vendored SemText islands
  # (priv/static/semtext/** — the same artefacts the Next.js site ships at
  # /semtext/**; design v2 §2.2). The js/ dir carries the island bridge.
  # demo/ + spec/ are byte-copies of the Next.js public/ demo windows and the
  # HTML spec the landing links to (port-landing lane). dataviz/ is the data
  # visualizer showcase's reading bundle + vocabulary theme + data files
  # (port-reference lane).
  plug Plug.Static,
    at: "/",
    from: :semtext,
    gzip: false,
    only: ~w(themes css hologram favicon.ico robots.txt semtext js demo spec dataviz icon.svg apple-touch-icon.png manifest.webmanifest icons)

  if code_reloading? do
    plug Phoenix.CodeReloader
    plug Phoenix.Ecto.CheckRepoStatus, otp_app: :semtext
  end

  plug SemtextWeb.Plugs.CORS
  plug Plug.RequestId
  plug SemtextWeb.Plugs.OtelLoggerMetadata
  plug Plug.Telemetry, event_prefix: [:phoenix, :endpoint]

  plug Plug.Parsers,
    parsers: [:urlencoded, :multipart, :json],
    pass: ["*/*"],
    json_decoder: Phoenix.json_library(),
    # GitHub webhooks must be verified against the RAW body (X-Hub-Signature-256,
    # byte-exact) after the JSON parser consumes the stream — the reader caches
    # a raw copy for /api/v1/webhooks/** requests only (everything else pays
    # zero extra memory).
    body_reader: {Semtext.Github.Webhook.BodyReader, :read, []}

  plug Plug.MethodOverride
  plug Plug.Head
  # Plug options are evaluated at compile time, so the session's signing salt
  # is read at runtime by SemtextWeb.Plugs.Session instead of being committed
  # here as a literal.
  plug SemtextWeb.Plugs.Session

  # Host-based dispatch (design v2 §3.1) BEFORE any page routing: the
  # proposals host goes to its own router and unknown hosts 404, so neither
  # ever reaches Hologram page routes.
  plug SemtextWeb.Plugs.HostDispatch

  # Hologram pages/commands BEFORE the Phoenix JSON API router
  plug SemtextWeb.Plugs.ReferenceCache
  plug Hologram.Router
  plug SemtextWeb.Router
end
