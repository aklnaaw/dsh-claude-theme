# Claude

[中文](README.zh.md) | English

Rebuilds the DSH Web GUI in the visual language of the claude.ai app: warm cream
canvas, serif reading text, coral accent. Shipped as a pure asset directory
alongside the other themes in the skin center package.

## What it is

- **Pure assets**: `skin.json` (v2 manifest) + `skin.css` (a full `--dsw-*`
  token remap) + `patches.css` (free-selector layer). No package.json, no build
  step; the skin center is the only loader.
- **App palette, not marketing palette**: the canvas is the claude.ai app's own
  warm cream `#faf9f5`, and the accent is the app's coral `#d97757` (the
  marketing site uses `#cc785c`; this theme deliberately does not).
- **Serif reading text**: markdown prose, headings and quotes use Newsreader,
  UI chrome uses Inter, code uses JetBrains Mono. All four woff2 files are
  self-hosted under `assets/fonts/` with no external requests; CJK falls back to
  the system Noto Serif CJK SC.
- **Warm-black dark mode**: `#181715` rather than pure black, with 97 alias
  tokens remapped per mode.
- **All 278 `--dsw-*` tokens declared explicitly**, with no reliance on the
  loader's token auto-derivation.

## Palette

- Light: canvas `#faf9f5`, layers `#f5f0e8` / `#efe9de` / `#e8e0d2`, ink
  `#141413`, accent `#d97757`.
- Dark: canvas `#181715`, layers `#1f1e1b` / `#252320`, ink `#faf9f5`, accent
  `#d97757`.

## Preview

```sh
pnpm market:build                            # refresh market artifacts (market/dist)
open market/dist/preview.html?skin=claude&theme=light
node scripts/capture-previews claude          # re-shoot preview/{light,dark}.jpg
```

## The full version lives in the repository

This directory contains the skin only. The same repository also ships two
**optional** plugins:

- **The Claude plugin** replaces the sidebar whale mark and brand wordmark with
  the Claude starburst and wordmark, adds a browser tab icon, and provides an
  editable display name and avatar in Settings.
- **The Clawd plugin** puts a clickable pixel crab on the composer's upper edge:
  its eyes follow the pointer, it blinks when idle, and poking it makes it jump
  and say something.

Neither goes through the skin center; both are ordinary Cordis client plugins.
Installation and screenshots: <https://github.com/aklnaaw/dsh-claude-theme>.

## Known limitations

- Presentation only: it changes browser styles and never touches model requests.
- The tool-call cards are not a 1:1 reproduction of claude.ai: claude.ai has no
  equivalent component, so tool cards are DSH-specific UI restyled in Claude's
  card language. Stylistic alignment, not a replica.
- A locally authored skin cannot run `hooks.mjs` (the loader only admits
  official-market origins), which is why the rebranding is a separate plugin.
- The bundled fonts are latin subsets and contain no CJK; Chinese falls back to
  system fonts.
