/**
 * End-to-end assembly check: run the plugin's real `apply` against a stub host
 * context, then render the way the host does and assert the served document
 * carries both the scoped stylesheet and the `<html>` attribute.
 *
 * This is the check the original bug would have failed: the stylesheet alone,
 * or the attribute alone, leaves the page looking untouched.
 */

import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { apply, seedBundledSkin } from "../lib/index.js";
import { rewriteAssetUrls, transformSkinCss } from "../lib/css-contract.js";

/**
 * `apply` seeds the repository's skin into `$DSH_HOME/skins`, so these tests must not
 * run against the real home directory: a test run would write to the machine's
 * actual installation. Pointing `DSH_HOME` at a throwaway directory both keeps
 * the tests inert and makes them exercise the real first-install path — an empty
 * home, the skin seeded, and a styled page coming out the other end.
 */
const TEST_HOME = mkdtempSync(join(tmpdir(), "dsh-skin-test-"));
process.env.DSH_HOME = TEST_HOME;

// The state file has to exist for the "active skin" assertion below to mean
// anything: without it the plugin falls back to its default id, and the test
// would pass whether or not it read the stored selection.
mkdirSync(join(TEST_HOME, "skins"), { recursive: true });
writeFileSync(join(TEST_HOME, "claude-skin.json"), JSON.stringify({ active: "claude" }), "utf8");

