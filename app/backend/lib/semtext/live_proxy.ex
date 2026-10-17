defmodule Semtext.LiveProxy do
  @moduledoc """
  Read-only live-fetch proxy (vocabulary epic Phase 5): server-side GETs to
  first-party services the embed chrome enriches against, so visitor
  browsers never hold upstream credentials and rate limits land in one place.

  Route table (all GET-only, `proxy_read` rate-limited, no auth — the data is
  org-public or already-public; credentials live server-side only):

  | Route                                             | Purpose                              |
  |---------------------------------------------------|--------------------------------------|
  | `GET /api/v1/agent-kit/tickets/:org/:project/:key`| one ticket's status/title enrichment |
  | `GET /api/v1/agent-kit/personas/:org`             | org persona directory                |
  | `GET /api/v1/agent-kit/boards/:org`               | org ticket boards                    |
  | `GET /api/v1/annotate/threads?site=&page=`        | annotate page-comments collection    |

  Fail-soft contract (THE embed-side promise — see `SemtextWeb.LiveProxyResponse`):
  any non-200 answer means "stay cached". The embed renders its last cached
  snapshot and never blocks or errors the page on a proxy problem. Bodies carry
  a machine-readable `error` kind + `live: false`; statuses are 400
  (invalid client params — do not retry), 404 (upstream says no such object),
  502 (upstream 5xx/timeout/transport — may retry later), 503 (proxy not
  configured upstream — ops fix).

  docptr (scope 3 of the plan): deliberately NOT proxied. The snapshot's
  doc-pointer map is file-backed at build time; there is nothing to call
  upstream. Server-side re-resolution only becomes a route if this backend
  ever hosts the referenced repo checkout — noted here so the gap is a
  decision, not an omission.
  """
end
