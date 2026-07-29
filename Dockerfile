# Single-container deployment: PostgreSQL + Redis + the BullMQ worker
# (apps/backend) + the Next.js app (apps/frontend) all run inside one
# image/container, per explicit deployment requirement (normally these
# would be separate services - see docker-compose.yml for the
# local-development split - but the target host wants exactly one
# Dockerfile/one container for everything, DB included).
FROM node:20-bookworm

# postgresql/redis-server pull in their own service users (postgres/redis);
# gosu lets the entrypoint drop from root to `postgres` for DB commands
# without making the whole container run as a non-root user.
RUN apt-get update && apt-get install -y --no-install-recommends \
      postgresql postgresql-contrib redis-server gosu \
    && rm -rf /var/lib/apt/lists/*

ENV PGDATA=/var/lib/postgresql/data
ENV POSTGRES_DB=venture27
ENV POSTGRES_USER=postgres

WORKDIR /app

# Install deps first (better layer caching on rebuilds where only app code
# changed) - copy just the package manifests needed to resolve the
# workspace, matching this repo's npm-workspaces monorepo layout.
COPY package.json package-lock.json ./
COPY apps/frontend/package.json apps/frontend/package.json
COPY apps/backend/package.json apps/backend/package.json
COPY packages/database/package.json packages/database/package.json
# --ignore-scripts: the root "postinstall" script runs `prisma generate`,
# but the actual schema file isn't copied in until after this layer - so at
# this point that hook would run and immediately fail with "schema not
# found". `prisma generate` is invoked explicitly below, after `COPY . .`.
RUN npm install --ignore-scripts

COPY . .

# `prisma generate` only needs DATABASE_URL to be well-formed, not
# reachable, at build time - the real one is set at container runtime once
# Postgres is actually running (see entrypoint.sh). No page in this app
# fetches from the DB during the Next.js build itself (everything renders
# dynamically at request time), so a placeholder is safe here.
ENV DATABASE_URL="postgresql://postgres:build@localhost:5432/venture27?schema=public"
RUN npm run build --workspace=@venture27/database
RUN npm run build --workspace=@venture27/frontend

COPY deploy/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Only the frontend's port is published - it's the only thing nginx (on the
# host) needs to reach. apps/backend has no external HTTP surface that
# matters outside the container (just a BullMQ worker + an internal
# /health endpoint), so it stays unpublished.
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