process.on("exit", () => {
  try {
    rmSync(TEST_HOME, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
});

/**
 * The real document the web server hands to renderIndex. Resolved from the DSH
 * installation rather than a relative walk, so the test does not depend on how
 * deep this checkout sits.
 */
const RAW_INDEX = (() => {
  const candidates = [
    process.env.DSH_WEB_INDEX,
    "/usr/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-web-frontend/dist/index.html",
  ].filter(Boolean);
  for (const file of candidates) {
    if (existsSync(file)) return readFileSync(file, "utf8");
  }
  return null;
})();

/** A minimal stand-in: the real document when present, a faithful one otherwise. */
const INDEX = RAW_INDEX ?? [
  "<!doctype html>",
  '<html lang="en">',
  "  <head>",
  '    <meta charset="utf-8" />',
  "    <title>DeepSeek Harness</title>",
  '    <script type="module" crossorigin src="./assets/index.js"></script>',
  '    <link rel="stylesheet" crossorigin href="./assets/vendor.css">',
  '    <link rel="stylesheet" crossorigin href="./assets/index.css">',
  "  </head>",
  "  <body>",
  '    <div id="root"></div>',
  "  </body>",
  "</html>",
].join("\n");

/** A host context that records what the plugin registers. */
function fakeCtx() {
  const routes = [];
  const taps = [];
  const listeners = new Map();
  return {
    routes,
    taps,
    listeners,
    effect(fn, label) {
      const dispose = fn();
      return () => {
        if (typeof dispose === "function") dispose();
        void label;
      };
    },
    connection: {
      fetch: {
        register(route) {
          routes.push(route);
          return () => {};
        },
      },
    },
    webServer: {
      tapIndex(transform) {
        taps.push(transform);
        return () => {};
      },
    },
    on(event, handler) {
      if (!listeners.has(event)) listeners.set(event, []);
      listeners.get(event).push(handler);
      return () => {};
    },
  };
}

/** Collect the rows the plugin contributes, then render them as the host does. */
function rendered(html, rows) {
  let head = "";
  for (const row of rows) {
    if (row.kind === "style") head += `<style>${row.text}</style>`;
    else throw new Error(`unexpected row kind ${row.kind}`);
  }
  return html.replace(/(<head(?:\s[^>]*)?>)/i, `$1${head}`);
}

test("apply registers the routes, an html tap and the injection listener", () => {
  const ctx = fakeCtx();
  apply(ctx);

  assert.deepEqual(
    ctx.routes.map((r) => [r.path, r.methods.join(",")]).sort(),
    [
      ["/api/dsh-claude-skin/active", "POST"],
      ["/api/dsh-claude-skin/asset", "GET"],
      ["/api/dsh-claude-skin/skins", "GET"],
      ["/api/dsh-claude-skin/stylesheet", "GET"],
    ],
  );
  assert.equal(ctx.taps.length, 1, "the <html> attribute needs exactly one index tap");
  assert.equal((ctx.listeners.get("webserver/index-inject") || []).length, 1);
});

test("the stylesheet route serves the same scoped sheet the injection row does", async () => {
  // The desktop host drops the tap, so the client half rebuilds the attribute
  // from this route's text. That only works if the route hands out exactly the
  // bytes the injection row would have — otherwise the two paths diverge.
  const ctx = fakeCtx();
  apply(ctx);

  const rows = [];
  for (const handler of ctx.listeners.get("webserver/index-inject") || []) handler(rows);
  assert.equal(rows.length, 1, "the injection table must carry exactly one style row");

  const route = ctx.routes.find((r) => r.path === "/api/dsh-claude-skin/stylesheet");
  assert.ok(route, "the stylesheet route must be registered");
  const response = await route.fetch(new Request("http://localhost" + route.path));
  const css = await response.text();

  assert.equal(response.status, 200);
  assert.equal(css, rows[0].text, "route text and injected row must be identical");
  assert.ok(css.includes(`html[data-dsh-skin="${activeId()}"] body`), "the served sheet is scoped");
  assert.ok(!css.includes("</style"), "the served sheet must not carry a closing style tag");
});

function activeId() {
  return JSON.parse(readFileSync(join(TEST_HOME, "claude-skin.json"), "utf8")).active;
}

test("the served document carries both the scoped stylesheet and the attribute", () => {
  const ctx = fakeCtx();
  apply(ctx);

  const rows = [];
  for (const handler of ctx.listeners.get("webserver/index-inject") || []) handler(rows);

  const withRows = rendered(INDEX, rows);
  const served = ctx.taps.reduce((html, tap) => tap(html), withRows);

  // The attribute the scoped selectors hang off.
  assert.match(served, /<html[^>]*\sdata-dsh-skin="[a-z0-9-]+"/, "the <html> tag must carry the active skin id");

  // The stylesheet, scoped to that same id.
  const id = /data-dsh-skin="([a-z0-9-]+)"/.exec(served)[1];
  assert.ok(served.includes(`<style>`), "a stylesheet must be injected");
  assert.ok(
    served.includes(`html[data-dsh-skin="${id}"] body`),
    "the light palette must be present as a body descendant of the scope",
  );

  // The official theme's own token block must not be the last word: the skin's
  // body clone has to appear inside the head.
  const skinRule = served.indexOf(`html[data-dsh-skin="${id}"] body {`);
  assert.ok(skinRule !== -1);
  assert.ok(!served.slice(0, skinRule).includes("</head>"), "the stylesheet must land inside <head>");

  // A root selector surviving unscoped means the transform was skipped.
  const styleText = /<style>([\s\S]*?)<\/style>/.exec(served)[1];
  const withoutScope = styleText.split(`html[data-dsh-skin="${id}"]`).join("");
  assert.ok(!/(^|[\n}])\s*:root\s*[,{]/.test(withoutScope), "no bare :root selector may reach the page");

  // The injected style must not terminate its own element.
  assert.ok(!styleText.includes("</style"), "the stylesheet must not contain a closing style tag");
});

test("relative asset urls are rewritten to the asset route", () => {
  // Seeded from the repository in the first test, so this reads the
  // throwaway home rather than whatever this machine happens to have installed.
  const sheet = join(TEST_HOME, "skins", "claude", "skin.css");
  if (!existsSync(sheet)) return; // the repository skin is absent from this checkout

  const css = readFileSync(sheet, "utf8");
  assert.ok(css.includes("url(assets/fonts/"), "fixture assumption: the claude skin has relative assets");

  const served = transformSkinCss(rewriteAssetUrls(css, "/api/dsh-claude-skin/asset"), "claude");
  assert.ok(
    served.includes("/api/dsh-claude-skin/asset?path=assets%2Ffonts%2F"),
    "relative asset urls must be rewritten to the asset route",
  );
  assert.ok(!served.includes("url(assets/"), "no document-root-relative url may survive");
});

test("a skin switch changes both the stamped id and the scoped stylesheet", async () => {
  const { transformSkinCss: transform, stampSkinAttribute: stamp } = await import("../lib/css-contract.js");
  const a = stamp('<html lang="en">', "claude");
  const b = stamp('<html lang="en">', "miku");
  assert.ok(a.includes('data-dsh-skin="claude"'));
  assert.ok(b.includes('data-dsh-skin="miku"'));
  assert.ok(transform(":root{--dsw-alias-bg-base:#faf9f5}", "claude").includes('html[data-dsh-skin="claude"] body'));
  assert.ok(transform(":root{--dsw-alias-bg-base:#39c5bb}", "miku").includes('html[data-dsh-skin="miku"] body'));
});

test("the active skin's id is the one stamped and scoped", () => {
  const active = JSON.parse(readFileSync(join(TEST_HOME, "claude-skin.json"), "utf8")).active;

  const ctx = fakeCtx();
  apply(ctx);
  const rows = [];
  for (const handler of ctx.listeners.get("webserver/index-inject") || []) handler(rows);
  const served = ctx.taps.reduce((html, tap) => tap(html), rendered(INDEX, rows));

  assert.ok(
    served.includes(`data-dsh-skin="${active}"`),
    `the stamped id must match the stored active skin "${active}"`,
  );
  assert.ok(served.includes(`html[data-dsh-skin="${active}"]`), "and the stylesheet must be scoped to it");
});

test("activation seeds the repository skin into an empty home", () => {
  // A fresh home is the first-install case: the plugin should make its own skin
  // available without the user copying anything.
  const home = mkdtempSync(join(tmpdir(), "dsh-skin-seed-"));

  const seeded = seedBundledSkin(join(home, "skins"));
  assert.ok(seeded !== null, "the repository skin must be present in this checkout");

  for (const rel of ["skin.json", "skin.css", "patches.css", "assets/fonts/inter-normal.woff2"]) {
    assert.ok(existsSync(join(seeded, rel)), `${rel} must be seeded`);
  }

  // The seeded manifest must not advertise previews the seed does not carry.
  const manifest = JSON.parse(readFileSync(join(seeded, "skin.json"), "utf8"));
  assert.equal(manifest.preview, undefined, "the seeded manifest must not name absent preview images");
  assert.equal(manifest.id, "claude");

  rmSync(home, { recursive: true, force: true });
});

test("seeding never overwrites a file the user already has", () => {
  // The whole safety argument for running this on every activation: an existing
  // skin is the user's, and a plugin update must not stomp on it.
  const home = mkdtempSync(join(tmpdir(), "dsh-skin-keep-"));
  const target = join(home, "skins", "claude");
  mkdirSync(target, { recursive: true });
  writeFileSync(join(target, "skin.css"), "/* hand-edited */", "utf8");

  const seeded = seedBundledSkin(join(home, "skins"));
  assert.ok(seeded !== null);
  assert.equal(readFileSync(join(target, "skin.css"), "utf8"), "/* hand-edited */");

  // ...while files that were missing are still filled in.
  assert.ok(existsSync(join(target, "patches.css")), "absent files are still added");

  rmSync(home, { recursive: true, force: true });
});
