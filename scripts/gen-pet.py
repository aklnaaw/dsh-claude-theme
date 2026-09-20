#!/usr/bin/env python3
"""Generate a Clawd pet directory ($DSH_HOME/pets/clawd/) for @linxin666/dsh-pet.

The pet system wants the hatch-pet contract: an 8x9 atlas of 192x208 cells. The
crab's pixel geometry already exists as box-shadow frame data inside the Clawd
plugin, so this renders that into the atlas rather than shipping a hand-drawn
one.

The frames are read from crab-plugin/lib/client.js -- the same table the plugin
paints on screen. That keeps the two from drifting, and it means this script
needs nothing that is not in the repository. An earlier version read
/tmp/clawd-frames.json, a scratch file from the original frame extraction: it
was never committed, so a fresh clone could not run this at all.

Honest limitation: this is the SAME crab drawn into every cell with a per-row
tint, not nine distinct animations. It gives Clawd a real presence in the pet
panel, but it is not frame-by-frame animation. Real per-track animation would
need artwork we do not have.
"""

import json
import pathlib
import re
import sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PLUGIN = ROOT / "crab-plugin" / "lib" / "client.js"

CELL_W, CELL_H = 192, 208
COLS, ROWS = 8, 9
SCALE = 12
ROW_TINTS = ["#d97757"] * ROWS
EYE = "#141413"

# One cell of the plugin's box-shadow data:
#   "6px 6px 0 .3px var(--dcc-body)"
SHADOW_RE = re.compile(
    r"(-?[\d.]+)px\s+(-?[\d.]+)px\s+0\s+[\d.]+px\s+(#[0-9a-fA-F]{3,8}|var\([^)]+\))"
)


def load_frame(name: str = "open") -> dict:
    """Pull one frame out of the plugin's FRAMES table."""
    src = PLUGIN.read_text(encoding="utf-8")
    m = re.search(r"var FRAMES = \{(.*?)\n    \};", src, re.S)
    if m is None:
        sys.exit(f"could not find the FRAMES table in {PLUGIN.relative_to(ROOT)}")
    body = m.group(1)
    fm = re.search(r'"%s"\s*:\s*"([^"]+)"' % re.escape(name), body)
    if fm is None:
        sys.exit(f'frame "{name}" not found in the FRAMES table')

    # The cell pitch is 3px; normalise to integer pixel coordinates.
    px = {}
    for mx, my, colour in SHADOW_RE.findall(fm.group(1)):
        px[(round(float(mx) / 3), round(float(my) / 3))] = colour
    if not px:
        sys.exit(f'frame "{name}" parsed to zero pixels')
    return px


def main() -> int:
    crab = load_frame("open")
    xs = [k[0] for k in crab]
    ys = [k[1] for k in crab]
    w = max(xs) - min(xs) + 1
    h = max(ys) - min(ys) + 1
    print(f"  frame: {len(crab)} pixels, {w}x{h} cells")

    atlas = Image.new("RGBA", (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        tint = tuple(int(ROW_TINTS[row][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for col in range(COLS):
            ox = col * CELL_W + (CELL_W - w * SCALE) // 2
            oy = row * CELL_H + (CELL_H - h * SCALE) // 2
            for (cx, cy), v in crab.items():
                # The frame data uses two CSS variables: --dcc-body for the
                # crab and --dcc-eye for the two eyes. Match on the NAME, not
                # on "contains var(" -- both are var() references, and testing
                # for var() alone paints the whole crab in the eye colour.
                colour = (
                    tuple(int(EYE[i:i + 2], 16) for i in (1, 3, 5)) + (255,)
                    if "--dcc-eye" in v
                    else tint
                )
                x0 = ox + (cx - min(xs)) * SCALE
                y0 = oy + (cy - min(ys)) * SCALE
                for dy in range(SCALE):
                    for dx in range(SCALE):
                        atlas.putpixel((x0 + dx, y0 + dy), colour)

    out = ROOT / "pet" / "clawd"
    out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / "spritesheet.png")

    manifest = {
        "petManifestVersion": 2,
        "id": "clawd",
        "displayName": "Clawd",
        "renderer": "sprite2d",
        "sprite2d": {
            "spritesheetPath": "spritesheet.png",
            "frames": [COLS] * ROWS,
            "tracks": {
                t: {"durations": [450] * COLS}
                for t in [
                    "idle", "running-right", "running-left", "waving", "jumping",
                    "failed", "waiting", "running", "review",
                ]
            },
        },
        "description": "Claude Code 的像素小螃蟹。原像素美术 by claudenoshujin（claude-web），非官方移植。",
        "license": "MIT",
    }
    (out / "pet.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )
    print(f"  wrote {out.relative_to(ROOT)}/pet.json and spritesheet.png "
          f"({atlas.size[0]}x{atlas.size[1]})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
