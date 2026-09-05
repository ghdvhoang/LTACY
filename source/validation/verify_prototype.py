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
    module_names = [item.name for item in module_files]
    required_modules = {
        "00-namespace.js", "01-utils.js", "02-permissions.js", "02-seed.js", "03-store.js", "04-policy.js",
        "05-approval.js", "05-commands.js", "06-public-content.js", "06-remedial.js", "06-selectors.js", "07-ui-kit.js", "08-public-views.js",
        "09-learning-views.js", "10-operations-views.js", "11-governance-views.js", "11-management-views.js",
        "13-router.js", "14-actions.js", "15-bootstrap.js",
    }
    require(required_modules.issubset(module_names), f"Runtime modules are missing: {sorted(required_modules - set(module_names))}")
    require(module_names[0] == "00-namespace.js" and module_names[-1] == "15-bootstrap.js", "Runtime module boundaries are out of order")
    require(bundle == versioned_bundle, "app.js and app.v3.js differ")
    require(standalone == source_standalone, "Standalone artifacts differ")
    require("./styles.css" in index and "./app.js" in index, "Source index must load split assets")
    require("<style>" in standalone and "<script>" in standalone, "Standalone does not inline assets")
    require(not re.search(r'<link[^>]+href=["\']\./styles\.css', standalone), "Standalone links external CSS")
    require(not re.search(r'<script[^>]+src=["\']\./app\.js', standalone), "Standalone links external JavaScript")
    for token in [
        "schemaVersion: 4", "REGISTER_VISITOR", "register-visitor", "/dang-ky", "/tai-khoan", "export-csv", "print-view",
        "SUBMIT_CHANGE_REQUEST", "SET_ROLE_PERMISSION", "/app/admin/approvals", "LEAD_CONTACTED",
        "CONFIRM_MAKE_UP_BOOKING", "/app/admin/course-versions/", "data-form=\"request-course\"",
        "PARENT_PROGRESS_VIEWED", "RENEWAL_ACCEPTED", "Không có quyền vào khu vực này",
        "CREATE_SITE_CONTENT_DRAFT", "PUBLISH_SITE_CONTENT", "publicTeacherProfiles",
    ]:
        require(token in bundle, f"Runtime token missing: {token}")
    for token in ["visitor-account", "course-player-layout", "role-switcher", "@media print"]:
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
