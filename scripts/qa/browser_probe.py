"""Probe the local browser environment for headless QA capability.

Investigates whether an already-installed browser (Chrome / Edge) can be driven
headless over the DevTools Protocol, as an alternative to the downloaded
Playwright Chromium that Windows Application Control blocks.

Read-only: launches a headless browser with a throwaway profile, checks the CDP
endpoint, then tears it down. No application code is touched.
"""

from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

CANDIDATES = [
    (r"C:\Users\Ankur\AppData\Local\Google\Chrome\Application\chrome.exe", "Chrome"),
    (r"C:\Program Files\Google\Chrome\Application\chrome.exe", "Chrome"),
    (r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe", "Edge"),
    (r"C:\Program Files\Microsoft\Edge\Application\msedge.exe", "Edge"),
]

PORT = 9333


def find_browser() -> tuple[str, str] | None:
    for path, name in CANDIDATES:
        if Path(path).exists():
            return path, name
    return None


def probe(path: str, name: str) -> dict:
    profile = Path(tempfile.mkdtemp(prefix="qa-profile-"))
    args = [
        path,
        "--headless=new",
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={profile}",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-gpu",
        "--disable-dev-shm-usage",
        "about:blank",
    ]
    result: dict = {"browser": name, "executable": path}
    proc = subprocess.Popen(
        args, stdout=subprocess.PIPE, stderr=subprocess.PIPE
    )
    result["launched"] = proc.poll() is None
    try:
        up = False
        for _ in range(25):
            time.sleep(1)
            if proc.poll() is not None:
                break
            try:
                with urllib.request.urlopen(
                    f"http://127.0.0.1:{PORT}/json/version", timeout=2
                ) as r:
                    info = json.load(r)
                    result["cdp"] = True
                    result["version"] = info.get("Browser")
                    result["protocol"] = info.get("Protocol-Version")
                    up = True
                    break
            except (urllib.error.URLError, TimeoutError, OSError):
                continue
        if not up and "cdp" not in result:
            result["cdp"] = False
            err = proc.stderr.read(600).decode(errors="ignore") if proc.stderr else ""
            result["stderr"] = err.strip()[-400:]
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=8)
        except subprocess.TimeoutExpired:
            proc.kill()
        shutil.rmtree(profile, ignore_errors=True)
    return result


def main() -> int:
    found = find_browser()
    if not found:
        print(json.dumps({"error": "no installed browser found", "candidates": CANDIDATES}, indent=2))
        return 2
    path, name = found
    print(json.dumps({"detected": {"name": name, "path": path}}, indent=2))
    result = probe(path, name)
    print(json.dumps(result, indent=2))
    return 0 if result.get("cdp") else 1


if __name__ == "__main__":
    sys.exit(main())
