# syntax=docker/dockerfile:1
FROM oven/bun:1 AS build
WORKDIR /app

COPY --from=node:22-slim /usr/local/bin/node /usr/local/bin/node

COPY package.json bun.lock ./
RUN --mount=type=cache,target=/root/.bun/install/cache \
    bun install --ignore-scripts

COPY . .
RUN bunx nuxt prepare && bun run generate

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/.output/public /usr/share/nginx/html/simplewiki

EXPOSE 80
# Start period covers nginx boot; grep rejects an empty body so a contentless 200 is unhealthy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget -q -T 3 -O - http://127.0.0.1/simplewiki/ | grep -q . || exit 1
