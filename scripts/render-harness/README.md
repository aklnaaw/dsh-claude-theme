# Render harness

Reproduces `claude/preview/*.jpg` without needing an authenticated DSH session
(the web server refuses unauthenticated requests with 401, and its cookie is
signed with a per-activation secret, so a headless browser cannot reach the real
page).

Instead this harness loads the **real served artefacts** and lays the **real
official token defaults** underneath them, then renders with headless Chrome.
The computed values it produces are therefore the same ones the live GUI gets.

## Use

```bash
# 1. fetch the real served CSS + official token defaults
curl -s localhost:3080/api/skin-center/v2/skins/claude/stylesheet -o served-skin.css
curl -s localhost:3080/api/skin-center/v2/skins/claude/patches    -o served-patches.css
# baseline.css = the 89 light + 89 dark --dsw-alias-* defaults from
#   @deepseek-ai/dsh-client-ui-theme/lib/client.js  (see scripts/gen-skin-css.py)

# 2. mirror the font tree so relative url(assets/fonts/...) resolves
mkdir -p assets/fonts
for f in newsreader-normal newsreader-italic inter-normal jetbrains-mono-normal; do
  curl -s "localhost:3080/api/skin-center/v2/skins/claude/assets/fonts/$f.woff2" -o "assets/fonts/$f.woff2"
done

# 3. serve + shoot
python3 -m http.server 8899 --bind 127.0.0.1 &
google-chrome-stable --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,900 --screenshot=preview-light.png \
  --virtual-time-budget=9000 http://127.0.0.1:8899/harness.html
sed 's|<body>|<body data-ds-dark-theme>|' harness.html > harness-dark.html
google-chrome-stable --headless=new --disable-gpu --hide-scrollbars \
  --window-size=1440,900 --screenshot=preview-dark.png \
  --virtual-time-budget=9000 http://127.0.0.1:8899/harness-dark.html
```

`harness.html` also appends a `#PROBE` element containing the measured computed
styles plus `document.fonts.check()` results, so a render can be asserted
rather than eyeballed:

```bash
google-chrome-stable --headless=new --dump-dom --virtual-time-budget=9000 \
  http://127.0.0.1:8899/harness.html | grep -o 'PROBE_JSON=.*</pre>'
```

Last measured values: body `rgb(250,249,245)`, sidebar `rgb(245,240,232)`,
send button `rgb(217,119,87)`, composer radius `26px`, reading font
`Newsreader`, all three families `loaded`; dark canvas `#181715`,
dark sidebar `#1f1e1b`.
