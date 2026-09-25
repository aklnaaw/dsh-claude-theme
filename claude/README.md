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

`preview/light.jpg` and `preview/dark.jpg` are 1440x900 renders of the official
shell facade with this skin's stylesheet injected — the same pipeline the rest of
the catalog uses, so the sidebar and composer geometry match the other skins.

## The full version lives in the project repository

This directory contains the skin only. The full version — the skin source plus
two **optional** plugins — lives at
<https://github.com/aklnaaw/dsh-claude-theme>:

- **The Claude plugin** replaces the sidebar whale mark and brand wordmark with
  the Claude starburst and wordmark, adds a browser tab icon, and provides an
  editable display name and avatar in Settings.
- **The Clawd plugin** puts a clickable pixel crab on the composer's upper edge:
  its eyes follow the pointer, it blinks when idle, and poking it makes it jump
  and say something.

Neither goes through the skin center; both are ordinary Cordis client plugins,
with installation notes and screenshots in that repository's README.

## Source and copyright

- Stylesheets (`skin.css` / `patches.css`): original work by aklnaaw, released with this repository under MIT.
- The four woff2 files under `assets/fonts/` are licensed under the SIL Open Font License 1.1, with the
  copyright notice and full license text included in this directory's `LICENSE`:
  - `newsreader-normal.woff2`, `newsreader-italic.woff2`: Newsreader, Copyright 2020 The Newsreader Project Authors.
  - `inter-normal.woff2`: Inter, Copyright 2016 The Inter Project Authors.
  - `jetbrains-mono-normal.woff2`: JetBrains Mono, Copyright 2020 The JetBrains Mono Project Authors.
  - All four are latin-subset builds from Google Fonts and contain no CJK; Chinese falls back to system fonts.
- Preview images `preview/light.jpg` and `preview/dark.jpg`: renders of the DSH official shell
  facade snapshot; no third-party artwork is used.
- This skin reproduces the visual language of the claude.ai interface. "Claude" and "Anthropic" are
  trademarks of Anthropic PBC; this skin is a stylistic homage and is not affiliated with or endorsed by
  Anthropic. The typefaces Anthropic actually uses (Copernicus and StyreneB) are commercially licensed and
  are not included; open Newsreader and Inter substitute for them here.

## Known limitations

- Presentation only: it changes browser styles and never touches model requests.
- The tool-call cards are not a 1:1 reproduction of claude.ai: claude.ai has no
  equivalent component, so tool cards are DSH-specific UI restyled in Claude's
  card language. Stylistic alignment, not a replica.
- A locally authored skin cannot run `hooks.mjs` (the loader only admits
  official-market origins), which is why the rebranding is a separate plugin.
- The bundled fonts are latin subsets and contain no CJK; Chinese falls back to
  system fonts.
