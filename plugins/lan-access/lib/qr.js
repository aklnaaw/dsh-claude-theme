/**
 * A minimal QR encoder, byte mode, versions 1-6, error levels L and M.
 *
 * Why hand-written: this plugin's whole point is being small enough to drop in
 * beside the other tools in this repository, and those have no dependencies and
 * no build step. `link:` installs resolve through the repository path, which
 * has no `node_modules`, so an npm QR package would not resolve at all. The
 * system `qrencode` binary is not guaranteed either. A single file with no
 * imports is the only shape that works everywhere this plugin runs.
 *
 * Scope is deliberate: a LAN URL is well under 130 bytes, so versions 1-6 at
 * level M (108 data codewords at version 6) are ample. Levels Q and H and
 * versions 7-40 are not implemented, and `encode()` refuses input that does
 * not fit rather than emitting a code that would not scan.
 *
 * Correctness is checked against the reference decoder, not against a table
 * copied from elsewhere: every matrix this file produces is round-tripped
 * through zbarimg in plugins/lan-access/test/.
 */

/* ---------------------------------------------------------------------------
 * GF(256) arithmetic, primitive polynomial 0x11D.
 * ------------------------------------------------------------------------ */

const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);

(function initTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** Reed-Solomon generator polynomial for `degree` error codewords. */
function rsGenerator(degree) {
  let poly = [1];
  for (let i = 0; i < degree; i++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let j = 0; j < poly.length; j++) {
      next[j] ^= poly[j];
      next[j + 1] ^= gfMul(poly[j], EXP[i]);
    }
    poly = next;
  }
  return poly;
}

/** The `degree` Reed-Solomon codewords for one block of data. */
function rsEncode(data, degree) {
  const gen = rsGenerator(degree);
  const out = new Array(data.length + degree).fill(0);
  for (let i = 0; i < data.length; i++) out[i] = data[i];
  for (let i = 0; i < data.length; i++) {
    const factor = out[i];
    if (factor === 0) continue;
    for (let j = 0; j < gen.length; j++) {
      out[i + j] ^= gfMul(gen[j], factor);
    }
  }
  return out.slice(data.length);
}

/* ---------------------------------------------------------------------------
 * Block structure.
 *
 * `blocks` lists, per version and level, the EC codewords per block followed
 * by each block's data-codeword count. Group boundaries fall out of it: QR
 * splits a version into blocks whose data lengths differ by at most one, so
 * the shorter blocks come first.
 * ------------------------------------------------------------------------ */

const EC_LEVEL_BITS = { L: 0b01, M: 0b00 };

const VERSIONS = {
  1: { L: { ec: 7, data: [19] }, M: { ec: 10, data: [16] } },
  2: { L: { ec: 10, data: [34] }, M: { ec: 16, data: [28] } },
  3: { L: { ec: 15, data: [55] }, M: { ec: 26, data: [44] } },
  4: { L: { ec: 20, data: [80] }, M: { ec: 18, data: [32, 32] } },
  5: { L: { ec: 26, data: [108] }, M: { ec: 24, data: [43, 43] } },
  6: { L: { ec: 18, data: [68, 68] }, M: { ec: 16, data: [27, 27, 27, 27] } },
};

/** Alignment-pattern centre coordinates, keyed by version. */
const ALIGNMENT = {
  1: [],
  2: [6, 18],
  3: [6, 22],
  4: [6, 26],
  5: [6, 30],
  6: [6, 34],
};

/* ---------------------------------------------------------------------------
 * Bit stream.
 * ------------------------------------------------------------------------ */

class BitBuffer {
  constructor() {
    this.bits = [];
  }
  put(value, length) {
    for (let i = length - 1; i >= 0; i--) this.bits.push((value >>> i) & 1);
  }
  get length() {
    return this.bits.length;
  }
  toCodewords() {
    const out = [];
    for (let i = 0; i < this.bits.length; i += 8) {
      let byte = 0;
      for (let j = 0; j < 8; j++) byte = (byte << 1) | (this.bits[i + j] || 0);
      out.push(byte);
    }
    return out;
  }
}

/** UTF-8 bytes for the input, so non-ASCII URLs survive. */
function utf8Bytes(text) {
  if (typeof TextEncoder !== "undefined") return Array.from(new TextEncoder().encode(text));
  // Node without a global TextEncoder is not a case this plugin meets, but the
  // fallback keeps the function total.
  return Array.from(Buffer.from(text, "utf8"));
}

/** Codeword count for the byte-mode data, before error correction. */
function pickVersion(byteLength, level) {
  for (let version = 1; version <= 6; version++) {
    const spec = VERSIONS[version][level];
    const capacity = spec.data.reduce((a, b) => a + b, 0);
    // 4 bits mode + character-count bits (8 for versions 1-9) + payload.
    const needed = Math.ceil((4 + 8 + byteLength * 8) / 8);
    if (needed <= capacity) return version;
  }
  return null;
}

