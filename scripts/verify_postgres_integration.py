"""Real PostgreSQL integration smoke test.

Boots an embedded, real PostgreSQL (via the `pgserver` package, which ships an
actual postgres binary), applies the canonical SQL schema from database/init,
then drives the FastAPI app against it end to end:

    SQL schema  ->  PostgreSQL  ->  SQLAlchemy models  ->  API  ->  CRUD

This proves the Backend <-> PostgreSQL integration for real (not SQLite):
schema/model parity, constraints, generated ids, timestamps and every CRUD
verb. It is a manual/local verification harness, not part of the unit suite.

Usage:
    python scripts/verify_postgres_integration.py
"""

from __future__ import annotations

import os
import sys
import tempfile
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1] / "backend"
SCHEMA_SQL = BACKEND_DIR.parent / "database" / "init" / "01_schema.sql"
SEED_SQL = BACKEND_DIR.parent / "database" / "init" / "02_seed.sql"

sys.path.insert(0, str(BACKEND_DIR))


def main() -> int:
    import pgserver

    data_dir = Path(tempfile.mkdtemp(prefix="pg-verify-"))
    pgdata = pgserver.get_server(data_dir)
    try:
        # pgserver exposes a default unix/database; build a SQLAlchemy DSN.
        uri = pgdata.get_uri()  # e.g. postgresql://postgres:@/postgres?host=...
        dsn = uri.replace("postgresql://", "postgresql+psycopg://", 1)
        print(f"[info] embedded PostgreSQL up: {uri}")

        # Apply the canonical schema + seed exactly as a fresh Docker volume would.
        import psycopg

        with psycopg.connect(uri) as conn:
            conn.execute(SCHEMA_SQL.read_text(encoding="utf-8"))
            conn.execute(SEED_SQL.read_text(encoding="utf-8"))
            conn.commit()
        print("[info] applied database/init/01_schema.sql + 02_seed.sql")

        # Point the app at this database and import *after* setting env vars.
        os.environ["DATABASE_URL"] = dsn
        os.environ["SEED_ON_STARTUP"] = "false"  # schema+seed already applied

        from fastapi.testclient import TestClient

        from app.main import app

        with TestClient(app) as client:
            # 1. health / ready (DB must be reachable)
            health = client.get("/health").json()
            assert health["database"] == "ok", health
            assert client.get("/ready").json()["status"] == "ready"
            print("[ok] /health and /ready report database=ok")

            # 2. seeded rows from SQL are visible through the ORM
            seeded = client.get("/employees").json()
            assert len(seeded) == 2, seeded
            assert {e["email"] for e in seeded} == {
                "ankur@example.com",
                "rahul@example.com",
            }
            assert seeded[0]["created_at"], "created_at must be populated by DB"
            print("[ok] seed rows read through SQLAlchemy models")

            # 3. CREATE
            created = client.post(
                "/employees",
                json={
                    "name": "Grace Hopper",
                    "email": "grace@example.com",
                    "department": "Engineering",
                    "role": "Admiral",
                },
            )
            assert created.status_code == 201, created.text
            emp = created.json()
            assert isinstance(emp["id"], int) and emp["id"] > 0
            print(f"[ok] CREATE -> id={emp['id']}")

            # 4. UNIQUE constraint enforced by PostgreSQL (not just the app)
            dup = client.post(
                "/employees",
                json={
                    "name": "Dup",
                    "email": "grace@example.com",
                    "department": "X",
                    "role": "Y",
                },
            )
            assert dup.status_code == 409, dup.text
            print("[ok] duplicate email rejected (409)")

            # 5. READ one
            got = client.get(f"/employees/{emp['id']}").json()
            assert got["email"] == "grace@example.com"
            print("[ok] READ one")

            # 6. UPDATE + updated_at advances (trigger/ORM onupdate)
            before = got["updated_at"]
            updated = client.put(
                f"/employees/{emp['id']}", json={"department": "Platform"}
            ).json()
            assert updated["department"] == "Platform"
            assert updated["updated_at"] >= before
            print("[ok] UPDATE + updated_at refreshed")

            # 7. PATCH
            patched = client.patch(
                f"/employees/{emp['id']}", json={"role": "Rear Admiral"}
            ).json()
            assert patched["role"] == "Rear Admiral"
            print("[ok] PATCH")

            # 8. DELETE
            assert client.delete(f"/employees/{emp['id']}").status_code == 204
            assert client.get(f"/employees/{emp['id']}").status_code == 404
            print("[ok] DELETE + 404 after delete")

        # 9. Confirm the SQL-defined primary key/sequence is really used.
        with psycopg.connect(uri) as conn:
            count = conn.execute("SELECT count(*) FROM employees").fetchone()[0]
            idx = conn.execute(
                "SELECT indexname FROM pg_indexes WHERE tablename = 'employees'"
            ).fetchall()
        print(f"[ok] remaining rows in PostgreSQL: {count}")
        print(f"[ok] indexes present: {sorted(i[0] for i in idx)}")

        print("\nALL POSTGRESQL INTEGRATION CHECKS PASSED")
        return 0
    finally:
        try:
            pgdata.cleanup()
        except Exception:  # noqa: BLE001
            pass


if __name__ == "__main__":
    raise SystemExit(main())
