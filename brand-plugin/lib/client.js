window.__ModuleLoader__.load({
	id: "dsh-claude-brand",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var h = React.createElement;

		/* ------------------------------------------------------------------
		 * The Anthropic / Claude radial starburst, viewBox 0 0 24 24.
		 * A real inline SVG — not a font glyph, not an <img> — so it inherits
		 * currentColor, stays crisp at any size, and needs no network request.
		 * ------------------------------------------------------------------ */
		var STARBURST = "m4.7144 15.9555 4.7174-2.6471.079-.2307-.079-.1275h-.2307l-.7893-.0486-2.6956-.0729-2.3375-.0971-2.2646-.1214-.5707-.1215-.5343-.7042.0546-.3522.4797-.3218.686.0608 1.5179.1032 2.2767.1578 1.6514.0972 2.4468.255h.3886l.0546-.1579-.1336-.0971-.1032-.0972L6.973 9.8356l-2.55-1.6879-1.3356-.9714-.7225-.4918-.3643-.4614-.1578-1.0078.6557-.7225.8803.0607.2246.0607.8925.686 1.9064 1.4754 2.4893 1.8336.3643.3035.1457-.1032.0182-.0728-.164-.2733-1.3539-2.4467-1.445-2.4893-.6435-1.032-.17-.6194c-.0607-.255-.1032-.4674-.1032-.7285L6.287.1335 6.6997 0l.9957.1336.419.3642.6192 1.4147 1.0018 2.2282 1.5543 3.0296.4553.8985.2429.8318.091.255h.1579v-.1457l.1275-1.706.2368-2.0947.2307-2.6957.0789-.7589.3764-.9107.7468-.4918.5828.2793.4797.686-.0668.4433-.2853 1.8517-.5586 2.9021-.3643 1.9429h.2125l.2429-.2429.9835-1.3053 1.6514-2.0643.7286-.8196.85-.9046.5464-.4311h1.0321l.759 1.1293-.34 1.1657-1.0625 1.3478-.8804 1.1414-1.2628 1.7-.7893 1.36.0729.1093.1882-.0183 2.8535-.607 1.5421-.2794 1.8396-.3157.8318.3886.091.3946-.3278.8075-1.967.4857-2.3072.4614-3.4364.8136-.0425.0304.0486.0607 1.5482.1457.6618.0364h1.621l3.0175.2247.7892.522.4736.6376-.079.4857-1.2142.6193-1.6393-.3886-3.825-.9107-1.3113-.3279h-.1822v.1093l1.0929 1.0686 2.0035 1.8092 2.5075 2.3314.1275.5768-.3218.4554-.34-.0486-2.2039-1.6575-.85-.7468-1.9246-1.621h-.1275v.17l.4432.6496 2.3436 3.5214.1214 1.0807-.17.3521-.6071.2125-.6679-.1214-1.3721-1.9246L14.38 17.959l-1.1414-1.9428-.1397.079-.674 7.2552-.3156.3703-.7286.2793-.6071-.4614-.3218-.7468.3218-1.4753.3886-1.9246.3157-1.53.2853-1.9004.17-.6314-.0121-.0425-.1397.0182-1.4328 1.9672-2.1796 2.9446-1.7243 1.8456-.4128.164-.7164-.3704.0667-.6618.4008-.5889 2.386-3.0357 1.4389-1.882.929-1.0868-.0062-.1579h-.0546l-6.3385 4.1164-1.1293.1457-.4857-.4554.0608-.7467.2307-.2429 1.9064-1.3114Z";

		function ClaudeMark(props) {
			var size = (props && props.size) || 24;
			var style = props && props.color ? { color: props.color } : undefined;
			return h(
				"svg",
				{
					width: size, height: size, viewBox: "0 0 24 24",
					fill: "currentColor", style: style,
					role: "img", "aria-label": "Claude", focusable: "false",
				},
				h("path", { d: STARBURST }),
			);
		}

		/* The shipped brand name is a glyph-outline SVG, so shadowing it with
		 * real text is what actually makes the sidebar read "Claude". */
		function ClaudeName() {
			return h("span", { className: "dcb-name" }, "Claude");
		}

		var CSS = [
			".dcb-name{",
			"font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,sans-serif);",
			"font-size:15px;font-weight:500;letter-spacing:-.01em;",
			"color:var(--dsw-alias-label-primary);line-height:1;white-space:nowrap}",

			/* Settings page. Everything is expressed with the official tokens so
			 * it follows whatever theme is active rather than hard-coding the
			 * Claude palette -- this plugin is about the name, not the colours. */
			".dcb-sec{display:flex;flex-direction:column;gap:20px;padding:4px 0 8px}",
			".dcb-row{display:flex;flex-direction:column;gap:8px}",
			".dcb-lbl{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
			".dcb-hint{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.5}",
			".dcb-in{",
			"font-family:var(--dsw-font-family,inherit);font-size:14px;",
			"padding:8px 12px;border-radius:10px;",
			"border:1px solid var(--dsw-alias-border-l2);",
			"outline:none;width:100%;box-sizing:border-box}",
			".dcb-in:focus{border-color:var(--dsw-alias-brand-primary)}",
			".dcb-avrow{display:flex;align-items:center;gap:14px}",
			".dcb-av{",
			"width:56px;height:56px;border-radius:50%;flex:none;overflow:hidden;",
			"display:grid;place-items:center;",
			".dcb-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcb-av svg{opacity:.45}",
			".dcb-preview{",
			"display:flex;align-items:center;gap:10px;",
			"padding:14px 16px;border-radius:12px;",
			".dcb-preview .mark{flex:none;color:var(--dsw-alias-brand-primary);display:flex}",
			".dcb-preview .line{",
			"font-family:var(--dsw-font-family,inherit);font-size:15px;",
			"color:var(--dsw-alias-label-primary)}",

			/* The sidebar foot row. Sized to match the Settings control it sits
			 * above so the two read as one stack. */
			".dcb-foot{",
			"display:flex;align-items:center;gap:10px;",
			"padding:8px 10px;border-radius:10px;",
			"font-family:var(--dsw-font-family,inherit);",
			"min-width:0}",
			".dcb-foot-rail{justify-content:center;padding:8px 0;gap:0}",
			/* The row is a button: it must look like the Settings control it
			 * sits above when hovered, and inherit the shell's font. */
			".dcb-foot-open{",
			"width:100%;background:none;border:0;cursor:pointer;text-align:left;",
			"font-family:inherit}",
			".dcb-foot-open:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dcb-foot-empty{color:var(--dsw-alias-label-tertiary);font-weight:400}",
			".dcb-foot-av{",
			"width:24px;height:24px;border-radius:50%;flex:none;overflow:hidden;",
			"display:grid;place-items:center;",
			".dcb-foot-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcb-foot-av svg{opacity:.6}",
			".dcb-foot-name{",
			"font-size:13px;font-weight:500;letter-spacing:-.01em;",
			"overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
		].join("");

		/* ------------------------------------------------------------------
		 * Display name and avatar.
		 *
		 * Purely cosmetic: this is a label for the greeting and the sidebar
		 * foot, not an account. There is no identity behind it and nothing
		 * reads it but this plugin. Kept in localStorage because that is what
		 * the shipped UI plugins use for browser-local preferences, and a
		 * static client half has no other place to put it.
		 * ------------------------------------------------------------------ */
		var STORE_KEY = "dsh-claude-brand.prefs";

		function readPrefs() {
			var empty = { name: "", avatar: "" };
			try {
				if (typeof localStorage === "undefined") return empty;
				var raw = localStorage.getItem(STORE_KEY);
				if (raw === null) return empty;
				var parsed = JSON.parse(raw);
				if (typeof parsed !== "object" || parsed === null) return empty;
				return {
					name: typeof parsed.name === "string" ? parsed.name.slice(0, 24) : "",
					avatar: typeof parsed.avatar === "string" ? parsed.avatar : "",
				};
			} catch (e) {
				return empty;
			}
		}

		function writePrefs(next) {
			try {
				if (typeof localStorage !== "undefined") {
					localStorage.setItem(STORE_KEY, JSON.stringify(next));
				}
			} catch (e) { /* storage full or blocked; the UI still updates */ }
			subscribers.forEach(function (fn) { try { fn(); } catch (e) {} });
		}

		var subscribers = new Set();

		function subscribe(fn) {
			subscribers.add(fn);
			return function () { subscribers.delete(fn); };
		}

		/* Re-read on every notification so several mounted surfaces agree. */
		function usePrefs() {
			var pair = React.useState(readPrefs);
			var prefs = pair[0], setPrefs = pair[1];
			React.useEffect(function () {
				return subscribe(function () { setPrefs(readPrefs()); });
			}, []);
			return prefs;
		}

		var ROTATION_KEY = "dsh-claude-brand.rotation";

		/* The rotation step is drawn ONCE per page load and then held.
		 *
		 * greetingLine() is called from the mutation observer, so advancing the
		 * counter there would burn through all two dozen lines in the first
		 * second the app re-renders. Drawing it here instead makes the line
		 * stable for the lifetime of the tab and lets it change on the next
		 * load -- which is what "cycle through them" should mean. */
		var rotationStep = null;

		function currentStep() {
			if (rotationStep !== null) return rotationStep;
			var n = 0;
			try {
				if (typeof localStorage !== "undefined") {
					n = parseInt(localStorage.getItem(ROTATION_KEY) || "0", 10) || 0;
					localStorage.setItem(ROTATION_KEY, String(n + 1));
				}
			} catch (e) { /* rotation is decoration; never fail on it */ }
			rotationStep = n;
			return n;
		}

		/* Claude greets by time of day. */
		function timeGreeting() {
			var hh = new Date().getHours();
			if (hh < 5) return "夜深了";
			if (hh < 11) return "早上好";
			if (hh < 13) return "中午好";
			if (hh < 18) return "下午好";
			return "晚上好";
		}

		/* Index 0 is the time-of-day greeting and is always what a first-time
		 * visitor sees; later loads walk the rest of the list. */
		var GREETINGS = [
			null,
			"准备好了就开始吧",
			"新的一页。写点什么？",
			"今天想做点什么？",
			"有什么想聊的？",
			"从哪里开始呢？",
			"慢慢来，不着急",
			"今天有什么计划？",
			"我在这儿呢",
			"有什么想法吗？",
			"开始吧",
			"来聊聊？",
			"说吧，我听着",
			"有什么需要帮忙的？",
			"今天感觉怎么样？",
			"要不要一起做点什么？",
			"想到什么了？",
			"随时可以开始",
			"我准备好了",
			"你来决定",
			"想从哪儿说起？",
			"有什么新鲜事？",
			"又是新的一天",
			"等你开口呢",
		];

		function greetingLine() {
			var base = GREETINGS[currentStep() % GREETINGS.length];
			if (base === null) base = timeGreeting();
			var name = readPrefs().name;
			return name ? base + "，" + name : base;
		}

		var HEADLINES = ["探索未至之境", "Into the Unknown"];
		var PRODUCT = "DeepSeek Harness";
		var BRAND = "Claude";

		/* Rewrite the two strings no slot exposes: the hero headline and the
		 * document title. Matched on the EXACT known value, never by substring,
		 * and originals are kept so dispose() restores them.
		 *
		 * The headline needs bookkeeping beyond the original text. Once this
		 * writes a greeting the node stops matching HEADLINES, so a plain
		 * "match the original" pass could never update it again -- renaming
		 * yourself would leave the old name on screen until a reload. Each
		 * claimed node therefore remembers both what it originally said and
		 * what we last wrote; when the desired line changes we rewrite only if
		 * the node still holds our own text (if it does not, the app has
		 * re-rendered it and we let go). */
		function installBrandText() {
			var claimed = new Map();
			var busy = false;
			var pending = false;

			function rewriteTitle() {
				if (document.title && document.title.indexOf(PRODUCT) !== -1) {
					document.title = document.title.split(PRODUCT).join(BRAND);
				}
			}

			function rewriteHeadline() {
				if (!document.body) return;
				var want = greetingLine();

				/* Release nodes the app has replaced under us. */
				claimed.forEach(function (state, node) {
					if (node.nodeValue !== state.written) claimed.delete(node);
				});

				claimed.forEach(function (state, node) {
					if (state.written === want) return;
					node.nodeValue = want;
					state.written = want;
				});

				var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
				var node;
				while ((node = walker.nextNode())) {
					var value = node.nodeValue;
					if (!value) continue;
					var trimmed = value.trim();
					if (HEADLINES.indexOf(trimmed) === -1) continue;
					if (claimed.has(node)) continue;
					var written = want;
					node.nodeValue = written;
					claimed.set(node, { original: value, written: written });
				}
			}

			function run() {
				if (busy) return;
				busy = true;
				try { rewriteTitle(); rewriteHeadline(); } finally { busy = false; }
			}

			function schedule() {
				if (pending) return;
				pending = true;
				/* The `pending` latch is cleared inside the frame callback. If the
				 * frame never arrives -- a backgrounded tab, a headless run, an
				 * engine that throttles rAF to zero -- the latch stays set and
				 * every later mutation is dropped forever, which shows up as
				 * "the greeting stopped updating after the first paint". Falling
				 * back to a task clears it even when no frame comes. */
				var cleared = false;
				function release() {
					if (cleared) return;
					cleared = true;
					pending = false;
					run();
				}
				requestAnimationFrame(release);
				Promise.resolve().then(release);
			}

			var observer = new MutationObserver(schedule);
			observer.observe(document.documentElement, {
				childList: true, subtree: true, characterData: true,
			});
			var unsubscribe = subscribe(schedule);
			run();

			return function () {
				observer.disconnect();
				unsubscribe();
				claimed.forEach(function (state, node) {
					try { node.nodeValue = state.original; } catch (e) { /* node detached */ }
				});
				claimed.clear();
			};
		}

		/* The browser tab icon.
		 *
		 * The page declares no <link rel="icon"> at all, so the browser falls
		 * back to requesting /favicon.svg, which DSH ships as its whale. That
		 * file lives inside the DSH install and would be clobbered by an
		 * upgrade, so it is not ours to edit. Declaring our own icon here wins
		 * the lookup without touching anything we do not own.
		 *
		 * Inlined as a data URI rather than a file: a plugin bundle has no
		 * asset pipeline, and the mark is one path. Coral on transparency so it
		 * stays legible against both light and dark browser chrome. */
		function faviconHref() {
			var svg =
				'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
				'<path fill="#d97757" d="' + STARBURST + '"/></svg>';
			return "data:image/svg+xml," + encodeURIComponent(svg);
		}

		function installFavicon() {
			/* Remove any icon the host may have declared, so ours is the only
			 * candidate. Kept for restore. */
			var replaced = [];
			var existing = document.querySelectorAll('link[rel~="icon"]');
			for (var i = 0; i < existing.length; i++) {
				var node = existing[i];
				if (node.parentNode) {
					replaced.push({ node: node, parent: node.parentNode, next: node.nextSibling });
					node.parentNode.removeChild(node);
				}
			}

			var link = document.createElement("link");
			link.setAttribute("rel", "icon");
			link.setAttribute("type", "image/svg+xml");
			link.setAttribute("href", faviconHref());
			link.setAttribute("data-dcb", "dsh-claude-brand");
			document.head.appendChild(link);

			return function () {
				if (link.parentNode) link.parentNode.removeChild(link);
				for (var j = 0; j < replaced.length; j++) {
					var r = replaced[j];
					try { r.parent.insertBefore(r.node, r.next); } catch (e) { /* head replaced */ }
				}
			};
		}

		/* ------------------------------------------------------------------
		 * Settings page: the display name and avatar.
		 * ------------------------------------------------------------------ */

		function Avatar(props) {
			var prefs = props.prefs;
			if (prefs.avatar) {
				return h("img", { src: prefs.avatar, alt: "" });
			}
			return h(ClaudeMark, { size: Math.round(props.size || 24) });
		}

		function NameSection() {
			var prefs = usePrefs();
			var nameState = React.useState(prefs.name);
			var name = nameState[0], setName = nameState[1];
			var fileRef = React.useRef(null);

			/* Keep the field in step when the stored value changes elsewhere. */
			React.useEffect(function () { setName(prefs.name); }, [prefs.name]);

			function commitName(value) {
				var trimmed = value.trim().slice(0, 24);
				setName(trimmed);
				writePrefs({ name: trimmed, avatar: prefs.avatar });
			}

			/* The avatar is stored as a data URL rather than a file reference:
			 * there is no upload endpoint here and the browser must be able to
			 * paint it on the next load with no server involved. */
			function pickAvatar(event) {
				var file = event.target.files && event.target.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () {
					writePrefs({ name: readPrefs().name, avatar: String(reader.result) });
				};
				reader.readAsDataURL(file);
				event.target.value = "";
			}

			function clearAvatar() {
				writePrefs({ name: readPrefs().name, avatar: "" });
			}

			var greeting = greetingLine();

			return h(
				"div",
				{ className: "dcb-sec" },

				h(
					"div",
					{ className: "dcb-row" },
					h("div", { className: "dcb-lbl" }, "名字"),
					h("input", {
						className: "dcb-in",
						type: "text",
						value: name,
						maxLength: 24,
						placeholder: "留空则只显示问候语",
						onChange: function (e) { commitName(e.target.value); },
					}),
					h(
						"div",
						{ className: "dcb-hint" },
						"只用于首页问候语和侧栏底部，存在这台浏览器里，不会上传到任何地方。",
					),
				),

				h(
					"div",
					{ className: "dcb-row" },
					h("div", { className: "dcb-lbl" }, "头像"),
					h(
						"div",
						{ className: "dcb-avrow" },
						h("div", { className: "dcb-av" }, h(Avatar, { prefs: prefs, size: 30 })),
						h(
							"div",
							{ style: { display: "flex", gap: "8px", flexWrap: "wrap" } },
							h(
								"button",
								{
									type: "button",
									className: "dcb-in",
									style: { width: "auto", cursor: "pointer" },
									onClick: function () {
										if (fileRef.current) fileRef.current.click();
									},
								},
								"选择图片",
							),
							prefs.avatar
								? h(
										"button",
										{
											type: "button",
											className: "dcb-in",
											style: { width: "auto", cursor: "pointer" },
											onClick: clearAvatar,
										},
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
					h("div", { className: "dcb-hint" }, "不选的话显示 Claude 星芒。图片以数据形式存在本地。"),
				),

				h(
					"div",
					{ className: "dcb-row" },
					h("div", { className: "dcb-lbl" }, "预览"),
					h(
						"div",
						{ className: "dcb-preview" },
						h("span", { className: "mark" }, h(ClaudeMark, { size: 20 })),
						h("span", { className: "line" }, greeting),
					),
					h(
						"div",
						{ className: "dcb-hint" },
						"每次打开页面换一句，共 " + GREETINGS.length + " 句。",
					),
				),
			);
		}

		/* ------------------------------------------------------------------
		 * Sidebar foot: avatar + name, sitting directly above Settings.
		 *
		 * The row is ALWAYS rendered, even with nothing configured. An earlier
		 * build hid it until a name was set, on the theory that an empty box is
		 * worse than nothing -- but that left no way to discover the feature at
		 * all. With nothing set it now shows the starburst and the words
		 * 设置名字, and clicking it opens the Settings panel where the name and
		 * avatar are edited. Nothing is edited in this row itself.
		 * ------------------------------------------------------------------ */

		/* Clicking the row opens the Settings panel.
		 *
		 * There is no service for this: the panel's open state lives in a React
		 * component this plugin does not own, and nothing publishes a way to
		 * set it. The dialog's trigger button is reachable in the DOM though --
		 * it is the only element in the shell carrying aria-haspopup="dialog"
		 * inside the sidebar's settings seat -- so the row defers to it rather
		 * than duplicating the panel. */
		function openSettings() {
			var seat = document.querySelector('[data-slot="sidebar.settings"]');
			var scope = seat || document;
			var trigger = scope.querySelector('button[aria-haspopup="dialog"]');
			if (trigger) { trigger.click(); return; }
			/* Fall back to the whole document in case the seat is not marked. */
			var any = document.querySelector('button[aria-haspopup="dialog"]');
			if (any) any.click();
		}

		function ProfileRow(props) {
			var prefs = usePrefs();
			var wide = props && props.wide;
			var hasIdentity = !!(prefs.name || prefs.avatar);
			var label = prefs.name || "设置名字";

			if (!wide) {
				return h(
					"button",
					{
						type: "button",
						className: "dcb-foot dcb-foot-rail dcb-foot-open",
						title: prefs.name ? prefs.name + " · 点击修改" : "点击设置名字",
						onClick: openSettings,
					},
					h("span", { className: "dcb-foot-av" }, h(Avatar, { prefs: prefs, size: 20 })),
				);
			}

			return h(
				"button",
				{
					type: "button",
					className: "dcb-foot dcb-foot-open",
					title: hasIdentity ? "点击修改名字和头像" : "点击设置名字和头像",
					onClick: openSettings,
				},
				h("span", { className: "dcb-foot-av" }, h(Avatar, { prefs: prefs, size: 22 })),
				h(
					"span",
					{ className: "dcb-foot-name" + (hasIdentity ? "" : " dcb-foot-empty") },
					label,
				),
			);
		}

		function apply(ctx) {
			ctx.effect(function () {
				var el = document.createElement("style");
				el.setAttribute("data-dcb", "dsh-claude-brand");
				el.textContent = CSS;
				document.head.appendChild(el);
				return function () { if (el.parentNode) el.parentNode.removeChild(el); };
			}, "dsh-claude-brand:styles");

			ctx.effect(installBrandText, "dsh-claude-brand:text");
			ctx.effect(installFavicon, "dsh-claude-brand:favicon");

			var slots = ctx.get("slots");
			if (slots === undefined) return;

			/* Slot shadowing is priority-based and the LOWEST priority renders,
			 * so -10 outranks the official brand plugin (priority 0). Registering
			 * at the SAME priority throws for a `single` slot. */
			var SHADOW = -10;

			slots.inject("sidebar.brand.mark", function () {
				return slots.register(
					{ name: "sidebar.brand.mark", priority: SHADOW },
					function (props) { return h(ClaudeMark, { size: (props && props.size) || 24 }); },
				);
			});

			slots.inject("sidebar.brand.name", function () {
				return slots.register(
					{ name: "sidebar.brand.name", priority: SHADOW },
					function () { return h(ClaudeName, null); },
				);
			});

			slots.inject("conversation.hero.brand.mark", function () {
				return slots.register(
					{ name: "conversation.hero.brand.mark", priority: SHADOW },
					function () { return h(ClaudeMark, { size: 32, color: "var(--dsw-alias-brand-primary)" }); },
				);
			});

			/* A settings page of its own, alongside General / Models / Plugins.
			 * `settings.section` is an additive list owned by the settings
			 * shell, so registering here needs no priority and shadows nothing.
			 * Labelled 名字, not Claude: the page holds a display name, and an
			 * entry reading "Claude" inside an already Claude-themed UI says
			 * nothing about where to change it. */
			slots.inject("settings.section", function () {
				try {
					return slots.register(
						{ name: "settings.section", id: "claude", order: 50, label: "名字" },
						NameSection,
					);
				} catch (e) {
					return function () {};
				}
			});

			/* Avatar + name at the sidebar foot, in the strip the shell renders
			 * just above Settings. Also additive. */
			slots.inject("sidebar.footer.action", function () {
				try {
					return slots.register(
						{ name: "sidebar.footer.action", id: "claude-profile", order: 10 },
						ProfileRow,
					);
				} catch (e) {
					return function () {};
				}
			});
		}

		exports.name = "dsh-claude-brand";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	},
});
