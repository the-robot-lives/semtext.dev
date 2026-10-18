# Dev-mode live-code image — stage.semtext.dev manual lane ONLY
# (docs/runbooks/stage-dev-lane.md). NEVER referenced by prod/CI: prod builds
# the compiled-release image from app/backend/Dockerfile; this one runs
# `mix phx.server` (dev code reloader) from a live volume mounted at /code.
# Registry namespace semtext.dev-work/* is DISJOINT from prod's
# semtext.dev/* so no prod automation can ever pull a dev image.
#
# THIN BY NECESSITY: the cluster nodes are amd64 and this build host is arm64 —
# OrbStack's amd64 emulation crashes the BEAM before mix even starts
# ({failed_to_start_child,user,nouser}; observed on the codemoshiach lane
# 2026-10-18). So NO mix/npm RUN steps here — this image carries toolchain +
# source only, and entrypoint-dev.sh bootstraps (hex, deps.get, compile) on
# first pod boot, NATIVELY on the amd64 nodes. Probe budgets in values-stage
# (40-min liveness delay) ride out that first boot; deps/_build persist on the
# code PVC so every later boot is warm.
#
# Toolchain versions stay in lockstep with app/.tool-versions and the prod
# image BASE_IMAGE (elixir 1.20.1 / OTP 29). JVM + Liquibase match
# Dockerfile.live-dev so schema audits (`mix liquibase.update`) can run
# in-pod against the work-branch changelog (runbook rule 3).
#
# Build (from the REPO ROOT of the `work` branch worktree, so docker/dev/
# entrypoint-dev.sh and app/backend are in context):
#   docker buildx build --platform linux/amd64 \
#     -f docker/dev/Dockerfile.app \
#     --build-context tobor_kit_hologram=<tobor-kit checkout>/hologram \
#     --build-arg STAGE_BUILD_SHA=$(git rev-parse HEAD) \
#     -t ops.noizu.com/semtext.dev-work/app:work-<short> .
FROM elixir:1.20.1-otp-29-slim

# Keep BEAM JIT mappings compatible with cross-arch builds (same as release).
ENV ERL_AFLAGS="+JMsingle true"

# Toolchain for the first-boot bootstrap (see entrypoint-dev.sh): build-essential
# for C NIF builds, git for git deps, inotify-tools for the LiveReload watcher
# (file_system resolves inotifywait from $PATH), gettext for envsubst,
# postgresql-client for manual psql checks. nodejs: the Hologram compiler
# shells out to node for Elixir -> JS bundles (same as the prod image).
RUN apt-get update -y && \
    apt-get install -y build-essential git inotify-tools curl ca-certificates gettext postgresql-client && \
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Liquibase owns the schema (`mix liquibase.update` runs the JVM CLI). Included
# so the schema-before-code audit/apply (runbook rule 3 + step 6) can run
# in-pod from the work-branch changelog. Same versions as Dockerfile.live-dev.
ENV JAVA_HOME=/opt/java/openjdk
COPY --from=eclipse-temurin:21-jre /opt/java/openjdk /opt/java/openjdk
ARG LIQUIBASE_VERSION="4.29.2"
RUN mkdir -p /opt/liquibase && \
    curl -fsSL "https://github.com/liquibase/liquibase/releases/download/v${LIQUIBASE_VERSION}/liquibase-${LIQUIBASE_VERSION}.tar.gz" | tar -xz -C /opt/liquibase && \
    curl -fsSL "https://jdbc.postgresql.org/download/postgresql-42.7.4.jar" -o /opt/liquibase/lib/postgresql.jar
ENV PATH="/opt/liquibase:${JAVA_HOME}/bin:${PATH}"

# tobor_kit_hologram path dep: baked from its own build context (prod does the
# same at /Portfolio/Libs/tobor-kit/hologram). The entrypoint re-points the
# kit's deps symlink at the live volume's deps dir after the git-poller clone.
COPY --from=tobor_kit_hologram mix.exs mix.lock /Portfolio/Libs/tobor-kit/hologram/
COPY --from=tobor_kit_hologram lib /Portfolio/Libs/tobor-kit/hologram/lib
COPY --from=tobor_kit_hologram priv /Portfolio/Libs/tobor-kit/hologram/priv
RUN test -f /Portfolio/Libs/tobor-kit/hologram/mix.exs || { \
      echo "tobor_kit_hologram build context missing: pass --build-context tobor_kit_hologram=<tobor-kit>/hologram" >&2; exit 1; }
ENV TOBOR_KIT_HOLOGRAM_PATH=/Portfolio/Libs/tobor-kit/hologram

# Source snapshot (provenance only — the servers run from /code, the
# git-poller's clone of the work branch; this copy is what the image tag
# work-<sha> attests to).
COPY app/backend /app
COPY docker/dev/entrypoint-dev.sh /app/entrypoint-dev.sh
RUN chmod +x /app/entrypoint-dev.sh

# Image provenance: reported as OTel service.version input alongside the tag.
ARG STAGE_BUILD_SHA=""
ENV STAGE_BUILD_SHA=${STAGE_BUILD_SHA}

# The chart's gated devCode block runs this wrapper (waits for the git-poller
# clone, cd's into /code/app/backend, bootstraps, execs the dev server).
ENTRYPOINT ["/bin/sh", "/app/entrypoint-dev.sh"]
EXPOSE 4000
