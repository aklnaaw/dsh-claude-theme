/**
 * Host half of dsh-lan-access.
 *
 * What this plugin is for: open DSH on a phone that is on the same network,
 * without installing a second interface, without a public tunnel, and without
 * signing up for anything. The phone gets the same Web GUI this machine runs.
 *
 * How it works, and why it is small
 * ---------------------------------
 *
 * The hard part of "reach DSH from another device" is not the network, it is
 * the credential. `dsh web` mints a browser-session cookie bound to the exact
 * `host:port` a browser visited, and it refuses a `Host` that is neither
 * loopback nor a declared trusted authority — so a phone pointed at
 * `192.168.x.x:3080` gets 401 even after the port is reachable.
 *
 * DSH already solves this for itself: the connection service exposes
 * `authenticatedUrl(baseUrl)`, which returns the same URL with this process's
 * launch token appended. A request carrying that token mints the cookie and
 * redirects to the clean path, which is exactly how the desktop browser
 * authenticates on first launch. So the plugin does not proxy anything, does
 * not relay API calls, and does not maintain device sessions. It asks for one
 * authenticated URL and draws it as a QR code.
 *
 * The bind
 * --------
 *
 * `dsh web --host 0.0.0.0` is refused on the command line on purpose: it would
 * put an agent with shell access on the network. This plugin offers the same
 * thing behind an explicit switch, and only when the switch is on, because the
 * user's own network is a reasonable place to run it as long as the choice is
 * deliberate and the consequence is stated. Two facts belong in that warning
 * and are repeated in the panel:
 *
 *   - anyone who can reach the port and obtain the URL can run commands here;
 *   - the URL itself is the credential, so it must not be shared.
 *
 * Turning the switch off restores the loopback bind. The value is written as a
 * static managed block in the profile's `cordis.patch.yml`, because a config
 * expression may not survive the patch layer's evaluation; the block is
 * rewritten on every activation so it cannot drift.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, networkInterfaces } from "node:os";
import { join } from "node:path";

import { encode } from "./qr.js";

export const name = "dsh-lan-access";

/** The connection service carries `authenticatedUrl`; the web server owns the bind. */
export const inject = ["connection", "webServer"];

/** Our own route family; loopback-only, like the pairing panels elsewhere. */
const ROUTE_STATUS = "/api/dsh-lan-access/status";
const ROUTE_SET = "/api/dsh-lan-access/bind";
const ROUTE_QR = "/api/dsh-lan-access/qr";

/** Marks the managed block this plugin owns inside the profile patch. */
const BLOCK_START = "# >>> dsh-lan-access bind >>>";
const BLOCK_END = "# <<< dsh-lan-access bind <<<";

const DEFAULT_PORT = 3080;

function dshHome() {
  return process.env.DSH_HOME || join(homedir(), ".dsh");
}

function profileDir() {
  const profile = process.env.DSH_PROFILE || "web";
  return join(dshHome(), "profiles", profile);
}

function patchFile() {
  return join(profileDir(), "cordis.patch.yml");
}

/**
 * The machine's LAN addresses, IPv4 only, loopback and link-local excluded.
 *
 * Docker bridges and similar virtual interfaces show up here too; they are
 * returned as well because a phone on a VLAN may legitimately need one, and the
 * panel lets the user pick. Private ranges are listed first as they are the
 * common case.
 */
export function lanAddresses() {
  const out = [];
  const interfaces = networkInterfaces();
  for (const [name, entries] of Object.entries(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family !== "IPv4" || entry.internal) continue;
      if (entry.address.startsWith("169.254.")) continue;
      out.push({ name, address: entry.address });
    }
  }
  const isPrivate = (address) =>
    address.startsWith("192.168.") ||
    address.startsWith("10.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(address);
  out.sort((a, b) => Number(isPrivate(b.address)) - Number(isPrivate(a.address)));
  return out;
}

/** Current bind host from the live web server, which is the authority on it. */
function currentHost(ctx) {
  try {
    return ctx.webServer.host;
  } catch {
    return "127.0.0.1";
  }
}

function currentPort(ctx) {
  try {
    return ctx.webServer.port || DEFAULT_PORT;
  } catch {
    return DEFAULT_PORT;
  }
}

/**
 * Read the managed block's recorded intent.
 *
 * The bind the server is actually using comes from `ctx.webServer.host`, but a
 * change only takes effect on the next start, so the recorded value is what the
 * panel reports as "after restart".
 */
