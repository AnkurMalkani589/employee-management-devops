"""Health and readiness endpoints.

* ``/health``  — liveness: the process is up. Never touches the database.
* ``/ready``   — readiness: the process can serve traffic (database reachable).
These are used by Docker healthchecks, Kubernetes probes and the CD pipeline.
"""

from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.config import get_settings
from app.database import engine
from app.schemas import HealthResponse

router = APIRouter(tags=["health"])
settings = get_settings()


def _db_ok() -> bool:
    """Return True if a trivial query succeeds against the database."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:  # noqa: BLE001 - any failure means "not ready"
        return False


@router.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    """Liveness probe — does not depend on the database."""
    return HealthResponse(
        status="ok",
        database="ok" if _db_ok() else "unavailable",
        version=settings.app_version,
        environment=settings.environment,
    )


@router.get("/ready", response_model=HealthResponse)
def ready(response: Response) -> HealthResponse:
    """Readiness probe — returns 503 when the database is unreachable."""
    db_ok = _db_ok()
    if not db_ok:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    return HealthResponse(
        status="ready" if db_ok else "not-ready",
        database="ok" if db_ok else "unavailable",
        version=settings.app_version,
        environment=settings.environment,
    )
