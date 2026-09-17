#!/usr/bin/env python3
"""Generate the video cover art: Claude starburst on the left, DSH on the right.

Both marks are the real geometry, never a redrawn approximation:

  * the Claude radial starburst is the same path the brand plugin paints into
    the sidebar (STARBURST in brand-plugin/lib/client.js)
  * the DSH half is the shipped brand lockup, extracted from the frontend
    bundle (BrandWordmark / FISH_LOGO_PATH) into scripts/cover-assets.json

The DSH half is assembled as a single SVG rather than two side-by-side ones.
That is not a style choice: in the shipped lockup the whale sits inside a
clipPath and is positioned in the same user space as the lettering, so the two
only keep their designed proportions -- and the designed gap between them -- if
they share one viewBox. Rendering them as separate SVGs is what makes the whale
come out roughly three times too large, which is exactly how the first attempt
looked.

The tight viewBox below is the union of the whale's clip rect and the glyphs'
ink box, taken from getBBox measurements rather than from the shipped viewBox,
which is wider than the ink because it also reserves room for a version badge.

Outputs 1920x1080 PNGs in both the light and dark palettes. Rendering is done
by headless Chrome, because the cover uses the theme's own self-hosted fonts and
only a browser will shape and kern them the way the real UI does. The fonts are
inlined as data: URIs: Chrome applies CORS to font fetches, so an @font-face
url() pointing at a sibling file fails under file:// and the text silently falls
back to a default.
"""

import base64
import json
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
ASSETS = json.loads((ROOT / "scripts" / "cover-assets.json").read_text(encoding="utf-8"))
FONTS = ROOT / "claude" / "assets" / "fonts"
WORK = pathlib.Path("/tmp/cover-build")
OUT = ROOT / "cover"

# Two outputs from one layout.
#
#   16:9 1920x1080 -- video thumbnail
#    2:1 1280x640  -- GitHub social preview, which is what the repo card shows.
#                      GitHub wants at least 1280x640 and under 1MB, and it does
#                      not crop to fit, so a 16:9 file would be letterboxed or
#                      squeezed on the card. Hence a second render rather than a
#                      resize of the first.
VARIANTS = [
    {"name": "cover", "w": 1920, "h": 1080},
    # Supersampled: GitHub caps this at 1MB and 151KB leaves room, so the
    # extra render resolution costs nothing that matters and sharpens the small
    # caption text, which is the one part that suffers at 1280 wide.
    {"name": "social", "w": 1280, "h": 640, "scale": 2},
]

# Ink bounds in the lockup's own user space.
#   whale  : clip rect at translate(0.141602 3.52185), size 23.16 x 17.0435
#   glyphs : measured with getBBox -> x 26.9563, y 4.6282, w 94.5607, h 17.0153
WHALE_X, WHALE_Y = 0.141602, 3.52185
WHALE_W, WHALE_H = 23.16, 17.0435
GLYPH_X, GLYPH_Y = 26.9563, 4.6282
GLYPH_W, GLYPH_H = 94.5607, 17.0153

LOCK_X = WHALE_X
LOCK_Y = WHALE_Y
LOCK_W = (GLYPH_X + GLYPH_W) - WHALE_X
LOCK_H = (GLYPH_Y + GLYPH_H) - WHALE_Y

LIGHT = {
    "canvas": "#faf9f5",
    "wash": "#f5f0e8",
    "ink": "#141413",
    "caption": "#8e8b82",
    "hairline": "#e6dfd8",
    "accent": "#d97757",
}
DARK = {
    "canvas": "#181715",
    "wash": "#252320",
    "ink": "#faf9f5",
    "caption": "#a09d96",
    "hairline": "#2b2925",
    "accent": "#d97757",
}


def font_face(family: str, filename: str, weight: str) -> str:
    raw = (FONTS / filename).read_bytes()
    b64 = base64.b64encode(raw).decode("ascii")
    return (
        "@font-face{"
        f"font-family:'{family}';"
        f"src:url(data:font/woff2;base64,{b64}) format('woff2');"
        f"font-weight:{weight};font-display:block;"
        "}"
    )


def lockup(pal: dict, width: int) -> str:
    """The shipped DSH lockup: clipped whale plus the wordmark, one user space.

    The version badge the shipped component stamps into this same viewBox is
    omitted deliberately -- it reads a build tag ("preview"), which is a fact
    about this install rather than part of the brand.
    """
    wm = ASSETS["wordmark"]
    glyphs = "".join(f'<path d="{d}"/>' for d in wm["glyph_paths"])
    height = round(width * LOCK_H / LOCK_W)
    return f"""<svg width="{width}" height="{height}"
       viewBox="{LOCK_X:.4f} {LOCK_Y:.4f} {LOCK_W:.4f} {LOCK_H:.4f}"
       role="img" aria-label="DeepSeek Harness">
    <defs><clipPath id="dsh-cover-whale">
      <rect x="{WHALE_X}" y="{WHALE_Y}" width="{WHALE_W}" height="{WHALE_H}"/>
    </clipPath></defs>
    <g clip-path="url(#dsh-cover-whale)" fill="{pal['ink']}">
      <path d="{wm['whale_path']}"/>
    </g>
    <g fill="{pal['ink']}">{glyphs}</g>
  </svg>"""


