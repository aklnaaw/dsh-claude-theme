#!/usr/bin/env python3
"""
Rebuild the Clawd-Laptop sprite sheet that brand-plugin ships as a base64 PNG.

Why this exists
---------------
The running indicator used to show the official whale-tail: a 14px box masking a
21 KB APNG. The brand plugin replaces it with Claude Desktop's own loading
animation, ``Clawd-Laptop`` -- the pixel crab walking behind a laptop trail. That
animation ships as Lottie JSON (108 KB, 2750x1850, 43 frames at 12fps) and would
need the 305 KB lottie-web runtime to play, which is far too much for one 18px
indicator.

The animation is not tweened, though: every frame is a distinct set of static
paths, switching on and off. So it can be sampled down to its native pixel grid
(34x23 cells, 50 Lottie units per cell), deduplicated to the 20 frames that
actually differ, and packed into one 1462x23 sprite sheet -- 1.2 KB, played by a
single CSS ``steps(43)`` animation with no runtime at all.

This script performs that conversion and rewrites the ``CLAWD_SPRITE`` constant
in ``lib/client.js`` in place. Run it only when the source animation changes.

USE
    python3 scripts/gen-clawd-sprite.py [path/to/Clawd-Laptop.json]

The default source path is the author's local copy. Requires Google Chrome (or
Chromium) to rasterise the Lottie frames, plus Pillow.
"""

from __future__ import annotations

import base64
import io
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "brand-plugin" / "lib" / "client.js"
DEFAULT_SOURCE = Path.home() / "卡工坊" / "clawd-loading-animation" / "Clawd-Laptop.json"

# One cell of the source artwork spans this many Lottie units. Derived by
# measuring the distinct x/y coordinates in the path data: every vertex lands on
# a multiple of 50, giving a 34x23 grid.
CELL = 50

# The palette the Lottie fills use, mapped to the single characters the grids
# are built from. '.' is transparent.
PALETTE = {
    (216, 118, 86): "B",   # body
    (0, 0, 0): "E",        # eyes and laptop
    (117, 92, 84): "S",    # trail / shadow
    (255, 255, 255): ".",
}

FRAME_COUNT = 43
FPS = 12


def find_chrome() -> str:
    for name in ("google-chrome-stable", "google-chrome", "chromium", "chromium-browser"):
        found = shutil.which(name)
        if found:
            return found
    raise SystemExit("gen-clawd-sprite: no Chrome/Chromium found on PATH")


def lottie_runtime() -> str:
    """The lottie-web build the author's local preview page inlines."""
    for candidate in (
        Path.home() / "卡工坊" / "clawd-loading-animation" / "preview-offline.html",
    ):
        if not candidate.exists():
            continue
        html = candidate.read_text(encoding="utf-8", errors="ignore")
        for chunk in re.findall(r"<script[^>]*>(.*?)</script>", html, re.S):
            # The runtime is the script that DEFINES lottie, not the one that
            # merely mentions it: the animation payload also contains the word.
            if "loadAnimation" in chunk and "var ANIMATION_DATA" not in chunk:
                return chunk
    raise SystemExit(
        "gen-clawd-sprite: could not find an inlined lottie runtime.\n"
        "Looked in the author's preview-offline.html next to the source JSON."
    )


def render_frames(chrome: str, runtime: str, data: str, work: Path) -> list[Path]:
    """
    Rasterise every frame.

    Each frame is drawn into its own 1375x925 cell (native size at 1/2), so the
    25px cell size divides evenly and sampling never straddles a boundary.
    """
    cell_w, cell_h = 1375, 925
    batch = 8
    pages: list[Path] = []

    data_js = work / "data.js"
    data_js.write_text("var ANIMATION_DATA=" + data + ";", encoding="utf-8")
    runtime_js = work / "lottie.js"
    runtime_js.write_text(runtime, encoding="utf-8")

    for start in range(0, FRAME_COUNT, batch):
        frames = list(range(start, min(start + batch, FRAME_COUNT)))
        cells = "".join(f"<div class='c' id='c{i}'></div>" for i in frames)
        page = f"""<!doctype html><html><head><meta charset='utf-8'><style>
html,body{{margin:0;background:#ffffff}}
#g{{display:flex}}
.c{{width:{cell_w}px;height:{cell_h}px;position:relative;overflow:hidden;flex:none}}
</style></head><body><div id='g'>{cells}</div>
<script src="file://{runtime_js}"></script>
<script src="file://{data_js}"></script>
<script>
var an=[];
{frames}.forEach(function(f){{
  an.push([f, lottie.loadAnimation({{container:document.getElementById('c'+f),
    renderer:'svg', loop:false, autoplay:false, animationData:ANIMATION_DATA}})]);
}});
setTimeout(function(){{ an.forEach(function(p){{ p[1].goToAndStop(p[0],true); }}); }}, 1800);
</script></body></html>"""
        html_path = work / f"page{start}.html"
        html_path.write_text(page, encoding="utf-8")
        png_path = work / f"page{start}.png"
        subprocess.run(
            [
                chrome, "--headless", "--disable-gpu", "--no-sandbox", "--hide-scrollbars",
                f"--window-size={cell_w * len(frames)},{cell_h}",
                "--virtual-time-budget=7000",
                f"--screenshot={png_path}", f"file://{html_path}",
            ],
            capture_output=True,
            check=False,
        )
        if not png_path.exists():
            raise SystemExit(f"gen-clawd-sprite: Chrome produced no image for frames {frames}")
        pages.append(png_path)
    return pages


