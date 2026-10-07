#!/usr/bin/env node
/**
 * Checks the host half of dsh-lan-access without a running DSH.
 *
 * Two things here can break a user's machine rather than just look wrong, so
 * both are asserted directly:
 *
 *   1. The bind block is written into the profile's `cordis.patch.yml`, which
 *      configures how their DSH starts. It must be idempotent and it must come
 *      out byte-identical when the switch is turned off, or repeated toggling
 *      would keep appending rows to a file the user owns.
 *   2. The status route mints a URL through `connection.authenticatedUrl`.
 *      That URL is the credential, so the test checks it carries the token and
 *      the LAN address -- not loopback -- because a QR pointing at 127.0.0.1
 *      cannot be opened from a phone.
 *
 * The `zbarimg` round-trip in verify-qr.mjs covers the encoder; this file
 * covers the wiring around it.
 *
 * USE
 *
 *   node plugins/lan-access/test/verify-host.mjs
 *
 * Exit code 0 when every check passes, 1 otherwise.
 */

import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const work = mkdtempSync(join(tmpdir(), "dsh-lan-host-"));
process.env.DSH_HOME = work;
process.env.DSH_PROFILE = "web";
mkdirSync(join(work, "profiles", "web"), { recursive: true });

const PATCH = join(work, "profiles", "web", "cordis.patch.yml");
const ORIGINAL = [
  "- id: dsh-cost-meter",
  "  disabled: false",
  "- id: ui-theme",
  '  name: "@deepseek-ai/dsh-client-ui-theme"',
  "  config:",
  "    preference: dark",
  "",
].join("\n");
writeFileSync(PATCH, ORIGINAL, "utf8");

const mod = await import("../lib/index.js");

let passed = 0;
let failed = 0;

function check(label, condition, detail) {
  if (condition) {
    console.log(`  ok    ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}${detail ? ` -- ${detail}` : ""}`);
    failed++;
  }
}

try {
  /* ---- the bind block ---------------------------------------------------- */

  check("starts with no managed block", readFileSync(PATCH, "utf8") === ORIGINAL);

  mod.writeBind(true);
  const once = readFileSync(PATCH, "utf8");
  check("enabling writes exactly one block", (once.match(/>>> dsh-lan-access bind >>>/g) || []).length === 1);
  check("enabling records host 0.0.0.0", mod.readBindIntent() === "0.0.0.0");
  check(
    "the block replaces the webserver row, so it repeats its static config",
    once.includes("- id: webserver") && once.includes("compression: gzip"),
  );

  mod.writeBind(true);
  check("enabling twice does not append a second block", readFileSync(PATCH, "utf8") === once);

  mod.writeBind(false);
  check("disabling removes the block", mod.readBindIntent() === null);
  check(
    "disabling restores the file byte for byte",
    readFileSync(PATCH, "utf8") === ORIGINAL,
    JSON.stringify(readFileSync(PATCH, "utf8")),
  );

  mod.writeBind(false);
  check("disabling twice is still byte-identical", readFileSync(PATCH, "utf8") === ORIGINAL);

  /* The managed row replaces the shipped `webserver` row, so the port it pins
   * is the port the next start uses. Hardcoding 3080 here would move a server
   * started with `--port 8080`, which the user would read as the plugin losing
   * their setting. */
  mod.writeBind(true, 8080);
  const pinned = /port:\s*(\d+)/.exec(readFileSync(PATCH, "utf8"));
  check("pins the port it was given, not a default", pinned !== null && pinned[1] === "8080", pinned ? pinned[1] : "no port line");
  mod.writeBind(false);
  check("still restores after a custom port", readFileSync(PATCH, "utf8") === ORIGINAL);

  /* ---- the routes ------------------------------------------------------- */

  const routes = new Map();
  const fakeCtx = {
    webServer: { host: "0.0.0.0", port: 3080 },
    connection: {
      authenticatedUrl(base) {
        const u = new URL(base);
        u.searchParams.set("token", "TEST_TOKEN");
        return u.href;
      },
      fetch: {
        register(spec) {
          routes.set(spec.path, spec);
          return () => {};
        },
      },
    },
    effect(fn) {
      const dispose = fn();
      return typeof dispose === "function" ? dispose : () => {};
    },
  };
  mod.apply(fakeCtx);

  check("registers three routes", routes.size === 3, [...routes.keys()].join(", "));

  /* `requestBody` is required on every route, GET included. An undefined value
   * fails dispatch before the handler runs and the carrier answers with a bare
   * 400 carrying an empty body -- which reads like a broken route rather than a
   * missing field. The first version of this plugin shipped without it on the
   * two GET routes and the panel reported "status read failed" against an
   * endpoint that looked registered. */
  for (const [path, spec] of routes) {
    const mode = spec.requestBody;
    check(
      `route ${path} declares a body mode`,
      mode === "buffered" || mode === "streaming",
      `got ${JSON.stringify(mode)}`,
    );
  }

  const statusResponse = await routes.get("/api/dsh-lan-access/status").fetch(
    new Request("http://127.0.0.1:3080/api/dsh-lan-access/status"),
  );
  const status = await statusResponse.json();
  check("status reports the live bind", status.bindHost === "0.0.0.0");
  check("status reports reachable", status.reachable === true);
  check("status carries a URL", typeof status.url === "string" && status.url.length > 0);
  check("the URL carries the token", String(status.url).includes("token=TEST_TOKEN"));
  check(
    "the URL points at a LAN address, not loopback",
    !String(status.url).includes("127.0.0.1") && !String(status.url).includes("localhost"),
    String(status.url),
  );

  const qrResponse = await routes.get("/api/dsh-lan-access/qr").fetch(
    new Request("http://127.0.0.1:3080/api/dsh-lan-access/qr?text=" + encodeURIComponent(status.url)),
  );
  const qr = await qrResponse.json();
  check("qr route returns a square matrix", qr.ok === true && qr.rows.length === qr.size);

  const emptyResponse = await routes.get("/api/dsh-lan-access/qr").fetch(
    new Request("http://127.0.0.1:3080/api/dsh-lan-access/qr"),
  );
  check("qr route refuses an empty payload", emptyResponse.status === 400);

  /* ---- loopback means no QR --------------------------------------------- */

  const loopbackRoutes = new Map();
  const loopbackCtx = {
    ...fakeCtx,
    webServer: { host: "127.0.0.1", port: 3080 },
    connection: {
      ...fakeCtx.connection,
      fetch: { register(spec) { loopbackRoutes.set(spec.path, spec); return () => {}; } },
    },
  };
  mod.apply(loopbackCtx);
  const loopStatus = await loopbackRoutes.get("/api/dsh-lan-access/status").fetch(
    new Request("http://127.0.0.1:3080/api/dsh-lan-access/status"),
  );
  const loopBody = await loopStatus.json();
  check("a loopback bind reports not reachable", loopBody.reachable === false);
  check("a loopback bind mints no URL", loopBody.url === null);
  check("a loopback bind is flagged as loopback", loopBody.loopback === true);
} finally {
  rmSync(work, { recursive: true, force: true });
}

console.log();
if (failed === 0) {
  console.log(`verify-host: ${passed} passed`);
  process.exit(0);
}
console.log(`verify-host: ${passed} passed, ${failed} failed`);
process.exit(1);
