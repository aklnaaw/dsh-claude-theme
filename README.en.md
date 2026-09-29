| ![](cover/blue-maid.png) | ![](cover/orange-reading.png) |
| --- | --- |

> ~~**These two look like a pair of star-crossed lovers to me.**~~

# Claude — a DSH Web GUI theme

> ~~**If Anthropic considers this an infringement, contact me and I will take it down.**~~

Makes the DSH Web GUI look like the claude.ai app: warm cream canvas, serif reading text, coral accent.

The repo holds five things. Each installs on its own, and none of them gets in another's way:

| | What it is |
| --- | --- |
| **Skin** `claude/` | Colours, fonts, rounded corners. The skin itself. |
| **Skin plugin** `plugins/skin/` | Lets you use the skin without the skin center. |
| **Claude plugin** `brand-plugin/` | The starburst mark and wordmark in the sidebar, the home-page greeting, the browser title and icon. |
| **Clawd plugin** `crab-plugin/` | The pokeable pixel crab on the composer edge. |
| **Font-switcher plugin** `plugins/font-switcher/` | Swaps out the three font groups the skin uses. |

### The skin installs two ways

**One: through the skin center.** If you already run `@linxin666/dsh-client-ui-skin-center`, search for Claude in its marketplace and install it — no manual copying. Then pick it in Settings.

**Two: through the standalone plugin.** If you would rather not install a whole skin center for one skin, install `plugins/skin/`. It **installs the skin for you**: on first load it copies the repository's `claude/` into `$DSH_HOME/skins/claude`, so after a restart you just pick Claude in **Settings → Claude-X**. It does only the skin's job — reads the directory, puts the stylesheet on the page, hands over the fonts and images — without the background images, marketplace or wallpaper features.

**Don't install both** — each would send the same stylesheet to the page.

### Between them

The four plugins each mind their own business: separate settings pages (skin → **Claude-X**, crab → **Clawd**, fonts → **Fonts**) and separate saved data. Just two small overlaps:

- The name, caption and avatar editor sits on the skin plugin's Claude-X page — it's part of that skin's look. The data itself belongs to the brand plugin, so with only the brand plugin installed you rename through the row at the foot of the sidebar.
- The font-switcher follows the current skin. No skin, nothing to swap.

Plugins without the skin still look right, just in the stock theme colours. The skin without the plugins means no starburst and no crab, but the colours, fonts and the pixel sparkle by the greeting are all there.

