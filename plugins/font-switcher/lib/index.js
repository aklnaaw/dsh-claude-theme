/**
 * Host half of dsh-font-switcher.
 *
 * Serves a manifest of the fonts a user has dropped into the skin's custom
 * folder, plus the font files themselves.
 *
 * WHY A HOST HALF AT ALL: browser JavaScript cannot enumerate a directory. The
 * client half has no way to discover what the user added, so the listing has to
 * happen on the filesystem.
 *
 * WHY THE FILES ARE ALSO SERVED HERE: a font only works if the browser can
 * fetch it, and a plugin-registered route is the supported way to do that from
 * a plugin. The skin asset route would work too, but it belongs to the skin
 * center; registering our own keeps this plugin honest about what it owns.
 */

import { mkdirSync, readdirSync, writeFileSync, existsSync, readFileSync, statSync } from "node:fs";
import { homedir, platform } from "node:os";
import { join, extname, basename } from "node:path";
import { spawn } from "node:child_process";

export const name = "dsh-font-switcher";

/** The host-side fetch registry, which is how the client reaches this half. */
export const inject = ["connection"];

const ROUTE_MANIFEST = "/api/dsh-font-switcher/manifest";
const ROUTE_FILE = "/api/dsh-font-switcher/file";
const ROUTE_REVEAL = "/api/dsh-font-switcher/reveal";

// Extensions a browser can load as a webfont.
const MIME = {
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
};

// Folders a user can use to say what a font is FOR. Files loose in the root
// are offered for every slot unless the file NAME says otherwise.
const SLOTS = ["serif", "sans", "mono"];

/**
 * Recognise a font's purpose from its file name.
 *
 * Naming a file is the fastest way to say what it is, and people reach for
 * different separators, so several shapes are accepted rather than one:
 *
 *   Inter-sans.woff2        suffix after a dash
 *   Inter_sans.woff2        suffix after an underscore
 *   Inter.sans.woff2        suffix after a dot
 *   Inter sans.woff2        suffix after a space
 *   sans-Inter.woff2        prefix before a dash
 *   [serif] Newsreader.woff2  bracketed tag anywhere
 *   InterSans.woff2         no separator at all
 *
 * Chinese and common synonyms are accepted too, because a font called
 * "思源宋体" should not have to be renamed in English to be usable:
 *
 *   serif: serif, song, 宋, 衬线, 明朝
 *   sans:  sans, hei, 黑, 无衬线, gothic
 *   mono:  mono, code, 等宽, 代码, 编程
 *
 * Returns "serif" | "sans" | "mono" | null.
 */
const PURPOSE_WORDS = {
  serif: ["serif", "song", "宋", "衬线", "明朝", "ming"],
  sans: ["sans", "hei", "黑", "无衬线", "gothic", "ui"],
  mono: ["mono", "code", "等宽", "代码", "编程", "fixed"],
};

function purposeOf(file) {
  // Strip the extension, then normalise every separator to a single space so
  // the shapes listed above collapse into "words separated by spaces".
  var stem = basename(file, extname(file))
    .replace(/[\[\](){}]/g, " ")
    .replace(/[._\-]+/g, " ")
    .toLowerCase();

  // Space-separated parts and, for the no-separator case, the whole stem.
  var parts = stem.split(/\s+/).filter(Boolean);

  for (var key in PURPOSE_WORDS) {
    var words = PURPOSE_WORDS[key];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (parts.indexOf(w) !== -1) return key;
      // No-separator names: a CJK word can sit anywhere in the stem, and a
      // latin one must at least be a distinct run so "Songti" does not match
      // "song" inside an unrelated word by accident... except that it should,
      // for names like "InterSans". CJK is checked as a substring because it
      // has no word boundaries; latin is checked against the stem too, which is
      // deliberate -- a false positive only means the font shows under an extra
      // heading, never that it becomes unusable.
      if (/[\u4e00-\u9fff]/.test(w) && stem.indexOf(w) !== -1) return key;
      if (stem.indexOf(w) !== -1) return key;
    }
  }
  return null;
}

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), ".dsh");
}

/** Which skin to scan. Read from the skin center, so no client round-trip is needed. */
function activeSkin() {
  try {
    const raw = JSON.parse(readFileSync(join(dshHome(), "skin-center-active.json"), "utf8"));
    if (raw && typeof raw.active === "string" && raw.active) return raw.active;
  } catch {
    /* absent or malformed */
  }
  return "claude";
}

/** Root of the drop folder for the active skin. */
function rootDir() {
  return join(dshHome(), "skins", activeSkin(), "assets", "fonts", "custom");
}

