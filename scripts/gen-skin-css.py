#!/usr/bin/env python3
"""Generate claude/skin.css: near-complete --dsw-* remap for light + dark.

The skin loader's token fallback is effectively dead (see .skin-recon REPORT §5),
so every token we care about must be declared here.
Palette: DESIGN-claude.md, with the accent taken from the claude.ai app (#d97757).
"""
import json, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SKIN = ROOT / "claude"
CANON = json.load(open("/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/"
                       "@deepseek-ai/dsh-client-ui-theme/lib/canon.json")) \
    if False else None

# ---- Palette (DESIGN-claude.md + app accent) -------------------------------
C = dict(
    canvas="#faf9f5", soft="#f5f0e8", card="#efe9de", cream="#e8e0d2",
    hairline="#e6dfd8", hairline_soft="#ebe6df",
    ink="#141413", body_strong="#252523", body="#3d3d3a",
    muted="#6c6a64", muted_soft="#8e8b82",
    coral="#d97757", coral_active="#a9583e", coral_soft="#f3e0d8",
    on_primary="#ffffff",
    dark="#181715", dark_el="#252320", dark_soft="#1f1e1b", dark_3="#2b2925",
    on_dark="#faf9f5", on_dark_soft="#a09d96",
    teal="#5db8a6", amber="#e8a55a",
    success="#5db872", warning="#d4a017", error="#c64545",
)
def a(hex6, alpha):
    """#rrggbb + alpha (0-1) -> #rrggbbaa"""
    h = hex6.lstrip("#")
    return f"#{h}{int(round(alpha*255)):02x}"

