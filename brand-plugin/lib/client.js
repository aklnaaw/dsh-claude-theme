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
		].join("");

		/* Claude greets by time of day rather than by name. */
		function greeting() {
			var hh = new Date().getHours();
			if (hh < 5) return "夜深了";
			if (hh < 11) return "早上好";
			if (hh < 13) return "中午好";
			if (hh < 18) return "下午好";
			return "晚上好";
		}

		var HEADLINES = ["探索未至之境", "Into the Unknown"];
		var PRODUCT = "DeepSeek Harness";
		var BRAND = "Claude";

		/* Rewrite the two strings no slot exposes: the hero headline and the
		 * document title. Matched on the EXACT known value, never by substring,
		 * and originals are kept so dispose() restores them. */
		function installBrandText() {
			var originals = new Map();
			var busy = false;
			var pending = false;

			function rewriteTitle() {
				if (document.title && document.title.indexOf(PRODUCT) !== -1) {
					document.title = document.title.split(PRODUCT).join(BRAND);
				}
			}

			function rewriteHeadline() {
				if (!document.body) return;
				var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
				var node;
				while ((node = walker.nextNode())) {
					var value = node.nodeValue;
					if (!value) continue;
					var trimmed = value.trim();
					if (HEADLINES.indexOf(trimmed) === -1) continue;
					if (!originals.has(node)) originals.set(node, value);
					node.nodeValue = value.split(trimmed).join(greeting());
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
				requestAnimationFrame(function () { pending = false; run(); });
			}

			var observer = new MutationObserver(schedule);
			observer.observe(document.documentElement, {
				childList: true, subtree: true, characterData: true,
			});
			run();

			return function () {
				observer.disconnect();
				originals.forEach(function (value, node) {
					try { node.nodeValue = value; } catch (e) { /* node detached */ }
				});
				originals.clear();
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
		}

		exports.name = "dsh-claude-brand";
		exports.inject = ["slots"];
		exports.apply = apply;
		return module.exports;
	},
});
