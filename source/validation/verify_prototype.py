#!/usr/bin/env python3
"""Static release verifier for the dependency-free v3 frontend demo."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[2]
SOURCE = PROJECT_ROOT / "source"
MODULES = SOURCE / "modules"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise AssertionError(message)


def verify_static() -> dict[str, object]:
    bundle = (SOURCE / "app.js").read_text(encoding="utf-8")
    versioned_bundle = (SOURCE / "app.v3.js").read_text(encoding="utf-8")
    standalone = (PROJECT_ROOT / "OPEN-DEMO.html").read_text(encoding="utf-8")
    source_standalone = (SOURCE / "yen-center-lms-demo.html").read_text(encoding="utf-8")
    index = (SOURCE / "index.html").read_text(encoding="utf-8")
    css = (SOURCE / "styles.css").read_text(encoding="utf-8")

    module_files = sorted(MODULES.glob("*.js"))
    require(len(module_files) == 16, f"Expected 16 runtime modules, found {len(module_files)}")
    require([item.name for item in module_files] == [f"{index:02d}-{name}" for index, name in enumerate([
        "namespace.js", "utils.js", "seed.js", "store.js", "policy.js", "commands.js", "selectors.js",
        "ui-kit.js", "public-views.js", "learning-views.js", "operations-views.js", "management-views.js",
        "demo-guide.js", "router.js", "actions.js", "bootstrap.js",
    ])], "Runtime modules are missing or out of order")
    require(bundle == versioned_bundle, "app.js and app.v3.js differ")
    require(standalone == source_standalone, "Standalone artifacts differ")
    require("./styles.css" in index and "./app.js" in index, "Source index must load split assets")
    require("<style>" in standalone and "<script>" in standalone, "Standalone does not inline assets")
    require(not re.search(r'<link[^>]+href=["\']\./styles\.css', standalone), "Standalone links external CSS")
    require(not re.search(r'<script[^>]+src=["\']\./app\.js', standalone), "Standalone links external JavaScript")
    for token in [
        "schemaVersion: 3", "canonical-run-all", "load-checkpoint", "export-csv", "print-view",
        "LEAD_CONTACTED", "PARENT_PROGRESS_VIEWED", "RENEWAL_ACCEPTED", "Không có quyền vào workspace này",
    ]:
        require(token in bundle, f"Runtime token missing: {token}")
    for token in ["checkpoint-bar", "course-player-layout", "role-switcher", "@media print"]:
        require(token in css, f"CSS token missing: {token}")
    require("Version: 3.0.0" in (PROJECT_ROOT / "VERSION.txt").read_text(encoding="utf-8"), "Release version is not 3.0.0")
    require((PROJECT_ROOT / "docs" / "HANDBOOK-COVERAGE-v1.1.md").exists(), "Handbook coverage matrix missing")

    return {
        "status": "PASS",
        "version": "3.0.0",
        "runtime_modules": len(module_files),
        "bundle_bytes": len(bundle.encode("utf-8")),
        "standalone_bytes": len(standalone.encode("utf-8")),
        "standalone_inline": True,
        "bundle_parity": True,
        "handbook_coverage": True,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--static-only", action="store_true", help="Retained for backwards-compatible release commands.")
    return parser.parse_args()


def main() -> int:
    parse_args()
    result = verify_static()
    output = json.dumps(result, ensure_ascii=False, indent=2)
    print(output)
    (Path(__file__).parent / "verification-result.json").write_text(output + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
