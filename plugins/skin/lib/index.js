/**
 * Server half of dsh-claude-skin.
 *
 * WHY THIS EXISTS: the Claude skin used to load through the skin-center
 * plugin, which also owns the skin catalog, the background controls, the
 * market integration and a large settings surface. This profile wants the skin
 * without that bundle. A skin is a pure asset directory — a stylesheet plus its
 * assets — so the whole job is: put the stylesheet in the page, make the assets
 * fetchable, and let the user pick which installed directory is active.
 *
 * WHAT IT DOES
 *
 *   1. Reads the active skin's `skin.css` and `patches.css`.
 *   2. Runs each through the scoping contract in `./css-contract.js`, which is
 *      what makes an authored skin actually apply (see that module for why a
 *      verbatim inline does not work).
 *   3. Points their relative `url(assets/…)` references at the asset route,
 *      because an inlined stylesheet resolves them against the document root,
 *      where no such path exists.
 *   4. Contributes the result to the page as a `<style>` row through the
 *      official index-injection table, and stamps the matching attribute on
 *      `<html>` through `webServer.tapIndex`.
 *   5. Serves the skin's assets, lists the installed skins, and records which
 *      one is active.
 *
 * WHY THE OFFICIAL INDEX TABLE rather than a raw `tapIndex` transform for the
 * stylesheet: the same structured rows feed both the served page and a static
 * worker deployment, and the row type already covers a head `<style>` element.
 * `tapIndex` is used only for the one thing no row can express — an attribute
 * on the `<html>` tag itself, which the row renderer never touches.
 *
 * WHY ROUTES GO THROUGH `connection.fetch`: that carrier is the authenticated
 * `/api` surface, so these routes inherit the session check instead of being
 * reachable by anything that can open the port.
 *
 * WHY THE STYLESHEETS ARE TRANSFORMED SEPARATELY: the skin center serves
 * `skin.css` and `patches.css` as two responses, so each is scoped on its own.
 * The results concatenate in the same order, and the only cross-sheet effect
 * would be a bare-root block appearing in both — which the token reset is
 * idempotent for.
 */

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, extname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { rewriteAssetUrls, stampSkinAttribute, transformSkinCss } from "./css-contract.js";

export const name = "dsh-claude-skin";

/**
 * Both halves are hard dependencies, for different reasons: the routes live on
 * the authenticated fetch carrier, and the `<html>` stamp needs the web
 * server's index tap. Neither is optional, so activation waits for the pair.
 */
export const inject = ["connection", "webServer"];

const ROUTE_ASSET = "/api/dsh-claude-skin/asset";
const ROUTE_SKINS = "/api/dsh-claude-skin/skins";
const ROUTE_ACTIVE = "/api/dsh-claude-skin/active";

/** The skin shown when no state file names one. */
const FALLBACK_SKIN = "claude";
/** The stylesheets a v2 skin directory contributes, in cascade order. */
const SHEETS = ["skin.css", "patches.css"];

/**
 * What the asset route will hand back: everything a skin stylesheet may
 * reference, plus the preview art a catalog UI shows.
 */
const ASSET_MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
};

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), ".dsh");
}

/** The state file this plugin owns. */
function stateFile() {
  return join(dshHome(), "claude-skin.json");
}

function skinsRoot() {
  return join(dshHome(), "skins");
}

/**
 * The repository's `claude/` directory, resolved from this file's own location.
 *
 * The plugin is installed from the repository (`link:…/plugins/skin`), so the
 * skin it was built for is always sitting three levels up. Copying that
 * directly beats shipping a second copy inside the plugin: there is one source
 * of truth, and the plugin carries no duplicate assets.
 */
function repoSkinDir() {
  return resolve(fileURLToPath(new URL(".", import.meta.url)), "..", "..", "..", "claude");
}

/**
 * The files the loader reads, plus the font licences. The working tree also
 * holds the generators' inputs (`patches.base.css`, `crab.generated.css`,
 * `assets/fonts/build-fonts.sh`, …); copying those into the user's skins
 * directory would be noise, so the seed is this explicit subset.
 */
const SEED_FILES = [
  "skin.json",
  "skin.css",
  "patches.css",
  "LICENSE",
  "assets/fonts/newsreader-normal.woff2",
  "assets/fonts/newsreader-italic.woff2",
  "assets/fonts/inter-normal.woff2",
  "assets/fonts/jetbrains-mono-normal.woff2",
];