LIGHT = {
 # -- backgrounds -----------------------------------------------------------
 "--dsw-alias-bg-base": C["canvas"],
 "--dsw-alias-bg-layer-1": C["soft"],
 "--dsw-alias-bg-layer-2": C["card"],
 "--dsw-alias-bg-layer-3": C["cream"],
 "--dsw-alias-bg-overlay": a(C["canvas"], .97),
 "--dsw-alias-bg-module-platform": C["soft"],
 "--dsw-alias-bg-multi-select": a(C["cream"], .85),
 "--dsw-alias-bg-skeleton": a(C["ink"], .04),
 "--dsw-alias-bg-mask-1": a(C["dark"], .24),
 "--dsw-alias-bg-mask-2": a(C["dark"], .12),
 "--dsw-alias-bg-mask-3": a(C["dark"], .48),
 "--dsw-alias-bg-mask-photo": a(C["dark"], .88),
 "--dsw-alias-bg-mask-drop": a(C["canvas"], .70),
 # -- borders ---------------------------------------------------------------
 "--dsw-alias-border-l1": C["hairline_soft"],
 "--dsw-alias-border-l2": C["hairline"],
 "--dsw-alias-border-l2-darkmode-thin": C["hairline"],
 "--dsw-alias-border-l3": a(C["ink"], .14),
 "--dsw-alias-border-l4": a(C["ink"], .20),
 "--dsw-alias-border-inverted": a(C["on_dark"], .10),
 "--dsw-alias-border-inverted2": a(C["on_dark"], .14),
 # -- labels ----------------------------------------------------------------
 "--dsw-alias-label-primary": C["ink"],
 "--dsw-alias-label-primary-bluish": C["ink"],
 "--dsw-alias-label-primary-dimmed": C["body"],
 "--dsw-alias-label-primary-foreground": C["ink"],
 "--dsw-alias-label-primary-inverted": C["on_dark"],
 "--dsw-alias-label-secondary": C["muted"],
 "--dsw-alias-label-tertiary": C["muted_soft"],
 "--dsw-alias-label-caption": C["muted_soft"],
 "--dsw-alias-label-dimmed": C["muted_soft"],
 # -- brand / coral ---------------------------------------------------------
 "--dsw-alias-brand-primary": C["coral"],
 "--dsw-alias-brand-primary-invert": C["on_primary"],
 "--dsw-alias-brand-primary-new-colorprimary-new-color": C["coral"],
 "--dsw-alias-brand-text": C["ink"],
 # -- buttons ---------------------------------------------------------------
 "--dsw-alias-button-primary-fill": C["coral"],
 "--dsw-alias-button-primary-hover": C["coral_active"],
 "--dsw-alias-button-primary-dimmed": C["coral_soft"],
 "--dsw-alias-button-contrast-fill": C["ink"],
 "--dsw-alias-button-elevated-fill": "#ffffff",
 "--dsw-alias-button-floating-fill": "#ffffff",
 "--dsw-alias-button-floating-hover": C["soft"],
 "--dsw-alias-button-ghost-active-fill": C["cream"],
 "--dsw-alias-button-ghost-active-hover": C["card"],
 "--dsw-alias-button-ghost-active-border": a(C["ink"], .30),
 "--dsw-alias-button-info-fill": C["coral"],
 "--dsw-alias-button-info-hover": C["coral_active"],
 "--dsw-alias-button-tool-bar-fill": a(C["ink"], .34),
 "--dsw-alias-button-tool-bar-fill-invisible": a(C["ink"], .36),
 "--dsw-alias-button-tool-bar-hover": a(C["ink"], .60),
 # -- interactive -----------------------------------------------------------
 "--dsw-alias-interactive-bg-hover": a(C["ink"], .05),
 "--dsw-alias-interactive-bg-active": a(C["ink"], .09),
 "--dsw-alias-interactive-bg-hover-solid": C["soft"],
 "--dsw-alias-interactive-bg-hover-accent": a(C["coral"], .12),
 "--dsw-alias-interactive-bg-hover-danger": a(C["error"], .12),
 # -- markdown --------------------------------------------------------------
 "--dsw-alias-markdown-code-block": C["soft"],
 "--dsw-alias-markdown-code-block-banner": C["card"],
 "--dsw-alias-markdown-inline-code": C["coral_soft"],
 "--dsw-alias-markdown-citation": C["soft"],
 "--dsw-alias-markdown-tag": C["card"],
 "--dsw-alias-markdown-placeholder": C["muted_soft"],
 "--dsw-alias-markdown-code-segment-selected": C["card"],
 "--dsw-alias-markdown-code-segment-unselected": a(C["card"], .5),
 # -- states ----------------------------------------------------------------
 "--dsw-alias-state-error-primary": C["error"],
 "--dsw-alias-state-error-secondary": a(C["error"], .16),
 "--dsw-alias-state-success-primary": C["success"],
 "--dsw-alias-state-success-secondary": a(C["success"], .16),
 "--dsw-alias-state-success-tertiary": a(C["success"], .10),
 "--dsw-alias-state-warn-primary": C["warning"],
 "--dsw-alias-state-warn-secondary": a(C["warning"], .16),
 "--dsw-alias-state-warn-tertiary": a(C["warning"], .10),
 "--dsw-alias-state-warn-label": C["body_strong"],
 "--dsw-alias-state-business-primary": C["coral"],
 "--dsw-alias-state-business-tertiary": a(C["coral"], .10),
 # -- misc ------------------------------------------------------------------
 "--dsw-alias-scrollbar-bg-l1": a(C["ink"], .16),
 "--dsw-alias-scrollbar-bg-l2": a(C["ink"], .10),
 "--dsw-alias-scrollbar-hover-l1": a(C["ink"], .30),
 "--dsw-alias-scrollbar-hover-l2": a(C["ink"], .20),
 "--dsw-alias-toast-bg": C["dark_el"],
 "--dsw-alias-tooltip-bg": C["ink"],
 "--dsw-hovercard-bg": C["dark_el"],
 "--dsw-specific-bubble": C["canvas"],
 "--dsw-specific-bubble-highlight": C["soft"],
 "--dsw-specific-input-major": "#ffffff",
 "--dsw-specific-menu": "#ffffff",
 "--dsw-specific-selector": C["card"],
 "--dsw-specific-sidebar-fill": C["soft"],
 "--dsw-specific-sidebar-nav-item-hover": a(C["ink"], .05),
 "--dsw-specific-sidebar-nav-item-active": C["card"],
 "--dsw-specific-sidebar-nav-item-active-accent": C["coral"],
 "--dsw-specific-login-input": "#ffffff",
 "--dsw-specific-tip": C["cream"],
 "--dsw-linear-gradient-think": f"linear-gradient(90deg,{a(C['coral'],0)}, {a(C['coral'],.35)}, {a(C['coral'],0)})",
 "--dsw-linear-think-select": f"linear-gradient(90deg,{a(C['coral'],.10)}, {a(C['coral'],.22)})",
 "--dsw-mask-blur": "blur(6px)",
 # -- shadows: warm-tinted, low alpha (Claude = colour-block first) ---------
 "--dsw-shadow-lv1": f"0 1px 3px {a(C['ink'], .06)}",
 "--dsw-shadow-lv1-blur": "3px",
 "--dsw-shadow-lv2": f"0 6px 20px {a(C['ink'], .08)}",
 "--dsw-shadow-lv3": f"0 14px 38px {a(C['ink'], .12)}",
}