**Why the brand swap isn't part of the skin**: skins can't run the official hooks (see [Limitations](#limitations)), and swapping a logo is plugin work.

---

## Preview

![](claude/preview/light.jpg)

![](claude/preview/dark.jpg)

Screenshots of the real running UI. The light canvas is warm cream, the dark one Claude's warm black — both matching the design values.

---

## Features

- **Warm cream canvas** — no more stock cool gray-white. Light is warm cream; dark is Claude's warm black, not pure black.
- **Serif reading text** — prose, headings and quotes in Newsreader; buttons and menus in Inter; code in JetBrains Mono. Chinese falls back to your system fonts.
- **Clawd, the pixel crab** — Claude Code's crab, drawn in pure CSS, no images. It lives in the plugin: eyes following your pointer, blinking when idle, dozing off when ignored, and a poke gets you a line that fits the moment. The skin just reserves room for it.
- **Fonts included** — four font files inside the skin directory; nothing is fetched from outside.
- **Third-party plugins blend in** — other plugins' UI gets a neutral coat so it follows Claude's card style instead of clashing.
- **Your name and avatar** — a row at the foot of the sidebar; click to edit in place. A fresh install shows `moon` and a built-in avatar, stored only in this browser.
- **Rotating greeting** — 24 lines, one per page load, the first always a time-of-day greeting, carrying your name.
- **Live switching** — through the skin center, swapping skins needs no reload; through the standalone plugin, reload once after switching.

---

## Layout

```
dsh-claude-theme/
├── claude/                          # the skin itself
│   ├── skin.json                    #   what the skin is (name, author, palette)
│   ├── skin.css                     #   all the colours and fonts
│   ├── patches.css                  #   the fine-tuning (radii, composer, cards, scrollbars)
│   ├── assets/fonts/                #   the four font files + a re-download script
│   ├── preview/                     #   preview images (real screenshots, light + dark)
│   ├── crab.generated.css           #   the pixel sparkle by the greeting (generated, don't edit)
│   └── patches.base.css             #   the hand-written draft behind patches.css
├── plugins/
│   ├── skin/                        # the skin plugin
│   │   ├── README.md                #   how it makes the skin take effect
│   │   ├── lib/index.js             #   reads the skin, puts styles on the page, serves assets
│   │   ├── lib/css-contract.js      #   stylesheet rewriting (see its own README)
│   │   ├── lib/client.js            #   the Claude-X settings page
│   │   └── test/                    #   unit tests
│   └── font-switcher/               # the font-switcher plugin
│       ├── README.md
│       ├── lib/index.js             #   scans the font folder
│       └── lib/client.js            #   the font settings page
├── crab-plugin/                     # the Clawd plugin
│   ├── LICENSE                      #   MIT + Clawd attribution
│   ├── README.md
│   ├── docs/preview.png             #   preview image
│   └── lib/client.js                #   the crab: pixel art, animation, lines
├── pet/                             # the crab spritesheet for the pet system
├── brand-plugin/                    # the Claude plugin
│   ├── README.md
│   ├── assets/default-avatar.webp   #   the default avatar
│   └── lib/client.js                #   starburst, wordmark, greeting, name and avatar
├── cover/                           # cover art (video cover + repo card ratios)
├── scripts/                         # maintenance scripts (regenerate, validate, screenshot)
├── README.md                        # Chinese
├── README.en.md                     # this file
├── INSTALL.md                       # step-by-step install and troubleshooting
└── LICENSE                          # MIT + font and trademark notices
```

Script usage is documented in [`scripts/README.md`](scripts/README.md).

---

## Install

The four things install on their own; missing one doesn't affect another. **Only the skin asks you to pick a route.**

### 1. The skin

**Through the skin center** (pick one): install `@linxin666/dsh-client-ui-skin-center`, search for Claude in its marketplace and install it, then open **Settings → Skin Center** and pick Claude. The marketplace puts it in `$DSH_HOME/skins/` for you. No restart.

**Through the standalone plugin** (pick one): install `plugins/skin/`, then restart:

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/plugins/skin
```

On first load the plugin copies the repository's `claude/` into `$DSH_HOME/skins/claude` itself, so there is nothing for you to copy. After the restart, pick Claude in **Settings → Claude-X**.

(You can still place the skin by hand if you prefer: `cp -r claude "$HOME/.dsh/skins/claude"`. The plugin only fills in missing files — it never overwrites what is already there.)

### 2. The Claude plugin

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/brand-plugin
```

**Restart DSH once** after installing (client plugins load at startup and can't hot-swap). The whale in the sidebar becomes a starburst, the wordmark reads "Claude", and the tab title and icon change with it.

### 3. The Clawd plugin

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/crab-plugin
```

Restart the same way. The pixel crab appears on the composer edge, and poking it gets a reaction.

The crab lives only in the plugin — the skin does not draw one, so you never get two.

### 4. The font-switcher plugin

```bash
dsh plugin --profile web add link:/path/to/dsh-claude-theme/plugins/font-switcher
```

Restart the same way, then open **Settings → 字体** and drop your font files into the folder it shows you (`assets/fonts/custom/` inside the skin directory), and come back and hit "rescan". To label what each one is for, put them in `serif/`, `sans/` or `mono/` subfolders, or say so in the filename.

Bring your own font files; the repo only has the four the skin ships with.

Troubleshooting, verification and rollback for every step are in [`INSTALL.md`](INSTALL.md).

**Too lazy? Hand it to dsh, Claude Code or codex and let them install it.**

---

## Limitations

- **Skins can't run the official hooks.** The skin center only admits skins installed from its marketplace and refuses local ones outright. That's why swapping the logo is a plugin, not part of the skin.
- **Remote fonts differ by route.** Through the skin center, fonts must live inside the skin directory — anything referencing outside gets rejected. The standalone plugin doesn't enforce this — and therefore doesn't check anything for you either, so only run skins you wrote or can read yourself.
- **The tool-call cards are an impression, not a replica.** claude.ai has no such thing (they're DSH-specific UI), so they're redrawn in Claude's style rather than copied.
- **The crab's art comes from someone else.** The pixel matrix is from the SillyTavern extension [claude-web](https://github.com/claudenoshujin/claude-web) by **claudenoshujin** — the drawing credit is his. The selectors, animation, colours and placement here are original. See [License and notices](#license-and-notices).
- **The pet-panel crab doesn't move.** The pet system wants a nine-frame animation sheet, but the crab only has one static pose, so all nine cells are the same crab in different tints. Real animation needs actual art.
- **The crab skips the official slot system.** It used to go through it, and it went badly: errors got swallowed, the plugin loaded but no crab appeared, and nothing was logged. It now mounts straight onto the composer. The cost: if the official marker for that spot ever changes, the crab disappears — but you'll get a console warning, not silence.
- **The skin no longer draws its own crab.** It used to carry a static one that fought with the plugin's crab (two crabs, or none), so it was removed. The crab lives only in the plugin now — skin without plugin means no crab.
- **The preview images are real screenshots**, one per mode.
- **The skin only applies while selected.** Everything is scoped inside the skin's own namespace, so other skins don't pick it up. Both install routes behave this way.

---

## License and notices

- Code and CSS: MIT, see [`LICENSE`](LICENSE).
- Vendored fonts: Newsreader, Inter and JetBrains Mono are licensed under the SIL Open Font License 1.1 and are included in `claude/assets/fonts/`.
- Trademarks: this is an **unofficial fan tribute**. "Claude" and "Anthropic" are trademarks of Anthropic PBC. This project is not affiliated with or endorsed by Anthropic.
- **Clawd attribution.** Clawd, the pixel crab mascot of Claude Code, belongs to Anthropic. The crab in this repo is **pure CSS**, generated by `scripts/gen-crab.py` from dot-matrix data with no image files. The geometry comes from the SillyTavern extension [claude-web](https://github.com/claudenoshujin/claude-web) by **claudenoshujin** — credit for the original pixel art belongs to that author. This project reuses the geometry only and copied no files from that repo; the selectors, animation, colours and placement are its own.
- **Copernicus and StyreneB are not included.** Those are Anthropic's actual typefaces and are licensed fonts that cannot be redistributed. This project substitutes the open Newsreader (for Copernicus's serif role) and Inter (for StyreneB's sans role) — similar in spirit, not identical.

---

## Credits

- The skin-center plugin [`@linxin666/dsh-client-ui-skin-center`](https://github.com/zhu1090093659/dsh-web), which provides skin loading, manifest validation, CSS sanitization and live switching.
- The type designers behind Newsreader, Inter and JetBrains Mono, and Google Fonts' latin subset builds.
- Anthropic's claude.ai interface, whose look this project reproduces.
- The SillyTavern extension [claude-web](https://github.com/claudenoshujin/claude-web) by **claudenoshujin**: source of the Clawd pixel geometry, and a key reference for the palette.
