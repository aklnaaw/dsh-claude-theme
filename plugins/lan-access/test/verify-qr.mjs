#!/usr/bin/env node
/**
 * Round-trip check for the hand-written QR encoder in `lib/qr.js`.
 *
 * A QR encoder can look right and be wrong: the symbol has the right size, the
 * finder patterns are in the right place, and it still will not scan. That is
 * exactly what happened while this file was written -- the 15 format bits were
 * placed least-significant first, so every code decoded as a different error
 * level and mask and every reader rejected it. Nothing short of handing the
 * symbol to a real decoder catches that class of bug.
 *
 * So the test does not compare against a table: it renders each matrix to a PNG
 * and asks `zbarimg` what it reads. A symbol that decodes to something other
 * than the input, or does not decode at all, fails.
 *
 * USE
 *
 *   node plugins/lan-access/test/verify-qr.mjs
 *
 * Needs ImageMagick-free decoding only: `zbarimg` on PATH. `qr.js` is a plain
 * ES module with no dependencies, so nothing has to be installed first.
 * Exit code 0 when every case round-trips, 1 otherwise, 2 when the decoder is
 * missing.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { encode } from "../lib/qr.js";

const CASES = [
  { name: "short ascii", text: "hello", level: "M" },
  { name: "short ascii, level L", text: "hello", level: "L" },
  { name: "localhost url", text: "http://192.168.10.102:3080/", level: "M" },
  { name: "paired url", text: "http://192.168.10.102:3080/?token=abc123", level: "M" },
  {
    name: "100-char url",
    text:
      "http://192.168.10.102:3080/?token=" +
      "Zm9vYmFyYmF6cXV4MTIzNDU2Nzg5MGFiY2RlZmdoaWprbG1ub3A",
    level: "M",
  },
  {
    name: "60-char token at level L",
    text: "http://10.0.0.5:3080/?token=" + "A".repeat(56),
    level: "L",
  },
  { name: "non-ascii", text: "中文测试", level: "M" },
  { name: "empty string", text: "", level: "M" },
];

/** Every one of the 32 valid 15-bit format words. */
const VALID_FORMATS = (() => {
  const EC = { L: 1, M: 0, Q: 3, H: 2 };
  const out = [];
  for (const [level, code] of Object.entries(EC)) {
    for (let mask = 0; mask < 8; mask++) {
      const data = (code << 3) | mask;
      let value = data << 10;
      for (let i = 14; i >= 10; i--) if ((value >>> i) & 1) value ^= 0x537 << (i - 10);
      out.push({ level, mask, value: ((data << 10) | value) ^ 0x5412 });
    }
  }
  return out;
})();

/**
 * Read both copies of the format information out of a matrix and decode them.
 *
 * This exists because the round-trip alone does not catch a wrong format
 * layout: `zbarimg` answers from whichever copy it likes, so misplacing the
 * first copy still scans. Reading both copies back is what pins the layout.
 *
 * @param rows - the module matrix.
 * @returns the level and mask each copy decodes to.
 */
