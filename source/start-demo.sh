#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
PYTHON_BIN="$(command -v python3 || command -v python || true)"
if [[ -z "$PYTHON_BIN" ]]; then
  echo "Không tìm thấy Python. Hãy mở trực tiếp yen-center-lms-demo.html"
  exit 1
fi
echo "Lớp Tiếng Anh Cô Yến · Frontend Demo v3.0"
echo "Mở trình duyệt tại: http://localhost:4173"
"$PYTHON_BIN" -m http.server 4173
