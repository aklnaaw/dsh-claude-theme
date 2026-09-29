#!/usr/bin/env node
/**
 * Regenerate `lib/official-tokens.js` from the installed skin center.
 *
 * The fallback derivation in `lib/css-contract.js` has to know which official
 * `--dsw-*` tokens exist, and it must know exactly the set the skin center
 * knows — a name missing here is a token the shell leaves underived, and a
 * stale extra name is a declaration the skin center would not emit. Both show
 * up as a skin that renders differently than it used to.
 *
 * Usage:
 *   node scripts/extract-official-tokens.mjs [path-to-skin-center-lib/index.js]
 *
 * With no argument it resolves the skin center from the active DSH profile's
 * node_modules, which is where a profile that has it installed keeps it.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "plugins", "skin", "lib", "official-tokens.js");

const DEFAULT_CANDIDATES = [
  process.env.DSH_PROFILE_DIR && join(process.env.DSH_PROFILE_DIR, "node_modules/@linxin666/dsh-client-ui-skin-center/lib/index.js"),
  join(process.env.DSH_HOME || join(homedir(), ".dsh"), "profiles/web/node_modules/@linxin666/dsh-client-ui-skin-center/lib/index.js"),
].filter(Boolean);

const source = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_CANDIDATES.find((p) => existsSync(p));

if (source === undefined || !existsSync(source)) {
  console.error("extract-official-tokens: skin center not found. Pass its lib/index.js path explicitly.");
  for (const candidate of DEFAULT_CANDIDATES) console.error("  tried " + candidate);
  process.exit(1);
}

const text = readFileSync(source, "utf8");
const declaration = /const OFFICIAL_TOKENS\s*=\s*\[/.exec(text);
if (declaration === null) {
  console.error(`extract-official-tokens: no OFFICIAL_TOKENS table in ${source}`);
  process.exit(1);
}

// Bracket-match the array literal so a token list containing "]" cannot
// truncate the scan.
const start = text.indexOf("[", declaration.index);
let depth = 0;
let end = -1;
for (let i = start; i < text.length; i++) {
  if (text[i] === "[") depth++;
  else if (text[i] === "]" && --depth === 0) {
    end = i;
    break;
  }
}
if (end === -1) {
  console.error("extract-official-tokens: unbalanced OFFICIAL_TOKENS array");
  process.exit(1);
}

const tokens = [...text.slice(start, end + 1).matchAll(/"(--[^"]+)"/g)].map((m) => m[1]);
if (tokens.length === 0) {
  console.error("extract-official-tokens: parsed zero tokens, refusing to write");
  process.exit(1);
}
if (new Set(tokens).size !== tokens.length) {
  console.error("extract-official-tokens: duplicate token names in the source table, refusing to write");
  process.exit(1);
}

const rows = [];
for (let i = 0; i < tokens.length; i += 4) {
  rows.push("  " + tokens.slice(i, i + 4).map((t) => JSON.stringify(t)).join(", ") + ",");
}
const body = rows.join("\n").replace(/,$/, "");

const out = `/**
 * The official \`--dsw-*\` token names a skin may rely on without declaring.
 *
 * GENERATED — do not hand-edit. Extracted from the \`OFFICIAL_TOKENS\` table in
 * \`@linxin666/dsh-client-ui-skin-center\` (${tokens.length} names) so the fallback
 * derivation in \`./css-contract.js\` produces the same declarations the skin
 * center does. Regenerate with \`scripts/extract-official-tokens.mjs\` after a
 * skin-center upgrade that changes its token contract.
 */

export const OFFICIAL_TOKENS = [
${body}
];
`;

writeFileSync(OUT, out, "utf8");
console.log(`extract-official-tokens: wrote ${tokens.length} tokens to ${OUT}`);