DARK = {
 "--dsw-alias-bg-base": C["dark"],
 "--dsw-alias-bg-layer-1": C["dark_soft"],
 "--dsw-alias-bg-layer-2": C["dark_el"],
 "--dsw-alias-bg-layer-3": C["dark_3"],
 "--dsw-alias-bg-overlay": a(C["dark_el"], .97),
 "--dsw-alias-bg-module-platform": C["dark_el"],
 "--dsw-alias-bg-multi-select": a(C["dark_3"], .85),
 "--dsw-alias-bg-skeleton": a(C["on_dark"], .08),
 "--dsw-alias-bg-mask-1": a("#000000", .50),
 "--dsw-alias-bg-mask-2": a("#000000", .20),
 "--dsw-alias-bg-mask-3": a("#000000", .48),
 "--dsw-alias-bg-mask-photo": a("#000000", .88),
 "--dsw-alias-bg-mask-drop": a(C["dark_el"], .70),
 "--dsw-alias-border-l1": a(C["on_dark"], .07),
 "--dsw-alias-border-l2": a(C["on_dark"], .12),
 "--dsw-alias-border-l2-darkmode-thin": a(C["on_dark"], .07),
 "--dsw-alias-border-l3": a(C["on_dark"], .17),
 "--dsw-alias-border-l4": a(C["on_dark"], .22),
 "--dsw-alias-border-inverted": a(C["ink"], .10),
 "--dsw-alias-border-inverted2": a(C["ink"], .14),
 "--dsw-alias-label-primary": C["on_dark"],
 "--dsw-alias-label-primary-bluish": C["on_dark"],
 "--dsw-alias-label-primary-dimmed": C["on_dark_soft"],
 "--dsw-alias-label-primary-foreground": C["dark"],
 "--dsw-alias-label-primary-inverted": C["ink"],
 "--dsw-alias-label-secondary": C["on_dark_soft"],
 "--dsw-alias-label-tertiary": a(C["on_dark_soft"], .85),
 "--dsw-alias-label-caption": a(C["on_dark_soft"], .80),
 "--dsw-alias-label-dimmed": a(C["on_dark_soft"], .70),
 "--dsw-alias-brand-primary": "#e08a6a",
 "--dsw-alias-brand-primary-invert": C["dark"],
 "--dsw-alias-brand-primary-new-colorprimary-new-color": "#e08a6a",
 "--dsw-alias-brand-text": C["on_dark"],
 "--dsw-alias-button-primary-fill": C["coral"],
 "--dsw-alias-button-primary-hover": "#e08a6a",
 "--dsw-alias-button-primary-dimmed": a(C["coral"], .28),
 "--dsw-alias-button-contrast-fill": C["on_dark"],
 "--dsw-alias-button-elevated-fill": C["dark_3"],
 "--dsw-alias-button-floating-fill": C["dark_el"],
 "--dsw-alias-button-floating-hover": C["dark_3"],
 "--dsw-alias-button-ghost-active-fill": C["dark_3"],
 "--dsw-alias-button-ghost-active-hover": C["dark_el"],
 "--dsw-alias-button-ghost-active-border": a(C["on_dark"], .30),
 "--dsw-alias-button-info-fill": C["coral"],
 "--dsw-alias-button-info-hover": "#e08a6a",
 "--dsw-alias-button-tool-bar-fill": a(C["on_dark"], .30),
 "--dsw-alias-button-tool-bar-fill-invisible": a(C["on_dark"], .32),
 "--dsw-alias-button-tool-bar-hover": a(C["on_dark"], .50),
 "--dsw-alias-interactive-bg-hover": a(C["on_dark"], .07),
 "--dsw-alias-interactive-bg-active": a(C["on_dark"], .12),
 "--dsw-alias-interactive-bg-hover-solid": C["dark_3"],
 "--dsw-alias-interactive-bg-hover-accent": a(C["coral"], .20),
 "--dsw-alias-interactive-bg-hover-danger": a(C["error"], .22),
 "--dsw-alias-markdown-code-block": C["dark_soft"],
 "--dsw-alias-markdown-code-block-banner": C["dark_el"],
 "--dsw-alias-markdown-inline-code": a(C["coral"], .18),
 "--dsw-alias-markdown-citation": C["dark_el"],
 "--dsw-alias-markdown-tag": C["dark_3"],
 "--dsw-alias-markdown-placeholder": a(C["on_dark_soft"], .80),
 "--dsw-alias-markdown-code-segment-selected": C["dark_3"],
 "--dsw-alias-markdown-code-segment-unselected": a(C["dark_3"], .5),
 "--dsw-alias-state-error-primary": "#e06b6b",
 "--dsw-alias-state-error-secondary": a("#e06b6b", .20),
 "--dsw-alias-state-success-primary": C["success"],
 "--dsw-alias-state-success-secondary": a(C["success"], .20),
 "--dsw-alias-state-success-tertiary": a(C["success"], .12),
 "--dsw-alias-state-warn-primary": C["amber"],
 "--dsw-alias-state-warn-secondary": a(C["amber"], .20),
 "--dsw-alias-state-warn-tertiary": a(C["amber"], .12),
 "--dsw-alias-state-warn-label": C["on_dark"],
 "--dsw-alias-state-business-primary": "#e08a6a",
 "--dsw-alias-state-business-tertiary": a("#e08a6a", .12),
 "--dsw-alias-scrollbar-bg-l1": a(C["on_dark"], .16),
 "--dsw-alias-scrollbar-bg-l2": a(C["on_dark"], .10),
 "--dsw-alias-scrollbar-hover-l1": a(C["on_dark"], .28),
 "--dsw-alias-scrollbar-hover-l2": a(C["on_dark"], .18),
 "--dsw-alias-toast-bg": C["dark_3"],
 "--dsw-alias-tooltip-bg": C["on_dark"],
 "--dsw-hovercard-bg": C["dark_3"],
 "--dsw-specific-bubble": C["dark_el"],
 "--dsw-specific-bubble-highlight": C["dark_3"],
 "--dsw-specific-input-major": C["dark_el"],
 "--dsw-specific-menu": C["dark_el"],
 "--dsw-specific-selector": C["dark_3"],
 "--dsw-specific-sidebar-fill": C["dark_soft"],
 "--dsw-specific-sidebar-nav-item-hover": a(C["on_dark"], .07),
 "--dsw-specific-sidebar-nav-item-active": C["dark_3"],
 "--dsw-specific-sidebar-nav-item-active-accent": "#e08a6a",
 "--dsw-specific-login-input": C["dark_el"],
 "--dsw-specific-tip": C["dark_3"],
 "--dsw-linear-gradient-think": f"linear-gradient(90deg,{a('#e08a6a',0)}, {a('#e08a6a',.35)}, {a('#e08a6a',0)})",
 "--dsw-linear-think-select": f"linear-gradient(90deg,{a('#e08a6a',.14)}, {a('#e08a6a',.26)})",
 "--dsw-mask-blur": "blur(6px)",
 "--dsw-shadow-lv1": "0 1px 3px #0000004d",
 "--dsw-shadow-lv1-blur": "3px",
 "--dsw-shadow-lv2": "0 6px 20px #00000059",
 "--dsw-shadow-lv3": "0 14px 38px #00000073",
}

