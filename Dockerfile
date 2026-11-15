# Build from the repository root; npm workspaces share one lockfile.
FROM node:22-bookworm-slim AS dependencies
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY server/package.json ./server/package.json
COPY client/package.json ./client/package.json
RUN npm ci

FROM dependencies AS build
COPY server/prisma ./server/prisma
COPY server/prisma.config.ts ./server/prisma.config.ts
# Prisma config requires a URL even for generation; no connection is made here.
RUN DATABASE_URL=postgresql://localhost/build_placeholder npm run db:generate
COPY server/src ./server/src
COPY server/tsconfig*.json ./server/
COPY client ./client
RUN npm run build

FROM build AS checks
COPY scripts ./scripts
COPY server/tests ./server/tests
COPY tests ./tests
COPY vitest.config.ts playwright.config.ts tsconfig.tools.json ./
RUN npm run typecheck && npm run test:unit

# Local nginx frontend. The backend and migration job use the production target.
FROM nginx:stable-alpine AS client
COPY client/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80

# Unified Cloud Run image, also includes Prisma CLI/tsx for a separate migration job.
# Keep locked tooling dependencies: the seed is TypeScript and Prisma is a root devDependency.
FROM node:22-bookworm-slim AS production
RUN apt-get update && apt-get install -y --no-install-recommends openssl ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/package.json /app/package-lock.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/server/src ./server/src
COPY --from=build /app/server/prisma ./server/prisma
COPY --from=build /app/server/prisma.config.ts ./server/prisma.config.ts
COPY --from=build /app/client/package.json ./client/package.json
COPY --from=build /app/client/dist ./client/dist
COPY --chmod=755 server/docker-entrypoint.sh ./server/docker-entrypoint.sh
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
USER node
WORKDIR /app/server
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/server.js"]
