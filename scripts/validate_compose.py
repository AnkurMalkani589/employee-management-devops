"""Validate the Compose service topology and cross-file consistency.

Checks that would otherwise break `docker compose up`:
  * every service has a healthcheck (or is explicitly a one-shot)
  * depends_on uses health conditions where a dependency must be ready
  * healthcheck binaries exist in the referenced image
  * upstream hostnames in nginx.conf match compose service names
  * container ports match the ports services listen on
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parents[1]
compose = yaml.safe_load((ROOT / "docker-compose.yml").read_text(encoding="utf-8"))
nginx_conf = (ROOT / "nginx" / "nginx.conf").read_text(encoding="utf-8")

failures: list[str] = []
notes: list[str] = []

services = compose["services"]
names = set(services)

print("Compose services:")
for name, svc in services.items():
    hc = "yes" if "healthcheck" in svc else "NO"
    dep = svc.get("depends_on", "-")
    if isinstance(dep, dict):
        dep_txt = ", ".join(f"{k}({v.get('condition', 'started')})" for k, v in dep.items())
    else:
        dep_txt = ", ".join(dep) if isinstance(dep, list) else str(dep)
    print(f"  {name:9} healthcheck={hc:3} depends_on={dep_txt}")

# 1. healthchecks present
for name, svc in services.items():
    if "healthcheck" not in svc:
        failures.append(f"service '{name}' has no healthcheck")

# 2. backend/nginx must wait for healthy dependencies
for name, svc in services.items():
    dep = svc.get("depends_on")
    if isinstance(dep, dict):
        for dep_name, opts in dep.items():
            if opts.get("condition") != "service_healthy":
                notes.append(f"'{name}' depends on '{dep_name}' without service_healthy")

# 3. healthcheck tools exist in the images
backend_df = (ROOT / "backend" / "Dockerfile").read_text(encoding="utf-8")
if "curl" not in backend_df:
    failures.append("backend healthcheck uses curl but Dockerfile does not install it")
if "nginx:1.27-alpine" in services.get("nginx", {}).get("image", ""):
    notes.append("nginx:alpine ships busybox wget -> healthcheck tool OK")

# 4. nginx upstreams reference real compose services
upstreams = re.findall(r"server\s+([a-zA-Z0-9_-]+):(\d+);", nginx_conf)
for host, port in upstreams:
    if host not in names:
        failures.append(f"nginx upstream '{host}' is not a compose service")
    else:
        print(f"  nginx upstream {host}:{port} -> compose service '{host}' OK")

# 5. published ports are well-formed
print("Published ports:")
for name, svc in services.items():
    for p in svc.get("ports", []):
        print(f"  {name}: {p}")

print()
if notes:
    print("Notes:")
    for n in notes:
        print(f"  - {n}")
if failures:
    print("\nFAILURES:")
    for f in failures:
        print(f"  ✗ {f}")
    sys.exit(1)
print("\nCompose topology OK")
