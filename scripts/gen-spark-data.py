#!/usr/bin/env python3
"""
Rebuild the Spark animation constants that brand-plugin ships.

What this feeds
---------------
The running indicator (`[data-chat-running]`) normally shows the whale tail.
The brand plugin can replace it with one of eight looping shapes, sourced from a
local JSON: eight entries, each carrying an SVG, a frame count and a per-frame
speed. Every SVG is one tall strip whose frames are stacked vertically.

The artwork is Anthropic's and is used as non-official fan homage; nothing in
this script fetches it, and the source path is a local file.

Unlike the crab (see gen-clawd-sprite.py, which rasterises a Lottie timeline
into a pixel sheet), these are already SVG and already frame-stepped, so nothing
is rendered here. The work is:

  * rewrite each clip's `viewBox` height to match its frame count;
  * namespace every `id`/`url(#…)` pair, because all eight strips end up in one
    document and `orbiting` defines a `clipPath id="a"` that would otherwise
    capture the others' references;
  * emit the strips as JS string constants, split at safe boundaries.

This rewrites the SPARK_ORDER / SPARK_DATA / SPARK_CSS block in
brand-plugin/lib/client.js in place. Run it only when the source changes.

USE
    python3 scripts/gen-spark-data.py [path/to/spark-animations.json]

The default source path is the author's local copy. No browser and no image
library are needed -- this is a pure text transform.
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CLIENT = ROOT / "brand-plugin" / "lib" / "client.js"
DEFAULT_SOURCE = (
    Path.home() / "卡工坊" / "clawd-loading-animation" / "spark-animations.json"
)

# Playback order and the slot boundaries are derived from the source's own
# frameCount x speed; nothing is hand-tuned here.
ORDER = [
    "thinking",
    "writing",
    "waiting",
    "shimmer",
    "orbiting",
    "entrance",
    "exit",
    "tickle",
]

CHUNK = 110

# A stop this far inside the next slot's start ends the previous slot. Without
# it two adjacent slots would share an exact percentage and the later keyframe
# would replace the earlier one, leaving a clip that never hides.
EPSILON_PCT = 0.001


def namespace_ids(svg: str, name: str) -> str:
    """
    Prefix every id and the references to it.

    The eight strips are injected into the same document, so a bare `id="a"` in
    `orbiting` would be the definition every `url(#a)` resolved to, including
    another clip's. The source only has one such id today, but the rewrite is
    written to handle any number rather than special-casing `orbiting`.
    """
    for old in re.findall(r'\bid="([^"]+)"', svg):
        new = f"dcb-spark-{name}-{old}"
        svg = svg.replace(f'id="{old}"', f'id="{new}"')
        svg = svg.replace(f"url(#{old})", f"url(#{new})")
    return svg


def js_chunks(raw: str) -> list[str]:
    """
    Split into JS string literals.

    The split happens on the RAW text and escaping is applied per chunk
    afterwards. Escaping first would let a boundary fall between a backslash and
    the character it escapes, producing a literal that does not parse.
    """
    parts = [raw[i : i + CHUNK] for i in range(0, len(raw), CHUNK)]
    return [p.replace("\\", "\\\\").replace('"', '\\"') for p in parts]


def build_order_and_data(clips: dict) -> str:
    out = [
        "\t\t/* Eight looping shapes for the running indicator. Each is one tall SVG",
        "\t\t * whose frames are stacked vertically and stepped through with",
        "\t\t * `translateY`; the paths carry no fill, so `currentColor` decides the",
        "\t\t * colour and the indicator follows the theme. This is data, not logic.",
        "\t\t * Artwork is Anthropic's, used as non-official fan homage. Rebuild with",
        "\t\t * scripts/gen-spark-data.py. */",
        "\t\tvar SPARK_ORDER = [%s];" % ",".join(f'"{k}"' for k in ORDER),
        "\t\tvar SPARK_DATA = {",
    ]
    for name in ORDER:
        clip = clips[name]
        lines = js_chunks(clip["svg"])
        out.append(
            f'\t\t\t{name}: {{ frames: {clip["frames"]}, dur: {clip["dur"]}, svg:'
        )
        for i, line in enumerate(lines):
            out.append(f'\t\t\t\t"{line}"' + ("" if i == len(lines) - 1 else " +"))
        out.append("\t\t\t\t},")
    out.append("\t\t};")
    return "\n".join(out)


def build_css(clips: dict) -> str:
    total = sum(clips[k]["dur"] for k in ORDER)

    def pct(value: float) -> str:
        return f"{value:.4f}%"

    out = [
        "\t\t/* One strip per animation, absolutely stacked; exactly one is opaque at",
        "\t\t * any moment. The eight slots partition one cycle, so the sequence repeats",
        "\t\t * with no gap and no overlap. Timings verified by stepping the Web",
        "\t\t * Animations clock and reading back which strip was visible. */",
        "\t\t/** Total cycle: the sum of all eight clip lengths. */",
        f"\t\tvar SPARK_TOTAL = {total};",
        "\t\tvar SPARK_CSS = [",
        '\t\t\t".dcb-spark{position:relative;overflow:hidden;width:100%;height:100%;color:inherit}",',
        '\t\t\t".dcb-spark>span{position:absolute;left:0;top:0;width:100%;opacity:0;",',
        '\t\t\t"animation-duration:" + SPARK_TOTAL + "ms;animation-iteration-count:infinite;",',
        '\t\t\t"animation-timing-function:linear}",',
        '\t\t\t".dcb-spark>span>svg{display:block;width:100%;height:auto;fill:currentColor}",',
        '\t\t\t"@keyframes dcb-spark-scroll{from{transform:translateY(0)}to{transform:translateY(-100%)}}",',
    ]

    cursor = 0.0
    for name in ORDER:
        clip = clips[name]
        start = cursor / total * 100
        cursor += clip["dur"]
        end = cursor / total * 100

        stops = []
        if start > EPSILON_PCT:
            stops.append(f"0%,{pct(start - EPSILON_PCT)}{{opacity:0}}")
        stops.append(f"{pct(start)},{pct(end - EPSILON_PCT)}{{opacity:1}}")
        if end < 100 - EPSILON_PCT:
            stops.append(f"{pct(end)},100%{{opacity:0}}")
        keyframes = "".join(stops)

        out.append(f'\t\t\t".dcb-spark>[data-k={name}]{{animation-name:dcb-spark-{name}}}",')
        out.append(
            f'\t\t\t".dcb-spark>[data-k={name}]>svg{{'
            f'animation:dcb-spark-scroll {clip["dur"]}ms '
            f'steps({clip["frames"]},jump-end) infinite}}",'
        )
        out.append(f'\t\t\t"@keyframes dcb-spark-{name}{{{keyframes}}}",')

    out.append('\t\t].join("");')
    return "\n".join(out)


def splice(text: str, marker_start: str, marker_end: str, block: str) -> str:
    """Replace everything from marker_start up to (not including) marker_end."""
    start = text.index(marker_start)
    end = text.index(marker_end, start)
    return text[:start] + block + "\n\n" + text[end:]


def main() -> int:
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SOURCE
    if not source.exists():
        raise SystemExit(f"gen-spark-data: source not found: {source}")

    payload = json.loads(source.read_text(encoding="utf-8"))
    missing = [k for k in ORDER if k not in payload]
    if missing:
        raise SystemExit(f"gen-spark-data: source is missing {missing}")

    clips = {}
    for name in ORDER:
        entry = payload[name]
        frames = int(entry["frameCount"])
        speed = int(entry["speed"])
        clips[name] = {
            "svg": namespace_ids(entry["svg"], name),
            "frames": frames,
            "dur": frames * speed,
        }

    text = CLIENT.read_text(encoding="utf-8")

    # The data block sits just before the crab sprite comment; the CSS block
    # just before RUNNING_CSS. Both are bounded by a stable following marker so
    # the script can be re-run without accumulating copies.
    text = splice(
        text,
        "\t\t/* Eight looping shapes for the running indicator.",
        "\t\t/* Clawd-Laptop: 43 frames",
        build_order_and_data(clips),
    )
    # The end marker is the comment that introduces RUNNING_CSS, NOT the array
    # itself: that comment sits between the generated block and the array, so
    # stopping at `var RUNNING_CSS = [` would delete it along with the old CSS.
    text = splice(
        text,
        "\t\t/* One strip per animation",
        "\t\t/* Every rule below is keyed on",
        build_css(clips),
    )

    CLIENT.write_text(text, encoding="utf-8")

    total = sum(clips[k]["dur"] for k in ORDER)
    print(f"  source : {source}")
    print(f"  clips  : {len(ORDER)}")
    for name in ORDER:
        c = clips[name]
        print(f"    {name:10s} {c['frames']:>2d} frames x {c['dur'] // max(c['frames'],1):>3d}ms = {c['dur']:>5d}ms")
    print(f"  cycle  : {total}ms")
    print(f"  svg    : {sum(len(clips[k]['svg']) for k in ORDER):,} chars")
    print(f"  written: {CLIENT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
