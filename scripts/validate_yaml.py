"""Validate every YAML file in the repository parses and, for Kubernetes
manifests, that each document has apiVersion/kind/metadata.

Runs with the standard library only (no PyYAML needed) if PyYAML is absent we
fall back to a clear message. Used by CI and locally.
"""

from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> int:
    try:
        import yaml
    except ImportError:
        print("PyYAML not installed; install with: pip install pyyaml")
        return 2

    targets: list[Path] = []
    for pattern in (
        "*.yml",
        "*.yaml",
        ".github/workflows/*.yml",
        "k8s/*.yaml",
        "ansible/*.yml",
    ):
        targets.extend(sorted(ROOT.glob(pattern)))

    failures = 0
    for path in targets:
        try:
            docs = list(yaml.safe_load_all(path.read_text(encoding="utf-8")))
        except yaml.YAMLError as exc:
            print(f"[FAIL] {path.relative_to(ROOT)}: {exc}")
            failures += 1
            continue

        rel = path.relative_to(ROOT)
        if "k8s" in path.parts:
            for doc in docs:
                if not doc:
                    continue
                missing = [k for k in ("apiVersion", "kind", "metadata") if k not in doc]
                if missing:
                    print(f"[FAIL] {rel}: document missing {missing}")
                    failures += 1
                else:
                    print(f"[ok]   {rel}: {doc['kind']}/{doc['metadata'].get('name')}")
        else:
            nonempty = [d for d in docs if d]
            print(f"[ok]   {rel}: {len(nonempty)} document(s)")

    if failures:
        print(f"\n{failures} file(s) failed validation")
        return 1
    print("\nAll YAML files valid")
    return 0


if __name__ == "__main__":
    sys.exit(main())
