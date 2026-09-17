#!/usr/bin/env bash
# Vendor the Google-Fonts *latin* subset of each face into the skin's assets/.
# Google serves variable fonts here (all weights share one file), so we emit a
# single @font-face per (family, style) with a weight RANGE.
# Skin CSS must reference assets by RELATIVE path — remote URLs are a hard 422.
set -euo pipefail
cd "$(dirname "$0")"
UA="Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36"

# family<TAB>css2-spec
FACES=$(cat <<'EOF'
Newsreader	Newsreader:ital,opsz,wght@0,6..72,200..800;1,6..72,200..800
Inter	Inter:wght@100..900
JetBrains Mono	JetBrains+Mono:wght@100..800
EOF
)

: > fonts.generated.css
while IFS=$'\t' read -r fam spec; do
  [ -z "$fam" ] && continue
  css=".face.css"
  curl -sS -A "$UA" "https://fonts.googleapis.com/css2?family=${spec}&display=swap" -o "$css"
  # keep only the /* latin */ block(s); capture style + weight range + url
  awk -v FAM="$fam" '
    /^\/\* latin \*\/$/ { inl=1; style="normal"; weight="400"; next }
    /^\/\* / { inl=0 }
    inl && /font-style:/  { style=$0; sub(/.*font-style:[ ]*/,"",style); sub(/;.*/,"",style) }
    inl && /font-weight:/ { weight=$0; sub(/.*font-weight:[ ]*/,"",weight); sub(/;.*/,"",weight) }
    inl && /url\(/ {
      match($0, /https:\/\/[^)]+\.woff2/); url=substr($0,RSTART,RLENGTH);
      print FAM "\t" style "\t" weight "\t" url
    }
  ' "$css" | sort -u > .faces
  while IFS=$'\t' read -r family style weight url; do
    [ -z "$url" ] && continue
    slug=$(printf '%s' "$family" | tr 'A-Z ' 'a-z-')
    out="${slug}-${style}.woff2"
    [ -f "$out" ] || curl -sS -o "$out" "$url"
    printf "@font-face{font-family:'%s';font-style:%s;font-weight:%s;font-display:swap;src:url(assets/fonts/%s) format('woff2')}\n" \
      "$family" "$style" "$weight" "$out" >> fonts.generated.css
  done < .faces
  rm -f "$css" .faces
done <<< "$FACES"

rm -f *.blocks *.files .faces .face.css
echo "=== vendored ==="; ls -la *.woff2 | awk '{printf "%8d  %s\n",$5,$9}'
echo "=== total ==="; du -ch *.woff2 | tail -1
