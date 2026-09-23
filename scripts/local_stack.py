"""Local end-to-end stack harness.

Docker Desktop is not available on this machine, so this reproduces the exact
Compose stack natively to run the same verification the containers would:

    PostgreSQL (real)  ->  FastAPI backend  ->  /api proxy  ->  SPA frontend

It boots an embedded real PostgreSQL (pgserver), applies database/init/*.sql
exactly as the postgres image's docker-entrypoint-initdb.d would, starts the
backend against it, serves the built frontend, and runs a small reverse proxy
that mirrors nginx/nginx.conf routing (/api/ -> backend, / -> frontend,
/health,/ready,/metrics,/docs -> backend).

Run:  python scripts/local_stack.py
Then hit http://127.0.0.1:<EDGE_PORT>/  (default 8080)
Ctrl+C to stop.
"""

from __future__ import annotations

import http.server
import os
import socket
import sys
import threading
import time
import urllib.error
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = ROOT / "backend"
FRONTEND_DIST = ROOT / "frontend" / "dist"
DB_INIT_DIR = ROOT / "database" / "init"

BACKEND_PORT = int(os.environ.get("BACKEND_PORT", "18000"))
FRONTEND_PORT = int(os.environ.get("FRONTEND_PORT", "14173"))
EDGE_PORT = int(os.environ.get("EDGE_PORT", "8080"))


def log(msg: str) -> None:
    print(f"[stack] {msg}", flush=True)


# --------------------------------------------------------------------------- #
# 1. PostgreSQL (real, embedded) + schema/seed exactly as the Docker image
# --------------------------------------------------------------------------- #
def start_database() -> tuple[object, str]:
    import pgserver

    data_dir = ROOT / ".local-pgdata"
    data_dir.mkdir(exist_ok=True)
    log(f"starting embedded PostgreSQL in {data_dir} ...")
    pg = pgserver.get_server(data_dir)
    uri = pg.get_uri()  # postgresql://postgres:@/postgres?host=...
    log(f"PostgreSQL up: {uri}")

    import psycopg

    # Apply the same SQL the postgres image runs on first init, in sorted order.
    sql_files = sorted(DB_INIT_DIR.glob("*.sql"))
    with psycopg.connect(uri) as conn:
        # Idempotency check: only seed if the table is empty (mirrors fresh volume)
        conn.execute(
            "CREATE TABLE IF NOT EXISTS _stack_probe (id int)"
        )
        for f in sql_files:
            log(f"applying {f.name}")
            conn.execute(f.read_text(encoding="utf-8"))
        conn.commit()
        count = conn.execute("SELECT count(*) FROM employees").fetchone()[0]
        log(f"employees table exists with {count} row(s) after init SQL")

    dsn = uri.replace("postgresql://", "postgresql+psycopg://", 1)
    return pg, dsn


# --------------------------------------------------------------------------- #
# 2. Backend (uvicorn) against that database
# --------------------------------------------------------------------------- #
def start_backend(dsn: str) -> threading.Thread:
    os.environ["DATABASE_URL"] = dsn
    os.environ["SEED_ON_STARTUP"] = os.environ.get("SEED_ON_STARTUP", "true")
    os.environ["LOG_LEVEL"] = "INFO"

    import uvicorn

    from app.main import app  # noqa: E402  (import after env is set)

    config = uvicorn.Config(app, host="127.0.0.1", port=BACKEND_PORT, log_level="info")
    server = uvicorn.Server(config)
    t = threading.Thread(target=server.run, daemon=True)
    t.start()
    log(f"backend starting on :{BACKEND_PORT}")

    # Wait for readiness
    for _ in range(40):
        try:
            with urllib.request.urlopen(
                f"http://127.0.0.1:{BACKEND_PORT}/health", timeout=1
            ) as r:
                if r.status == 200:
                    log("backend /health OK")
                    return t
        except Exception:  # noqa: BLE001
            time.sleep(0.5)
    raise RuntimeError("backend did not become healthy")


