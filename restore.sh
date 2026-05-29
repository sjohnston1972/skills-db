#!/usr/bin/env bash
# Restore a Skills Matrix pg_dump into the running container's Postgres.
# Usage: ./restore.sh <dump-file.sql>
#
# Produce the dump with:
#   docker exec skills-matrix-db pg_dump --clean --if-exists --no-owner -U skillsuser skills_matrix > dump.sql
#
# Note: restoring as 'skillsuser' may emit harmless "must be able to SET ROLE"
# notices on ownership lines; data still loads. We therefore do NOT stop on error.
set -euo pipefail

DUMP="${1:?Usage: ./restore.sh <dump-file.sql>}"
CONTAINER="${CONTAINER:-skills-matrix-db}"
DB_NAME="${DB_NAME:-skills_matrix}"
DB_USER="${DB_USER:-skillsuser}"

if [ ! -f "$DUMP" ]; then
  echo "Dump file not found: $DUMP" >&2
  exit 1
fi

echo "Restoring $DUMP into container '$CONTAINER' (db=$DB_NAME, user=$DB_USER)..."
docker exec -i "$CONTAINER" psql -v ON_ERROR_STOP=0 -U "$DB_USER" -d "$DB_NAME" < "$DUMP"
echo "Restore finished. Verify your data in the app."
