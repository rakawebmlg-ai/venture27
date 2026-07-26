#!/bin/bash
# Restores the venture27 database from the pg_dump custom-format archive that the
# `dbdump` service (image: rakawebmlg/venture27-dbdump) copies into /dump.
#
# Postgres only runs /docker-entrypoint-initdb.d/* when its data directory is
# EMPTY, so this fires on a fresh `docker compose up` (or after `docker compose
# down -v`) and never overwrites an existing database.
set -euo pipefail

DUMP_FILE="${DUMP_FILE:-/dump/venture27.dump}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "[restore] $DUMP_FILE not found — starting with an empty database."
  echo "[restore] Run 'npx prisma db push' in packages/database to create the schema."
  exit 0
fi

echo "[restore] Restoring $DUMP_FILE into database '$POSTGRES_DB'..."

# --no-owner / --no-privileges: the dump was taken as role 'postgres'; these keep
# the restore working even if POSTGRES_USER is changed later.
pg_restore \
  --username "$POSTGRES_USER" \
  --dbname "$POSTGRES_DB" \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  "$DUMP_FILE"

echo "[restore] Done."
