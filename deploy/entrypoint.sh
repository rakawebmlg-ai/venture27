#!/bin/bash
set -euo pipefail

: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set (docker run -e / env-file)}"
: "${DASHBOARD_USERNAME:?DASHBOARD_USERNAME must be set}"
: "${DASHBOARD_PASSWORD:?DASHBOARD_PASSWORD must be set}"
: "${SESSION_SECRET:?SESSION_SECRET must be set}"

PGDATA="${PGDATA:-/var/lib/postgresql/data}"
POSTGRES_DB="${POSTGRES_DB:-venture27}"
PG_BIN="$(dirname "$(find /usr/lib/postgresql -maxdepth 3 -name initdb | head -n1)")"

mkdir -p "$PGDATA" /var/run/postgresql
chown -R postgres:postgres "$PGDATA" /var/run/postgresql

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  gosu postgres "$PG_BIN/initdb" -D "$PGDATA" --auth=trust --username=postgres >/dev/null
  # initdb only trusts local unix-socket connections by default; Prisma
  # connects over TCP to 127.0.0.1, so that path needs an explicit password rule.
  echo "host all all 127.0.0.1/32 scram-sha-256" >> "$PGDATA/pg_hba.conf"
fi

gosu postgres "$PG_BIN/pg_ctl" -D "$PGDATA" -l /var/log/postgres.log -w start

gosu postgres psql -v ON_ERROR_STOP=1 --username postgres -c \
  "ALTER ROLE postgres WITH PASSWORD '${POSTGRES_PASSWORD}';"

gosu postgres psql -v ON_ERROR_STOP=1 --username postgres -tc \
  "SELECT 1 FROM pg_database WHERE datname = '${POSTGRES_DB}'" | grep -q 1 || \
  gosu postgres createdb --username postgres "${POSTGRES_DB}"

export DATABASE_URL="postgresql://postgres:${POSTGRES_PASSWORD}@127.0.0.1:5432/${POSTGRES_DB}?schema=public"
export REDIS_URL="${REDIS_URL:-redis://127.0.0.1:6379}"
export NODE_ENV=production
export PORT="${BACKEND_PORT:-3001}"

redis-server --daemonize yes --save "" --appendonly no --bind 127.0.0.1

npx prisma db push --schema=packages/database/prisma/schema.prisma --skip-generate --accept-data-loss

# Backend (BullMQ worker + its small internal API) runs in the background;
# the frontend is what actually needs to stay in the foreground as PID 1's
# child so `docker stop`/health checks behave normally.
npx tsx apps/backend/src/index.ts &
BACKEND_PID=$!

cleanup() {
  kill "$BACKEND_PID" 2>/dev/null || true
  gosu postgres "$PG_BIN/pg_ctl" -D "$PGDATA" -m fast -w stop || true
}
trap cleanup TERM INT

npm run start --workspace=@venture27/frontend -- -p 3000 &
FRONTEND_PID=$!

wait "$FRONTEND_PID"
