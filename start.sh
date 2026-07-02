#!/usr/bin/env bash
set -euo pipefail

PORT="${1:-8000}"
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
URL="http://localhost:${PORT}"

cd "$DIR"

open_browser() {
  if command -v open >/dev/null 2>&1; then
    open "$URL"
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$URL"
  elif command -v start >/dev/null 2>&1; then
    start "$URL"
  else
    echo "Open handmatig: $URL"
  fi
}

PYTHON_BIN="python3"
command -v "$PYTHON_BIN" >/dev/null 2>&1 || PYTHON_BIN="python"

echo "LinkBoard wordt gestart op ${URL}"
( sleep 1 && open_browser ) &

exec "$PYTHON_BIN" -m http.server "$PORT"
