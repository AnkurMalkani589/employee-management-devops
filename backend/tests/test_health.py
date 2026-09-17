"""Tests for the root and health endpoints."""

from fastapi.testclient import TestClient


def test_root(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    body = response.json()
    assert "message" in body
    assert "version" in body
    assert body["docs"] == "/docs"


def test_health(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["database"] == "ok"


def test_ready(client: TestClient) -> None:
    response = client.get("/ready")
    assert response.status_code == 200
    assert response.json()["status"] == "ready"


def test_openapi_docs_available(client: TestClient) -> None:
    """The OpenAPI schema (and therefore /docs) must be generated."""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    schema = response.json()
    paths = schema["paths"]
    for path in ["/", "/health", "/ready", "/employees", "/employees/{employee_id}"]:
        assert path in paths, f"missing path {path} in OpenAPI schema"
