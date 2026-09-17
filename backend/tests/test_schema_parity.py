"""Schema <-> model parity tests.

These lock in the contract between the canonical SQL schema and the SQLAlchemy
models so the two cannot silently drift apart. They run against the SQLite test
database (fast, hermetic) and assert the structural facts that must hold in
PostgreSQL too: table name, column set, nullability, uniqueness and indexes.
"""

from sqlalchemy import inspect

from app.database import engine
from app.models import Employee


def test_table_name() -> None:
    assert Employee.__tablename__ == "employees"


def test_columns_match_schema() -> None:
    """The ORM must expose exactly the columns the SQL schema defines."""
    inspector = inspect(engine)
    db_columns = {c["name"] for c in inspector.get_columns("employees")}
    expected = {"id", "name", "email", "department", "role", "created_at", "updated_at"}
    assert db_columns == expected


def test_primary_key() -> None:
    inspector = inspect(engine)
    pk = inspector.get_pk_constraint("employees")
    assert pk["constrained_columns"] == ["id"]


def test_email_is_unique() -> None:
    inspector = inspect(engine)
    unique_cols = set()
    for uc in inspector.get_unique_constraints("employees"):
        unique_cols.update(uc["column_names"])
    # email uniqueness is enforced (either as a unique constraint or index)
    index_cols = set()
    for idx in inspector.get_indexes("employees"):
        if idx.get("unique"):
            index_cols.update(idx["column_names"])
    assert "email" in unique_cols or "email" in index_cols


def test_not_null_columns() -> None:
    inspector = inspect(engine)
    nullable = {
        c["name"]: c["nullable"] for c in inspector.get_columns("employees")
    }
    for col in ["name", "email", "department", "role", "created_at", "updated_at"]:
        assert nullable[col] is False, f"{col} should be NOT NULL"


def test_string_lengths() -> None:
    """VARCHAR sizes must match the SQL schema (120/255/120/120)."""
    cols = {c.name: c for c in Employee.__table__.columns}
    assert cols["name"].type.length == 120
    assert cols["email"].type.length == 255
    assert cols["department"].type.length == 120
    assert cols["role"].type.length == 120
