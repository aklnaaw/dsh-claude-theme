#!/usr/bin/env bash
# Capture the GUI at 1440x900 (the convention 7/8 shipped skins use).
# Requires an authenticated DSH web session URL; the server returns 401 without it.
set -euo pipefail
URL="${1:?usage: capture-preview.sh <authenticated-dsh-url> [outdir]}"
OUT="${2:-$(cd "$(dirname "$0")/.." && pwd)/claude/preview}"
mkdir -p "$OUT"
CHROME=$(command -v google-chrome-stable || command -v chromium || command -v google-chrome)
"$CHROME" --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,900 --screenshot="$OUT/light.jpg" \
  --virtual-time-budget=6000 "$URL"
echo "wrote $OUT/light.jpg"
