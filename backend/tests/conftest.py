"""Pytest fixtures.

The API test-suite runs against an isolated SQLite database so it needs no
external PostgreSQL. A separate integration test (``test_db_integration.py``)
exercises the real PostgreSQL database when ``DATABASE_URL``/``POSTGRES_*``
point at one that is reachable.
"""

import os
from collections.abc import Generator

import pytest

# Use a throwaway SQLite file *before* importing the app so the engine binds
# to it. This keeps tests hermetic and fast.
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test.db")
os.environ.setdefault("DATABASE_URL", f"sqlite+pysqlite:///{TEST_DB_PATH}")
os.environ.setdefault("ENVIRONMENT", "test")
os.environ["SEED_ON_STARTUP"] = "false"

from fastapi.testclient import TestClient  # noqa: E402

from app import models  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture(scope="session", autouse=True)
def _schema() -> Generator[None, None, None]:
    """Create the schema once per test session and drop it afterwards."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


@pytest.fixture(autouse=True)
def _clean_tables() -> Generator[None, None, None]:
    """Start every test from an empty employees table."""
    db = SessionLocal()
    try:
        db.query(models.Employee).delete()
        db.commit()
    finally:
        db.close()
    yield


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
    """A TestClient bound to the app (lifespan enabled)."""
    with TestClient(app) as c:
        yield c


@pytest.fixture
def sample_employee() -> dict:
    """A valid employee payload."""
    return {
        "name": "Ada Lovelace",
        "email": "ada@example.com",
        "department": "Engineering",
        "role": "Principal Engineer",
    }
