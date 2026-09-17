#!/usr/bin/env bash
#
# Server-side deployment with health verification and automatic rollback.
#
# Invoked by the CD workflow over SSH, but runnable manually on the deploy host:
#
#   IMAGE_TAG=abc123 BACKEND_IMAGE=ghcr.io/org/repo/backend \
#   FRONTEND_IMAGE=ghcr.io/org/repo/frontend ./scripts/deploy.sh
#
# Flow:
#   record current version -> pull new images -> up -> health check
#     -> success: keep, write .deployed_tag
#     -> failure: restore previous images -> up -> verify -> exit 1
#
# Requires: docker + compose, curl. Assumes it runs in the repo checkout that
# contains docker-compose.yml.

set -euo pipefail

: "${IMAGE_TAG:?IMAGE_TAG is required}"
: "${BACKEND_IMAGE:?BACKEND_IMAGE is required (e.g. ghcr.io/org/repo/backend)}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"

COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:8080/api/health}"
HEALTH_RETRIES="${HEALTH_RETRIES:-30}"
HEALTH_DELAY="${HEALTH_DELAY:-3}"
STATE_FILE=".deployed_tag"
PREV_FILE=".previous_image_tag"

previous_tag="$(cat "$STATE_FILE" 2>/dev/null || true)"
echo "[deploy] previous tag: ${previous_tag:-<none>}"
echo "$previous_tag" > "$PREV_FILE"

export BACKEND_IMAGE="${BACKEND_IMAGE}:${IMAGE_TAG}"
export FRONTEND_IMAGE="${FRONTEND_IMAGE}:${IMAGE_TAG}"

echo "[deploy] pulling images for tag ${IMAGE_TAG}"
docker compose -f "$COMPOSE_FILE" pull || true

echo "[deploy] starting new version"
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

health_ok() {
    curl -fsS "$HEALTH_URL" 2>/dev/null | grep -q '"status":"ok"'
}

echo "[deploy] waiting for health at ${HEALTH_URL}"
for i in $(seq 1 "$HEALTH_RETRIES"); do
    if health_ok; then
        echo "[deploy] OK - new version healthy"
        echo "$IMAGE_TAG" > "$STATE_FILE"
        exit 0
    fi
    echo "[deploy] not ready ($i/$HEALTH_RETRIES)"
    sleep "$HEALTH_DELAY"
done

echo "[deploy] !! new version FAILED health checks"

if [[ -n "$previous_tag" && "$previous_tag" != "$IMAGE_TAG" ]]; then
    echo "[deploy] rolling back to ${previous_tag}"
    export BACKEND_IMAGE="${BACKEND_IMAGE%:*}:${previous_tag}"
    export FRONTEND_IMAGE="${FRONTEND_IMAGE%:*}:${previous_tag}"
    docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

    for i in $(seq 1 "$HEALTH_RETRIES"); do
        if health_ok; then
            echo "[deploy] rollback to ${previous_tag} healthy"
            echo "$previous_tag" > "$STATE_FILE"
            # Fail this deploy run: the new version was not deployed.
            exit 1
        fi
        sleep "$HEALTH_DELAY"
    done
    echo "[deploy] !! rollback ALSO unhealthy - showing logs"
    docker compose -f "$COMPOSE_FILE" logs --tail=150
else
    echo "[deploy] no previous version available; showing logs"
    docker compose -f "$COMPOSE_FILE" logs --tail=150
fi

exit 1
