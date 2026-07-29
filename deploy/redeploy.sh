#!/bin/bash
# Polled by cron on the deploy server (see deploy/README or crontab -l for the
# venture user). Checks origin/main for new commits; if there's nothing new,
# exits immediately without touching the running container - only builds/
# restarts when there's an actual change to deploy.
set -euo pipefail

cd "$(dirname "$0")/.."

LOCK_FILE="/tmp/programmatic-page-deploy.lock"
exec 200>"$LOCK_FILE"
flock -n 200 || { echo "$(date -Iseconds) deploy already in progress, skipping"; exit 0; }

git fetch origin main --quiet

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

if [ "$LOCAL" = "$REMOTE" ]; then
  exit 0
fi

echo "$(date -Iseconds) new commit detected ($LOCAL -> $REMOTE), deploying"
git merge --ff-only origin/main

docker build -t programmatic-page:latest .
docker stop programmatic-page
docker rm programmatic-page
docker run -d --name programmatic-page -p 9090:3000 \
  --env-file deploy/.env \
  -v programmatic-page-pgdata:/var/lib/postgresql/data \
  --restart unless-stopped \
  programmatic-page:latest

echo "$(date -Iseconds) deploy complete ($REMOTE)"
