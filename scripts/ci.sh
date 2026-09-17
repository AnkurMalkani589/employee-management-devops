#!/usr/bin/env bash
#
# Local CI runner - mirrors the GitHub Actions pipeline so the same checks can
# be run offline before pushing.
#
# Steps:
#   1. Backend: create clean venv, install deps, ruff lint, pytest
#   2. Frontend: install deps, eslint, unit tests, production build
#
# Requires: python3, node, npm.
#
# Usage: ./scripts/ci.sh
set -euo pipefail
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "============================================================"
echo " CI pipeline"
echo "============================================================"

# ---------- Backend ----------
echo
echo ">>> Backend"
cd "$ROOT_DIR/backend"

CI_VENV=".ci-venv"
cleanup() {
    echo "Cleaning up backend CI environment..."
    rm -rf "$CI_VENV"
}
trap cleanup EXIT
python3 -m venv "$CI_VENV"
# shellcheck disable=SC1091
source "$CI_VENV/bin/activate"

python -m pip install --upgrade pip
python -m pip install -r requirements.txt -r requirements-dev.txt

echo "--- ruff lint ---"
python -m ruff check app tests

echo "--- pytest ---"
python -m pytest -v
# ---------- Frontend ----------
echo
echo ">>> Frontend"
cd "$ROOT_DIR/frontend"

npm ci || npm install
echo "--- eslint ---"
npm run lint
echo "--- vitest ---"
npm run test
echo "--- vite build ---"
npm run build

echo
echo "============================================================"
echo " CI pipeline PASSED"
echo "============================================================"
