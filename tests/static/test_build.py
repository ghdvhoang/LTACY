import subprocess
import sys
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
BUILDER = ROOT / "scripts" / "build_standalone.py"


class StandaloneBuildTests(unittest.TestCase):
    def make_fixture(self, directory: Path) -> None:
        modules = directory / "source" / "modules"
        modules.mkdir(parents=True)
        (modules / "10-second.js").write_text("window.order.push('second');\n", encoding="utf-8")
        (modules / "00-first.js").write_text("window.order = ['first'];\n", encoding="utf-8")
        (directory / "source" / "styles.css").write_text("body { color: #111; }\n", encoding="utf-8")
        (directory / "source" / "index.html").write_text(
            '<!doctype html><html><head><link rel="stylesheet" href="styles.css"></head>'
            '<body><div id="app"></div><script src="app.js"></script></body></html>\n',
            encoding="utf-8",
        )

    def run_builder(self, root: Path, *args: str) -> subprocess.CompletedProcess[str]:
        return subprocess.run(
            [sys.executable, str(BUILDER), "--root", str(root), *args],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )

    def test_builder_concatenates_classic_modules_in_filename_order(self):
        with tempfile.TemporaryDirectory() as temp:
            fixture = Path(temp)
            self.make_fixture(fixture)

            result = self.run_builder(fixture)

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            bundle = (fixture / "source" / "app.v3.js").read_text(encoding="utf-8")
            self.assertLess(bundle.index("window.order = ['first']"), bundle.index("window.order.push('second')"))

    def test_check_fails_after_a_source_module_changes(self):
        with tempfile.TemporaryDirectory() as temp:
            fixture = Path(temp)
            self.make_fixture(fixture)
            self.assertEqual(self.run_builder(fixture).returncode, 0)
            (fixture / "source" / "modules" / "10-second.js").write_text(
                "window.order.push('changed');\n", encoding="utf-8"
            )

            result = self.run_builder(fixture, "--check")

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("stale", (result.stdout + result.stderr).lower())

    def test_release_inlines_css_and_javascript_without_external_runtime_files(self):
        with tempfile.TemporaryDirectory() as temp:
            fixture = Path(temp)
            self.make_fixture(fixture)

            result = self.run_builder(fixture, "--release")

            self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
            standalone = (fixture / "OPEN-DEMO.html").read_text(encoding="utf-8")
            self.assertIn("<style>body { color: #111; }", standalone)
            self.assertIn("window.order.push('second')", standalone)
            self.assertNotIn('href="styles.css"', standalone)
            self.assertNotIn('src="app.js"', standalone)


if __name__ == "__main__":
    unittest.main()
