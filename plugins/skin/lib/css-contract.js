/**
 * The skin stylesheet contract: turn an authored skin stylesheet into one the
 * DSH page can inline safely and correctly.
 *
 * A skin is authored for a loader that force-scopes it. Both halves of that
 * contract are load-bearing, and dropping either one leaves the page looking
 * completely untouched:
 *
 *   1. SCOPING. Every selector is rewritten under
 *      `html[data-dsh-skin="<id>"]`, and that attribute is stamped on the
 *      `<html>` tag at index render time. Without the attribute the rewritten
 *      selectors match nothing; without the rewrite the attribute alone does
 *      nothing.
 *
 *   2. LIGHT TOKENS BELONG ON BODY, NOT ON ROOT. The official theme declares
 *      `--dsw-alias-*` on `body{…}`, with dark variants on
 *      `body[data-ds-dark-theme]{…}`. A skin that puts its light palette on
 *      `:root` loses, and not because of document order: `:root` and `body`
 *      carry the same specificity, but a declaration on `body` itself beats a
 *      value inherited from `html`. The skin's own dark block does win (it is
 *      an attribute-qualified body rule), so the failure mode is a skin that
 *      looks right in dark mode and completely unchanged in light mode. The
 *      transform therefore resets the root-declared alias tokens on the scope
 *      and clones them onto `body`.
 *
 * The exact rewrite mirrors the contract implemented by
 * `@linxin666/dsh-client-ui-skin-center`, because the installed skins are
 * authored against that output. Any deviation shows up as a skin that renders
 * differently here than it did under the skin center.
 *
 * This module is pure: text in, text out. No filesystem, no host context.
 */

import { OFFICIAL_TOKENS } from "./official-tokens.js";

