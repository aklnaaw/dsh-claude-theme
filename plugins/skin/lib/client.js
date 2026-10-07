window.__ModuleLoader__.load({
	id: "dsh-claude-skin",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var h = React.createElement;

		var ROUTE_SKINS = "/api/dsh-claude-skin/skins";
		var ROUTE_ACTIVE = "/api/dsh-claude-skin/active";

		/* ------------------------------------------------------------------
		 * Display name.
		 *
		 * The name and the caption live in the same browser-local record that
		 * dsh-claude-brand owns (`dsh-claude-brand.prefs`), because that is the
		 * record the greeting and the sidebar foot already read. Two plugins
		 * cannot share a module scope, so the record is the shared state and a
		 * window event is the shared notification: whoever writes announces it,
		 * whoever displays listens. Nothing is uploaded anywhere.
		 * ------------------------------------------------------------------ */
		var PREFS_KEY = "dsh-claude-brand.prefs";
		var PREFS_EVENT = "dsh-claude-brand:prefs";

		/** What the greeting shows before anyone has chosen a name. */
		var DEFAULT_NAME = "moon";

		/* ------------------------------------------------------------------
		 * The Anthropic / Claude radial starburst, viewBox 0 0 24 24 — the
		 * placeholder for "no avatar chosen", matching the brand plugin.
		 * ------------------------------------------------------------------ */
		var STARBURST = "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

		function Mark(props) {
			var size = (props && props.size) || 24;
			return h(
				"svg",
				{
					width: size, height: size, viewBox: "0 0 24 24",
					fill: "currentColor", role: "img", "aria-label": "Claude", focusable: "false",
				},
				h("path", { d: STARBURST }),
			);
		}

		/* Everything is expressed with the official tokens, so the page follows
		 * whatever theme is active instead of hard-coding the Claude palette. */
		var CSS = [
			".dcs-sec{display:flex;flex-direction:column;gap:22px;padding:4px 0 8px}",
			".dcs-row{display:flex;flex-direction:column;gap:8px}",
			".dcs-lbl{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
			".dcs-hint{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-tertiary)}",
			".dcs-err{font-size:12px;line-height:1.5;color:var(--dsw-alias-label-secondary)}",
			".dcs-in{",
			"font-family:var(--dsw-font-family,inherit);font-size:14px;",
			"padding:8px 12px;border-radius:10px;box-sizing:border-box;width:100%;",
			"border:1px solid var(--dsw-alias-border-l2);outline:none;",
			"background:transparent;color:var(--dsw-alias-label-primary)}",
			".dcs-in:focus{border-color:var(--dsw-alias-brand-primary)}",
			".dcs-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(148px,1fr));gap:8px}",
			".dcs-item{",
			"display:flex;align-items:center;gap:9px;padding:9px 11px;",
			"border-radius:10px;cursor:pointer;text-align:left;min-width:0;",
			"font-family:inherit;font-size:13px;",
			"color:var(--dsw-alias-label-primary);",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcs-item:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dcs-item[data-on='1']{border-color:var(--dsw-alias-brand-primary)}",
			".dcs-item:disabled{cursor:default;opacity:.6}",
			".dcs-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dcs-dot{",
			"width:9px;height:9px;border-radius:50%;flex:none;",
			"background:var(--dsw-alias-border-l3)}",
			".dcs-item[data-on='1'] .dcs-dot{background:var(--dsw-alias-brand-primary)}",
			".dcs-avrow{display:flex;align-items:center;gap:14px}",
			".dcs-av{",
			"width:56px;height:56px;border-radius:50%;flex:none;overflow:hidden;",
			"display:grid;place-items:center;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcs-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcs-av svg{opacity:.45}",
			".dcs-mini{",
			"font-family:inherit;font-size:12px;cursor:pointer;",
			"padding:6px 11px;border-radius:8px;",
			"color:var(--dsw-alias-label-primary);background:transparent;",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcs-mini:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dcs-toggle{display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--dsw-alias-label-primary)}",
			".dcs-toggle input{accent-color:var(--dsw-alias-brand-primary)}",
		].join("");

		/* ------------------------------------------------------------------
		 * The shared preference record.
		 *
		 * Reads return the raw stored object (or null when nobody has written
		 * one). They deliberately do NOT invent defaults: the writer merges one
		 * field at a time, so a reader that materialised defaults here would
		 * silently drop every field it did not know about.
		 * ------------------------------------------------------------------ */
		function readRaw() {
			try {
				if (typeof localStorage === "undefined") return null;
				var raw = localStorage.getItem(PREFS_KEY);
				if (raw === null) return null;
				var parsed = JSON.parse(raw);
				if (typeof parsed !== "object" || parsed === null) return null;
				return parsed;
			} catch (e) {
				return null;
			}
		}

		function notifyAll() {
			try {
				window.dispatchEvent(new CustomEvent(PREFS_EVENT));
			} catch (e) { /* no window (never in a real page); the UI still updates */ }
		}

		/** Merge one patch over what is stored, then announce the change. */
		function writePrefs(patch) {
			var next = readRaw() || {};
			if (typeof patch.name === "string") next.name = patch.name.slice(0, 24);
			if (typeof patch.sub === "string") next.sub = patch.sub.slice(0, 32);
			if (typeof patch.avatar === "string") next.avatar = patch.avatar;
			if (typeof patch.showProfile === "boolean") next.showProfile = patch.showProfile;
			try {
				if (typeof localStorage !== "undefined") {
					localStorage.setItem(PREFS_KEY, JSON.stringify(next));
				}
			} catch (e) { /* storage full or blocked; the UI still updates */ }
			notifyAll();
		}

		function subscribe(fn) {
			window.addEventListener(PREFS_EVENT, fn);
			return function () { window.removeEventListener(PREFS_EVENT, fn); };
		}

		function usePrefs() {
			var pair = React.useState(readRaw);
			var raw = pair[0], setRaw = pair[1];
			React.useEffect(function () {
				return subscribe(function () { setRaw(readRaw()); });
			}, []);
			return raw;
		}

		/* ------------------------------------------------------------------
		 * The host half owns the skin directory, so the list, the active id and
		 * the switch itself all come from it. Switching reloads: the stylesheet
		 * is contributed to the page at index render time, so the new skin is
		 * picked up on the next document rather than patched in place.
		 * ------------------------------------------------------------------ */
		function fetchSkins() {
			return fetch(ROUTE_SKINS, { credentials: "same-origin" })
				.then(function (r) { return r.ok ? r.json() : null; })
				.catch(function () { return null; });
		}

		function activate(id) {
			return fetch(ROUTE_ACTIVE, {
				method: "POST",
				credentials: "same-origin",
				headers: { "content-type": "application/json" },
				body: JSON.stringify({ id: id }),
			})
				.then(function (r) { return r.ok ? r.json() : null; })
				.catch(function () { return null; });
		}

		function Avatar(props) {
			var prefs = props.prefs || {};
			if (prefs.avatar) return h("img", { src: prefs.avatar, alt: "" });
			return h(Mark, { size: Math.round(props.size || 24) });
		}

		function SkinSection() {
			var listState = React.useState(null);
			var list = listState[0], setList = listState[1];
			var errState = React.useState("");
			var error = errState[0], setError = errState[1];
			var busyState = React.useState("");
			var busy = busyState[0], setBusy = busyState[1];

			var prefs = usePrefs() || {};
			var nameState = React.useState("");
			var name = nameState[0], setName = nameState[1];
			var subState = React.useState("");
			var sub = subState[0], setSub = subState[1];
			var fileRef = React.useRef(null);

			React.useEffect(function () {
				var alive = true;
				fetchSkins().then(function (data) {
					if (!alive) return;
					if (data === null) {
						setError("读不到皮肤列表：宿主半边没有响应。");
						return;
					}
					setError("");
					setList(data);
				});
				return function () { alive = false; };
			}, []);

			/* Follow the stored record, including edits made in the sidebar
			 * foot popover, which writes the same fields. */
			React.useEffect(function () {
				setName(typeof prefs.name === "string" ? prefs.name : DEFAULT_NAME);
			}, [prefs.name]);
			React.useEffect(function () {
				setSub(typeof prefs.sub === "string" ? prefs.sub : "");
			}, [prefs.sub]);

			function choose(id) {
				if (busy) return;
				if (list && list.active === id) return;
				setBusy(id);
				setError("");
				activate(id).then(function (result) {
					if (result && result.ok) {
						window.location.reload();
						return;
					}
					setBusy("");
					setError((result && result.error) || "切换失败。");
				});
			}

			function commitName(value) {
				var trimmed = value.trim().slice(0, 24);
				setName(trimmed);
				writePrefs({ name: trimmed });
			}

			function commitSub(value) {
				var trimmed = value.trim().slice(0, 32);
				setSub(trimmed);
				writePrefs({ sub: trimmed });
			}

			/* The avatar is a data URL rather than a file reference: there is no
			 * upload endpoint here, and the browser must be able to paint it on
			 * the next load with no server involved. */
			function pickAvatar(event) {
				var file = event.target.files && event.target.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () { writePrefs({ avatar: String(reader.result) }); };
				reader.readAsDataURL(file);
				event.target.value = "";
			}

			var activeId = list && list.active;
			var skins = (list && list.skins) || [];

			return h(
				"div",
				{ className: "dcs-sec" },

				h(
					"div",
					{ className: "dcs-row" },
					h("div", { className: "dcs-lbl" }, "皮肤"),
					skins.length > 0
						? h(
								"div",
								{ className: "dcs-grid" },
								skins.map(function (skin) {
									return h(
										"button",
										{
											key: skin.id,
											type: "button",
											className: "dcs-item",
											"data-on": skin.id === activeId ? "1" : "0",
											disabled: busy !== "",
											onClick: function () { choose(skin.id); },
										},
										h("span", { className: "dcs-dot" }),
										h("span", null, skin.label),
									);
								}),
							)
						: h("div", { className: "dcs-hint" }, "正在读取已安装的皮肤…"),
					h(
						"div",
						{ className: "dcs-hint" },
						"读取 $DSH_HOME/skins/ 下的皮肤目录，切换后页面重新加载。",
					),
					error ? h("div", { className: "dcs-err" }, error) : null,
				),

				h(
					"div",
					{ className: "dcs-row" },
					h("div", { className: "dcs-lbl" }, "名字"),
					h("input", {
						className: "dcs-in",
						type: "text",
						value: name,
						maxLength: 24,
						placeholder: "留空则只显示问候语",
						onChange: function (e) { commitName(e.target.value); },
					}),
					h(
						"div",
						{ className: "dcs-hint" },
						"只用于首页问候语和侧栏底部，存在这台浏览器里，不会上传到任何地方。",
					),
				),

				h(
					"div",
					{ className: "dcs-row" },
					h("div", { className: "dcs-lbl" }, "副标题"),
					h("input", {
						className: "dcs-in",
						type: "text",
						value: sub,
						maxLength: 32,
						placeholder: "名字下面那行小字，可留空",
						onChange: function (e) { commitSub(e.target.value); },
					}),
				),

				h(
					"div",
					{ className: "dcs-row" },
					h("div", { className: "dcs-lbl" }, "头像"),
					h(
						"div",
						{ className: "dcs-avrow" },
						h("div", { className: "dcs-av" }, h(Avatar, { prefs: prefs, size: 30 })),
						h(
							"div",
							{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
							h(
								"button",
								{
									type: "button",
									className: "dcs-mini",
									onClick: function () { if (fileRef.current) fileRef.current.click(); },
								},
								"选择图片",
							),
							prefs.avatar
								? h(
										"button",
										{ type: "button", className: "dcs-mini", onClick: function () { writePrefs({ avatar: "" }); } },
										"移除",
									)
								: null,
							h("input", {
								ref: fileRef,
								type: "file",
								accept: "image/*",
								style: { display: "none" },
								onChange: pickAvatar,
							}),
						),
					),
					h("div", { className: "dcs-hint" }, "不选的话显示 Claude 星芒。图片以数据形式存在本地。"),
				),

				h(
					"div",
					{ className: "dcs-row" },
					h("div", { className: "dcs-lbl" }, "侧栏底部那行"),
					h(
						"label",
						{ className: "dcs-toggle" },
						h("input", {
							type: "checkbox",
							checked: prefs.showProfile !== false,
							onChange: function (e) { writePrefs({ showProfile: e.target.checked }); },
						}),
						h("span", null, "显示头像和名字"),
					),
					h(
						"div",
						{ className: "dcs-hint" },
						"关掉后侧栏底部就不放这行了；名字和头像的数据还在，随时能开回来。",
					),
				),
			);
		}

		var STYLE_ID = "dsh-claude-skin:styles";

		/* ==================================================================
		 * "Request fingerprint" -- the second easter egg.
		 *
		 * This is a joke about the June 2026 Claude Code finding: CC silently
		 * classified requests by reading the system time zone, and hid the
		 * verdict in the system prompt by swapping one character -- the
		 * apostrophe in "Today's" became U+2019, and the date separator turned
		 * from "-" into "/". Nobody could see it; that was the point.
		 *
		 * The reconstruction here is faithful to the published analysis:
		 *
		 *     let cnTZ = timezone === "Asia/Shanghai" || timezone === "Asia/Urumqi";
		 *     let rendered = cnTZ ? date.replaceAll("-", "/") : date;
		 *     `Today${apostrophe}s date is ${rendered}.`
		 *
		 * Two deliberate departures, both for the joke:
		 *
		 *   1. The value written into the box is always `Asia/Shanghai`,
		 *      whatever the machine actually reports. That is the whole gag --
		 *      CC decided where you were from a setting you never chose, so
		 *      this decides for you too. The panel shows both, so the real
		 *      zone is never hidden from you.
		 *   2. Nothing leaves the page. Every value comes from `Intl`, which
		 *      the browser hands to any script, and the result is only drawn.
		 *      No request is made and no storage is written beyond the
		 *      cooldown stamp.
		 *
		 * The switch is shared with the crab's easter egg on purpose: both are
		 * the same kind of joke, so one switch turns both off. They keep
		 * separate cooldowns so neither can eat the other's turn.
		 * ================================================================== */

		var EGG_STORE = "dsh-claude-skin.egg";        /* cooldown stamp */
		var EGG_SWITCH_KEY = "dsh-claude-crab.prefs"; /* the shared switch */
		var EGG_SWITCH_FIELD = "mystery";
		var EGG_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
		var EGG_TRIGGER = "TZ=";
		var EGG_TZ = "Asia/Shanghai";

		/** The shared switch. Absent or unreadable means on, matching the crab. */
		function eggEnabled() {
			try {
				if (typeof localStorage === "undefined") return true;
				var raw = localStorage.getItem(EGG_SWITCH_KEY);
				if (raw === null) return true;
				var parsed = JSON.parse(raw);
				if (parsed && typeof parsed[EGG_SWITCH_FIELD] === "boolean") {
					return parsed[EGG_SWITCH_FIELD];
				}
				return true;
			} catch (e) { return true; }
		}

		function eggOnCooldown() {
			try {
				if (typeof localStorage === "undefined") return false;
				var raw = localStorage.getItem(EGG_STORE);
				if (raw === null) return false;
				var t = parseInt(raw, 10);
				return isFinite(t) && t > 0 && Date.now() - t < EGG_COOLDOWN_MS;
			} catch (e) { return false; }
		}

		function eggStamp() {
			try {
				if (typeof localStorage !== "undefined") {
					localStorage.setItem(EGG_STORE, String(Date.now()));
				}
			} catch (e) { /* storage blocked: it may reappear, which is harmless */ }
		}

		/** What the machine actually reports. Nothing else is consulted. */
		function realTimeZone() {
			try {
				return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
			} catch (e) { return ""; }
		}

		/**
		 * The apostrophe CC picked, from the published `edp()`:
		 * `'` when nothing matched, `U+2019` for a known gateway host,
		 * `U+02BC` for a lab keyword, `U+02B9` for both. Only the time-zone
		 * branch is reproduced here, so the plain and cnTZ cases are the two
		 * that can occur.
		 */
		function apostropheFor(cnTZ) {
			return cnTZ ? "\u2019" : "'";
		}

		/** `Today’s date is 2026/10/06.` -- with the real substitution applied. */
		function fingerprintLine(cnTZ) {
			var now = new Date();
			var iso = now.getFullYear() + "-" +
				String(now.getMonth() + 1).padStart(2, "0") + "-" +
				String(now.getDate()).padStart(2, "0");
			var rendered = cnTZ ? iso.replace(/-/g, "/") : iso;
			return "Today" + apostropheFor(cnTZ) + "s date is " + rendered + ".";
		}

		/** Human name for one Unicode scalar, for the panel's code-point row. */
		function codePointOf(ch) {
			var n = ch.codePointAt(0);
			return "U+" + n.toString(16).toUpperCase().padStart(4, "0");
		}

		var EGG_CSS = [
			".dcs-fp{position:fixed;inset:0;z-index:2147483000;display:flex;",
			"align-items:center;justify-content:center;padding:20px;overflow:auto;",
			"background:rgba(20,20,19,.34);-webkit-backdrop-filter:blur(10px);",
			"backdrop-filter:blur(10px);",
			"font-family:var(--dsw-font-family,-apple-system,sans-serif)}",

			".dcs-fp-card{width:100%;max-width:520px;",
			"background:var(--dsw-alias-bg-overlay,#faf9f5);",
			"color:var(--dsw-alias-label-primary,#141413);",
			"border:1px solid var(--dsw-alias-border-l2,#e6dfd8);border-radius:12px;",
			"overflow:hidden;box-shadow:0 30px 70px -16px rgba(0,0,0,.34)}",

			".dcs-fp-head{display:flex;align-items:center;gap:9px;padding:12px 20px;",
			"border-bottom:1px solid var(--dsw-alias-border-l1,#ebe6df);font-size:13px;",
			"font-weight:500}",

			".dcs-fp-dot{width:7px;height:7px;border-radius:50%;flex:none;",
			"background:var(--dsw-alias-brand-primary,#d97757)}",

			".dcs-fp-body{padding:18px 20px 20px}",

			/* The prompt line is the payload, so it gets the monospace treatment. */
			".dcs-fp-code{font-family:'JetBrains Mono',ui-monospace,monospace;",
			"font-size:13px;line-height:1.75;padding:14px 16px;border-radius:8px;",
			"background:var(--dsw-alias-bg-layer-1,#f5f0e8);",
			"border:1px solid var(--dsw-alias-border-l1,#ebe6df);",
			"white-space:pre-wrap;overflow-wrap:anywhere}",

			".dcs-fp-rows{margin-top:14px;font-size:13px;line-height:1.9;",
			"font-family:'JetBrains Mono',ui-monospace,monospace}",

			".dcs-fp-row{display:flex;gap:10px}",
			".dcs-fp-key{width:112px;flex:none;",
			"color:var(--dsw-alias-label-tertiary,#8a8781)}",
			".dcs-fp-val{color:var(--dsw-alias-label-primary,#141413)}",

			/* The point of the whole panel: the two apostrophes look identical. */
			".dcs-fp-mark{padding:0 4px;border-radius:3px;",
			"background:var(--dsw-alias-brand-primary,#d97757);color:#fff}",

			".dcs-fp-note{margin-top:16px;padding-top:13px;font-size:12px;line-height:1.6;",
			"border-top:1px solid var(--dsw-alias-border-l1,#ebe6df);",
			"color:var(--dsw-alias-label-tertiary,#8a8781)}",

			".dcs-fp-btn{margin-top:16px;font:inherit;font-size:13.5px;font-weight:500;",
			"padding:8px 18px;border-radius:999px;cursor:pointer;border:0;",
			"background:var(--dsw-alias-brand-primary,#d97757);color:#fff}",

			/* Clawd, perched on the card's top edge.
			 *
			 * The sprite is the real one: the same 16x12 dot matrix the crab
			 * plugin paints, drawn the same way (box-shadow on a 3px cell), so
			 * it is unmistakably the same character rather than a lookalike.
			 *
			 * It hangs off the TOP of a wrapper rather than sitting inside the
			 * card: the card clips its own rounded corners with
			 * `overflow:hidden`, so a sprite inside it loses its head. The
			 * wrapper is positioned to match the card and lets the crab spill
			 * upward; the legs that overlap the card are covered by the card
			 * itself, which is what makes it read as gripping the edge.
			 *
			 * `top` is half the sprite, so the visible half is the head and
			 * the claws; the lower body sits behind the card. */
			".dcs-fp-perch{position:absolute;top:-18px;left:28px;width:48px;height:36px;",
			"pointer-events:none;z-index:2;",
			"--fp-crab-body:var(--dsw-alias-brand-primary,#d97757);",
			"--fp-crab-eye:var(--dsw-alias-bg-overlay,#faf9f5)}",

			/* The card and its passenger, sized together so the crab's offset is
			 * measured against the same box the card occupies. */
			".dcs-fp-stack{position:relative;width:100%;max-width:520px}",

			".dcs-fp-perch i{position:absolute;left:0;top:0;width:3px;height:3px;",
			"background:transparent;transform-origin:0 0;transform:scale(1)}",

			/* A slow lean, as if it is reading the panel over your shoulder. */
			"@keyframes dcs-fp-lean{",
			"0%,100%{transform:rotate(-2deg) translateY(0)}",
			"50%{transform:rotate(2.5deg) translateY(-1px)}}",

			".dcs-fp-perch{animation:dcs-fp-lean 3.4s ease-in-out infinite;",
			"transform-origin:center bottom}",

			"@media (prefers-reduced-motion:reduce){.dcs-fp-perch{animation:none}}",
		].join("");

		var fpScrim = null;

		/* ------------------------------------------------------------------
		 * Clawd, for the panel's edge.
		 *
		 * Copied from the crab plugin's FRAMES.open, cell for cell: the same
		 * 16x12 dot matrix on the same 3px grid, painted as box-shadow so it
		 * needs no image. It is duplicated rather than imported because the
		 * two plugins deliberately share no module scope -- the record in
		 * localStorage is their only channel, and reaching across for one
		 * sprite would couple a skin to a pet.
		 *
		 * '.' empty, '#' body, 'E' eye. FRAMES.open, verbatim.
		 * ------------------------------------------------------------------ */
		var FP_CRAB = [
			"................",
			"................",
			"..############..",
			"..############..",
			"..##E######E##..",
			"..##E######E##..",
			"..############..",
			"################",
			"################",
			"..############..",
			"...#.#....#.#...",
			"...#.#....#.#...",
		];
		var FP_CELL = 3;

		/** Build the crab: two stacked cells, body under eyes. */
		function fpCrab() {
			var host = fpEl("div", "dcs-fp-perch");
			host.setAttribute("aria-hidden", "true");
			var body = [], eye = [];
			for (var y = 0; y < FP_CRAB.length; y++) {
				for (var x = 0; x < FP_CRAB[y].length; x++) {
					var ch = FP_CRAB[y][x];
					if (ch === ".") continue;
					/* The frame's own art starts two rows down; keeping the
					 * offset means the crab sits at the same height here as it
					 * does in the composer. */
					var v = (x * FP_CELL) + "px " + ((y - 2) * FP_CELL) + "px 0 .3px ";
					if (ch === "E") eye.push(v + "var(--fp-crab-eye)");
					else body.push(v + "var(--fp-crab-body)");
				}
			}
			var mk = function (list) {
				var i = fpEl("i");
				i.style.boxShadow = list.join(",");
				return i;
			};
			host.appendChild(mk(body));
			host.appendChild(mk(eye));
			return host;
		}

		/* Recording mode, off by default. While on, the cooldown neither blocks
		 * the trigger nor records a visit, so `TZ=` can be demonstrated again
		 * and again without waiting a week or leaving state behind. Off the
		 * console it cannot be reached: the helper below is the only switch. */
		var fpRecording = false;

		function fpEl(tag, cls, text) {
			var n = document.createElement(tag);
			if (cls) n.className = cls;
			if (text !== undefined && text !== null) n.textContent = text;
			return n;
		}

		function fpRow(key, value, highlight) {
			var row = fpEl("div", "dcs-fp-row");
			row.appendChild(fpEl("span", "dcs-fp-key", key));
			var val = fpEl("span", "dcs-fp-val");
			if (highlight) {
				var mark = fpEl("span", "dcs-fp-mark", value);
				val.appendChild(mark);
			} else {
				val.textContent = value;
			}
			row.appendChild(val);
			return row;
		}

		function fpClose() {
			if (fpScrim !== null && fpScrim.parentNode) {
				fpScrim.parentNode.removeChild(fpScrim);
			}
			fpScrim = null;
			document.removeEventListener("keydown", fpKey, true);
		}

		function fpKey(e) {
			if (e.key === "Escape") { e.preventDefault(); fpClose(); }
		}

		/**
		 * Draw the panel. `force` skips both the switch and the cooldown, which
		 * is what the console helper uses while the joke is being recorded.
		 */
		function fpOpen(force) {
			if (fpScrim !== null) return false;
			if (!force) {
				if (!eggEnabled()) return false;
				/* Recording mode disables the cooldown so the joke can be
				 * demonstrated repeatedly. It does NOT stamp, so turning it
				 * off leaves the real cooldown untouched. */
				if (!fpRecording && eggOnCooldown()) return false;
			}
			if (!fpRecording) eggStamp();

			var real = realTimeZone();
			/* The joke decides; the panel reports. */
			var cnTZ = EGG_TZ === "Asia/Shanghai" || EGG_TZ === "Asia/Urumqi";
			var apos = apostropheFor(cnTZ);

			fpScrim = fpEl("div", "dcs-fp");
			fpScrim.setAttribute("role", "dialog");
			fpScrim.setAttribute("aria-modal", "true");
			fpScrim.setAttribute("aria-label", "Request fingerprint");

			var card = fpEl("div", "dcs-fp-card");

			var head = fpEl("div", "dcs-fp-head");
			head.appendChild(fpEl("span", "dcs-fp-dot"));
			head.appendChild(fpEl("span", null, "Request fingerprint"));
			card.appendChild(head);

			var body = fpEl("div", "dcs-fp-body");

			/* The system-prompt line, with the real substitution applied. */
			body.appendChild(fpEl("div", "dcs-fp-code", fingerprintLine(cnTZ)));

			var rows = fpEl("div", "dcs-fp-rows");
			rows.appendChild(fpRow("timeZone", real || "(unavailable)"));
			rows.appendChild(fpRow("TZ", EGG_TZ));
			rows.appendChild(fpRow("cnTZ", String(cnTZ)));
			rows.appendChild(fpRow("apostrophe", apos + "  " + codePointOf(apos), true));
			rows.appendChild(fpRow("dateSep", cnTZ ? "- \u2192 /" : "- (unchanged)"));
			body.appendChild(rows);

			body.appendChild(fpEl("div", "dcs-fp-note",
				"Read locally from Intl. Nothing was sent anywhere, and nothing " +
				"was written outside this browser."));

			var close = fpEl("button", "dcs-fp-btn", "知道了");
			close.type = "button";
			close.addEventListener("click", fpClose);
			body.appendChild(close);

			card.appendChild(body);

			/* The crab rides just outside the card, because the card clips its
			 * own rounded corners with `overflow:hidden` and a sprite inside
			 * would lose its head. Sharing one positioned wrapper gives the
			 * crab an offset measured against the card's top edge. */
			var stack = fpEl("div", "dcs-fp-stack");
			stack.appendChild(fpCrab());
			stack.appendChild(card);

			fpScrim.appendChild(stack);
			document.body.appendChild(fpScrim);
			document.addEventListener("keydown", fpKey, true);
			close.focus();
			return true;
		}

		/**
		 * Console helper, for recording the joke without waiting out a
		 * week-long cooldown:
		 *
		 *   __claudeFootprint()          show it now
		 *   __claudeFootprint.record()   let `TZ=` fire every time, no cooldown
		 *   __claudeFootprint.stop()     back to normal
		 *   __claudeFootprint.reset()    clear the cooldown stamp
		 *
		 * Deliberately not surfaced in any settings page: the easter egg should
		 * not advertise itself, and this is a recording aid, not a feature.
		 */
		function installFootprintHelper() {
			if (typeof window === "undefined") return;
			var helper = function () { return fpOpen(true); };
			helper.record = function () { fpRecording = true; return "recording"; };
			helper.stop = function () { fpRecording = false; return "normal"; };
			helper.reset = function () {
				try {
					if (typeof localStorage !== "undefined") {
						localStorage.removeItem(EGG_STORE);
					}
				} catch (e) { /* nothing to clear */ }
				return "cleared";
			};
			helper.show = helper;
			window.__claudeFootprint = helper;
		}

		/* ------------------------------------------------------------------
		 * The trigger.
		 *
		 * Rides the official session slot so the draft can be read and written
		 * through the documented `useInput` / `inputActions` pair rather than
		 * by poking at the Lexical editor. The component renders nothing; it
		 * exists to receive those two values.
		 * ------------------------------------------------------------------ */
		function FootprintWatcher(props) {
			/* `conversation.input.left` is a session-scope slot, so the renderer
			 * always hands it SessionStandardProps -- `useInput` and
			 * `inputActions` are part of the contract, not optional extras.
			 * They are called unconditionally because a hook behind a
			 * conditional changes the call order between renders, and React
			 * throws when that happens. */
			var draft = props.useInput(function (s) { return s.draft; });
			var actions = props.inputActions;
			/* Remembers the previous draft text rather than a one-shot flag, so
			 * clearing the box and typing the trigger again fires again. A
			 * flag would make the joke a once-per-page-load event and there
			 * would be no way to demonstrate it twice. */
			var last = React.useRef(null);

			React.useEffect(function () {
				if (!actions) return;
				if (typeof draft !== "string") return;
				var was = last.current;
				last.current = draft;
				if (draft.trim() !== EGG_TRIGGER) return;
				/* Only on the transition into the bare trigger, so the setDraft
				 * below (which changes the draft again) cannot re-enter. */
				if (was !== null && was.trim() === EGG_TRIGGER) return;
				var ok = fpOpen(false);
				if (ok) {
					/* Write the value in, as if the shell had completed it. */
					actions.setDraft(EGG_TRIGGER + EGG_TZ);
				}
			});

			return null;
		}

		function apply(ctx) {
			ctx.effect(function () {
				var el = document.createElement("style");
				el.id = STYLE_ID;
				el.textContent = CSS;
				document.head.appendChild(el);
				return function () {
					if (el.parentNode) el.parentNode.removeChild(el);
				};
			}, "dsh-claude-skin:styles");

			/* The fingerprint panel's own sheet, separate from the skin's so a
			 * failure to inject it cannot take the skin down with it. */
			ctx.effect(function () {
				var el = document.createElement("style");
				el.id = "dsh-claude-skin:fingerprint";
				el.textContent = EGG_CSS;
				document.head.appendChild(el);
				return function () {
					if (el.parentNode) el.parentNode.removeChild(el);
					fpClose();
				};
			}, "dsh-claude-skin:fingerprint-styles");

			installFootprintHelper();

			var slots = ctx.get("slots");
			if (slots === undefined) return;

			/* The watcher is a list-slot entry that renders nothing: it takes
			 * the session's input actions and draft, and no visible seat. */
			slots.inject("conversation.input.left", function () {
				try {
					return slots.register(
						{ name: "conversation.input.left", id: "claude-fingerprint" },
						FootprintWatcher,
					);
				} catch (e) {
					return function () {};
				}
			});

			/* One settings page holds both the skin and the display name. The
			 * name used to be its own section; it is a property of this skin's
			 * chrome, so it belongs on this page rather than beside it. */
			/* `id` is the internal key and stays skin-specific, while the label
			 * carries the dashes: "Claude" alone reads like the brand mark this
			 * profile already renders in the sidebar, and this page is about
			 * the skin plus its chrome, not the wordmark. */
			slots.inject("settings.section", function () {
				try {
					return slots.register(
						{ name: "settings.section", id: "claude-skin", order: 50, label: "Claude-X" },
						SkinSection,
					);
				} catch (e) {
					return function () {};
				}
			});
		}

		exports.name = "dsh-claude-skin";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	},
});
