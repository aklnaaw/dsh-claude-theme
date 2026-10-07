window.__ModuleLoader__.load({
	id: "dsh-lan-access",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var h = React.createElement;

		var ROUTE_STATUS = "/api/dsh-lan-access/status";
		var ROUTE_SET = "/api/dsh-lan-access/bind";

		/* ------------------------------------------------------------------
		 * Browser half of dsh-lan-access.
		 *
		 * One phone icon in the sidebar foot. Opening it asks the host half for
		 * an authenticated LAN URL and draws that URL as a QR code, so a phone
		 * on the same network can open the real Web GUI by scanning.
		 *
		 * No proxy lives here and none is needed: the host half appends the
		 * process launch token to the URL, and the phone's first request spends
		 * it for a session cookie. See the host half for the full reasoning.
		 * ------------------------------------------------------------------ */

		var CSS = [
			".dla-btn{display:flex;align-items:center;gap:8px;width:100%;",
			"padding:7px 8px;border:0;border-radius:8px;background:transparent;",
			"color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;",
			"font-size:13px;text-align:left}",
			".dla-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dla-btn[data-rail='1']{justify-content:center;padding:7px 0}",
			".dla-btn svg{flex:none}",

			".dla-scrim{position:fixed;inset:0;z-index:2147483000;display:flex;",
			"align-items:center;justify-content:center;padding:20px;overflow:auto;",
			"background:rgba(20,20,19,.34);-webkit-backdrop-filter:blur(10px);",
			"backdrop-filter:blur(10px);",
			"font-family:var(--dsw-font-family,-apple-system,sans-serif)}",

			".dla-card{width:100%;max-width:440px;overflow:hidden;",
			"background:var(--dsw-alias-bg-overlay,#faf9f5);",
			"color:var(--dsw-alias-label-primary,#141413);",
			"border:1px solid var(--dsw-alias-border-l2,#e6dfd8);border-radius:12px;",
			"box-shadow:0 30px 70px -16px rgba(0,0,0,.34)}",

			".dla-head{display:flex;align-items:center;gap:9px;padding:13px 18px;",
			"border-bottom:1px solid var(--dsw-alias-border-l1,#ebe6df);",
			"font-size:13px;font-weight:500}",
			".dla-dot{width:7px;height:7px;border-radius:50%;flex:none;",
			"background:var(--dsw-alias-brand-primary,#d97757)}",

			".dla-body{padding:16px 18px 18px}",
			".dla-label{font-size:11.5px;font-weight:500;letter-spacing:.06em;",
			"text-transform:uppercase;margin-bottom:9px;",
			"color:var(--dsw-alias-label-tertiary,#8a8781)}",

			/* The white box hugs the code rather than stretching the full card
			 * width: the surrounding white IS the quiet zone a scanner needs,
			 * so it belongs tight around the modules, not spread across 400px
			 * of empty card. */
			".dla-qr{width:fit-content;margin:0 auto;padding:24px;",
			"border-radius:10px;background:#fff;",
			"border:1px solid var(--dsw-alias-border-l1,#ebe6df)}",
			/* An inline SVG with only a viewBox has no intrinsic size in some
			 * engines, so the box is set explicitly. */
			".dla-qr svg{display:block;width:224px;height:224px}",

			".dla-url{margin-top:10px;padding:8px 10px;border-radius:8px;",
			"font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;",
			"line-height:1.5;word-break:break-all;",
			"background:var(--dsw-alias-bg-layer-1,#f5f0e8);",
			"color:var(--dsw-alias-label-secondary,#6c6a64)}",

			".dla-note{margin-top:12px;font-size:12px;line-height:1.6;",
			"color:var(--dsw-alias-label-tertiary,#8a8781)}",

			".dla-warn{margin-top:12px;padding:10px 12px;border-radius:8px;",
			"font-size:12px;line-height:1.6;",
			"background:var(--dsw-alias-state-warn-bg,rgba(217,119,87,.12));",
			"color:var(--dsw-alias-label-primary,#141413)}",

			".dla-row{display:flex;align-items:center;gap:10px;margin-top:16px;",
			"padding-top:14px;border-top:1px solid var(--dsw-alias-border-l1,#ebe6df)}",
			".dla-switch{display:flex;align-items:center;gap:8px;font-size:13px;",
			"cursor:pointer;flex:1}",
			".dla-switch input{width:15px;height:15px;cursor:pointer}",

			".dla-btn2{font:inherit;font-size:13px;font-weight:500;padding:7px 14px;",
			"border-radius:999px;cursor:pointer;border:1px solid var(--dsw-alias-border-l2,#e6dfd8);",
			"background:transparent;color:var(--dsw-alias-label-primary,#141413)}",
			".dla-btn2.primary{background:var(--dsw-alias-brand-primary,#d97757);",
			"border-color:var(--dsw-alias-brand-primary,#d97757);color:#fff}",

			".dla-addr{font-size:12px;font-family:'JetBrains Mono',ui-monospace,monospace;",
			"color:var(--dsw-alias-label-secondary,#6c6a64);margin-top:4px}",
		].join("");

		/* A phone outline, drawn inline so the row needs no icon package. */
		function PhoneIcon() {
			return h(
				"svg",
				{
					width: 15, height: 15, viewBox: "0 0 24 24", fill: "none",
					stroke: "currentColor", strokeWidth: 1.8,
					strokeLinecap: "round", strokeLinejoin: "round",
					"aria-hidden": "true",
				},
				h("rect", { x: 7, y: 2.5, width: 10, height: 19, rx: 2.4 }),
				h("line", { x1: 11, y1: 18.4, x2: 13, y2: 18.4 }),
			);
		}

		async function requestJson(url, options) {
			var response = await fetch(url, Object.assign({ credentials: "same-origin" }, options || {}));
			var body = await response.json().catch(function () { return null; });
			return { ok: response.ok, status: response.status, body: body };
		}

		/** The panel: bind switch, QR, and the authenticated URL as text. */
		function LanPanel(props) {
			var state = React.useState(null);
			var info = state[0];
			var setInfo = state[1];
			var errState = React.useState("");
			var error = errState[0];
			var setError = errState[1];
			var busyState = React.useState(false);
			var busy = busyState[0];
			var setBusy = busyState[1];

			function load() {
				requestJson(ROUTE_STATUS).then(function (result) {
					if (!result.ok || !result.body || result.body.ok !== true) {
						setError("状态读取失败");
						return;
					}
					setError("");
					setInfo(result.body);
				}).catch(function () { setError("状态读取失败"); });
			}

			React.useEffect(load, []);

			function toggle(enabled) {
				setBusy(true);
				requestJson(ROUTE_SET, {
					method: "POST",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ enabled: enabled }),
				}).then(function (result) {
					setBusy(false);
					if (!result.ok || !result.body || result.body.ok !== true) {
						setError("写入失败：" + ((result.body && result.body.error) || result.status));
						return;
					}
					setError("");
					load();
				}).catch(function () { setBusy(false); setError("写入失败"); });
			}

			var body = [];

			// The QR, when a URL could be minted.
			if (info && info.reachable && info.url) {
				body.push(h("div", { className: "dla-label", key: "l1" }, "扫码打开"));
				body.push(
					h(
						"div",
						{ className: "dla-qr", key: "qr" },
						h(QrImage, { text: info.url }),
					),
				);
				body.push(h("div", { className: "dla-url", key: "u" }, info.url));
				body.push(
					h("div", { className: "dla-note", key: "n1" },
						"手机需与本机在同一网络。扫开后就是完整的 DSH 界面，没有第二个 App。"),
				);
			} else if (info) {
				body.push(h("div", { className: "dla-label", key: "l1" }, "还没打开局域网访问"));
				body.push(
					h("div", { className: "dla-note", key: "n2" },
						"下面打开开关并重启 DSH，这里就会出现二维码。"),
				);
			} else {
				body.push(h("div", { className: "dla-note", key: "n3" }, "读取中…"));
			}

			// The switch.
			if (info) {
				var enabled = info.bindHost === "0.0.0.0";
				body.push(
					h(
						"div",
						{ className: "dla-row", key: "row" },
						h(
							"label",
							{ className: "dla-switch" },
							h("input", {
								type: "checkbox",
								checked: enabled,
								disabled: busy,
								onChange: function (e) { toggle(e.target.checked); },
							}),
							h("span", null, "局域网访问"),
						),
					),
				);
				if (info.loopback && info.pendingBind === "0.0.0.0") {
					body.push(
						h("div", { className: "dla-note", key: "pr" },
							"配置已写入。重启 DSH 后生效。"),
					);
				}
				if (!info.loopback && info.pendingBind !== "0.0.0.0") {
					body.push(
						h("div", { className: "dla-note", key: "pr2" },
							"当前是局域网绑定，但开关已关。重启 DSH 后回到仅本机。"),
					);
				}
				if (info.addresses && info.addresses.length) {
					body.push(
						h("div", { className: "dla-addr", key: "a" },
							info.addresses.map(function (a) { return a.address; }).join("  ·  ")),
					);
				}

				if (enabled || info.pendingBind === "0.0.0.0") {
					body.push(
						h("div", { className: "dla-warn", key: "w" },
							"打开后，能连到 " + (info.port || 3080) + " 端口的人就能控制这台机器上的 agent。" +
							"这条链接本身就是凭证，别发给别人。只在可信网络里开。"),
					);
				}
			}

			if (error) {
				body.push(h("div", { className: "dla-warn", key: "err" }, error));
			}

			var close = h(
				"button",
				{ className: "dla-btn2", type: "button", onClick: props.onClose, key: "c" },
				"关闭",
			);
			if (info && info.reachable && info.url) {
				body.push(
					h("div", { className: "dla-row", key: "foot" },
						h("button", {
							className: "dla-btn2 primary", type: "button",
							onClick: function () {
								try { navigator.clipboard.writeText(info.url); } catch (e) { /* no clipboard */ }
							},
						}, "复制链接"),
						close),
				);
			} else {
				body.push(h("div", { className: "dla-row", key: "foot2" }, close));
			}

			var card = h(
				"div",
				{ className: "dla-card" },
				h(
					"div",
					{ className: "dla-head" },
					h("span", { className: "dla-dot" }),
					h("span", null, "手机访问"),
				),
				h("div", { className: "dla-body" }, body),
			);

			return h(
				"div",
				{
					className: "dla-scrim",
					role: "dialog",
					"aria-modal": "true",
					"aria-label": "手机访问",
					onClick: function (e) { if (e.target === e.currentTarget) props.onClose(); },
				},
				card,
			);
		}

		/**
		 * Draw a QR code client-side.
		 *
		 * The host half already ships `lib/qr.js`, but a browser half cannot
		 * import from the host's module graph, and shipping a second copy of the
		 * encoder into the client bundle would double the surface for no gain.
		 * So the matrix is fetched once per URL from the host route instead --
		 * one small JSON payload, cached per URL in this closure.
		 */
		var matrixCache = {};
		function QrImage(props) {
			var state = React.useState(matrixCache[props.text] || null);
			var matrix = state[0];
			var setMatrix = state[1];

			React.useEffect(function () {
				if (matrixCache[props.text]) {
					setMatrix(matrixCache[props.text]);
					return;
				}
				var cancelled = false;
				requestJson("/api/dsh-lan-access/qr?text=" + encodeURIComponent(props.text))
					.then(function (result) {
						if (cancelled || !result.ok || !result.body || !result.body.rows) return;
						matrixCache[props.text] = result.body.rows;
						setMatrix(result.body.rows);
					})
					.catch(function () { /* the panel shows the URL text regardless */ });
				return function () { cancelled = true; };
			}, [props.text]);

			if (!matrix) return h("div", { style: { width: 200, height: 200 } });
			var rows = matrix;
			var n = rows.length;
			var cells = [];
			for (var r = 0; r < n; r++) {
				for (var c = 0; c < n; c++) {
					if (rows[r][c] === "1") cells.push(r + "," + c);
				}
			}
			return h(
				"svg",
				{ viewBox: "0 0 " + n + " " + n, shapeRendering: "crispEdges" },
				h("rect", { width: n, height: n, fill: "#fff" }),
				h(
					"g",
					{ fill: "#000" },
					cells.map(function (key) {
						var parts = key.split(",");
						return h("rect", { key: key, x: +parts[1], y: +parts[0], width: 1, height: 1 });
					}),
				),
			);
		}

		/** The sidebar-foot entry. */
		function LanEntry(props) {
			var state = React.useState(false);
			var open = state[0];
			var setOpen = state[1];
			var wide = props && props.wide;

			return h(
				React.Fragment,
				null,
				h(
					"button",
					{
						type: "button",
						className: "dla-btn",
						"data-rail": wide ? "0" : "1",
						title: "手机访问",
						"aria-label": "手机访问",
						onClick: function () { setOpen(true); },
					},
					h(PhoneIcon),
					wide ? h("span", null, "手机访问") : null,
				),
				open ? h(LanPanel, { onClose: function () { setOpen(false); } }) : null,
			);
		}

		function apply(ctx) {
			ctx.effect(function () {
				var el = document.createElement("style");
				el.id = "dsh-lan-access:styles";
				el.textContent = CSS;
				document.head.appendChild(el);
				return function () { if (el.parentNode) el.parentNode.removeChild(el); };
			}, "dsh-lan-access:styles");

			var slots = ctx.get("slots");
			if (slots === undefined) return;

			slots.inject("sidebar.footer.action", function () {
				try {
					return slots.register(
						{ name: "sidebar.footer.action", id: "lan-access", order: 20 },
						LanEntry,
					);
				} catch (e) {
					return function () {};
				}
			});
		}

		exports.name = "dsh-lan-access";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	},
});