def sample_grids(pages: list[Path]) -> dict[int, list[str]]:
    """Read each frame back as a 34x23 grid of palette characters."""
    from PIL import Image

    cell_w, cell_h = 1375, 925
    module = CELL // 2  # 25px in these renders

    # A single origin shared by every frame, so the walk lines up across frames.
    min_x, min_y, max_x, max_y = 10**9, 10**9, -1, -1
    loaded: dict[int, object] = {}
    for page_index, page in enumerate(pages):
        sheet = Image.open(page).convert("RGB")
        for slot in range(8):
            frame = page_index * 8 + slot
            if frame >= FRAME_COUNT:
                break
            cell = sheet.crop((slot * cell_w, 0, slot * cell_w + cell_w, cell_h))
            loaded[frame] = cell
            px = cell.load()
            for y in range(cell.size[1]):
                for x in range(cell.size[0]):
                    if px[x, y] != (255, 255, 255):
                        min_x = min(min_x, x); min_y = min(min_y, y)
                        max_x = max(max_x, x); max_y = max(max_y, y)

    cols = round((max_x - min_x + 1) / module)
    rows = round((max_y - min_y + 1) / module)

    def nearest(pixel):
        best, best_d = None, 1e18
        for colour, char in PALETTE.items():
            d = sum((a - b) ** 2 for a, b in zip(pixel, colour))
            if d < best_d:
                best_d, best = d, char
        return best

    grids: dict[int, list[str]] = {}
    for frame, cell in loaded.items():
        px = cell.load()
        grid = []
        for r in range(rows):
            row = ""
            for c in range(cols):
                x = min_x + c * module + module // 2
                y = min_y + r * module + module // 2
                if x < cell.size[0] and y < cell.size[1]:
                    row += nearest(px[x, y])
                else:
                    row += "."
            grid.append(row)
        grids[frame] = grid
    return grids


def build_sprite(grids: dict[int, list[str]]) -> tuple[str, int, int]:
    """Compose the frames into one horizontal sprite sheet, returned as base64."""
    from PIL import Image

    rows = len(grids[0])
    cols = len(grids[0][0])
    colour = {v: k + (255,) if len(k) == 3 else k for k, v in PALETTE.items()}
    colour["."] = (0, 0, 0, 0)

    sheet = Image.new("RGBA", (cols * FRAME_COUNT, rows), (0, 0, 0, 0))
    for frame in range(FRAME_COUNT):
        grid = grids[frame]
        for r in range(rows):
            for c in range(cols):
                sheet.putpixel((frame * cols + c, r), colour[grid[r][c]])

    buf = io.BytesIO()
    sheet.save(buf, "PNG", optimize=True)
    return base64.b64encode(buf.getvalue()).decode("ascii"), cols * FRAME_COUNT, rows


def rewrite_constant(b64: str) -> None:
    """Replace the CLAWD_SPRITE constant in lib/client.js in place."""
    text = CLIENT.read_text(encoding="utf-8")
    start = text.index("var CLAWD_SPRITE =")
    end = text.index(";", start)
    chunks = [b64[i : i + 120] for i in range(0, len(b64), 120)]
    # No trailing `;` here: the slice keeps the original one, and adding another
    # would leave a harmless but untidy `;;` behind.
    body = "\n".join(
        f'\t\t\t"{chunk}"' + ("" if i == len(chunks) - 1 else " +")
        for i, chunk in enumerate(chunks)
    )
    replacement = "var CLAWD_SPRITE =\n" + body
    CLIENT.write_text(text[:start] + replacement + text[end:], encoding="utf-8")


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        raise SystemExit(f"gen-clawd-sprite: source not found: {source}")

    payload = json.loads(source.read_text(encoding="utf-8"))
    if payload.get("fr") != FPS:
        print(f"  note: source frame rate is {payload.get('fr')}, expected {FPS}")
    frames_in_source = int(payload.get("op", 0)) - int(payload.get("ip", 0))
    if frames_in_source != FRAME_COUNT:
        print(f"  note: source has {frames_in_source} frames, expected {FRAME_COUNT}")

    chrome = find_chrome()
    runtime = lottie_runtime()

    with tempfile.TemporaryDirectory(prefix="clawd-sprite-") as tmp:
        work = Path(tmp)
        pages = render_frames(chrome, runtime, source.read_text(encoding="utf-8"), work)
        grids = sample_grids(pages)

    b64, width, height = build_sprite(grids)
    unique = len({"\n".join(g) for g in grids.values()})
    rewrite_constant(b64)

    print(f"  source     : {source}")
    print(f"  frames     : {FRAME_COUNT} ({unique} unique)")
    print(f"  grid       : {len(grids[0][0])} x {len(grids[0])} cells")
    print(f"  sprite     : {width} x {height} px")
    print(f"  png        : {len(base64.b64decode(b64)):,} bytes")
    print(f"  base64     : {len(b64):,} chars")
    print(f"  written to : {CLIENT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