# ---- Fonts -----------------------------------------------------------------
# Claude voice: serif display + humanist sans UI. Chinese falls back to the
# system Noto Serif CJK SC (20MB/weight — never vendored).
SERIF = "'Newsreader','Noto Serif CJK SC','Source Han Serif SC','Songti SC',Georgia,serif"
SANS  = "'Inter','Noto Sans CJK SC','PingFang SC','Microsoft YaHei',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
MONO  = "'JetBrains Mono','Noto Sans Mono CJK SC',ui-monospace,SFMono-Regular,Menlo,monospace"

FONT_STACKS = {"--dsw-font-family": SANS, "--ds-font-family-code": MONO}

# Composite font tokens: `font:` shorthand + longhands. The shell consumes the
# SHORTHAND, so overriding only -font-family does nothing (recon §7).
BODY_SIZES = {
  "--dsw-font-xl-24": (24, 1.3), "--dsw-font-l-20": (20, 1.4),
  "--dsw-font-m-18": (18, 1.5), "--dsw-font-base-16": (16, 1.6),
  "--dsw-font-base-strong-16": (16, 1.6), "--dsw-font-s-14": (14, 1.55),
  "--dsw-font-s-strong-14": (14, 1.55), "--dsw-font-xs-13": (13, 1.5),
  "--dsw-font-xs-strong-13": (13, 1.5), "--dsw-font-xxs-12": (12, 1.45),
  "--dsw-font-xxs-strong-12": (12, 1.45), "--dsw-font-xxxs-11": (11, 1.4),
  "--dsw-font-xxxs-strong-11": (11, 1.4),
}
# Reading surface (markdown) is where the serif voice belongs.
MD_SERIF = {
  "--dsw-font-markdown-h1": (30, 1.25, 400), "--dsw-font-markdown-h2": (24, 1.3, 400),
  "--dsw-font-markdown-h3": (20, 1.35, 400), "--dsw-font-markdown-h4": (17, 1.4, 500),
  "--dsw-font-markdown-base": (16, 1.72, 400),
  "--dsw-font-markdown-base-strong": (16, 1.72, 500),
  "--dsw-font-markdown-base-italic": (16, 1.72, 400),
  "--dsw-font-markdown-base-strong-italic": (16, 1.72, 500),
  "--dsw-font-markdown-small": (14, 1.68, 400),
  "--dsw-font-markdown-small-strong": (14, 1.68, 500),
  "--dsw-font-markdown-small-italic": (14, 1.68, 400),
  "--dsw-font-markdown-small-strong-italic": (14, 1.68, 500),
}
MD_SANS = {
  "--dsw-font-markdown-table": (14, 1.5, 400), "--dsw-font-markdown-table-head": (14, 1.5, 500),
}
MD_MONO = {
  "--dsw-font-markdown-code": (14, 1.6, 400), "--dsw-font-markdown-code-block": (14, 1.6, 400),
  "--dsw-font-markdown-code-block-small": (13, 1.6, 400),
}

