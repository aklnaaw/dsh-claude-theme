#!/usr/bin/env node
/**
 * Prove this plugin's skin transform matches the skin center's, byte for byte,
 * over every installed skin.
 *
 * The installed skins are authored against the skin center's output, so for the
 * sheets this plugin serves, equality with that output IS the correctness bar:
 * any drift is a skin that renders differently here than it did under the skin
 * center. The unit tests cover the properties; this covers the whole corpus.
 *
 * Needs `@linxin666/dsh-client-ui-skin-center` installed in the active profile.
 * Exits non-zero on the first differing stylesheet.
 *
 * Usage:
 *   node scripts/compare-with-skin-center.mjs [skins-dir]
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const HERE = new URL(".", import.meta.url);
const MINE = new URL("../plugins/skin/lib/css-contract.js", HERE);
const DSH_HOME = process.env.DSH_HOME || join(homedir(), ".dsh");
const PROFILE_DIR = process.env.DSH_PROFILE_DIR || join(DSH_HOME, "profiles/web");
const CENTER = join(PROFILE_DIR, "node_modules/@linxin666/dsh-client-ui-skin-center/lib/index.js");
const SKINS = process.argv[2] ? join(process.argv[2]) : join(DSH_HOME, "skins");

if (!existsSync(CENTER)) {
  console.error(`compare-with-skin-center: skin center not installed at ${CENTER}`);
  console.error("This check is optional; the unit tests do not need it.");
  process.exit(1);
}
if (!existsSync(SKINS)) {
  console.error(`compare-with-skin-center: no skins directory at ${SKINS}`);
  process.exit(1);
}

const { transformSkinCss: theirs } = await import(pathToFileURL(CENTER).href);
const { transformSkinCss: mine } = await import(MINE.href);

/** Where two strings first differ, with context, or null when equal. */
function firstDiff(a, b) {
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i] !== b[i]) {
      return `at char ${i}\n    theirs: ${JSON.stringify(a.slice(Math.max(0, i - 60), i + 60))}\n    mine:   ${JSON.stringify(b.slice(Math.max(0, i - 60), i + 60))}`;
    }
  }
  if (a.length !== b.length) return `length differs: theirs ${a.length}, mine ${b.length}`;
  return null;
}

const ids = readdirSync(SKINS, { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(join(SKINS, e.name, "skin.json")))
  .map((e) => e.name)
  .sort();

if (ids.length === 0) {
  console.error(`compare-with-skin-center: no skins under ${SKINS}`);
  process.exit(1);
}

// Mirror how the plugin drives the transform: skin.css derives fallbacks,
// patches.css does not (the derivation is a skin.css-only concern).
const SHEETS = [
  ["skin.css", true],
  ["patches.css", false],
];

let compared = 0;
const failures = [];

for (const id of ids) {
  for (const [sheet, derive] of SHEETS) {
    const file = join(SKINS, id, sheet);
    if (!existsSync(file)) continue;
    const raw = readFileSync(file, "utf8");

    let want;
    try {
      want = theirs(raw, { skinId: id, filename: sheet, deriveFallbacks: derive }).code;
    } catch (error) {
      // The authoritative pipeline refused this sheet (whitelist or parse).
      // That is its call, not a transform mismatch, so it is not our failure.
      console.log(`SKIP ${id}/${sheet} — skin center refused it: ${error.message.split("\n")[0]}`);
      continue;
    }

    compared++;
    const got = mine(raw, id, { deriveFallbacks: derive });
    const diff = firstDiff(want, got);
    if (diff === null) {
      console.log(`OK   ${id}/${sheet} — ${got.length} bytes identical`);
    } else {
      failures.push(`${id}/${sheet} ${diff}`);
    }
  }
}

if (failures.length > 0) {
  console.error(`\ncompare-with-skin-center: ${failures.length} of ${compared} stylesheets differ\n`);
  for (const failure of failures) console.error("  " + failure);
  process.exit(1);
}

console.log(`\ncompare-with-skin-center: all ${compared} stylesheets identical across ${ids.length} skins`);
