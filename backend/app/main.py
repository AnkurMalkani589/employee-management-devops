"""Employee Management API - FastAPI application entrypoint.

Wires together configuration, logging, CORS, request tracing, the database
lifecycle (wait-for-db + schema bootstrap + seed) and the API routers.
"""

import time
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from prometheus_client import CONTENT_TYPE_LATEST, generate_latest
from sqlalchemy import text

from app import metrics
from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.logging_config import configure_logging, get_logger
from app.routers import employees, health

settings = get_settings()
logger = get_logger("app.main")


def _wait_for_database() -> None:
    """Block until the database accepts connections (or raise).

    In Docker the API container may start before PostgreSQL is ready; this
    makes startup deterministic instead of crashing on the first request.
    """
    last_error: Exception | None = None
    for attempt in range(1, settings.db_connect_retries + 1):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("Database connection established (attempt %s)", attempt)
            return
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            logger.warning(
                "Database not ready (attempt %s/%s): %s",
                attempt,
                settings.db_connect_retries,
                exc,
            )
            time.sleep(settings.db_connect_retry_delay_seconds)
    raise RuntimeError(f"Database unreachable after retries: {last_error}")


def _bootstrap_schema() -> None:
    """Create tables that do not yet exist.

    The canonical schema also lives in database/init/01_schema.sql for a fresh
    PostgreSQL volume; this call keeps things working when the volume already
    exists or when running against a bare database (e.g. tests).
    """
    Base.metadata.create_all(bind=engine)
    logger.info("Database schema ensured")


def _seed() -> None:
    """Insert reproducible sample data when the table is empty."""
    from app import models

    db = SessionLocal()
    try:
        if db.query(models.Employee).count() == 0:
            db.add_all(
                [
                    models.Employee(
                        name="Ankur Sharma",
                        email="ankur@example.com",
                        department="DevOps",
                        role="Platform Engineer",
                    ),
                    models.Employee(
                        name="Rahul Verma",
                        email="rahul@example.com",
                        department="HR",
                        role="HR Manager",
                    ),
                ]
            )
            db.commit()
            logger.info("Seeded sample employees")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup/shutdown lifecycle."""
    configure_logging()
    logger.info(
        "Starting %s v%s (env=%s)",
        settings.app_name,
        settings.app_version,
        settings.environment,
    )
    _wait_for_database()
    _bootstrap_schema()
    if settings.seed_on_startup:
        _seed()
    yield
    logger.info("Shutting down")
    engine.dispose()


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description="CRUD API for managing employees. Backed by PostgreSQL.",
    lifespan=lifespan,
)

# --- CORS: allow the frontend origin(s) configured via the environment ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    """Attach a request id and log method, path, status and latency."""
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    start = time.perf_counter()
    metrics.IN_FLIGHT.inc()
    try:
        response = await call_next(request)
    finally:
        metrics.IN_FLIGHT.dec()
    duration = time.perf_counter() - start
    response.headers["X-Request-ID"] = request_id
    route = request.scope.get("route")
    path_label = getattr(route, "path", request.url.path)
    metrics.record_request(request.method, path_label, response.status_code, duration)
    logger.info(
        "%s %s -> %s (%.1f ms)",
        request.method,
        request.url.path,
        response.status_code,
        duration * 1000,
        extra={"request_id": request_id},
    )
    return response
@app.get("/metrics", tags=["observability"], include_in_schema=False)
def metrics_endpoint() -> Response:
    # Prometheus metrics scrape endpoint.
    metrics.DB_UP.set(1 if health._db_ok() else 0)
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    """Welcome / service banner."""
    return {
        "message": f"Welcome to {settings.app_name}",
        "version": settings.app_version,
        "docs": "/docs",
    }


app.include_router(health.router)
app.include_router(employees.router)