def font_decls():
    out = []
    for name, stack in FONT_STACKS.items():
        out.append(f"  {name}: {stack};")
    for name, (size, lh) in BODY_SIZES.items():
        weight = 500 if "strong" in name else 400
        out.append(f"  {name}: 400 {size}px/{lh} {SANS};")
        out.append(f"  {name}-font-family: {SANS};")
        out.append(f"  {name}-font-size: {size}px;")
        out.append(f"  {name}-font-weight: {weight};")
        out.append(f"  {name}-font-style: normal;")
        out.append(f"  {name}-line-height: {lh};")
    for name, (size, lh, weight) in MD_SERIF.items():
        style = "italic" if "italic" in name else "normal"
        out.append(f"  {name}: {style} {weight} {size}px/{lh} {SERIF};")
        out.append(f"  {name}-font-family: {SERIF};")
        out.append(f"  {name}-font-size: {size}px;")
        out.append(f"  {name}-font-weight: {weight};")
        out.append(f"  {name}-font-style: {style};")
        out.append(f"  {name}-line-height: {lh};")
    for group, stack in ((MD_SANS, SANS), (MD_MONO, MONO)):
        for name, (size, lh, weight) in group.items():
            out.append(f"  {name}: {weight} {size}px/{lh} {stack};")
            out.append(f"  {name}-font-family: {stack};")
            out.append(f"  {name}-font-size: {size}px;")
            out.append(f"  {name}-font-weight: {weight};")
            out.append(f"  {name}-font-style: normal;")
            out.append(f"  {name}-line-height: {lh};")
    return "\n".join(out)

# ---- Emit ------------------------------------------------------------------
fonts_css = (SKIN / "assets/fonts/fonts.generated.css").read_text().strip()

def block(d, indent="  "):
    return "\n".join(f"{indent}{k}: {v};" for k, v in d.items())

css = f"""/* ============================================================================
 * Claude — dsh skin
 *   light : warm cream canvas (#faf9f5) + coral accent (#d97757)
 *   dark  : Claude warm-black (#181715), never pure black
 *
 * Palette: DESIGN-claude.md, accent taken from the claude.ai app surface.
 * Every token is declared explicitly: the loader's token fallback is
 * effectively dead (see .skin-recon REPORT §5 — 190/191 uncovered tokens keep
 * stock values), so nothing here may be left to derivation.
 * ========================================================================== */

/* ---- Self-hosted faces -----------------------------------------------------
 * Remote fonts are a hard 422 in this loader; only relative in-directory
 * assets are allowed. Latin is vendored (364 KB); Chinese resolves through the
 * system Noto Serif CJK SC — it is ~20 MB per weight and is never shipped.
 * -------------------------------------------------------------------------- */
{fonts_css}

/* ============================================================================
 * LIGHT
 * ========================================================================== */
:root {{
{block(LIGHT)}
}}

:root {{
{font_decls()}
}}

/* ============================================================================
 * DARK — same token names, Claude's warm black
 * ========================================================================== */
body[data-ds-dark-theme] {{
{block(DARK)}
}}
"""

out = SKIN / "skin.css"
out.write_text(css, encoding="utf-8")
n_light = len(LIGHT); n_dark = len(DARK)
print(f"wrote {out} ({len(css)} bytes)")
print(f"light tokens: {n_light}   dark tokens: {n_dark}   font decls: {len(font_decls().splitlines())}")
