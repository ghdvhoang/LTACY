import hashlib
import re
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]


class ReleaseDocumentationTests(unittest.TestCase):
    def test_release_is_identified_as_v3_full_journey_frontend_demo(self):
        version = (ROOT / "VERSION.txt").read_text(encoding="utf-8")
        source_version = (ROOT / "source" / "VERSION.txt").read_text(encoding="utf-8")
        readme = (ROOT / "README.md").read_text(encoding="utf-8")

        self.assertIn("3.0.0", version)
        self.assertIn("3.0.0", source_version)
        self.assertIn("Full Journey", readme)
        self.assertIn("frontend", readme.lower())
        self.assertIn("OPEN-DEMO.html", readme)

    def test_handoff_docs_cover_roles_visitor_access_and_scope_boundary(self):
        start = (ROOT / "START-HERE.md").read_text(encoding="utf-8")
        coverage = (ROOT / "docs" / "HANDBOOK-COVERAGE-v1.1.md").read_text(encoding="utf-8")
        limitations = (ROOT / "docs" / "KNOWN-LIMITATIONS.md").read_text(encoding="utf-8")

        for account in [
            "admissions@yencenter.demo", "academic@yencenter.demo", "service@yencenter.demo",
            "finance@yencenter.demo", "teacher@yencenter.demo", "HS6A001", "0901000002",
            "manager@yencenter.demo", "admin@yencenter.demo",
        ]:
            self.assertIn(account, start)
        self.assertIn("Khách chưa đăng nhập và khách đã đăng nhập", start)
        self.assertIn("Tài khoản của tôi", start)
        self.assertNotIn("Hướng dẫn demo", start)
        self.assertIn("Release 1", coverage)
        self.assertIn("Release 2", coverage)
        self.assertIn("Release 3+", coverage)
        self.assertIn("frontend", limitations.lower())
        self.assertIn("server-side", limitations)

    def test_manifest_lists_runtime_modules_and_release_artifacts(self):
        manifest = (ROOT / "PACKAGE-MANIFEST.txt").read_text(encoding="utf-8")
        entries = {line.strip() for line in manifest.splitlines() if re.match(r"^[\w./-]+$", line.strip())}
        required = {
            "OPEN-DEMO.html", "source/app.js", "source/app.v3.js", "source/styles.css",
            "source/modules/00-namespace.js", "source/modules/15-bootstrap.js",
            "docs/HANDBOOK-COVERAGE-v1.1.md", "tests/domain/canonical-journey.test.cjs",
            "tests/domain/visitor-auth.test.cjs",
        }
        self.assertTrue(required.issubset(entries), required - entries)

    def test_release_checksums_match_every_listed_file(self):
        checksum_lines = (ROOT / "CHECKSUMS-SHA256.txt").read_text(encoding="utf-8").splitlines()
        verified = set()
        for line in checksum_lines:
            expected, relative = line.split(maxsplit=1)
            target = ROOT / relative
            self.assertTrue(target.is_file(), relative)
            self.assertEqual(hashlib.sha256(target.read_bytes()).hexdigest(), expected, relative)
            verified.add(relative)

        manifest = {
            line.strip() for line in (ROOT / "PACKAGE-MANIFEST.txt").read_text(encoding="utf-8").splitlines()
            if re.match(r"^[\w./-]+$", line.strip()) and line.strip() != "CHECKSUMS-SHA256.txt"
        }
        self.assertEqual(verified, manifest)


if __name__ == "__main__":
    unittest.main()
