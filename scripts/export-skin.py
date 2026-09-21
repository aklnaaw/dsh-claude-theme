#!/usr/bin/env python3
"""Export a market-ready skin directory.

The repository's claude/ directory is a WORKING tree: it also holds the inputs
the generators read (patches.base.css, crab.generated.css,
assets/fonts/fonts.generated.css, build-fonts.sh). The skin market takes pure
asset directories -- every listed skin ships only skin.json, skin.css,
patches.css, preview/ and optional assets/ -- so the working tree cannot be
copied in as-is.

This produces the publishable subset, plus the market-specific manifest fields
(the description carries the repository link, since the schema has no homepage
field and the shipped skins attribute their origin in prose).

    python3 scripts/export-skin.py [outdir]

Defaults to dist/claude-market/. The output is disposable; nothing reads it back.
"""

import json
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "claude"

# Runtime files the loader actually reads, plus the market-facing READMEs. The
# skin center ignores the READMEs and the loader never requests them, but the
# market lists them beside the other skins, which all ship a bilingual pair.
KEEP = [
    "skin.json",
    "skin.css",
    "patches.css",
    "preview/light.jpg",
    "preview/dark.jpg",
    "assets/fonts/newsreader-normal.woff2",
    "assets/fonts/newsreader-italic.woff2",
    "assets/fonts/inter-normal.woff2",
    "assets/fonts/jetbrains-mono-normal.woff2",
    "README.md",
    "README.zh.md",
    "LICENSE",
]

# Dropped from the working tree and never copied.
DROP = [
    "patches.base.css",
    "crab.generated.css",
    "assets/fonts/fonts.generated.css",
    "assets/fonts/build-fonts.sh",
]

REPO = "https://github.com/aklnaaw/dsh-claude-theme"

# The market shows description, not a link field, so the pointer to the rest of
# the project has to live in prose. Kept to two sentences: the market listing is
# a card, and the plugins are an extra, not the headline.
DESCRIPTION_SUFFIX = (
    "皮肤本身是完整的亮暗双主题；仓库另有两个可选插件（Claude 品牌替换、"
    "可交互的 Clawd 像素蟹），需要时见 " + REPO
)


def main() -> int:
    out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "dist" / "claude-market"

    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)

    missing = []
    for rel in KEEP:
        src = SRC / rel
        if not src.exists():
            missing.append(rel)
            continue
        dest = out / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
    if missing:
        print("  missing from the working tree: " + ", ".join(missing), file=sys.stderr)
        return 1

    # Manifest: same skin, with the repository pointer appended to description.
    manifest = json.loads((SRC / "skin.json").read_text(encoding="utf-8"))
    base = manifest.get("description", "").rstrip()
    if not base.endswith(("。", ".")):
        base += "。"
    manifest["description"] = base + DESCRIPTION_SUFFIX
    (out / "skin.json").write_text(
        json.dumps(manifest, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    # Report what was left behind, so the exclusion is visible rather than
    # something a reader has to reconstruct from the script.
    kept_bytes = sum((out / r).stat().st_size for r in KEEP)
    print(f"  exported {len(KEEP)} files, {kept_bytes / 1024:.0f} KB -> {out.relative_to(ROOT)}")
    for rel in DROP:
        if (SRC / rel).exists():
            print(f"  excluded (build input): {rel}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