/**
 * Copy the repository's skin into `root`, on first activation.
 *
 * `force: false` is the whole contract: a file that is already there stays
 * exactly as the user left it (hand-edited, or a newer version), and only
 * genuinely absent files are written. That makes this safe to run on every
 * activation — it is idempotent, and it cannot clobber an installed skin.
 *
 * Returns the directory it seeded, or null when there is nothing to copy from
 * (e.g. the plugin was published to npm without the repository around it).
 *
 * @param root - Skins root; injected so tests never touch the real `$DSH_HOME`.
 */
export function seedBundledSkin(root = skinsRoot()) {
  const source = repoSkinDir();
  if (!existsSync(join(source, "skin.json"))) return null;

  const target = join(root, FALLBACK_SKIN);
  try {
    mkdirSync(root, { recursive: true });
    for (const rel of SEED_FILES) {
      const from = join(source, rel);
      if (!existsSync(from)) continue;
      const to = join(target, rel);
      mkdirSync(dirname(to), { recursive: true });
      cpSync(from, to, { force: false, errorOnExist: false });
      // A manifest that names preview images the seed does not carry would read
      // as a broken skin to anything scanning the directory.
      if (rel === "skin.json") {
        const manifest = JSON.parse(readFileSync(to, "utf8"));
        if (manifest.preview !== undefined) {
          delete manifest.preview;
          writeFileSync(to, JSON.stringify(manifest, null, 2) + "\n", "utf8");
        }
      }
    }
  } catch {
    // A read-only or otherwise unusable skins root must not stop the plugin
    // from loading; the user can still point at a skin installed some other way.
    return null;
  }
  return target;
}

/**
 * Which skin directory is active.
 *
 * Our own state file wins. `skin-center-active.json` is read as a fallback so a
 * profile that still has the skin center installed keeps one shared answer
 * rather than two that disagree. The last resort is a constant, because a skin
 * plugin with no skin is not a useful state to boot into.
 */
function activeSkin() {
  for (const file of [stateFile(), join(dshHome(), "skin-center-active.json")]) {
    try {
      const parsed = JSON.parse(readFileSync(file, "utf8"));
      if (parsed && typeof parsed.active === "string" && parsed.active) return parsed.active;
    } catch {
      /* absent or malformed; try the next source */
    }
  }
  return FALLBACK_SKIN;
}

/** One skin id is a plain directory name, never a path. */
function isSkinId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/.test(value);
}

function skinDir(id) {
  return join(skinsRoot(), id || activeSkin());
}

/** Every installed skin directory that carries a v2 manifest. */
function listSkins() {
  const root = skinsRoot();
  if (!existsSync(root)) return [];
  const out = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory() || !isSkinId(entry.name)) continue;
    const manifest = join(root, entry.name, "skin.json");
    if (!existsSync(manifest)) continue;
    let label = entry.name;
    try {
      const parsed = JSON.parse(readFileSync(manifest, "utf8"));
      if (parsed && typeof parsed.name === "string" && parsed.name) label = parsed.name;
    } catch {
      /* unreadable manifest: the directory name still identifies it */
    }
    out.push({ id: entry.name, label });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

/**
 * The complete, scoped stylesheet for the active skin, or null when there is
 * none.
 *
 * Read and transformed fresh on every index render: the injection table is
 * collected per request, so a stylesheet edit or a skin switch shows up on the
 * next document without touching the plugin or the host.
 */
