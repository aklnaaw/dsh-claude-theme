/**
 * Contract tests for the skin stylesheet pipeline and the html attribute
 * stamp.
 *
 * Run from the repository root:
 *   node --test plugins/skin/test/
 *
 * These assert the properties that broke the page, not the implementation
 * shape: a scoped selector outranks the official `body{…}` token block, the
 * light palette reaches body, the attribute lands on <html>, and the transform
 * does not corrupt the sheets it passes through.
 *
 * The strongest guard — byte-equality with the skin center's own transform over
 * every installed skin — lives in `scripts/compare-with-skin-center.mjs`,
 * because it needs that package present.
 */

import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import {
  isRelativeAsset,
  rewriteAssetUrls,
  stampSkinAttribute,
  transformSkinCss,
} from "../lib/css-contract.js";

const ID = "claude";
const SCOPE = `html[data-dsh-skin="${ID}"]`;
/** Escape the scope for use inside a RegExp: the brackets are literal. */
const re = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("a skin's :root block is scoped and its light tokens are cloned onto body", () => {
  const out = transformSkinCss(":root {\n  --dsw-alias-bg-base: #faf9f5;\n}", ID);
  // The scope resets the token so nothing inherits the light value onto html…
  assert.match(out, new RegExp(`${re(SCOPE)} \\{\\s*\\n\\s*--dsw-alias-bg-base: initial;`));
  // …and body carries the value itself, where the official theme declares it.
  assert.match(out, new RegExp(`${re(SCOPE)} body \\{\\s*\\n\\s*--dsw-alias-bg-base: #faf9f5;`));
});

test("the scoped body rule outranks the official body token block", () => {
  // The official theme declares --dsw-alias-* on `body{…}`, which beats a value
  // inherited from `:root` regardless of order. The clone must therefore be an
  // attribute-qualified body rule, not a root one.
  const out = transformSkinCss(":root { --dsw-alias-bg-base: #faf9f5; }", ID);
  const rule = `${SCOPE} body {\n  --dsw-alias-bg-base: #faf9f5;`;
  assert.ok(out.includes(rule), "expected an attribute-qualified body clone");
});

test("private tokens are cloned to body so body-level rules can consume them", () => {
  const out = transformSkinCss(":root {\n  --cl-serif: 'Newsreader', serif;\n  --dsh-scrollbar-thumb: #333;\n}", ID);
  assert.ok(out.includes("--cl-serif: 'Newsreader', serif;"));
  assert.ok(out.includes("--dsh-scrollbar-thumb: #333;"));
});

test("!important is stripped only from the official token families", () => {
  const out = transformSkinCss(
    ":root {\n  --dsw-alias-bg-base: #fff !important;\n  --cl-serif: a !important;\n}",
    ID,
  );
  assert.ok(out.includes("--dsw-alias-bg-base: #fff;"), "alias clone must drop !important so dark can override");
  assert.ok(out.includes("--cl-serif: a !important;"), "unrelated tokens keep their own !important");
});

test("a dark body rule survives as a descendant of the scope", () => {
  const out = transformSkinCss("body[data-ds-dark-theme] {\n  --dsw-alias-bg-base: #181715;\n}", ID);
  assert.ok(out.includes(`${SCOPE} body[data-ds-dark-theme] {`), out.slice(0, 200));
});

test("an official [data-ds-*] head becomes a body descendant, not a root one", () => {
  // The dark-theme attribute lives on body, so anchoring it to the scope
  // directly would match nothing.
  const out = transformSkinCss('[data-ds-dark-theme] { --dsw-alias-bg-base: #000; }', ID);
  assert.ok(out.includes(`${SCOPE} body[data-ds-dark-theme] {`), out.slice(0, 200));
});

test("an @font-face after a header comment is not treated as a selector", () => {
  const css = "/* fonts ---- */\n@font-face{font-family:'Inter';src:url(assets/fonts/inter-normal.woff2) format('woff2')}";
  const out = transformSkinCss(css, ID);
  assert.ok(out.includes("@font-face{"), "@font-face must survive verbatim");
  assert.ok(!out.includes(`${SCOPE} @font-face`), "@font-face must not be scoped");
  assert.ok(out.includes("/* fonts ---- */"), "the leading comment is preserved in place");
});

test("@keyframes contents are left alone", () => {
  const out = transformSkinCss("@keyframes spin { from { transform: rotate(0) } to { transform: rotate(1turn) } }", ID);
  assert.ok(out.includes("@keyframes spin {"));
  assert.ok(!out.includes(`${SCOPE} from`), "keyframe selectors are not element selectors");
});

