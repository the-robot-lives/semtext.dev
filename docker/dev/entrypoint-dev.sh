#!/bin/sh
# Dev-mode entrypoint — stage.semtext.dev manual lane ONLY
# (docs/runbooks/stage-dev-lane.md).
#
# The build host is arm64 and OrbStack's amd64 emulation crashes the BEAM, so
# the image carries NO compiled state: this wrapper bootstraps on first boot —
# NATIVELY on the amd64 cluster nodes — then execs the Phoenix dev server.
# deps/_build land in /code/app/backend (the code PVC), so every boot after
# the first is warm. Never auto-migrates — Liquibase owns the schema
# (runbook rule 3); schema audits/applys are explicit operator actions.
set -eu

# 1. Wait for the git-poller's clone (the code volume starts empty; the
#    poller sidecar clones the `work` branch within seconds of pod start).
#    10-min cap, then fail loudly — the pod restarts and retries.
i=0
while [ ! -f /code/app/backend/mix.exs ]; do
  if [ "$i" -ge 600 ]; then
    echo "entrypoint-dev: /code/app/backend/mix.exs never appeared (git-poller clone failed?)" >&2
    exit 1
  fi
  sleep 2
  i=$((i + 2))
done
cd /code/app/backend

# 2. Hex/Rebar (the base image ships them but a cold container still needs the
#    archives; guarded so warm boots skip the download). Runs NATIVELY on the
#    node — never at image build time (arm64 emulation crashes the BEAM).
mix hex.info >/dev/null 2>&1 || mix local.hex --force
mix rebar3 --version >/dev/null 2>&1 || mix local.rebar --force

# 3. tobor_kit_hologram deps symlink — the kit's Hologram compiler looks for
#    JS assets under ITS OWN deps path; prod's Dockerfile links it at the
#    compiled deps dir. Here the deps live in the volume, so link the baked
#    kit source at /Portfolio/Libs/tobor-kit/hologram to /code/app/backend/deps
#    once deps exist.
if [ -d deps ]; then
  ln -sfn "$PWD/deps" /Portfolio/Libs/tobor-kit/hologram/deps
fi

# 4. Hex deps. vendor/uuid_shim is a tracked path dep (comes with the clone).
[ -d deps ] || mix deps.get

# 5. JS deps — none today (app/backend has no package.json; Hologram shells
#    out to node, which the image ships). Guarded so a future package.json
#    gets its npm ci automatically. No private registry => no token needed.
if [ -f package.json ] && [ -f package-lock.json ] && [ ! -d node_modules ]; then
  npm ci --include=dev
fi

# 6. Compile (incremental — cheap when warm).
mix compile

# 7. Dev server env. Defeats the chart/release env WITHOUT chart edits:
#    the chart renders PHX_SERVER=true + MIX_ENV/HOLOGRAM_ENV=prod (prod
#    images bake them); dev live-code needs dev. HOLOGRAM_START=1 is the
#    dev-lane unlock: Hologram.enabled?/0 is FALSE for :dev/:test unless it
#    is set (deps/hologram/lib/hologram.ex), so without it Hologram.Router
#    serves nothing and every page 404s.
export MIX_ENV=dev
export HOLOGRAM_ENV=dev
export HOLOGRAM_START=1
unset PHX_SERVER || true
# stage.semtext.dev is an unknown host to HostDispatch (config.exs :hosts is
# compile-time; main: [semtext.dev, www, localhost]) — unknown hosts 404 by
# design. The runtime hook merges extra main hosts; chart values-stage sets
# this too, the default here is defense in depth.
export SEMTEXT_EXTRA_MAIN_HOSTS="${SEMTEXT_EXTRA_MAIN_HOSTS:-stage.semtext.dev}"
export PORT="${PORT:-4000}"
export PHX_IP="${PHX_IP:-0.0.0.0}"

echo "entrypoint-dev: booting Phoenix dev server on ${PORT} (MIX_ENV=dev HOLOGRAM_ENV=dev)"
exec mix phx.server
