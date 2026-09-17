#!/usr/bin/env bash
#
# PostgreSQL backup script.
#
# Creates a timestamped, compressed custom-format dump (restorable with
# pg_restore) and prunes backups older than BACKUP_RETENTION_DAYS.
#
# Works two ways:
#   * Inside the compose stack: DB_HOST=db, run from the backend or a db container
#   * Locally: export DB_* / PGHOST etc.
#
# Env vars (all optional, with defaults):
#   PGHOST (db), PGPORT (5432), PGUSER (employee),
#   PGPASSWORD, PGDATABASE (employees)
#   BACKUP_DIR (/backups), BACKUP_RETENTION_DAYS (7)
#
# Usage:
#   ./scripts/backup_db.sh
#   docker compose exec db /scripts/backup_db.sh   # if mounted

set -euo pipefail

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-employee}"
PGDATABASE="${PGDATABASE:-employees}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"
BACKUP_RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-7}"

timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
backup_file="${BACKUP_DIR}/${PGDATABASE}_${timestamp}.dump"

mkdir -p "${BACKUP_DIR}"

echo "[backup] dumping ${PGDATABASE}@${PGHOST}:${PGPORT} -> ${backup_file}"
pg_dump \
    --host="${PGHOST}" \
    --port="${PGPORT}" \
    --username="${PGUSER}" \
    --dbname="${PGDATABASE}" \
    --format=custom \
    --compress=9 \
    --no-owner \
    --file="${backup_file}"

echo "[backup] wrote $(du -h "${backup_file}" | cut -f1)"

# Verify the dump is readable before trusting it.
echo "[backup] verifying dump integrity"
pg_restore --list "${backup_file}" > /dev/null
echo "[backup] dump verified OK"

echo "[backup] pruning backups older than ${BACKUP_RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "${PGDATABASE}_*.dump" -type f \
    -mtime "+${BACKUP_RETENTION_DAYS}" -print -delete || true

echo "[backup] done"