def page(pal: dict, w: int, h: int) -> str:
    # Everything scales off the short edge, so the 2:1 card and the 16:9
    # thumbnail keep the same visual weight instead of the lockup shrinking
    # when the canvas gets shorter.
    k = h / 1080.0
    lock_w = round(620 * k)
    lock_h = round(lock_w * LOCK_H / LOCK_W)
    star = round(300 * k)

    return f"""<!doctype html>
<html><head><meta charset="utf-8">
<style>
{font_face('Inter', 'inter-normal.woff2', '100 900')}
{font_face('Newsreader', 'newsreader-normal.woff2', '200 800')}
* {{ margin:0; padding:0; box-sizing:border-box; }}
html,body {{ width:{w}px; height:{h}px; }}
body {{
  background:{pal['canvas']};
  font-family:'Inter',sans-serif;
  -webkit-font-smoothing:antialiased;
  overflow:hidden; position:relative;
}}

.wash {{
  position:absolute; inset:0;
  background:radial-gradient(ellipse 58% 54% at 50% 45%,
             {pal['wash']} 0%, transparent 72%);
}}

.stage {{
  position:absolute; inset:0;
  display:flex; align-items:center; justify-content:center;
  gap:{round(104*k)}px;
}}
.stage svg {{ display:block; }}

.rule {{ width:2px; height:{round(lock_h*0.86)}px; flex:none; background:{pal['hairline']}; }}

.caption {{
  position:absolute; left:0; right:0; bottom:{round(96*k)}px;
  text-align:center; font-size:{round(26*k)}px; font-weight:500;
  letter-spacing:0.22em; color:{pal['caption']};
  text-transform:uppercase;
}}
</style></head>
<body>
<div class="wash"></div>
<div class="stage">

  <!-- Claude: the radial starburst, filled coral. -->
  <svg width="{star}" height="{star}" viewBox="0 0 24 24" role="img" aria-label="Claude">
    <path fill="{pal['accent']}" d="{ASSETS['starburst']}"/>
  </svg>

  <div class="rule"></div>

  {lockup(pal, lock_w)}

</div>
<div class="caption">Claude Theme &nbsp;·&nbsp; DeepSeek Harness</div>
</body></html>
"""


def render(pal: dict, name: str, w: int, h: int, scale: int = 1) -> pathlib.Path:
    """Render one variant. `scale` supersamples: the page is laid out at w x h
    and the screenshot is taken at scale times that, then reduced with a good
    filter. Headless Chrome's own downscaling is worse than Pillow's Lanczos,
    and the caption is small enough that it shows."""
    if WORK.exists():
        shutil.rmtree(WORK)
    WORK.mkdir(parents=True)
    (WORK / "index.html").write_text(page(pal, w, h), encoding="utf-8")

    png = WORK / f"{name}.png"
    subprocess.run(
        [
            "google-chrome-stable", "--headless=new", "--disable-gpu",
            "--hide-scrollbars", f"--window-size={w},{h}",
            f"--force-device-scale-factor={scale}",
            "--virtual-time-budget=8000",
            f"--screenshot={png}", f"file://{WORK}/index.html",
        ],
        check=True, capture_output=True,
    )

    OUT.mkdir(exist_ok=True)
    dest = OUT / f"{name}.png"
    if scale == 1:
        shutil.copy2(png, dest)
    else:
        from PIL import Image

        im = Image.open(png).convert("RGB")
        im.resize((w, h), Image.LANCZOS).save(dest, "PNG", optimize=True)
    return dest


def main() -> int:
    print(f"  lockup viewBox: {LOCK_X:.4f} {LOCK_Y:.4f} {LOCK_W:.4f} {LOCK_H:.4f}"
          f"  (aspect {LOCK_W/LOCK_H:.3f})")
    for v in VARIANTS:
        for pal, theme in ((LIGHT, "light"), (DARK, "dark")):
            name = f"{v['name']}-{theme}"
            dest = render(pal, name, v["w"], v["h"], v.get("scale", 1))
            print(f"  {dest.relative_to(ROOT)}  {v['w']}x{v['h']}  {dest.stat().st_size} B")
    return 0


if __name__ == "__main__":
    sys.exit(main())
