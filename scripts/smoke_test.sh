#!/usr/bin/env bash
#
# End-to-end smoke test against a *running* stack.
#
# Verifies the full request chain that a user actually exercises:
#   nginx (edge) -> backend postgres
#
# Usage:
#   BASE_URL=http://localhost:8080 ./scripts/smoke_test.sh
#
# Exits non-zero with a clear message on the first failure.

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8080}"
API="${BASE_URL}/api"
MAX_RETRIES="${MAX_RETRIES:-20}"
RETRY_DELAY="${RETRY_DELAY:-3}"

pass() { echo "  [PASS] $1"; }
fail() { echo "  [FAIL] $1" >&2; exit 1; }

echo "============================================================"
echo " Smoke test against ${BASE_URL}"
echo "============================================================"

# 1. Edge health
echo "[1] Edge nginx health"
for i in $(seq 1 "$MAX_RETRIES"); do
    if curl -fsS "${BASE_URL}/nginx-health" >/dev/null 2>&1; then
        pass "nginx /nginx-health reachable"
        break
    fi
    [[ "$i" -eq "$MAX_RETRIES" ]] && fail "nginx not reachable after ${MAX_RETRIES} tries"
    sleep "$RETRY_DELAY"
done

# 2. Backend health THROUGH nginx (proves /api routing + upstream)
echo "[2] Backend health through nginx"
health="$(curl -fsS "${API}/health")" || fail "/api/health not reachable"
echo "$health" | grep -q '"status":"ok"' || fail "backend status not ok: $health"
echo "$health" | grep -q '"database":"ok"' || fail "backend cannot reach database: $health"
pass "backend healthy and connected to DB"

# 3. List employees (seeded data present)
echo "[3] Read employees"
list="$(curl -fsS "${API}/employees")" || fail "GET /api/employees failed"
echo "$list" | grep -q '"id"' || fail "no employees returned: $list"
pass "GET /api/employees returned data"

# 4. Full CRUD round-trip
echo "[4] CRUD round-trip"
email="smoke.$(date +%s)@example.com"
created="$(curl -fsS -X POST "${API}/employees" \
    -H 'Content-Type: application/json' \
    -d "{\"name\":\"Smoke Test\",\"email\":\"${email}\",\"department\":\"QA\",\"role\":\"Bot\"}")" \
    || fail "POST /api/employees failed"
id="$(echo "$created" | sed -n 's/.*"id":\([0-9]*\).*/\1/p')"
[[ -n "$id" ]] || fail "could not parse created id: $created"
pass "created id=$id"

curl -fsS -X PUT "${API}/employees/${id}" \
    -H 'Content-Type: application/json' \
    -d '{"department":"Platform"}' >/dev/null || fail "PUT failed"
pass "updated id=$id"

curl -fsS -X DELETE "${API}/employees/${id}" >/dev/null || fail "DELETE failed"
pass "deleted id=$id"

# 5. 404 after delete
echo "[5] Deleted resource is gone"
code="$(curl -s -o /dev/null -w '%{http_code}' "${API}/employees/${id}")"
[[ "$code" == "404" ]] || fail "expected 404 after delete, got $code"
pass "GET after delete -> 404"

# 6. Frontend is served by nginx
echo "[6] Frontend served by nginx"
curl -fsS "${BASE_URL}/" | grep -qi 'id="root"' || fail "frontend index not served"
pass "SPA index served at /"

echo "============================================================"
echo " SMOKE TEST PASSED"
echo "============================================================"
