#!/usr/bin/env python3
"""Generate a Clawd pet directory ($DSH_HOME/pets/clawd/) for @linxin666/dsh-pet.

The pet system wants the hatch-pet contract: an 8x9 atlas of 192x208 cells.
We already have the crab's pixel geometry as data (see gen-crab.py), so we
render it into that atlas rather than shipping a hand-drawn one.

Honest limitation: this is the SAME crab drawn into every cell with a per-row
tint, not nine distinct animations. It gives Clawd a real presence in the pet
panel, but it is not frame-by-frame animation. Real per-track animation would
need artwork we do not have.
"""
import re, json, pathlib, sys

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
CELL_W, CELL_H = 192, 208
COLS, ROWS = 8, 9
SCALE = 12
ROW_TINTS = ['#d97757'] * ROWS
EYE = '#141413'

def load_frames() -> dict:
    ref = pathlib.Path('/tmp/clawd-frames.json')
    if not ref.exists():
        sys.exit("run the frame extraction first: /tmp/clawd-frames.json is missing")
    return json.loads(ref.read_text())

def decode(val: str) -> dict:
    px = {}
    for part in val.split(','):
        m = re.match(r'\s*(-?[\d.]+)px\s+(-?[\d.]+)px\s+0\s+[\d.]+px\s+(#[0-9a-fA-F]{3,8}|var\([^)]+\))', part.strip())
        if m:
            px[(round(float(m.group(1)) / 3), round(float(m.group(2)) / 3))] = m.group(3)
    return px

def main() -> None:
    frames = load_frames()
    crab = decode(frames['--clawd-f-open'])
    xs = [k[0] for k in crab]; ys = [k[1] for k in crab]
    w = max(xs) - min(xs) + 1
    h = max(ys) - min(ys) + 1

    atlas = Image.new('RGBA', (CELL_W * COLS, CELL_H * ROWS), (0, 0, 0, 0))
    for row in range(ROWS):
        tint = tuple(int(ROW_TINTS[row][i:i + 2], 16) for i in (1, 3, 5)) + (255,)
        for col in range(COLS):
            ox = col * CELL_W + (CELL_W - w * SCALE) // 2
            oy = row * CELL_H + (CELL_H - h * SCALE) // 2
            for (cx, cy), v in crab.items():
                colour = tuple(int(EYE[i:i + 2], 16) for i in (1, 3, 5)) + (255,) if 'var(' in v else tint
                x0 = ox + (cx - min(xs)) * SCALE
                y0 = oy + (cy - min(ys)) * SCALE
                for dy in range(SCALE):
                    for dx in range(SCALE):
                        atlas.putpixel((x0 + dx, y0 + dy), colour)

    out = ROOT / 'pet' / 'clawd'
    out.mkdir(parents=True, exist_ok=True)
    atlas.save(out / 'spritesheet.png')

    manifest = {
        "petManifestVersion": 2,
        "id": "clawd",
        "displayName": "Clawd",
        "renderer": "sprite2d",
        "sprite2d": {
            "spritesheetPath": "spritesheet.png",
            "frames": [COLS] * ROWS,
            "tracks": {t: {"durations": [450] * COLS} for t in
                       ['idle', 'running-right', 'running-left', 'waving', 'jumping',
                        'failed', 'waiting', 'running', 'review']},
        },
        "description": "Claude Code 的像素小螃蟹。原像素美术 by claudenoshujin（claude-web），非官方移植。",
        "license": "MIT",
    }
    (out / 'pet.json').write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding='utf-8')
    print(f"wrote {out}/pet.json and spritesheet.png ({atlas.size[0]}x{atlas.size[1]})")

if __name__ == '__main__':
    main()
