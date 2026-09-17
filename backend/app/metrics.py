"""Prometheus metrics for the API.

Exposes request counts, latency and in-flight requests, plus a dependency
check for the database. Scraped at ``/metrics``.
"""

from prometheus_client import Counter, Gauge, Histogram

REQUEST_COUNT = Counter(
    "http_requests_total",
    "Total HTTP requests",
    ["method", "path", "status"],
)

REQUEST_LATENCY = Histogram(
    "http_request_duration_seconds",
    "HTTP request latency in seconds",
    ["method", "path"],
)

IN_FLIGHT = Gauge(
    "http_requests_in_flight",
    "Number of in-flight HTTP requests",
)

DB_UP = Gauge(
    "db_up",
    "1 if the database is reachable, 0 otherwise",
)


def record_request(method: str, path: str, status: int, duration: float) -> None:
    """Record a completed request against the metrics."""
    REQUEST_COUNT.labels(method=method, path=path, status=str(status)).inc()
    REQUEST_LATENCY.labels(method=method, path=path).observe(duration)