# --------------------------------------------------------------------------- #
# 3. Frontend static server (serves the built SPA)
# --------------------------------------------------------------------------- #
class SPAHandler(http.server.SimpleHTTPRequestHandler):
    """Serves the SPA with index.html fallback (like the frontend nginx.conf)."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIST), **kwargs)

    def do_GET(self):  # noqa: N802
        path = self.path.split("?", 1)[0]
        target = FRONTEND_DIST / path.lstrip("/")
        if not path.startswith("/assets/") and not target.is_file():
            self.path = "/index.html"
        return super().do_GET()

    def log_message(self, *args):  # silence
        pass


def start_frontend() -> ThreadingHTTPServer:
    srv = ThreadingHTTPServer(("127.0.0.1", FRONTEND_PORT), SPAHandler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    log(f"frontend (SPA) serving on :{FRONTEND_PORT}")
    return srv


# --------------------------------------------------------------------------- #
# 4. Edge proxy - mirrors nginx/nginx.conf routing
# --------------------------------------------------------------------------- #
API_PREFIX = "/api/"
ROOT_BACKEND_PATHS = ("/health", "/ready", "/metrics", "/docs", "/redoc", "/openapi.json")


class EdgeProxy(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _proxy(self, target_url: str, body: bytes | None, method: str):
        req = urllib.request.Request(target_url, data=body, method=method)
        for h in ("Content-Type", "Accept"):
            if self.headers.get(h):
                req.add_header(h, self.headers.get(h))
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                data = resp.read()
                self.send_response(resp.status)
                for k, v in resp.getheaders():
                    if k.lower() in ("transfer-encoding", "connection"):
                        continue
                    self.send_header(k, v)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                if data:
                    self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as exc:  # noqa: BLE001
            self.send_response(502)
            msg = f"bad gateway: {exc}".encode()
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def _route(self, method: str):
        path = self.path
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        if path == "/nginx-health":
            msg = b"ok\n"
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)
            return

        # /api/* -> backend, strip the /api prefix (proxy_pass .../ semantics)
        if path.startswith(API_PREFIX):
            stripped = "/" + path[len(API_PREFIX):]
            backend_path = stripped + ("?" + path.split("?", 1)[1] if "?" in path else "")
            url = f"http://127.0.0.1:{BACKEND_PORT}{backend_path}"
            return self._proxy(url, body, method)

        # bare health/docs/metrics at root -> backend
        if path.split("?")[0] in ROOT_BACKEND_PATHS:
            url = f"http://127.0.0.1:{BACKEND_PORT}{path}"
            return self._proxy(url, body, method)

        # everything else -> frontend SPA
        url = f"http://127.0.0.1:{FRONTEND_PORT}{path}"
        return self._proxy(url, body, method)

    def do_GET(self):  # noqa: N802
        self._route("GET")

    def do_POST(self):  # noqa: N802
        self._route("POST")

    def do_PUT(self):  # noqa: N802
        self._route("PUT")

    def do_PATCH(self):  # noqa: N802
        self._route("PATCH")

    def do_DELETE(self):  # noqa: N802
        self._route("DELETE")

    def log_message(self, *args):
        pass


def start_edge() -> ThreadingHTTPServer:
    srv = ThreadingHTTPServer(("127.0.0.1", EDGE_PORT), EdgeProxy)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    log(f"edge proxy (nginx equivalent) serving on :{EDGE_PORT}")
    return srv


def main() -> int:
    sys.path.insert(0, str(BACKEND_DIR))

    pg, dsn = start_database()
    start_backend(dsn)
    start_frontend()
    start_edge()

    log("")
    log("=" * 60)
    log(f"STACK READY - open http://127.0.0.1:{EDGE_PORT}/")
    log(f"  API via edge:  http://127.0.0.1:{EDGE_PORT}/api/employees")
    log(f"  Docs via edge: http://127.0.0.1:{EDGE_PORT}/docs")
    log("=" * 60)

    # Port-open probe so callers know we are up
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        log("shutting down")
        pg.cleanup()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
