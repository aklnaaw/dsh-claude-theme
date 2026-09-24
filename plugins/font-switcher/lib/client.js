window.__ModuleLoader__.load({
	id: "dsh-font-switcher",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var h = React.createElement;

		/* ------------------------------------------------------------------
		 * How the swap works.
		 *
		 * The skin declares its families as literal names inside 181 composite
		 * tokens -- `--dsw-font-l-20: 400 20px/1.4 'Inter','Noto Sans CJK SC',...`
		 * -- and those values do NOT go through a variable, so there is nothing
		 * to re-point. Rewriting 181 declarations on every switch would be
		 * brittle and would have to be re-done whenever the skin changes.
		 *
		 * Instead we re-declare @font-face under the SAME family name. The
		 * browser lets a later @font-face for a family take over, so
		 * `'Inter'` in every existing token starts resolving to the chosen
		 * file with no token touched at all. Verified against a real browser
		 * before building this: two faces named 'Inter', the second one won.
		 *
		 * Faces must match the weights and styles the skin's tokens ask for, so
		 * each is declared with a full 100..900 range and both normal and
		 * italic. A file that lacks a weight simply synthesises, which is
		 * acceptable for a local convenience switch.
		 * ------------------------------------------------------------------ */

		// The three roles the skin separates, and the family names its tokens use.
		var ROLES = [
			{ key: "serif", family: "Newsreader", label: "正文衬线", hint: "markdown 正文、标题、引用" },
			{ key: "sans", family: "Inter", label: "界面无衬线", hint: "按钮、菜单、标签" },
			{ key: "mono", family: "JetBrains Mono", label: "代码等宽", hint: "代码块、行内代码" },
		];

		var STORE_KEY = "dsh-font-switcher.selection";

		function readSelection() {
			try {
				if (typeof localStorage === "undefined") return {};
				var raw = localStorage.getItem(STORE_KEY);
				if (!raw) return {};
				var parsed = JSON.parse(raw);
				return typeof parsed === "object" && parsed !== null ? parsed : {};
			} catch (e) {
				return {};
			}
		}

		function writeSelection(next) {
			try {
				if (typeof localStorage !== "undefined") {
					localStorage.setItem(STORE_KEY, JSON.stringify(next));
				}
			} catch (e) { /* storage blocked; the page still updates */ }
			notify(next);
		}

		/* Subscribers are React state setters, so the new value is passed in.
		 *
		 * Calling them with no argument ran setValue(undefined); React stored
		 * undefined, and the next render read a property off it and threw,
		 * unmounting the whole settings page on the first selection. The
		 * dropdowns looked frozen. This is the same defect the Clawd plugin
		 * had. */
		var subscribers = new Set();
		function notify(value) {
			subscribers.forEach(function (fn) {
				try { fn(value); } catch (e) { /* detached */ }
			});
		}

		function useSelection() {
			var pair = React.useState(readSelection);
			var value = pair[0], setValue = pair[1];
			React.useEffect(function () {
				subscribers.add(setValue);
				return function () { subscribers.delete(setValue); };
			}, []);
			// Recompute from storage so several mounted surfaces agree.
			return value;
		}

		function subscribe(fn) {
			subscribers.add(fn);
			return function () { subscribers.delete(fn); };
		}

		/* ------------------------------------------------------------------
		 * The injected stylesheet.
		 * ------------------------------------------------------------------ */

		var STYLE_ID = "dsh-font-switcher";

		function faceCss(family, url) {
			// One file serves both styles: the browser synthesises the oblique
			// axis, which is the right trade for a local switch that must not
			// ask the user for an italic file too.
			return (
				"@font-face{font-family:'" + family + "';" +
				"src:url('" + url + "') format('" + formatOf(url) + "');" +
				"font-weight:100 900;font-style:normal;font-display:swap}" +
				"@font-face{font-family:'" + family + "';" +
				"src:url('" + url + "') format('" + formatOf(url) + "');" +
				"font-weight:100 900;font-style:italic;font-display:swap}"
			);
		}

		function formatOf(url) {
			if (/\.woff2(\?|$)/i.test(url)) return "woff2";
			if (/\.woff(\?|$)/i.test(url)) return "woff";
			if (/\.otf(\?|$)/i.test(url)) return "opentype";
			return "truetype";
		}

		function applySelection(manifest, selection) {
			var css = "";
			for (var i = 0; i < ROLES.length; i++) {
				var role = ROLES[i];
				var pick = selection[role.key];
				if (!pick) continue;
				var hit = findFont(manifest, role.key, pick);
				if (!hit) continue;
				css += faceCss(role.family, hit.url);
			}

			var el = document.getElementById(STYLE_ID);
			if (!css) {
				// Nothing chosen: drop the sheet so the skin's own fonts return.
				if (el && el.parentNode) el.parentNode.removeChild(el);
				return;
			}
			if (!el) {
				el = document.createElement("style");
				el.id = STYLE_ID;
				document.head.appendChild(el);
			}
			el.textContent = css;
		}

		/** Resolve a stored pick to a current file entry. */
		function findFont(manifest, roleKey, file) {
			if (!manifest) return null;
			var list = manifest.fonts || [];
			for (var i = 0; i < list.length; i++) if (list[i].file === file) return list[i];
			// The file was removed since it was chosen.
			return null;
		}

		/* ------------------------------------------------------------------
		 * Talking to the host half.
		 * ------------------------------------------------------------------ */

		function fetchManifest() {
			return fetch("/api/dsh-font-switcher/manifest", { credentials: "same-origin" })
				.then(function (r) { return r.ok ? r.json() : null; })
				.catch(function () { return null; });
		}

		/* ------------------------------------------------------------------
		 * Path display.
		 *
		 * The full path is long and mostly machine plumbing — a home directory
		 * and the DSH bookkeeping under it. What a person needs to recognise is
		 * the tail, so the head is dimmed instead of competing with it. Nothing
		 * is hidden: the whole path is still on screen, and on the title for
		 * hovering.
		 * ------------------------------------------------------------------ */

		// Segments at the end that identify the folder to a human.
		var TAIL_SEGMENTS = 4;

		function splitPath(p) {
			if (typeof p !== "string" || !p) return [];
			return p.split("/").filter(function (s) { return s.length > 0; });
		}

		/** The dimmed head. Empty when the path is short enough to show whole. */
		function shortenPath(p) {
			var parts = splitPath(p);
			if (parts.length <= TAIL_SEGMENTS) return "";
			var head = parts.slice(0, parts.length - TAIL_SEGMENTS).join("/");
			// A leading slash was lost in the split; put it back.
			return (p.charAt(0) === "/" ? "/" : "") + head + "/";
		}

		/** The emphasised tail, which is the part worth reading. */
		function tailOfPath(p) {
			var parts = splitPath(p);
			if (parts.length <= TAIL_SEGMENTS) {
				return (p.charAt(0) === "/" ? "/" : "") + parts.join("/");
			}
			return parts.slice(parts.length - TAIL_SEGMENTS).join("/");
		}

		/* ------------------------------------------------------------------
		 * Settings page.
		 * ------------------------------------------------------------------ */

		function FontSection() {
			var selection = useSelection();
			var state = React.useState(null);
			var manifest = state[0], setManifest = state[1];
			var errState = React.useState(null);
			var error = errState[0], setError = errState[1];

			var revealState = React.useState(false);
			var revealing = revealState[0], setRevealing = revealState[1];
			var revealErrState = React.useState(null);
			var revealError = revealErrState[0], setRevealError = revealErrState[1];

			var reload = React.useCallback(function () {
				fetchManifest().then(function (m) {
					if (m === null) { setError("读不到字体清单（host 半边未响应）"); return; }
					setError(null);
					setManifest(m);
				});
			}, []);

			/**
			 * Ask the host to open the folder in the desktop file manager.
			 *
			 * POST, because this opens a window: a GET could be fired by a
			 * prefetch or a link the user did not mean to follow.
			 */
			function openFolder() {
				setRevealing(true);
				setRevealError(null);
				fetch("/api/dsh-font-switcher/reveal", {
					method: "POST",
					credentials: "same-origin",
				})
					.then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
					.then(function (res) {
						setRevealing(false);
						if (res && res.ok) return;
						setRevealError(
							res && res.reason === "no-desktop"
								? "这台机器的 DSH 没有桌面会话，打不开文件管理器。请手动打开上面的路径。"
								: "打开文件夹失败：" + ((res && res.reason) || "未知原因")
						);
					})
					.catch(function () {
						setRevealing(false);
						setRevealError("打开文件夹失败（请求未送达）");
					});
			}

			React.useEffect(function () { reload(); }, [reload]);

			// Re-apply whenever the manifest or the choice changes, so a switch
			// takes effect without a reload.
			React.useEffect(function () {
				applySelection(manifest, selection);
			}, [manifest, selection]);

			function choose(roleKey, file) {
				var next = {};
				var cur = readSelection();
				for (var k in cur) if (Object.prototype.hasOwnProperty.call(cur, k)) next[k] = cur[k];
				if (file) next[roleKey] = file; else delete next[roleKey];
				writeSelection(next);
			}

			/**
			 * Fonts offered for one role, split for the dropdown's group headings.
			 *
			 * `matched` said what they are for, by folder or by file name;
			 * `loose` are the ones nothing could be inferred for. An
			 * unrecognised name must still be listed -- hiding it would make a
			 * dropped file look ignored -- so it appears under a heading that
			 * says the purpose was not recognised.
			 */
			function optionsFor(roleKey) {
				var matched = [], loose = [];
				if (!manifest) return { matched: matched, loose: loose };
				var list = manifest.fonts || [];
				for (var i = 0; i < list.length; i++) {
					var f = list[i];
					if (f.purpose === roleKey) matched.push(f);
					else if (f.purpose === null || f.purpose === undefined) loose.push(f);
				}
				return { matched: matched, loose: loose };
			}

			var rows = ROLES.map(function (role) {
				var opts = optionsFor(role.key);
				var current = selection[role.key] || "";
				// A file that disappeared should not silently pretend to be set.
				var missing = current && !findFont(manifest, role.key, current);

				return h(
					"div",
					{ className: "dfs-row", key: role.key },
					h(
						"div",
						{ className: "dfs-rowhead" },
						h("span", { className: "dfs-lbl" }, role.label),
						h("span", { className: "dfs-hint" }, role.hint),
					),
					h(
						"select",
						{
							className: "dfs-sel",
							value: current,
							onChange: function (e) { choose(role.key, e.target.value); },
						},
						h("option", { value: "" }, "皮肤自带（" + role.family + "）"),

						// Group headings, so it is obvious why a file is in the
						// list: it said so by name or folder, or it did not and
						// is offered anyway.
						opts.matched.length
							? h(
									"optgroup",
									{ label: "识别为" + role.label },
									opts.matched.map(function (o) {
										return h("option", { value: o.file, key: "m-" + o.file }, o.label);
									}),
								)
							: null,
						opts.loose.length
							? h(
									"optgroup",
									{ label: "未识别用途（也可选用）" },
									opts.loose.map(function (o) {
										return h("option", { value: o.file, key: "l-" + o.file }, o.label);
									}),
								)
							: null,
					),
					missing
						? h("div", { className: "dfs-warn" }, "「" + current + "」已不在字体文件夹里，已回退到皮肤自带字体。")
						: null,
				);
			});

			return h(
				"div",
				{ className: "dfs-sec" },
				rows,

				h(
					"div",
					{ className: "dfs-actions" },
					h("button", { type: "button", className: "dfs-btn", onClick: reload }, "重新扫描"),
					// Offered only when the host reports a desktop session; on a
					// headless server this would only ever fail, so it is hidden
					// rather than shown-and-broken.
					manifest && manifest.canReveal
						? h(
								"button",
								{
									type: "button",
									className: "dfs-btn dfs-btn-go",
									disabled: revealing,
									onClick: openFolder,
								},
								revealing ? "正在打开…" : "打开文件夹",
							)
						: null,
					h(
						"button",
						{
							type: "button",
							className: "dfs-btn",
							onClick: function () {
								var next = {};
								writeSelection(next);
							},
						},
						"全部还原",
					),
				),

				revealError ? h("div", { className: "dfs-warn" }, revealError) : null,

				manifest
					? h(
							"div",
							{ className: "dfs-path" },
							"把字体文件丢进这个文件夹：",
							// The full path is long and mostly machine plumbing;
							// the tail is what a person needs to recognise it, so
							// the head is dimmed rather than shown at full weight.
							// The whole thing stays on the title for hover.
							h(
								"code",
								{ className: "dfs-code", title: manifest.folder },
								h("span", { className: "dfs-code-dim" }, shortenPath(manifest.folder)),
								h("span", { className: "dfs-code-tail" }, tailOfPath(manifest.folder)),
							),
							h(
								"div",
								{ className: "dfs-note" },
								"支持 .woff2 / .woff / .ttf / .otf。用途有两种说法，任选其一：",
								h(
									"div",
									{ className: "dfs-sub" },
									"1. 放进子文件夹：serif（正文衬线）、sans（界面无衬线）、mono（代码等宽）。",
								),
								h(
									"div",
									{ className: "dfs-sub" },
									"2. 写进文件名，下面这些写法都认：Inter-sans.woff2、Inter_sans.woff2、" +
									"Inter.sans.woff2、sans-Inter.woff2、[serif] Newsreader.woff2、InterSans.woff2；" +
									"中文名也可以，如 思源宋体.woff2、黑体-sans.ttf、等宽字体.otf。",
								),
								h(
									"div",
									{ className: "dfs-sub" },
									"两种都没写，就三个下拉里都会出现（归在「未识别用途」下）。下拉里显示的是文件名。",
								),
							),
						)
					: null,

				error ? h("div", { className: "dfs-warn" }, error) : null,

				!manifest && !error
					? h("div", { className: "dfs-hint" }, "正在读取…")
					: null,
			);
		}

		var CSS = [
			".dfs-sec{display:flex;flex-direction:column;gap:18px;padding:4px 0 8px}",
			".dfs-row{display:flex;flex-direction:column;gap:7px}",
			".dfs-rowhead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
			".dfs-lbl{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
			".dfs-hint{font-size:12px;color:var(--dsw-alias-label-tertiary)}",
			".dfs-sel{",
			"font-family:var(--dsw-font-family,inherit);font-size:14px;",
			"padding:8px 10px;border-radius:10px;width:100%;box-sizing:border-box;",
			"color:var(--dsw-alias-label-primary);",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2);outline:none;cursor:pointer}",
			".dfs-sel:focus{border-color:var(--dsw-alias-brand-primary)}",
			".dfs-actions{display:flex;gap:8px;flex-wrap:wrap}",
			".dfs-btn{",
			"font-family:inherit;font-size:12px;cursor:pointer;",
			"padding:6px 12px;border-radius:8px;",
			"color:var(--dsw-alias-label-primary);background:transparent;",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dfs-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dfs-btn:disabled{opacity:.6;cursor:default}",
			// The primary action of this page: it is the one that saves the
			// trip through a file manager by hand.
			".dfs-btn-go{",
			"background:var(--dsw-alias-brand-primary);",
			"border-color:var(--dsw-alias-brand-primary);",
			"color:#fff}",
			".dfs-btn-go:hover{opacity:.9;background:var(--dsw-alias-brand-primary)}",
			".dfs-path{display:flex;flex-direction:column;gap:6px;",
			"font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.6}",
			".dfs-code{",
			"font-family:var(--dsw-font-family-mono,monospace);font-size:11px;",
			"padding:6px 8px;border-radius:8px;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2);",
			"color:var(--dsw-alias-label-primary);",
			// Long paths may wrap, but only at a separator, never mid-segment.
			"overflow-wrap:anywhere;line-height:1.6}",
			".dfs-code-dim{color:var(--dsw-alias-label-tertiary)}",
			".dfs-code-tail{color:var(--dsw-alias-label-primary);font-weight:500}",
			".dfs-note{line-height:1.7;display:flex;flex-direction:column;gap:4px}",
			".dfs-sub{line-height:1.7}",
			".dfs-warn{font-size:12px;line-height:1.6;color:var(--dsw-alias-label-primary);",
			"padding:8px 10px;border-radius:8px;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
		].join("");

		function apply(ctx) {
			ctx.effect(function () {
				var el = document.createElement("style");
				el.setAttribute("data-dfs", "dsh-font-switcher");
				el.textContent = CSS;
				document.head.appendChild(el);
				return function () { if (el.parentNode) el.parentNode.removeChild(el); };
			}, "dsh-font-switcher:styles");

			// Apply the stored choice as soon as the plugin loads, so a saved
			// font is in force without opening Settings.
			ctx.effect(function () {
				var stop = null;
				function sync() {
					fetchManifest().then(function (m) { applySelection(m, readSelection()); });
				}
				sync();
				stop = subscribe(sync);
				return function () {
					if (stop) stop();
					var el = document.getElementById(STYLE_ID);
					if (el && el.parentNode) el.parentNode.removeChild(el);
				};
			}, "dsh-font-switcher:apply");

			var slots = ctx.get("slots");
			if (slots === undefined) return;

			slots.inject("settings.section", function () {
				try {
					return slots.register(
						{ name: "settings.section", id: "fonts", order: 51, label: "字体" },
						FontSection,
					);
				} catch (e) {
					return function () {};
				}
			});
		}

		exports.name = "dsh-font-switcher";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	},
});
