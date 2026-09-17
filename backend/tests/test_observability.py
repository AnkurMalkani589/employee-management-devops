"""Observability endpoint tests."""

from fastapi.testclient import TestClient


def test_metrics_endpoint_exposes_prometheus_format(client: TestClient) -> None:
    # generate some traffic first
    client.get("/health")
    response = client.get("/metrics")
    assert response.status_code == 200
    body = response.text
    assert "http_requests_total" in body
    assert "db_up" in body
    assert "http_requests_in_flight" in body


def test_request_id_header_present(client: TestClient) -> None:
    response = client.get("/health")
    assert "X-Request-ID" in response.headers