/** Font files directly inside one directory. */
function listIn(dir) {
  if (!existsSync(dir)) return [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const out = [];
  for (const e of entries) {
    if (!e.isFile() || e.name.startsWith(".")) continue;
    if (!(extname(e.name).toLowerCase() in MIME)) continue;
    out.push(e.name);
  }
  return out.sort();
}

/** A label from the file name; fonts carry no metadata we can rely on. */
function labelOf(file) {
  return basename(file, extname(file)).replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
}

function entry(dir, file) {
  return {
    file,
    label: labelOf(file),
    url: ROUTE_FILE + "?name=" + encodeURIComponent(file) + "&dir=" + encodeURIComponent(dir),
  };
}

function buildManifest() {
  const root = rootDir();
  for (const slot of SLOTS) {
    try {
      mkdirSync(join(root, slot), { recursive: true });
    } catch {
      /* read-only; listing just comes back empty */
    }
  }
  ensureReadme(root);

  // One flat list; the client groups it. Each font carries the purpose we
  // inferred and how, so the settings page can show why a file appears where
  // it does rather than leaving the user to guess.
  const fonts = [];

  // Loose files first. Their purpose comes from the file name, if it says.
  for (const file of listIn(root)) {
    const byName = purposeOf(file);
    fonts.push({
      ...entry(".", file),
      purpose: byName,          // null means "offer everywhere"
      source: byName ? "name" : null,
    });
  }

  // Files inside a role folder. The folder wins over the name: choosing a
  // folder is explicit, and a mismatch is worth reporting rather than obeying.
  for (const slot of SLOTS) {
    for (const file of listIn(join(root, slot))) {
      const byName = purposeOf(file);
      fonts.push({
        ...entry(slot, file),
        purpose: slot,
        source: byName && byName !== slot ? "folder-conflict" : "folder",
        namePurpose: byName,
      });
    }
  }

  // `canReveal` lets the settings page hide the open button entirely on hosts
  // with no desktop session (a headless server), instead of offering a control
  // that can only fail.
  return { skinId: activeSkin(), folder: root, fonts, canReveal: canReveal() };
}

/**
 * Open a folder in the desktop's file manager.
 *
 * Deliberately a subprocess rather than DSH's own native-open helper
 * (@deepseek-ai/dsh-native-command). That package resolves from inside the DSH
 * install, but a `link:`-installed plugin is loaded through a symlink, and Node
 * resolves a symlinked module from its REAL path -- the project directory,
 * which has no node_modules/@deepseek-ai. Importing it made the whole plugin
 * fail to load with ERR_MODULE_NOT_FOUND. Verified by loading the plugin from
 * the profile directory, which is where DSH loads it from.
 *
 * Spawning the platform's own opener has no such dependency.
 */
function openerFor(target) {
  switch (platform()) {
    case "darwin":
      return { cmd: "open", args: [target] };
    case "win32":
      // explorer.exe wants backslashes and returns a non-zero code even when it
      // succeeds, so the exit code is not treated as failure for this one.
      return { cmd: "explorer.exe", args: [target.replace(/\//g, "\\")], lenient: true };
    default:
      return { cmd: "xdg-open", args: [target] };
  }
}

/**
 * Whether a file manager is plausible on this host.
 *
 * A headless server has no DISPLAY and no opener; the settings page hides the
 * button when this is false rather than offering a control that can only fail.
 */
function canReveal() {
  if (platform() === "win32" || platform() === "darwin") return true;
  return Boolean(process.env.DISPLAY || process.env.WAYLAND_DISPLAY);
}

function revealFolder(dir) {
  return new Promise((resolve) => {
    const { cmd, args, lenient } = openerFor(dir);
    let child;
    try {
      // detached + stdio ignore: the opener is its own process and must outlive
      // this request. Piping would tie the file manager to the HTTP response.
      child = spawn(cmd, args, { detached: true, stdio: "ignore" });
    } catch (e) {
      resolve({ ok: false, reason: String((e && e.message) || e) });
      return;
    }

    let settled = false;
    const done = (r) => { if (!settled) { settled = true; resolve(r); } };

    child.on("error", (e) => done({ ok: false, reason: String((e && e.message) || e) }));
    child.on("spawn", () => {
      // The command started, which is all this needs to know: whether a window
      // appeared is the desktop's business, not ours.
      child.unref();
      done({ ok: true });
    });
    child.on("exit", (code) => {
      if (lenient || code === 0) done({ ok: true });
      else done({ ok: false, reason: cmd + " exited with " + code });
    });
  });
}

/** Leave a note so the drop folder explains itself. */
function ensureReadme(root) {
  const p = join(root, "README.txt");
  if (existsSync(p)) return;
  try {
    writeFileSync(
      p,
      [
        "字体放这里，然后在 设置 → 字体 里点「重新扫描」。",
        "Drop font files here, then reopen Settings -> Fonts.",
        "",
        "支持 / Supported: .woff2  .woff  .ttf  .otf",
        "",
        "用途有两种说法，任选其一 / Say what it is for, either way:",
        "",
        "  1. 放进子文件夹 / put it in a sub-folder",
        "       serif/   正文、标题        body text, headings",
        "       sans/    按钮、菜单、标签   buttons, menus, labels",
        "       mono/    代码             code",
        "",
        "  2. 写进文件名 / put it in the file name",
        "       这些写法都认 / all of these work:",
        "         Inter-sans.woff2      Inter_sans.woff2",
        "         Inter.sans.woff2      sans-Inter.woff2",
        "         [serif] Newsreader.woff2",
        "         InterSans.woff2       (no separator)",
        "       中文名也行 / CJK names work too:",
        "         思源宋体.woff2   黑体-sans.ttf   等宽字体.otf",
        "",
        "两种都没写，三个下拉里都会出现（归在「未识别用途」下）。",
        "Neither given? It still shows up under every dropdown, as unrecognised.",
        "",
        "下拉里显示的是文件名 / The dropdown shows the file name.",
        "",
      ].join("\n"),
      "utf8"
    );
  } catch {
    /* not fatal */
  }
}

/**
 * Answer the manifest, or one font file.
 *
 * `dir` and `name` are validated against the actual listing rather than being
 * joined blindly: a client-supplied path must never reach the filesystem, or
 * this route would read arbitrary files. Only names that are already known to
 * be font files in a known sub-folder are served.
 */
async function handle(request) {
  const url = new URL(request.url, "http://localhost");

  if (url.pathname === ROUTE_MANIFEST) {
    return new Response(JSON.stringify(buildManifest()), {
      status: 200,
      headers: { "content-type": "application/json", "cache-control": "no-store" },
    });
  }

  if (url.pathname === ROUTE_FILE) {
    const dir = url.searchParams.get("dir") || ".";
    const want = url.searchParams.get("name") || "";

    if (!SLOTS.includes(dir) && dir !== ".") {
      return new Response("bad dir", { status: 400 });
    }
    // The name must be one we would have listed ourselves.
    const allowed = listIn(dir === "." ? rootDir() : join(rootDir(), dir));
    if (!allowed.includes(want)) {
      return new Response("not found", { status: 404 });
    }

    const abs = join(dir === "." ? rootDir() : join(rootDir(), dir), want);
    const size = statSync(abs).size;
    return new Response(readFileSync(abs), {
      status: 200,
      headers: {
        "content-type": MIME[extname(want).toLowerCase()] || "application/octet-stream",
        "content-length": String(size),
        // Font files are immutable once dropped; let the browser keep them.
        "cache-control": "public, max-age=3600",
      },
    });
  }

  // Open the drop folder in the desktop's file manager.
  //
  // No path comes from the client: the folder is always the one this plugin
  // computed, so this cannot be turned into "open any directory". The client
  // only says "open it".
  if (url.pathname === ROUTE_REVEAL) {
    if (!canReveal()) {
      return new Response(JSON.stringify({ ok: false, reason: "no-desktop" }), {
        status: 503,
        headers: { "content-type": "application/json" },
      });
    }
    const dir = rootDir();
    const result = await revealFolder(dir);
    return new Response(JSON.stringify(result.ok ? { ok: true, folder: dir } : result), {
      status: result.ok ? 200 : 500,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response("not found", { status: 404 });
}

export function apply(ctx) {
  ctx.effect(
    () => {
      // Create the tree on first run so there is somewhere to drop files.
      try {
        const root = rootDir();
        mkdirSync(root, { recursive: true });
        for (const slot of SLOTS) mkdirSync(join(root, slot), { recursive: true });
        ensureReadme(root);
      } catch {
        /* the handler reports an empty manifest if this is not writable */
      }
    },
    "dsh-font-switcher:ensure-folder"
  );

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_MANIFEST,
        methods: ["GET"],
        requestBody: "buffered",
        fetch: handle,
      }),
    "dsh-font-switcher:manifest-route"
  );

  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_FILE,
        methods: ["GET"],
        requestBody: "buffered",
        fetch: handle,
      }),
    "dsh-font-switcher:file-route"
  );

  // POST, not GET: opening a window is a side effect, and a GET could be
  // triggered by a prefetch or a link the user did not mean to follow.
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_REVEAL,
        methods: ["POST"],
        requestBody: "buffered",
        fetch: handle,
      }),
    "dsh-font-switcher:reveal-route"
  );
}