/* ---------------------------------------------------------------------------
 * Matrix construction.
 * ------------------------------------------------------------------------ */

function emptyMatrix(size) {
  const m = [];
  for (let i = 0; i < size; i++) m.push(new Array(size).fill(null));
  return m;
}

function placeFinder(m, r, c) {
  for (let dr = -1; dr <= 7; dr++) {
    for (let dc = -1; dc <= 7; dc++) {
      const y = r + dr;
      const x = c + dc;
      if (y < 0 || y >= m.length || x < 0 || x >= m.length) continue;
      const inner = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6;
      const ring = dr === 0 || dr === 6 || dc === 0 || dc === 6;
      const core = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4;
      m[y][x] = inner && (ring || core) ? 1 : 0;
    }
  }
}

function placeAlignment(m, version) {
  const centres = ALIGNMENT[version];
  const size = m.length;
  for (const r of centres) {
    for (const c of centres) {
      // Skip the three positions that would collide with a finder pattern.
      if (m[r][c] !== null) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          m[r + dr][c + dc] = ring === 1 ? 0 : 1;
        }
      }
    }
  }
  // Timing patterns: alternating modules on row 6 and column 6.
  for (let i = 8; i < size - 8; i++) {
    if (m[6][i] === null) m[6][i] = i % 2 === 0 ? 1 : 0;
    if (m[i][6] === null) m[i][6] = i % 2 === 0 ? 1 : 0;
  }
}

function reserveFormat(m) {
  const size = m.length;
  for (let i = 0; i < 9; i++) {
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
  }
  for (let i = size - 8; i < size; i++) {
    if (m[8][i] === null) m[8][i] = 0;
    if (m[i][8] === null) m[i][8] = 0;
  }
  // The module that is always dark.
  m[size - 8][8] = 1;
}

/** Walk the data placement order and hand back the free module coordinates. */
function dataCells(size) {
  const cells = [];
  let upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5; // skip the vertical timing column
    for (let step = 0; step < size; step++) {
      const row = upward ? size - 1 - step : step;
      for (let k = 0; k < 2; k++) {
        const col = right - k;
        cells.push([row, col]);
      }
    }
    upward = !upward;
  }
  return cells;
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/** Format information: 5 data bits, BCH(15,5), then the 0x5412 mask. */
function formatBits(level, mask) {
  const data = (EC_LEVEL_BITS[level] << 3) | mask;
  let value = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((value >>> i) & 1) value ^= 0x537 << (i - 10);
  }
  return ((data << 10) | value) ^ 0x5412;
}

function placeFormat(m, level, mask) {
  const size = m.length;
  const bits = formatBits(level, mask);
  const bit = (i) => (bits >>> i) & 1;

  /* Both copies of the 15 format bits, most significant bit first.
   *
   * The order is the whole game here. Placing the low bits first -- which an
   * earlier version did -- leaves a symbol whose format field decodes as a
   * different level and mask, and a reader rejects the code outright rather
   * than reporting a readable error. The reference for this layout is a
   * matrix known to decode: see the note in test/verify.mjs.
   */

  // Copy 1: six bits leftwards along row 8, then the two beside the corner,
  // then six upwards along column 8.
  for (let i = 0; i <= 5; i++) m[8][i] = bit(14 - i); // (8,0)=bit14 ... (8,5)=bit9
  m[8][7] = bit(8);
  m[8][8] = bit(7);
  m[7][8] = bit(6);
  for (let j = 0; j <= 5; j++) m[j][8] = bit(j); // (0,8)=bit5 ... (5,8)=bit0

  // Copy 2: seven bits up from the bottom-left corner, then eight leftwards
  // across the top-right corner. The dark module at [size-8][8] sits between
  // the two runs and is never written here.
  for (let i = 0; i <= 6; i++) m[size - 1 - i][8] = bit(14 - i);
  for (let i = 0; i <= 7; i++) m[8][size - 8 + i] = bit(7 - i);
}