test("@media contents are scoped, the at-rule is not", () => {
  const out = transformSkinCss("@media (prefers-reduced-motion: reduce) { .x { animation: none } }", ID);
  assert.ok(!out.includes(`${SCOPE} @media`), "the at-rule itself must not be scoped");
  assert.ok(out.includes(`${SCOPE} .x`), "rules inside must be scoped");
});

test("every selector in a list is scoped, not just the first", () => {
  const out = transformSkinCss("button, a { color: red }", ID);
  assert.ok(out.includes(`${SCOPE} button`), out.slice(0, 200));
  assert.ok(out.includes(`${SCOPE} a {`), out.slice(0, 200));
});

test(":is() commas do not split a selector", () => {
  const out = transformSkinCss(":is(h1, h2) { color: red }", ID);
  assert.ok(out.includes(`${SCOPE} :is(h1, h2)`), out.slice(0, 200));
});

test("a stylesheet whose selectors are all root-ish still scopes every rule", () => {
  const out = transformSkinCss(":root, html { --dsw-alias-brand-primary: #d97757; }", ID);
  const withoutScope = out.split(SCOPE).join("");
  assert.ok(!/(^|[\n}])\s*(:root|html)\s*[,{]/.test(withoutScope), "no bare :root/html selector may survive");
  assert.ok(out.includes(`${SCOPE} body`), "the light palette still reaches body");
});

test("relative assets are rewritten to the asset route, others are untouched", () => {
  const route = "/api/dsh-claude-skin/asset";
  const out = rewriteAssetUrls(
    "src:url(assets/fonts/a.woff2) format('woff2'),url('assets/b.webp'),url(data:image/png;base64,AAA),url(https://x/y.png),url(#grad)",
    route,
  );
  assert.ok(out.includes(`url(${route}?path=assets%2Ffonts%2Fa.woff2)`));
  assert.ok(out.includes(`url(${route}?path=assets%2Fb.webp)`));
  assert.ok(out.includes("url(data:image/png;base64,AAA)"), "data: URLs must not be rewritten");
  assert.ok(out.includes("url(https://x/y.png)"), "remote URLs must not be rewritten");
  assert.ok(out.includes("url(#grad)"), "fragment refs must not be rewritten");
});

test("asset paths that escape the skin directory are refused", () => {
  assert.equal(isRelativeAsset("../secret"), false);
  assert.equal(isRelativeAsset("/etc/passwd"), false);
  assert.equal(isRelativeAsset("//evil/x"), false);
  assert.equal(isRelativeAsset("http://evil/x"), false);
  assert.equal(isRelativeAsset("data:image/png;base64,AA"), false);
  assert.equal(isRelativeAsset("assets/ok.webp"), true);
});

test("the skin attribute is stamped on <html>", () => {
  assert.equal(
    stampSkinAttribute('<!doctype html>\n<html lang="en">\n<head>', ID),
    `<!doctype html>\n<html lang="en" data-dsh-skin="${ID}">\n<head>`,
  );
});

test("the skin attribute is replaced, not duplicated", () => {
  const once = stampSkinAttribute('<html lang="en" data-dsh-skin="old">', ID);
  assert.equal(once, `<html lang="en" data-dsh-skin="${ID}">`);
  const twice = stampSkinAttribute(once, "miku");
  assert.equal(twice, '<html lang="en" data-dsh-skin="miku">');
  assert.equal((twice.match(/data-dsh-skin=/g) || []).length, 1);
});

test("an html with no <html> tag is returned unchanged", () => {
  assert.equal(stampSkinAttribute("<body>x</body>", ID), "<body>x</body>");
});

test("the installed claude skin keeps its font faces and dark block", () => {
  const file = join(homedir(), ".dsh", "skins", "claude", "skin.css");
  let css;
  try {
    css = readFileSync(file, "utf8");
  } catch {
    return; // skin not installed on this machine
  }
  const out = transformSkinCss(css, ID, { deriveFallbacks: true });
  assert.equal((out.match(/@font-face/g) || []).length, (css.match(/@font-face/g) || []).length);
  assert.ok(out.includes(`${SCOPE} body[data-ds-dark-theme]`), "the dark block must survive scoped");
  assert.ok(out.includes("--dsw-alias-bg-base: #faf9f5;"), "the light canvas must reach body");
  const withoutScope = out.split(SCOPE).join("");
  assert.ok(!/(^|[\n}])\s*(:root|html)\s*[,{]/.test(withoutScope), "no unscoped root selector may survive");
});
