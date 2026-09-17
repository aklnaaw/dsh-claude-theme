#!/usr/bin/env python3
"""Inline the default avatar into the brand plugin's client bundle.

The plugin ships a default display name and avatar so a first-time install looks
finished rather than empty. The avatar has to be a data URL: a plugin bundle is
served as a single JavaScript file with no asset pipeline, and a relative URL
would have to resolve against a path this plugin does not own.

That makes the base64 part of the source, which nobody can edit by hand. So the
image lives in brand-plugin/assets/ as a real file and this script splices it
into lib/client.js between the markers below. Run it after replacing the source
image; the output is committed like any other generated file in this repo.

    python3 scripts/gen-brand-avatar.py
"""

import base64
import io
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "brand-plugin" / "assets" / "default-avatar.webp"
CLIENT = ROOT / "brand-plugin" / "lib" / "client.js"

BEGIN = "var DEFAULT_AVATAR =\n\t\t\t\"data:image/webp;base64,"
END = "\";"

# The row draws this at 24px and the editor at 40px. 256 leaves headroom for 2x
# displays without putting weight in the bundle nobody can see.
SIZE = 256


def build() -> str:
    """Round-cropped, centred, WebP, as base64."""
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("  PIL is required: python3 -m pip install pillow", file=sys.stderr)
        return ""

    im = Image.open(SRC).convert("RGB")
    w, h = im.size
    side = min(w, h)
    sq = im.crop(((w - side) // 2, (h - side) // 2, (w - side) // 2 + side, (h - side) // 2 + side))
    sq = sq.resize((SIZE, SIZE), Image.LANCZOS)

    # Round the alpha here rather than relying on CSS border-radius: the same
    # data URL is used in more than one container, and a pre-rounded asset
    # composites correctly against any backdrop.
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, SIZE - 1, SIZE - 1), fill=255)
    out = sq.convert("RGBA")
    out.putalpha(mask)

    buf = io.BytesIO()
    out.save(buf, "WEBP", quality=82, method=6)
    raw = buf.getvalue()
    b64 = base64.b64encode(raw).decode("ascii")
    print(f"  {SRC.name}: {im.size} -> {SIZE}x{SIZE}  webp {len(raw)} B -> base64 {len(b64)} B")
    return b64


def main() -> int:
    b64 = build()
    if not b64:
        return 1

    text = CLIENT.read_text(encoding="utf-8")
    start = text.find(BEGIN)
    if start < 0:
        print(f"  marker not found in {CLIENT.relative_to(ROOT)}", file=sys.stderr)
        return 1
    start += len(BEGIN)
    end = text.find(END, start)
    if end < 0:
        print("  closing quote not found", file=sys.stderr)
        return 1

    updated = text[:start] + b64 + text[end:]
    CLIENT.write_text(updated, encoding="utf-8")
    print(f"  spliced into {CLIENT.relative_to(ROOT)} ({len(updated)} chars)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