/** Custom properties the official theme evaluates on body, not on html. */
const ROOT_BODY_TOKEN = /^(?:--dsw-alias-|--dsw-specific-)/;
/** An official dark-theme style head: the attribute lives on body. */
const HEAD_DATA_DS = /^\[data-ds-[a-z0-9-]+/;
/** At-rules whose block holds style rules that must themselves be scoped. */
const NESTED_AT_RULES = new Set(["media", "supports", "container", "layer", "document", "scope", "starting-style"]);
const COMMENT = /\/\*[\s\S]*?\*\//g;

/** `html[data-dsh-skin="<id>"]` is the single scope every selector lands in. */
export function scopeSelector(id) {
  return `html[data-dsh-skin="${id}"]`;
}

function stripComments(value) {
  return value.replace(COMMENT, "");
}

/** Split a selector list on top-level commas, ignoring commas inside `()`/`[]`/strings. */
export function splitSelectors(text) {
  const out = [];
  let current = "";
  let depth = 0;
  let quote = null;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quote !== null) {
      current += ch;
      if (ch === "\\") {
        current += text[i + 1] ?? "";
        i++;
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "/" && text[i + 1] === "*") {
      const close = text.indexOf("*/", i + 2);
      i = close === -1 ? text.length : close + 1;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
      continue;
    }
    if (ch === "(" || ch === "[") depth++;
    else if (ch === ")" || ch === "]") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      out.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  out.push(current);
  return out;
}

/**
 * Scope one selector under the skin's html attribute.
 *
 * Only the well-defined root-ish heads are rewritten; anything else simply
 * becomes a descendant of the scope. `body` and a bare official `[data-ds-*]`
 * head become descendants too — the official dark-theme attribute lives on
 * body, so it must not be rewritten as if it lived on the root.
 */
export function scopeSelectorText(selector, id) {
  const scope = scopeSelector(id);
  const trimmed = selector.trim();
  const leading = selector.slice(0, selector.length - selector.trimStart().length);
  const trailing = selector.slice(leading.length + trimmed.length);
  if (trimmed === ":root" || trimmed.startsWith(":root ") || trimmed.startsWith(":root,")) {
    return leading + scope + trimmed.slice(5) + trailing;
  }
  if (/^html\[data-ds-/.test(trimmed)) return `${leading}${scope} body${trimmed.slice(4)}${trailing}`;
  if (trimmed === "html" || trimmed.startsWith("html ")) return leading + scope + trimmed.slice(4) + trailing;
  if (trimmed === "body" || trimmed.startsWith("body ") || trimmed.startsWith("body[") || trimmed.startsWith("body:")) {
    return `${leading}${scope} ${trimmed}${trailing}`;
  }
  if (HEAD_DATA_DS.test(trimmed)) return `${leading}${scope} body${trimmed}${trailing}`;
  return `${leading}${scope} ${trimmed}${trailing}`;
}

export function scopeSelectorList(selectorText, id) {
  return splitSelectors(selectorText).map((one) => scopeSelectorText(one, id)).join(",");
}

/** A bare root selector owns custom properties evaluated on html itself. */
function hasBareRootSelector(selectorText) {
  return splitSelectors(selectorText).some((selector) => {
    const trimmed = selector.trim();
    return trimmed === ":root" || trimmed === "html";
  });
}

/** Per-theme root declarations that must instead take effect from body. */
function rootBodyTokens(block) {
  const tokens = new Map();
  for (const match of stripComments(block).matchAll(/(?:^|[;{])\s*(--[\w-]+)\s*:\s*([^;}]*)/gm)) {
    const tokenName = match[1];
    if (tokenName !== undefined && ROOT_BODY_TOKEN.test(tokenName)) {
      tokens.set(tokenName, /!\s*important\s*$/i.test(match[2] ?? ""));
    }
  }
  return [...tokens].map(([tokenName, important]) => ({ name: tokenName, important }));
}

/**
 * Normalize one cloned root declaration for the body clone.
 *
 * Every custom property declared on a bare root selector is cloned, not just
 * the official alias family: a skin's own private tokens (`--cl-serif`,
 * `--dsh-scrollbar-thumb`) are consumed by its body-level rules too, so they
 * must be present where those rules evaluate. `ROOT_BODY_TOKEN` only decides
 * whether `!important` is stripped — forcing it off lets the skin's own dark
 * body rule override its light root value.
 *
 * `background-color` / `background-image` ride along so the page canvas is the
 * skin's; every other normal property stays on the scope and inherits down.
 */
function bodyCloneProperty(line) {
  const custom = line.match(/^(--[\w-]+)\s*:/);
  if (custom !== null) {
    const tokenName = custom[1] ?? "";
    return ROOT_BODY_TOKEN.test(tokenName) ? line.replace(/\s*!important(?=\s*;?\s*$)/i, "") : line;
  }
  return /^background-(color|image)\s*:/.test(line) ? line : null;
}

/** Index just past the string literal starting at `i`. */
function skipString(css, i, end) {
  const quote = css[i];
  i++;
  while (i < end) {
    const ch = css[i];
    if (ch === "\\") {
      i += 2;
      continue;
    }
    if (ch === quote) return i + 1;
    i++;
  }
  return end;
}

/** The matching `}` for the block opening at `openBrace`, or -1. */
export function findCloseBrace(css, openBrace, end) {
  let depth = 0;
  let quote = null;
  let comment = false;
  for (let i = openBrace; i < end; i++) {
    const ch = css[i];
    const next = css[i + 1];
    if (comment) {
      if (ch === "*" && next === "/") {
        comment = false;
        i++;
      }
      continue;
    }
    if (quote !== null) {
      if (ch === "\\") i++;
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "/" && next === "*") {
      comment = true;
      i++;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * How much of a prelude is leading trivia (whitespace and comments) rather than
 * the at-keyword or selector itself.
 *
 * This must skip comments as well as whitespace: a rule preceded by a header
 * comment would otherwise look like a selector whose text starts with `/`, and
 * an `@font-face` after a comment would be scoped as if it were a selector.
 */
export function leadingTriviaLength(prelude) {
  let i = 0;
  while (i < prelude.length) {
    const ch = prelude[i];
    if (ch === " " || ch === "\t" || ch === "\n" || ch === "\r" || ch === "\f") {
      i++;
      continue;
    }
    if (ch === "/" && prelude[i + 1] === "*") {
      const close = prelude.indexOf("*/", i + 2);
      if (close === -1) break;
      i = close + 2;
      continue;
    }
    break;
  }
  return i;
}

/**
 * The reset-and-clone pair a bare root block needs (see the module doc).
 *
 * Reset the root-declared alias tokens on the scope so a light value on html
 * cannot be inherited while the dark variant belongs on body, then clone the
 * same declarations onto body where the official theme also declares them.
 */
function rootExtras(block, id) {
  const scope = scopeSelector(id);
  let out = "";
  const tokens = rootBodyTokens(block);
  if (tokens.length > 0) {
    const body = tokens.map(({ name: tokenName, important }) => `${tokenName}: initial${important ? " !important" : ""};`).join("\n  ");
    out += `\n${scope} {\n  ${body}\n}\n`;
  }
  const props = stripComments(block.slice(1, -1))
    .split("\n")
    .map((line) => bodyCloneProperty(line.trim()))
    .filter((line) => line !== null);
  if (props.length > 0) {
    out += `\n${scope} body {\n  ${props.join("\n  ")}\n}\n`;
  }
  return out;
}

/**
 * Rewrite every style rule in one region of a stylesheet, recursing through
 * conditional at-rule blocks and passing `@font-face` / `@keyframes` blocks
 * through verbatim (their contents are descriptors and keyframe selectors, not
 * element selectors).
 */
function transformRegion(css, start, end, id) {
  let out = "";
  let segStart = start;
  let i = start;
  while (i < end) {
    const ch = css[i];
    if (ch === "/" && css[i + 1] === "*") {
      const close = css.indexOf("*/", i + 2);
      i = close === -1 || close + 2 > end ? end : close + 2;
      continue;
    }
    if (ch === '"' || ch === "'") {
      i = skipString(css, i, end);
      continue;
    }
    if (ch === ";") {
      // A statement at-rule (`@import …;` and friends): pass it through and
      // keep it out of the next rule's prelude.
      out += css.slice(segStart, i + 1);
      segStart = i + 1;
      i++;
      continue;
    }
    if (ch === "{") {
      const openBrace = i;
      const close = findCloseBrace(css, openBrace, end);
      const prelude = css.slice(segStart, openBrace);
      const blockText = css.slice(openBrace, close === -1 ? end : close + 1);
      const lead = leadingTriviaLength(prelude);
      const trivia = prelude.slice(0, lead);
      const head = prelude.slice(lead);
      const name = head.startsWith("@") ? (/^@([-a-zA-Z][-a-zA-Z0-9]*)/.exec(head)?.[1]?.toLowerCase() ?? "") : null;

      if (name === null) {
        const selectorText = head.includes("/*") ? stripComments(head) : head;
        out += trivia + scopeSelectorList(selectorText, id) + blockText;
        if (close !== -1 && hasBareRootSelector(selectorText)) out += rootExtras(blockText, id);
      } else if (NESTED_AT_RULES.has(name)) {
        const inner = transformRegion(css, openBrace + 1, close === -1 ? end : close, id);
        out += prelude + "{" + inner + (close === -1 ? "" : "}");
      } else {
        out += prelude + blockText;
      }

      i = close === -1 ? end : close + 1;
      segStart = i;
      continue;
    }
    i++;
  }
  out += css.slice(segStart, end);
  return out;
}

/**
 * Force-scope every selector, move the light palette onto body, and append the
 * two tail rules the skin center always appends (transparent mount root, the
 * code-block background token).
 *
 * @param css - one authored stylesheet, verbatim.
 * @param id - the skin id whose scope the selectors land under.
 * @param options - `deriveFallbacks` completes the official tokens the skin
 *   left undeclared; the skin center enables it for `skin.css` only, and the
 *   default matches that.
 * @returns the transformed stylesheet.
 */
export function transformSkinCss(css, id, options = {}) {
  const scope = scopeSelector(id);
  const defined = collectDefinedTokens(css);
  let out = transformRegion(css, 0, css.length, id);
  out += `\n${scope} [id="root"] { background: transparent; }\n`;
  out += `\n${scope} body { --shiki-background: var(--dsw-alias-markdown-code-block); }\n`;
  if (options.deriveFallbacks === true) {
    const fallbacks = [...deriveFallbackTokens(defined), ...derivePrimaryActionFallbacks(defined)];
    if (fallbacks.length > 0) out += `\n${scope} body {\n  ${fallbacks.join("\n  ")}\n}\n`;
  }
  return out;
}

/* --------------------------------------------------------------------------
 * Fallback derivation
 *
 * A skin declares the tokens it restyles; the official shell declares the
 * other ~300. Where the shell's chain would leave a token derived from a value
 * the skin replaced, the skin center completes it explicitly instead — most
 * visibly for primary buttons, whose hover and foreground do not follow the
 * brand token. Ported from `@linxin666/dsh-client-ui-skin-center` so a skin
 * renders there and here the same way.
 * ----------------------------------------------------------------------- */

/** Every custom property the stylesheet declares, in any block. */
function collectDefinedTokens(css) {
  const defined = new Set();
  for (const match of stripComments(css).matchAll(/(--[\w-]+)\s*:/g)) {
    if (match[1] !== undefined) defined.add(match[1]);
  }
  return defined;
}

/** Token families the derivation deliberately leaves to the shell. */
const EXCLUDED = /(^|-)(mask|shadow|button|state|error|warning|success|danger|info|caution|brand|scrollbar|foreground|inverted|dimmed)(-|$)|-font-|linear-|ease|duration|transition/;

/** Matched in order; the first group whose pattern hits wins. */
const GROUPS = [
  { skip: /-bg-/, anchors: ["--dsw-alias-bg-layer-1", "--dsw-alias-bg-base"], alpha: 65 },
  { skip: /-label-/, anchors: ["--dsw-alias-label-primary"], alpha: 70 },
  { skip: /-border-/, anchors: ["--dsw-alias-border-l2", "--dsw-alias-border-l1"], alpha: 55 },
  { skip: /-interactive-/, anchors: ["--dsw-alias-bg-layer-1"], alpha: 50 },
  { skip: /-specific-/, anchors: ["--dsw-alias-bg-layer-1", "--dsw-alias-bg-base"], alpha: 60 },
];

function groupFor(token) {
  if (EXCLUDED.test(token)) return null;
  for (const group of GROUPS) if (group.skip.test(token)) return group;
  return null;
}

/** Derive the official tokens the skin does not define, from anchors it does. */
function deriveFallbackTokens(defined) {
  const out = [];
  for (const token of OFFICIAL_TOKENS) {
    if (defined.has(token)) continue;
    const group = groupFor(token);
    if (group === null) continue;
    const anchor = group.anchors.find((candidate) => defined.has(candidate));
    if (anchor === undefined) continue;
    out.push(`${token}: color-mix(in srgb, var(${anchor}) ${group.alpha}%, transparent);`);
  }
  return out;
}

/**
 * Complete the primary-action set: filled primary buttons render from one
 * matched trio (fill, hover, foreground). The shell wires the fill to the
 * brand, but hover and foreground do not follow it and would snap to the
 * static shell values, so a skin that remaps its brand gets an incoherent CTA
 * unless the set is completed here.
 */
const PRIMARY_ACTION_FILL = "--dsw-alias-button-primary-fill";
const PRIMARY_ACTION_HOVER = "--dsw-alias-button-primary-hover";
const PRIMARY_ACTION_DIMMED = "--dsw-alias-button-primary-dimmed";
const PRIMARY_ACTION_FOREGROUND = "--dsw-alias-label-primary-foreground";
const PRIMARY_ACTION_BRAND = "--dsw-alias-brand-primary";
const PRIMARY_ACTION_BRAND_INVERT = "--dsw-alias-brand-primary-invert";

function derivePrimaryActionFallbacks(defined) {
  const out = [];
  const hasBrand = defined.has(PRIMARY_ACTION_BRAND);
  const branded = hasBrand || defined.has(PRIMARY_ACTION_FILL);
  if (!hasBrand && !defined.has(PRIMARY_ACTION_FILL)) return out;
  if (!defined.has(PRIMARY_ACTION_FILL) && hasBrand) out.push(`${PRIMARY_ACTION_FILL}: var(${PRIMARY_ACTION_BRAND});`);
  if (branded && !defined.has(PRIMARY_ACTION_HOVER)) {
    out.push(`${PRIMARY_ACTION_HOVER}: color-mix(in srgb, var(${PRIMARY_ACTION_FILL}) 82%, var(--dsw-alias-bg-layer-1));`);
  }
  if (branded && !defined.has(PRIMARY_ACTION_DIMMED)) {
    out.push(`${PRIMARY_ACTION_DIMMED}: color-mix(in srgb, var(${PRIMARY_ACTION_FILL}) 60%, var(--dsw-alias-bg-layer-1));`);
  }
  if (!defined.has(PRIMARY_ACTION_FOREGROUND) && hasBrand && defined.has(PRIMARY_ACTION_BRAND_INVERT)) {
    out.push(`${PRIMARY_ACTION_FOREGROUND}: var(${PRIMARY_ACTION_BRAND_INVERT});`);
  }
  return out;
}

/** A relative, in-directory asset reference — never a data:, remote or absolute URL. */
export function isRelativeAsset(target) {
  const t = target.trim();
  if (t === "" || t.startsWith("#")) return false;
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return false;
  if (t.startsWith("//") || t.startsWith("/")) return false;
  if (t.split(/[\\/]/).includes("..")) return false;
  return true;
}

/**
 * Point a stylesheet's relative asset references at the given route.
 *
 * A skin says `url(assets/fonts/x.woff2)` because the skin center serves it
 * from its own asset root, where that relative URL resolves. Inlined into the
 * page it would resolve against the document root instead, so each reference
 * becomes an absolute, same-origin route.
 */
export function rewriteAssetUrls(css, route) {
  return css.replace(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g, (match, _quote, target) =>
    isRelativeAsset(target) ? `url(${route}?path=${encodeURIComponent(target.trim())})` : match,
  );
}

/** Stamp or replace `data-dsh-skin` on the `<html>` tag. */
const HTML_TAG = /<html(\s[^>]*)?>/i;
export function stampSkinAttribute(html, id) {
  if (typeof id !== "string" || id === "") return html;
  return html.replace(HTML_TAG, (match, attrs) => {
    const rest = attrs ?? "";
    if (/\sdata-dsh-skin=/.test(rest)) {
      return match.replace(/\sdata-dsh-skin=("[^"]*"|'[^']*'|[^\s>]+)/, ` data-dsh-skin="${id}"`);
    }
    return `<html${rest} data-dsh-skin="${id}">`;
  });
}
