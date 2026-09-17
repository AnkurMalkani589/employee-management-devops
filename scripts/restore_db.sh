#!/usr/bin/env bash
#
# PostgreSQL restore script.
#
# Restores a custom-format dump produced by backup_db.sh. Without arguments it
# restores the most recent dump in BACKUP_DIR.
#
# Usage:
#   ./scripts/restore_db.sh                          # latest backup
#   ./scripts/restore_db.sh /backups/employees_X.dump
#
# Env vars: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE, BACKUP_DIR

set -euo pipefail

PGHOST="${PGHOST:-db}"
PGPORT="${PGPORT:-5432}"
PGUSER="${PGUSER:-employee}"
PGDATABASE="${PGDATABASE:-employees}"
BACKUP_DIR="${BACKUP_DIR:-/backups}"

if [[ $# -ge 1 ]]; then
    backup_file="$1"
else
    backup_file="$(ls -1t "${BACKUP_DIR}"/${PGDATABASE}_*.dump 2>/dev/null | head -n1 || true)"
fi

if [[ -z "${backup_file:-}" || ! -f "${backup_file}" ]]; then
    echo "[restore] ERROR: no backup file found in ${BACKUP_DIR}" >&2
    exit 1
fi

echo "[restore] restoring ${backup_file} -> ${PGDATABASE}@${PGHOST}:${PGPORT}"
echo "[restore] this will DROP and recreate objects in the target database"

pg_restore \
    --host="${PGHOST}" \
    --port="${PGPORT}" \
    --username="${PGUSER}" \
    --dbname="${PGDATABASE}" \
    --clean \
    --if-exists \
    --no-owner \
    --verbose \
    "${backup_file}"

echo "[restore] done"
