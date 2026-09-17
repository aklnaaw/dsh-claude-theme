window.__ModuleLoader__.load({
	id: "dsh-claude-brand",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

		var React = require("react");
		var reactDom = require("react-dom");
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
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcb-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcb-av svg{opacity:.45}",
			".dcb-preview{",
			"display:flex;align-items:center;gap:10px;",
			"padding:14px 16px;border-radius:12px;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcb-preview .mark{flex:none;color:var(--dsw-alias-brand-primary);display:flex}",
			".dcb-preview .line{",
			"font-family:var(--dsw-font-family,inherit);font-size:15px;",
			"color:var(--dsw-alias-label-primary)}",

			/* The wrapper exists only to keep the trigger and the editor as
			 * siblings in the React tree; it carries no look of its own. */
			".dcb-foot-wrap{display:block;width:100%;min-width:0}",
			".dcb-foot-wrap-rail{width:auto}",

			/* The sidebar foot row: a round avatar, then a two-line stack of name
			 * and caption, then a chevron at the far edge -- the arrangement the
			 * account row uses in the app being imitated. It is a button across
			 * its whole width so the hit target matches what it looks like. */
			".dcb-foot{",
			"display:flex;align-items:center;gap:10px;",
			"padding:7px 8px;border-radius:10px;",
			"font-family:var(--dsw-font-family,inherit);",
			"width:100%;background:none;border:0;cursor:pointer;text-align:left;",
			"min-width:0}",
			".dcb-foot:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dcb-foot-rail{justify-content:center;padding:8px 0;gap:0}",
			".dcb-foot-av{",
			"width:30px;height:30px;border-radius:50%;flex:none;overflow:hidden;",
			"display:grid;place-items:center;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcb-foot-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcb-foot-av svg{opacity:.6}",
			".dcb-foot-text{display:flex;flex-direction:column;gap:1px;min-width:0;flex:1}",
			".dcb-foot-name{",
			"font-size:13px;font-weight:500;letter-spacing:-.01em;line-height:1.3;",
			"overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dcb-foot-sub{",
			"font-size:11px;line-height:1.3;color:var(--dsw-alias-label-tertiary);",
			"overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
			".dcb-foot-chev{flex:none;display:flex;color:var(--dsw-alias-label-tertiary)}",

			/* The editor popover. Fixed-positioned by inline style; the classes
			 * here only carry its look, never its coordinates. */
			".dcb-pop{",
			"position:fixed;z-index:80;width:232px;",
			"display:flex;flex-direction:column;gap:8px;padding:12px;",
			"border-radius:12px;box-sizing:border-box;",
			"font-family:var(--dsw-font-family,inherit);",
			"background:var(--dsw-alias-bg-overlay,var(--dsw-alias-bg-base));",
			"border:1px solid var(--dsw-alias-border-l2);",
			"box-shadow:var(--dsw-shadow-lv2,0 8px 28px rgba(0,0,0,.18))}",
			".dcb-pop-head{display:flex;align-items:center;gap:10px}",
			".dcb-pop-av{",
			"width:40px;height:40px;border-radius:50%;flex:none;overflow:hidden;",
			"display:grid;place-items:center;",
			"background:var(--dsw-alias-bg-base);",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcb-pop-av img{width:100%;height:100%;object-fit:cover;display:block}",
			".dcb-pop-av svg{opacity:.6}",
			".dcb-pop-avbtns{display:flex;gap:6px;flex-wrap:wrap}",
			".dcb-pop-foot{display:flex;justify-content:flex-end}",
			".dcb-mini{",
			"font-family:inherit;font-size:12px;cursor:pointer;",
			"padding:5px 10px;border-radius:8px;",
			"color:var(--dsw-alias-label-primary);",
			"background:transparent;",
			"border:1px solid var(--dsw-alias-border-l2)}",
			".dcb-mini:hover{background:var(--dsw-alias-interactive-bg-hover)}",
			".dcb-mini-go{",
			"background:var(--dsw-alias-brand-primary);",
			"border-color:var(--dsw-alias-brand-primary);",
			"color:#fff}",
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

		/* Shipped defaults, shown to someone who has never opened the editor.
		 *
		 * The avatar is inlined as a data URL for the same reason a user-picked
		 * one is: the plugin bundle has no asset pipeline, and a relative URL
		 * would have to resolve against a served path this plugin does not own.
		 * 256px WebP, ~13 KB of base64 -- the row draws it at 24px and the
		 * editor at 40px, so this is already generous headroom for 2x displays. */
		var DEFAULT_NAME = "moon";
		var DEFAULT_AVATAR =
			"data:image/webp;base64,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";

		function readPrefs() {
			var fresh = { name: DEFAULT_NAME, sub: "", avatar: DEFAULT_AVATAR };
			try {
				if (typeof localStorage === "undefined") return fresh;
				var raw = localStorage.getItem(STORE_KEY);
				/* No record at all means nobody has been here yet, so the
				 * shipped defaults stand. An EXISTING record is returned
				 * verbatim even when its fields are empty -- otherwise clearing
				 * the name on purpose would silently restore the default, and
				 * there would be no way to have a blank field. */
				if (raw === null) return fresh;
				var parsed = JSON.parse(raw);
				if (typeof parsed !== "object" || parsed === null) return fresh;
				return {
					name: typeof parsed.name === "string" ? parsed.name.slice(0, 24) : "",
					sub: typeof parsed.sub === "string" ? parsed.sub.slice(0, 32) : "",
					avatar: typeof parsed.avatar === "string" ? parsed.avatar : "",
				};
			} catch (e) {
				return fresh;
			}
		}

		/* Merge, never replace.
		 *
		 * Callers each own one field, and every call site used to have to
		 * re-supply the others -- which silently dropped whatever a caller
		 * forgot the moment a new field was added. Merging over what is stored
		 * makes each field independently writable. */
		function writePrefs(patch) {
			var next = readPrefs();
			if (typeof patch.name === "string") next.name = patch.name.slice(0, 24);
			if (typeof patch.sub === "string") next.sub = patch.sub.slice(0, 32);
			if (typeof patch.avatar === "string") next.avatar = patch.avatar;
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
			var subState = React.useState(prefs.sub);
			var sub = subState[0], setSub = subState[1];
			var fileRef = React.useRef(null);

			/* Keep the fields in step when the stored value changes elsewhere. */
			React.useEffect(function () { setName(prefs.name); }, [prefs.name]);
			React.useEffect(function () { setSub(prefs.sub); }, [prefs.sub]);

			function commitName(value) {
				var trimmed = value.trim().slice(0, 24);
				setName(trimmed);
				writePrefs({ name: trimmed });
			}

			/* The avatar is stored as a data URL rather than a file reference:
			 * there is no upload endpoint here and the browser must be able to
			 * paint it on the next load with no server involved. */
			function pickAvatar(event) {
				var file = event.target.files && event.target.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () {
					writePrefs({ avatar: String(reader.result) });
				};
				reader.readAsDataURL(file);
				event.target.value = "";
			}

			function clearAvatar() {
				writePrefs({ avatar: "" });
			}

			function commitSub(value) {
				var trimmed = value.trim().slice(0, 32);
				setSub(trimmed);
				writePrefs({ sub: trimmed });
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
					h("div", { className: "dcb-lbl" }, "副标题"),
					h("input", {
						className: "dcb-in",
						type: "text",
						value: sub,
						maxLength: 32,
						placeholder: "名字下面那行小字，可留空",
						onChange: function (e) { commitSub(e.target.value); },
					}),
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

		/* A small chevron, matching the affordance the account row carries in
		 * the app being imitated. Drawn inline so it needs no icon package. */
		function Chevron(props) {
			return h(
				"svg",
				{
					width: 12, height: 12, viewBox: "0 0 12 12", fill: "none",
					"aria-hidden": "true",
					style: props && props.open ? { transform: "rotate(180deg)" } : undefined,
				},
				h("path", {
					d: "M2.5 4.25 6 7.75l3.5-3.5",
					stroke: "currentColor",
					"stroke-width": "1.4",
					"stroke-linecap": "round",
					"stroke-linejoin": "round",
				}),
			);
		}

		/* ------------------------------------------------------------------
		 * The editor popover.
		 *
		 * Portalled to document.body and positioned against the trigger's own
		 * rect. It cannot be rendered inside the row: the sidebar is a scrolling
		 * column and an ancestor clips overflow, so anything drawn there is cut
		 * off at the column edge. `createPortal` is how the shipped menus handle
		 * the same problem.
		 *
		 * Dismissal follows the shipped menus too: a mousedown outside closes it,
		 * Escape closes it, and the listener is only attached while open.
		 * ------------------------------------------------------------------ */
		function Editor(props) {
			var prefs = usePrefs();
			var anchor = props.anchor;
			var onClose = props.onClose;

			var nameState = React.useState(prefs.name);
			var name = nameState[0], setName = nameState[1];
			var subState = React.useState(prefs.sub);
			var sub = subState[0], setSub = subState[1];

			var popRef = React.useRef(null);
			var fileRef = React.useRef(null);
			var posState = React.useState(null);
			var pos = posState[0], setPos = posState[1];

			/* Measure-then-place: the first pass renders hidden at the origin so
			 * offsetWidth/offsetHeight are real, then the rect is computed. */
			React.useEffect(function () {
				if (!anchor) return;
				var place = function () {
					var r = anchor.getBoundingClientRect();
					var el = popRef.current;
					var w = el ? el.offsetWidth : 232;
					var hgt = el ? el.offsetHeight : 240;
					var left = Math.max(8, Math.min(r.left, window.innerWidth - w - 8));
					/* Prefer above the row: the row sits at the very bottom of
					 * the viewport, so below would run off screen. */
					var top = r.top - hgt - 8;
					if (top < 8) top = Math.min(r.bottom + 8, window.innerHeight - hgt - 8);
					setPos({ left: left, top: top });
				};
				place();
				window.addEventListener("resize", place);
				return function () { window.removeEventListener("resize", place); };
			}, [anchor]);

			/* The dismissal listeners must not re-attach on every keystroke, so
			 * `close` reads the latest values through a ref rather than closing
			 * over the state it was created with. Re-subscribing per keystroke
			 * would also leave a gap between remove and add in which a click
			 * outside goes unnoticed. */
			var latest = React.useRef({ name: name, sub: sub });
			latest.current = { name: name, sub: sub };

			function close() {
				writePrefs({ name: latest.current.name.trim(), sub: latest.current.sub.trim() });
				onClose();
			}

			React.useEffect(function () {
				var onDown = function (event) {
					if (popRef.current && popRef.current.contains(event.target)) return;
					if (anchor && anchor.contains(event.target)) return;
					close();
				};
				var onKey = function (event) { if (event.key === "Escape") close(); };
				document.addEventListener("mousedown", onDown);
				document.addEventListener("keydown", onKey);
				return function () {
					document.removeEventListener("mousedown", onDown);
					document.removeEventListener("keydown", onKey);
				};
			}, [anchor]);

			function pickAvatar(event) {
				var file = event.target.files && event.target.files[0];
				if (!file) return;
				var reader = new FileReader();
				reader.onload = function () { writePrefs({ avatar: String(reader.result) }); };
				reader.readAsDataURL(file);
				event.target.value = "";
			}

			return reactDom.createPortal(
				h(
					"div",
					{
						ref: popRef,
						className: "dcb-pop",
						role: "dialog",
						"aria-label": "修改名字和头像",
						style: pos === null
							? { visibility: "hidden", left: 0, top: 0 }
							: { left: pos.left + "px", top: pos.top + "px" },
					},

					h(
						"div",
						{ className: "dcb-pop-head" },
						h("span", { className: "dcb-pop-av" }, h(Avatar, { prefs: prefs, size: 26 })),
						h(
							"div",
							{ className: "dcb-pop-avbtns" },
							h(
								"button",
								{
									type: "button",
									className: "dcb-mini",
									onClick: function () { if (fileRef.current) fileRef.current.click(); },
								},
								"换头像",
							),
							prefs.avatar
								? h(
										"button",
										{ type: "button", className: "dcb-mini", onClick: function () { writePrefs({ avatar: "" }); } },
										"移除",
									)
								: null,
						),
					),

					h("input", {
						className: "dcb-in",
						type: "text",
						value: name,
						maxLength: 24,
						placeholder: "名字",
						/* Deliberately untrimmed while typing: trimming on every
						 * keystroke eats the space the moment it is typed, so a
						 * name typed with a pause after a space can never hold
						 * one. The stored value is trimmed on close instead. */
						onChange: function (e) { setName(e.target.value); writePrefs({ name: e.target.value }); },
					}),
					h("input", {
						className: "dcb-in",
						type: "text",
						value: sub,
						maxLength: 32,
						placeholder: "副标题（可留空）",
						onChange: function (e) { setSub(e.target.value); writePrefs({ sub: e.target.value }); },
					}),

					h("input", {
						ref: fileRef,
						type: "file",
						accept: "image/*",
						style: { display: "none" },
						onChange: pickAvatar,
					}),

					h(
						"div",
						{ className: "dcb-pop-foot" },
						h("button", { type: "button", className: "dcb-mini dcb-mini-go", onClick: close }, "完成"),
					),
				),
				document.body,
			);
		}

		function ProfileRow(props) {
			var prefs = usePrefs();
			var wide = props && props.wide;

			var openState = React.useState(false);
			var open = openState[0], setOpen = openState[1];
			var btnRef = React.useRef(null);

			/* The editor is a SIBLING of the trigger, never its child.
			 *
			 * A portal moves an element in the DOM but not in the React tree,
			 * and React keeps event propagation along the React tree. Nested
			 * inside the trigger, every click in the editor -- including into
			 * the caption field -- bubbled to the trigger's own onClick and
			 * toggled the popover shut again. Wrapping both in a plain div is
			 * what actually separates them; stopPropagation would only have
			 * hidden the symptom, and interactive content inside a <button> is
			 * invalid markup regardless. */
			var trigger = h(
				"button",
				{
					ref: btnRef,
					type: "button",
					className: wide ? "dcb-foot" : "dcb-foot dcb-foot-rail",
					title: wide
						? "点击修改名字和头像"
						: (prefs.name ? prefs.name + " · 点击修改" : "点击设置名字"),
					onClick: function () { setOpen(!open); },
				},
				h(
					"span",
					{ className: "dcb-foot-av" },
					h(Avatar, { prefs: prefs, size: wide ? 24 : 18 }),
				),
				wide
					? h(
							"span",
							{ className: "dcb-foot-text" },
							h("span", { className: "dcb-foot-name" }, prefs.name || "未命名"),
							/* The caption falls back to a prompt rather than
							 * disappearing, so the stack keeps its height and
							 * the row does not jump once a name is typed. */
							h("span", { className: "dcb-foot-sub" }, prefs.sub || "点击设置"),
						)
					: null,
				wide ? h("span", { className: "dcb-foot-chev" }, h(Chevron, { open: open })) : null,
			);

			return h(
				"div",
				{ className: wide ? "dcb-foot-wrap" : "dcb-foot-wrap dcb-foot-wrap-rail" },
				trigger,
				open ? h(Editor, { anchor: btnRef.current, onClose: function () { setOpen(false); } }) : null,
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
