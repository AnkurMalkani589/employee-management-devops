"""PostgreSQL integration test.

Runs against a *real* PostgreSQL when ``POSTGRES_TEST_DSN`` (or
``DATABASE_URL`` that is not SQLite) is exported; otherwise it is skipped so
the suite still passes with no external services.

Example:

    $env:POSTGRES_TEST_DSN="postgresql+psycopg://employee:employee@localhost:5432/employees"
    pytest tests/test_db_integration.py -v
"""

import os

import pytest
from sqlalchemy import create_engine, text

DSN = os.environ.get("POSTGRES_TEST_DSN") or os.environ.get("DATABASE_URL", "")

pytestmark = pytest.mark.skipif(
    "postgres" not in DSN,
    reason="requires a real PostgreSQL (set POSTGRES_TEST_DSN)",
)


def test_postgres_connection_and_table() -> None:
    engine = create_engine(DSN, pool_pre_ping=True)
    with engine.connect() as conn:
        assert conn.execute(text("SELECT 1")).scalar() == 1
        # The employees table must exist once schema/bootstrap has run.
        result = conn.execute(
            text(
                "SELECT EXISTS (SELECT FROM information_schema.tables "
                "WHERE table_name = 'employees')"
            )
        ).scalar()
        assert result is True
    engine.dispose()
