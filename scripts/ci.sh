#!/bin/bash

set -e

echo "================================"
echo "Starting CI pipeline"
echo "================================"

cd "$(dirname "$0")/../backend"

CI_VENV=".ci-venv"

cleanup() {
    echo "Cleaning up CI environment..."
    rm -rf "$CI_VENV"
}

trap cleanup EXIT

echo "Creating CI virtual environment..."
python3 -m venv "$CI_VENV"

echo "Activating CI virtual environment..."
source "$CI_VENV/bin/activate"

echo "Installing dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

echo "Running tests..."
python -m pytest -v

echo "================================"
echo "CI pipeline PASSED"
echo "================================"
