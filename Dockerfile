# syntax=docker/dockerfile:1.7
#
# SemText — semtext.dev: one image, one nginx.
#
#   /             web/ Next.js static export — home, /reference/,
#                 /docs/, /integrations/, /showcase/, /themes/, /extend/,
#                 /dataviz/, /elements/ (meta-refresh → /reference/)
#   /semtext/     runtime bundles + theme CSS (web/public/semtext)
#   /demo/        SemText fixtures (web/public/demo)
#   /spec/        spec snapshot (web/public/spec)
#
# The old surfaces (landing/ one-pager, vite showcase dist/site + dist/demo +
# dist/spec + root semtext*.js bundles + /themes/*.css) are no longer built
# into the image. Their URLs live on as nginx 301s — see nginx.conf.
#
# Two stages:
#   web-builder — node, `npm ci && npm run build` in web/ → out/
#   production  — nginx:alpine serving the export.
#
# The final stage MUST be named "production" — the fleet build tooling targets
# that stage name by contract (same as elixirgenai.dev, pos.noizu.com, ...).

# ---- web (Next.js static export) -----------------------------------------
FROM node:22-alpine AS web-builder
WORKDIR /app

# Cypress is a devDependency but its binary is only needed for the e2e suite,
# never for `npm run build`. Skip the ~200MB download in the image build.
ENV CYPRESS_INSTALL_BINARY=0

COPY web/package.json web/package-lock.json ./
# npm's download cache survives lockfile changes (the layer itself does not).
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci
COPY web/ .
# Static export still warms .next/cache; keep it across builds.
RUN --mount=type=cache,id=semtext-next-cache,target=/app/.next/cache,sharing=locked \
    npm run build

# ---- serve --------------------------------------------------------------
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf

# The web/ export is the web root (public/ files included in out/).
COPY --from=web-builder /app/out/ /usr/share/nginx/html/

# Runtime GA4 injection. The served root page carries an inert marker
# comment; the entrypoint hook rewrites the copy at / from this pristine
# template on every container start (nginx:alpine runs
# /docker-entrypoint.d/*.sh before nginx). GA_MEASUREMENT_ID is therefore a
# deploy-time helm value, not something baked into an image sha — unset means
# no analytics at all. NOTE: neither the old landing/ nor the current web/
# home ships the marker comment, so injection is a no-op today; the plumbing
# (helm env + hook + template) stays in place so a future marker needs no
# image change.
COPY --from=web-builder /app/out/index.html /usr/share/nginx/templates/index.html
COPY docker/20-ga-measurement-id.sh /docker-entrypoint.d/20-ga-measurement-id.sh
RUN chmod +x /docker-entrypoint.d/20-ga-measurement-id.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