/** Penalty score; the lowest-scoring mask wins, as the spec requires. */
function penalty(m) {
  const size = m.length;
  let score = 0;

  // Rule 1: runs of five or more same-coloured modules.
  const runs = (get) => {
    for (let i = 0; i < size; i++) {
      let run = 1;
      for (let j = 1; j < size; j++) {
        if (get(i, j) === get(i, j - 1)) run++;
        else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  };
  runs((i, j) => m[i][j]);
  runs((i, j) => m[j][i]);

  // Rule 2: every 2x2 block of one colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = m[r][c];
      if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
    }
  }

  // Rule 3: the finder-like 1:1:3:1:1 pattern with four light modules beside it.
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  const matches = (arr, k, line, horizontal) => {
    for (let i = 0; i < 11; i++) {
      const v = horizontal ? m[line][k + i] : m[k + i][line];
      if (v !== arr[i]) return false;
    }
    return true;
  };
  for (let i = 0; i < size; i++) {
    for (let j = 0; j <= size - 11; j++) {
      if (matches(A, j, i, true) || matches(B, j, i, true)) score += 40;
      if (matches(A, j, i, false) || matches(B, j, i, false)) score += 40;
    }
  }

  // Rule 4: deviation from an even split of dark and light.
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (m[r][c]) dark++;
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/**
 * Encode `text` and return `{ size, rows }` where each row is a string of
 * `0`/`1`. Throws when the text does not fit versions 1-6 at the given level,
 * because a too-small code would be silently unscannable.
 *
 * @param text - the payload, encoded as UTF-8.
 * @param level - error-correction level, `L` or `M`.
 */
export function encode(text, level = "M") {
  if (level !== "L" && level !== "M") {
    throw new Error(`qr: unsupported error level ${JSON.stringify(level)}`);
  }
  const bytes = utf8Bytes(text);
  const version = pickVersion(bytes.length, level);
  if (version === null) {
    throw new Error(`qr: ${bytes.length} bytes does not fit versions 1-6 at level ${level}`);
  }

  const spec = VERSIONS[version][level];
  const totalData = spec.data.reduce((a, b) => a + b, 0);

  // --- data codewords -----------------------------------------------------
  const buf = new BitBuffer();
  buf.put(0b0100, 4); // byte mode
  buf.put(bytes.length, 8); // character count, 8 bits for versions 1-9
  for (const b of bytes) buf.put(b, 8);

  const capacityBits = totalData * 8;
  const terminator = Math.min(4, capacityBits - buf.length);
  buf.put(0, terminator);
  while (buf.length % 8 !== 0) buf.bits.push(0);

  const data = buf.toCodewords();
  const PAD = [0xec, 0x11];
  for (let i = 0; data.length < totalData; i++) data.push(PAD[i % 2]);

  // --- error correction and interleaving ----------------------------------
  const blocks = [];
  let cursor = 0;
  for (const dataLen of spec.data) {
    const block = data.slice(cursor, cursor + dataLen);
    cursor += dataLen;
    blocks.push({ data: block, ec: rsEncode(block, spec.ec) });
  }
  const interleaved = [];
  const maxData = Math.max(...blocks.map((b) => b.data.length));
  for (let i = 0; i < maxData; i++) {
    for (const b of blocks) if (i < b.data.length) interleaved.push(b.data[i]);
  }
  for (let i = 0; i < spec.ec; i++) {
    for (const b of blocks) interleaved.push(b.ec[i]);
  }

  // --- matrix -------------------------------------------------------------
  const size = version * 4 + 17;
  const base = emptyMatrix(size);
  placeFinder(base, 0, 0);
  placeFinder(base, 0, size - 7);
  placeFinder(base, size - 7, 0);
  placeAlignment(base, version);
  reserveFormat(base);

  const cells = dataCells(size);
  const fixed = base.map((row) => row.map((v) => (v === null ? null : v)));

  const buildWithMask = (mask) => {
    const m = fixed.map((row) => row.slice());
    let bitIndex = 0;
    for (const [row, col] of cells) {
      if (m[row][col] !== null) continue;
      const byte = interleaved[bitIndex >> 3] ?? 0;
      const raw = (byte >>> (7 - (bitIndex & 7))) & 1;
      bitIndex++;
      m[row][col] = raw ^ (MASKS[mask](row, col) ? 1 : 0);
    }
    placeFormat(m, level, mask);
    return m;
  };

  let best = null;
  let bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = buildWithMask(mask);
    const score = penalty(m);
    if (score < bestScore) {
      bestScore = score;
      best = m;
    }
  }

  return { size, rows: best.map((row) => row.join("")) };
}

/** Convenience wrapper returning an SVG string, used by the host half. */
export function toSvg(text, options = {}) {
  const { size, rows } = encode(text, options.level || "M");
  const quiet = options.quiet === undefined ? 2 : options.quiet;
  const scale = options.scale || 4;
  const side = (size + quiet * 2) * scale;
  const parts = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (rows[r][c] !== "1") continue;
      const x = (c + quiet) * scale;
      const y = (r + quiet) * scale;
      parts.push(`<rect x="${x}" y="${y}" width="${scale}" height="${scale}"/>`);
    }
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" ` +
    `viewBox="0 0 ${side} ${side}" shape-rendering="crispEdges" role="img">` +
    `<rect width="${side}" height="${side}" fill="#fff"/>` +
    `<g fill="#000">${parts.join("")}</g></svg>`
  );
}
