#!/usr/bin/env bash
# Fetch the real served CSS + the official token baseline into this directory,
# so harness.html can be rendered without an authenticated session.
set -euo pipefail
cd "$(dirname "$0")"
BASE="${DSH_WEB:-http://127.0.0.1:3080}"

curl -sS "$BASE/api/skin-center/v2/skins/claude/stylesheet" -o served-skin.css
curl -sS "$BASE/api/skin-center/v2/skins/claude/patches"     -o served-patches.css
mkdir -p assets/fonts
for f in newsreader-normal newsreader-italic inter-normal jetbrains-mono-normal; do
  curl -sS "$BASE/api/skin-center/v2/skins/claude/assets/fonts/$f.woff2" -o "assets/fonts/$f.woff2"
done

# baseline.css: the official --dsw-alias-* defaults, extracted from
# @deepseek-ai/dsh-client-ui-theme/lib/client.js. Regenerate with gen-skin-css.py's
# palette source if the official shell moves.
python3 - <<'PY'
import re, pathlib
cands = list(pathlib.Path('/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai').glob('dsh-client-ui-theme/lib/client.js'))
if not cands:
    raise SystemExit("theme client.js not found; pass a hand-made baseline.css")
src = cands[0].read_text(encoding='utf-8').encode().decode('unicode_escape')
def block(sel):
    i = src.find(sel)
    if i < 0: return {}
    return dict(re.findall(r'(--dsw-[a-z0-9-]+)\s*:\s*([^;]+)', src[i+len(sel):src.find('}', i)]))
light = block('body{--dsw-alias-bg-base')
dark  = block('body[data-ds-dark-theme]{--dsw-alias-bg-base')
out = ["body{"] + [f"{k}:{v};" for k, v in light.items()] + ["}",
       "body[data-ds-dark-theme]{"] + [f"{k}:{v};" for k, v in dark.items()] + ["}"]
pathlib.Path('baseline.css').write_text("\n".join(out))
print(f"baseline.css: {len(light)} light + {len(dark)} dark tokens")
PY

echo "fetched into $(pwd)"
