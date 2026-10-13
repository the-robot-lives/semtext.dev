# SemText — semtext.dev: one image, one nginx.
#
#   /            Next.js landing (static export, landing/)
#   /site/       SemText marketing page (showcase build, dist/site)
#   /demo/       component demos (dist/demo)
#   /spec/       standalone spec pages (dist/spec, built by
#                scripts/build-standalone.mjs — its relative refs
#                ../semtext*.js and ../themes/*.css resolve from /spec/
#                against the bundles shipped at the image root)
#
# Three stages:
#   landing-builder  — node, `npm ci && npm run build` in landing/ → out/
#   showcase-builder — node, `npm ci && npm run build` at the root → dist/
#   production       — nginx:alpine serving both.
#
# The final stage MUST be named "production" — the fleet build tooling targets
# that stage name by contract (same as elixirgenai.dev, pos.noizu.com, ...).

# ---- landing (Next.js static export) ------------------------------------
FROM node:22-alpine AS landing-builder
WORKDIR /app
COPY landing/package.json landing/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci
COPY landing/ .
RUN --mount=type=cache,id=semtext-next-cache,target=/app/.next/cache,sharing=locked \
    npm run build

# ---- showcase (SemText format: site, demos, standalone spec) -------------
FROM node:22-alpine AS showcase-builder
WORKDIR /app

# Cypress is a devDependency but its binary is only needed for the e2e suite,
# never for `npm run build`. Skip the ~200MB download in the image build.
ENV CYPRESS_INSTALL_BINARY=0

COPY package.json package-lock.json ./
# npm's download cache survives lockfile changes (the layer itself does not).
RUN --mount=type=cache,target=/root/.npm npm ci

# NOTE: `COPY dir/ ./` copies the CONTENTS of dir/ into ./ — each showcase
# dir therefore needs its own destination below, or the build flat-reads /app.
COPY src/ ./src/
COPY spec/ ./spec/
COPY site/ ./site/
COPY demo/ ./demo/
COPY themes/ ./themes/
COPY scripts/ ./scripts/
COPY vite.config.ts tsconfig.json ./
RUN npm run build

# ---- serve --------------------------------------------------------------
FROM nginx:alpine AS production
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Landing is the web root.
COPY --from=landing-builder /app/out/ /usr/share/nginx/html/

# Showcase keeps its dist/ layout one level down.
COPY --from=showcase-builder /app/dist/site/ /usr/share/nginx/html/site/
COPY --from=showcase-builder /app/dist/demo/ /usr/share/nginx/html/demo/
COPY --from=showcase-builder /app/dist/spec/ /usr/share/nginx/html/spec/
COPY --from=showcase-builder /app/dist/themes/ /usr/share/nginx/html/themes/
COPY --from=showcase-builder /app/dist/semtext*.js /usr/share/nginx/html/

# Runtime GA4 injection. The served root page carries an inert marker
# comment; the entrypoint hook rewrites the copy at / from this pristine
# template on every container start (nginx:alpine runs
# /docker-entrypoint.d/*.sh before nginx). GA_MEASUREMENT_ID is therefore a
# deploy-time helm value, not something baked into an image sha — unset means
# no analytics at all. Showcase pages keep their marker as an inert comment.
COPY --from=landing-builder /app/out/index.html /usr/share/nginx/templates/index.html
COPY docker/20-ga-measurement-id.sh /docker-entrypoint.d/20-ga-measurement-id.sh
RUN chmod +x /docker-entrypoint.d/20-ga-measurement-id.sh

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