function readFormat(rows) {
  const n = rows.length;
  const copyA = [
    [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
    [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8],
  ];
  const copyB = [
    [n - 1, 8], [n - 2, 8], [n - 3, 8], [n - 4, 8], [n - 5, 8], [n - 6, 8], [n - 7, 8],
    [8, n - 8], [8, n - 7], [8, n - 6], [8, n - 5], [8, n - 4], [8, n - 3], [8, n - 2], [8, n - 1],
  ];
  const decode = (cells) => {
    let value = 0;
    for (const [r, c] of cells) value = (value << 1) | +rows[r][c];
    let best = null;
    for (const candidate of VALID_FORMATS) {
      let x = value ^ candidate.value;
      let distance = 0;
      while (x) { distance += x & 1; x >>= 1; }
      if (best === null || distance < best.distance) best = { ...candidate, distance };
    }
    return best;
  };
  return { a: decode(copyA), b: decode(copyB) };
}

/** Write one module matrix as a PNG without any image library. */
function matrixToPng(rows, path, scale = 8, quiet = 4) {
  const n = rows.length;
  const side = (n + quiet * 2) * scale;
  // A greyscale PNG built by hand: header, one IDAT of filter-0 scanlines, IEND.
  const raw = [];
  for (let y = 0; y < side; y++) {
    raw.push(0); // filter type "none"
    const r = Math.floor(y / scale) - quiet;
    for (let x = 0; x < side; x++) {
      const c = Math.floor(x / scale) - quiet;
      const dark = r >= 0 && r < n && c >= 0 && c < n && rows[r][c] === "1";
      raw.push(dark ? 0 : 255);
    }
  }
  const data = Buffer.from(raw);

  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const typed = Buffer.concat([Buffer.from(type, "ascii"), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(typed) >>> 0);
    return Buffer.concat([len, typed, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(side, 0);
  ihdr.writeUInt32BE(side, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 0; // greyscale
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", zlibStored(data)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
  writeFileSync(path, png);
}

/** One zlib stream using only stored (uncompressed) blocks. */
function zlibStored(data) {
  const out = [Buffer.from([0x78, 0x01])];
  const MAX = 65535;
  for (let offset = 0; offset < data.length; offset += MAX) {
    const block = data.subarray(offset, Math.min(offset + MAX, data.length));
    const last = offset + MAX >= data.length ? 1 : 0;
    const header = Buffer.alloc(5);
    header[0] = last;
    header.writeUInt16LE(block.length, 1);
    header.writeUInt16LE(~block.length & 0xffff, 3);
    out.push(header, block);
  }
  const adler = Buffer.alloc(4);
  adler.writeUInt32BE(adler32(data) >>> 0);
  out.push(adler);
  return Buffer.concat(out);
}

let CRC_TABLE = null;
function crc32(buf) {
  if (CRC_TABLE === null) {
    CRC_TABLE = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      CRC_TABLE[n] = c >>> 0;
    }
  }
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function adler32(buf) {
  let a = 1;
  let b = 0;
  for (const byte of buf) {
    a = (a + byte) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

const work = mkdtempSync(join(tmpdir(), "dsh-lan-qr-"));
let passed = 0;
let failed = 0;

try {
  for (const [i, testCase] of CASES.entries()) {
    let rows;
    try {
      rows = encode(testCase.text, testCase.level).rows;
    } catch (error) {
      console.log(`  FAIL  ${testCase.name} -- encoder threw: ${error.message}`);
      failed++;
      continue;
    }
    const png = join(work, `case-${i}.png`);
    matrixToPng(rows, png);

    let decoded;
    try {
      decoded = execFileSync("zbarimg", ["--quiet", "--raw", png], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
      }).replace(/\n+$/, "");
    } catch {
      decoded = null;
    }

    if (decoded === testCase.text) {
      console.log(`  ok    ${testCase.name} -- ${rows.length}x${rows.length}, round-tripped`);
      passed++;
    } else {
      console.log(
        `  FAIL  ${testCase.name} -- decoded ${JSON.stringify(decoded)}, expected ${JSON.stringify(testCase.text)}`,
      );
      failed++;
    }

    /* Both copies of the format field must be present AND agree. A reader can
     * answer from either one, so a matrix with only one correct copy still
     * scans -- and would then break on a reader that happens to read the other. */
    const format = readFormat(rows);
    const good =
      format.a.distance === 0 &&
      format.b.distance === 0 &&
      format.a.level === testCase.level &&
      format.b.level === testCase.level &&
      format.a.mask === format.b.mask;
    if (good) {
      console.log(
        `  ok    ${testCase.name} -- format copies agree (level ${format.a.level}, mask ${format.a.mask})`,
      );
      passed++;
    } else {
      console.log(
        `  FAIL  ${testCase.name} -- format copies: ` +
          `A=${format.a.level}/${format.a.mask}/d${format.a.distance} ` +
          `B=${format.b.level}/${format.b.mask}/d${format.b.distance} ` +
          `(expected level ${testCase.level}, both copies exact)`,
      );
      failed++;
    }
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log();
if (failed === 0) {
  console.log(`verify-qr: ${passed} passed`);
  process.exit(0);
}
console.log(`verify-qr: ${passed} passed, ${failed} failed`);
process.exit(1);
