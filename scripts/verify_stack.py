"""End-to-end verification through the edge proxy (nginx equivalent).

Checks the complete chain exactly as a browser would hit it:

    edge(:8080) --/--> frontend SPA
    edge(:8080) --/api/--> backend(:18000) --> PostgreSQL

Covers: edge health, backend health/ready through the proxy, full CRUD over the
proxied /api path, 404/409/422 error handling, DB persistence, and the SPA +
static assets. Exits non-zero on the first failure.
"""

from __future__ import annotations

import json
import sys
import urllib.error
import urllib.request

EDGE = "http://127.0.0.1:8080"
PASS = 0
FAIL = 0


def check(name: str, cond: bool, detail: str = "") -> None:
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  [PASS] {name}")
    else:
        FAIL += 1
        print(f"  [FAIL] {name} {detail}")


def req(path: str, method: str = "GET", body: dict | None = None):
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(f"{EDGE}{path}", data=data, method=method)
    if body is not None:
        r.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            raw = resp.read()
            return resp.status, raw, dict(resp.headers)
    except urllib.error.HTTPError as e:
        return e.code, e.read(), dict(e.headers)


print("=" * 64)
print(" END-TO-END VERIFICATION through the edge proxy (nginx equivalent)")
print("=" * 64)

# 1. Edge proxy health
print("\n[1] Edge proxy (nginx) health")
s, _, _ = req("/nginx-health")
check("GET /nginx-health -> 200", s == 200, f"(got {s})")

# 2. Backend health/ready through the proxy
print("\n[2] Backend health through the proxy")
s, raw, _ = req("/api/health")
body = json.loads(raw) if s == 200 else {}
check("GET /api/health -> 200", s == 200, f"(got {s})")
check("health.status == 'ok'", body.get("status") == "ok", str(body))
check("health.database == 'ok'", body.get("database") == "ok", str(body))

s, _, _ = req("/health")
check("GET /health (root proxy) -> 200", s == 200, f"(got {s})")

s, raw, _ = req("/api/ready")
body = json.loads(raw) if s == 200 else {}
check("GET /api/ready -> 200 & ready", s == 200 and body.get("status") == "ready", str(body))

# 3. List (seeded data from database/init)
print("\n[3] Seeded data visible through the API")
s, raw, _ = req("/api/employees")
emps = json.loads(raw) if s == 200 else []
check("GET /api/employees -> 200", s == 200, f"(got {s})")
check("seeded 2 employees present", len(emps) == 2, f"(got {len(emps)})")
emails = {e.get("email") for e in emps}
check(
    "seed emails match database/init/02_seed.sql",
    {"ankur@example.com", "rahul@example.com"} <= emails,
    str(emails),
)
check("rows carry created_at from DB", all(e.get("created_at") for e in emps))

# 4. Full CRUD over the proxied API
print("\n[4] Full CRUD through the proxy -> PostgreSQL")
payload = {
    "name": "E2E Verifier",
    "email": "e2e.verify@example.com",
    "department": "Quality",
    "role": "Verification Bot",
}
s, raw, _ = req("/api/employees", "POST", payload)
created = json.loads(raw) if s == 201 else {}
check("POST /api/employees -> 201", s == 201, f"(got {s})")
new_id = created.get("id")
check("created row has id", isinstance(new_id, int), str(created))

s, raw, _ = req(f"/api/employees/{new_id}")
check("GET /api/employees/{id} -> 200", s == 200, f"(got {s})")
check("GET returns the created row", json.loads(raw).get("email") == payload["email"] if s == 200 else False)

s, raw, _ = req(f"/api/employees/{new_id}", "PUT", {"department": "Platform"})
check("PUT /api/employees/{id} -> 200", s == 200, f"(got {s})")
check("update persisted", json.loads(raw).get("department") == "Platform" if s == 200 else False)

# 5. Error handling
print("\n[5] Error handling")
s, raw, _ = req("/api/employees/999")
check("GET missing employee -> 404", s == 404, f"(got {s})")

s, _, _ = req("/api/employees", "POST", payload)  # duplicate email
check("duplicate email -> 409", s == 409, f"(got {s})")

s, _, _ = req("/api/employees", "POST", {"name": "No Email"})
check("invalid payload -> 422", s == 422, f"(got {s})")

# 6. Delete + persistence
print("\n[6] Delete + persistence")
s, _, _ = req(f"/api/employees/{new_id}", "DELETE")
check("DELETE /api/employees/{id} -> 204", s == 204, f"(got {s})")
s, _, _ = req(f"/api/employees/{new_id}")
check("deleted row is gone (404)", s == 404, f"(got {s})")

s, raw, _ = req("/api/employees")
final = json.loads(raw) if s == 200 else []
check("back to 2 employees", len(final) == 2, f"(got {len(final)})")

# 7. Frontend SPA served by the edge
print("\n[7] Frontend served through the edge proxy")
s, raw, hdrs = req("/")
html = raw.decode(errors="ignore")
check("GET / -> 200", s == 200, f"(got {s})")
check("SPA mount point present", 'id="root"' in html)
check("index references bundled assets", "/assets/" in html)

# SPA fallback for a client route (like nginx try_files)
s, raw, _ = req("/employees")
check("SPA fallback serves index.html", s == 200 and 'id="root"' in raw.decode(errors="ignore"), f"(got {s})")

# 8. Metrics through the proxy
print("\n[8] Observability endpoint")
s, raw, _ = req("/metrics")
check("GET /metrics -> 200", s == 200, f"(got {s})")
check("prometheus format present", b"http_requests_total" in raw or b"db_up" in raw)

print("\n" + "=" * 64)
print(f" RESULT: {PASS} passed, {FAIL} failed")
print("=" * 64)
sys.exit(1 if FAIL else 0)