export function readBindIntent() {
  const file = patchFile();
  if (!existsSync(file)) return null;
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const start = text.indexOf(BLOCK_START);
  const end = text.indexOf(BLOCK_END);
  if (start === -1 || end === -1 || end < start) return null;
  const block = text.slice(start, end);
  const match = /host:\s*["']?([0-9.]+)["']?/.exec(block);
  return match ? match[1] : null;
}

/**
 * Write or remove the managed block.
 *
 * A same-id patch row REPLACES the row's config wholesale, so the block has to
 * carry every static field the shipped `webserver` row sets -- `compression*`
 * included -- or enabling this switch would silently drop gzip. The shipped row
 * computes host and port from the `webStartup` provider through `!!js`
 * expressions, and that provider only carries command-line values, which is
 * exactly why `--host 0.0.0.0` is refused at the CLI: there is no config field
 * to set instead. Materializing static values here is the documented way to
 * override a `!!js`-driven row from a user patch.
 *
 * @param allInterfaces - true to pin `0.0.0.0`, false to remove the block and
 *   fall back to the shipped row.
 * @param port - the port to pin. It must be the port the server is actually
 *   listening on, because the managed row replaces the shipped one: hardcoding
 *   3080 here would move a server started with `--port 8080` to 3080 on its
 *   next start, which looks like the plugin losing the user's setting.
 * @returns the host that will apply after the next start.
 */
export function writeBind(allInterfaces, port = DEFAULT_PORT) {
  const file = patchFile();
  let text = "";
  try {
    text = existsSync(file) ? readFileSync(file, "utf8") : "";
  } catch {
    text = "";
  }
  const start = text.indexOf(BLOCK_START);
  const end = text.indexOf(BLOCK_END);
  if (start !== -1 && end !== -1 && end > start) {
    text = text.slice(0, start) + text.slice(end + BLOCK_END.length);
  }
  text = text.replace(/\n{3,}/g, "\n\n").replace(/\s+$/, "\n");

  if (allInterfaces) {
    const block = [
      BLOCK_START,
      "# Managed by dsh-lan-access. Removed when the switch is turned off.",
      "#",
      "# This row replaces the shipped `webserver` row, so every static field it",
      "# sets has to be repeated here. Reaching this port from another device",
      "# grants full control of this machine's agent: keep it on a network you",
      "# trust, and do not share the pairing URL.",
      "- id: webserver",
      "  name: '@deepseek-ai/dsh-host-webserver'",
      "  inject: [webStartup]",
      "  config:",
      "    host: '0.0.0.0'",
      `    port: ${port}`,
      "    compression: gzip",
      "    compressionLevel: 1",
      "    compressionThresholdBytes: 1024",
      BLOCK_END,
      "",
    ].join("\n");
    text += (text.endsWith("\n") || text === "" ? "" : "\n") + block;
  }

  try {
    writeFileSync(file, text, "utf8");
  } catch (error) {
    throw new Error(`could not write ${file}: ${error.message}`);
  }
  return allInterfaces ? "0.0.0.0" : "127.0.0.1";
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

/**
 * The status the panel renders, including a ready-to-scan authenticated URL.
 *
 * The URL is only minted when the bind actually reaches the network; with a
 * loopback bind a QR would point at an address the phone cannot open, so the
 * panel gets an explanation instead of a dead code.
 */
function handleStatus(ctx) {
  const host = currentHost(ctx);
  const port = currentPort(ctx);
  const addresses = lanAddresses();
  const reachable = host === "0.0.0.0" && addresses.length > 0;

  let url = null;
  if (reachable) {
    try {
      url = ctx.connection.authenticatedUrl(`http://${addresses[0].address}:${port}/`);
    } catch {
      url = null;
    }
  }

  return json({
    ok: true,
    bindHost: host,
    port,
    addresses,
    reachable,
    url,
    pendingBind: readBindIntent(),
    loopback: host === "127.0.0.1",
  });
}

async function handleBind(request, ctx) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "bad-json" }, 400);
  }
  if (typeof body?.enabled !== "boolean") {
    return json({ ok: false, error: "bad-request" }, 400);
  }
  let next;
  try {
    // Pin the port the server is actually on, not a default: the managed row
    // replaces the shipped one, so a wrong port here would silently move the
    // user's server on the next start.
    next = writeBind(body.enabled, currentPort(ctx));
  } catch (error) {
    return json({ ok: false, error: String(error.message) }, 500);
  }
  return json({ ok: true, pendingBind: next, restartRequired: true });
}

/**
 * The QR matrix for a URL.
 *
 * The browser half cannot import the host's `lib/qr.js`, and duplicating the
 * encoder into the client bundle would double the code that has to stay
 * correct. One JSON payload of `0`/`1` rows per URL is the cheaper seam, and the
 * client caches it per URL.
 *
 * The text is capped because the encoder only supports versions 1-6; a longer
 * payload is refused with a clear status instead of being silently truncated.
 */
function handleQr(request) {
  const url = new URL(request.url, "http://dsh.invalid");
  const text = url.searchParams.get("text") || "";
  if (text.length === 0) return json({ ok: false, error: "missing-text" }, 400);
  try {
    const { size, rows } = encode(text, "M");
    return json({ ok: true, size, rows });
  } catch (error) {
    return json({ ok: false, error: String(error.message) }, 400);
  }
}

export function apply(ctx) {
  /* `requestBody` is required on every route, GET included: the carrier reads
   * it to decide how to present the body, and an undefined value fails dispatch
   * before the handler runs -- which surfaces as a bare 400 with an empty body,
   * a response that looks nothing like a routing mistake. */
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_STATUS,
        methods: ["GET"],
        requestBody: "buffered",
        fetch: (request) => handleStatus(ctx),
      }),
    "dsh-lan-access: status route",
  );
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_SET,
        methods: ["POST"],
        requestBody: "buffered",
        fetch: (request) => handleBind(request, ctx),
      }),
    "dsh-lan-access: bind route",
  );
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: ROUTE_QR,
        methods: ["GET"],
        requestBody: "buffered",
        fetch: (request) => handleQr(request),
      }),
    "dsh-lan-access: qr route",
  );
}
