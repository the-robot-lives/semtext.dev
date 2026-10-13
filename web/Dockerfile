# syntax=docker/dockerfile:1.7
#
# Cache policy: additive / over-tolerant.
# - npm package cache on BuildKit mount (partials kept across builds).
# - .next/cache on BuildKit mount (helps even for static export; Next still uses .next during build).
# - Prefer occasional prune over cold npm ci / next rebuilds.

FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci
COPY . .
RUN --mount=type=cache,id=semtext-next-cache,target=/app/.next/cache,sharing=locked \
    npm run build

FROM nginx:alpine AS production
COPY --from=builder /app/out /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