function skinStylesheet() {
  const id = activeSkin();
  const dir = skinDir(id);
  const parts = [];
  for (const sheet of SHEETS) {
    const file = join(dir, sheet);
    try {
      if (existsSync(file)) {
        // The fallback derivation is a skin.css-only concern: it completes the
        // official tokens the skin left undeclared, and running it twice would
        // duplicate those rows.
        const body = transformSkinCss(rewriteAssetUrls(readFileSync(file, "utf8"), ROUTE_ASSET), id, {
          deriveFallbacks: sheet === "skin.css",
        });
        parts.push(body);
      }
    } catch {
      /* unreadable sheet: contribute what is readable rather than nothing */
    }
  }
  if (parts.length === 0) return null;
  return parts.join("\n");
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/** Validate a skin-relative asset path and return its absolute location. */
function assetFile(rel) {
  if (typeof rel !== "string" || rel === "") return null;
  const clean = rel.replace(/^\.\//, "");
  if (!clean.startsWith("assets/")) return null;
  if (clean.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) return null;
  const root = resolve(skinDir(), "assets");
  const file = resolve(skinDir(), clean);
  if (file !== root && !file.startsWith(root + sep)) return null;
  return file;
}

/** One asset binary, or a refusal. */
function serveAsset(rel) {
  const file = assetFile(rel);
  if (file === null) return new Response("bad path", { status: 400 });

  let body;
  try {
    body = readFileSync(file);
  } catch {
    return new Response("not found", { status: 404 });
  }
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(file).mtimeMs;
  } catch {
    /* no mtime: serve without a validator rather than fail */
  }

  return new Response(body, {
    status: 200,
    headers: {
      "content-type": ASSET_MIME[extname(file).toLowerCase()] || "application/octet-stream",
      // A switched skin serves different bytes from the same URL, and a
      // replaced asset keeps its name, so this must revalidate; the ETag keeps
      // the revalidation cheap.
      "cache-control": "no-cache",
      ...(mtimeMs ? { etag: `"${mtimeMs.toString(36)}-${body.length.toString(36)}"` } : {}),
    },
  });
}

/** Record the active skin. The page reloads itself to pick the change up. */
function setActiveSkin(id) {
  if (!isSkinId(id)) return json({ ok: false, error: "bad id" }, 400);
  if (!existsSync(join(skinDir(id), "skin.json"))) return json({ ok: false, error: "no such skin" }, 404);
  try {
    mkdirSync(dshHome(), { recursive: true });
    writeFileSync(stateFile(), JSON.stringify({ active: id }, null, 2) + "\n", "utf8");
  } catch (error) {
    return json({ ok: false, error: String((error && error.message) || error) }, 500);
  }
  return json({ ok: true, active: id });
}

async function handle(request) {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === ROUTE_ASSET) return serveAsset(url.searchParams.get("path"));
  if (url.pathname === ROUTE_SKINS) return json({ active: activeSkin(), skins: listSkins() });
  if (url.pathname === ROUTE_ACTIVE) {
    if (request.method !== "POST") return new Response("method not allowed", { status: 405 });
    let body = {};
    try {
      body = await request.json();
    } catch {
      return json({ ok: false, error: "bad body" }, 400);
    }
    return setActiveSkin(body && body.id);
  }

  return new Response("not found", { status: 404 });
}

/** @param ctx - Host plugin context carrying the fetch carrier and the web server. */
export function apply(ctx) {
  // Seed the skin the plugin ships with. Idempotent and non-destructive, so it
  // runs on every activation: a first install becomes usable with no manual
  // copy, and an existing skin is left untouched.
  ctx.effect(() => {
    seedBundledSkin();
  }, "dsh-claude-skin: seed bundled skin");

  for (const [path, methods, label] of [
    [ROUTE_ASSET, ["GET"], "asset"],
    [ROUTE_SKINS, ["GET"], "skins"],
    [ROUTE_ACTIVE, ["POST"], "active"],
  ]) {
    ctx.effect(
      () => ctx.connection.fetch.register({ path, methods, requestBody: "buffered", fetch: handle }),
      `dsh-claude-skin: ${label} route`,
    );
  }

  // The attribute the scoped selectors hang off. It lives on the <html> tag,
  // which no injection row can reach, so it goes through the index tap. It
  // reads the active skin fresh, so a switch lands on the next document.
  ctx.effect(
    () => ctx.webServer.tapIndex((html) => stampSkinAttribute(html, activeSkin())),
    "dsh-claude-skin: html attribute",
  );

  // The index-injection table is re-collected per render, so the stylesheet is
  // read and transformed fresh each time rather than captured at activation.
  ctx.on("webserver/index-inject", (table) => {
    const css = skinStylesheet();
    // A stylesheet containing the closing tag would end its own <style>
    // element early and spill the rest of the sheet into the document as
    // markup. The shipped sheets do not, and this refuses to guess if one
    // ever does.
    if (css === null || css.includes("</style")) return;
    table.push({ kind: "style", text: css });
  });
}
