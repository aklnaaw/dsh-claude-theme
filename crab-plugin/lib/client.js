window.__ModuleLoader__.load({
  id: "dsh-claude-crab",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* =====================================================================
     * Clawd — the interactive pixel crab.
     *
     * The static skin already draws a crab as a CSS ::after on the composer.
     * That one is deliberately inert (a pseudo-element cannot be clicked,
     * focused or removed). THIS is the interactive one: a real element
     * registered into `conversation.input.overlay`, which the composer renders
     * inside `overlayAnchor` — an absolutely-positioned, zero-height strip
     * pinned to the card's top edge. That is exactly where the crab stands.
     *
     * The skin's ::after is suppressed from this plugin's stylesheet so the two
     * do not double up.
     *
     * Everyone here is original to this project. The crab's pixel GEOMETRY is
     * the mascot's own (credited to lulu / claude-web in the repo LICENSE);
     * the behaviour below is ours.
     * ===================================================================== */

    var React = require("react");
    var h = React.createElement;

    /* Frames carried by the skin, referenced by CSS custom property name so the
     * art lives in one place. The crab reads its expression by swapping which
     * variable the shadow uses — no geometry duplicated in JS. */
    var FRAME = function (name) { return "var(--crab-f-" + name + ")"; };

    /* Where the crab sits, relative to the card's top edge. */
    var SIZE = 0.85;          // scale of the 48x36 native art

    /* What Clawd says. Short, dry, Clawd-flavoured — not a chatbot voice.
     * Kept in the plugin (not the skin) because it is behaviour, not styling. */
    var LINES = [
      "钳子在这儿呢。",
      "戳我干嘛，我正忙着发呆。",
      "别戳了，壳要掉了。",
      "……你这样我很难专注。",
      "海边的风不错，就是有点咸。",
      "我什么都不想吃，谢谢。",
      "再戳一下我就夹你。",
      "在的，一直在的。",
      "咕噜。",
      "你的光标挡到我晒太阳了。",
    ];

    var LINES_SLEEPY = [
      "呼……呼……",
      "别吵，我在做螃蟹的梦。",
      "……嗯？你刚才说什么。",
    ];

    /* Expression states. `look-*` are the eye-tracking frames the skin ships;
     * `cheer`/`shut` are the reaction frames. */
    var IDLE_FRAMES = ["open", "blink"];

    /* ------------------------------------------------------------------ */
    /* Styles — scoped to this plugin's own class names so they never leak. */
    /* ------------------------------------------------------------------ */
    var CSS = [
      /* Stand on the card's top edge, right-aligned. */
      /* POSITIONING IS EXPLICIT ON PURPOSE.
       *
       * right:32px, NOT 18px: the card's border-radius is 26px, so anything
       * inside ~26px of the corner stands on the curve and reads as floating.
       *
       * top is a computed negative, not `translateY(-100%)`: the art is painted
       * DOWNWARD from the origin by box-shadow, so the feet land on the line at
       *   top = -(art height * scale) - 1px
       * A percentage transform depends on the element's own height; if that
       * height ever fails to apply, the crab is drawn inside the card instead. */
      ".clawd3d{position:absolute;right:32px;",
      "top:calc(-1 * " + (36 * SIZE) + "px - 1px);",
      "width:" + (48 * SIZE) + "px;height:" + (36 * SIZE) + "px;",
      "cursor:pointer;user-select:none;-webkit-user-select:none;",
      "z-index:3;background:transparent;border:0;padding:0;",
      "transition:transform .13s ease}",

      /* The pixel element itself: one 3px cell, art painted by box-shadow. */
      ".clawd3d-px{position:absolute;left:0;top:0;width:3px;height:3px;",
      "background:transparent;transform-origin:0 0;",
      "transform:scale(" + SIZE + ");pointer-events:none}",

      ".clawd3d:hover{transform:translateY(calc(-100% - 2px))}",
      ".clawd3d:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);",
      "outline-offset:3px;border-radius:4px}",

      /* Speech bubble, above the crab. */
      ".clawd3d-say{position:absolute;right:0;bottom:calc(100% + 8px);",
      "max-width:190px;padding:6px 10px;border-radius:10px;",
      "background:var(--dsw-alias-bg-overlay,#fff);",
      "border:1px solid var(--dsw-alias-border-l2);",
      "box-shadow:var(--dsw-shadow-lv2);",
      "color:var(--dsw-alias-label-primary);",
      "font-size:12px;line-height:1.45;white-space:nowrap;",
      "pointer-events:none;opacity:0;transform:translateY(3px);",
      "transition:opacity .16s ease,transform .16s ease}",

      ".clawd3d-say[data-on='1']{opacity:1;transform:translateY(0)}",

      /* Cheer bounce when poked. */
      "@keyframes clawd3d-hop{0%,100%{translate:0 0}35%{translate:0 -5px}70%{translate:0 -1px}}",
      ".clawd3d[data-hop='1'] .clawd3d-px{animation:clawd3d-hop 520ms cubic-bezier(.34,1.2,.64,1)}",

      /* Suppress the skin's inert pseudo-crab: one crab, not two. */
      "[data-composer-card]::after{content:none !important}",

      "@media (prefers-reduced-motion:reduce){",
      ".clawd3d,.clawd3d-say{transition:none}",
      ".clawd3d[data-hop='1'] .clawd3d-px{animation:none}}",
    ].join("");

    /* ------------------------------------------------------------------ */
    /* The crab component.                                                 */
    /* ------------------------------------------------------------------ */
    function Clawd() {
      var pxRef = React.useRef(null);
      var rootRef = React.useRef(null);

      /* frame: which shadow variable is applied. line: current remark. */
      var frameState = React.useState("open");
      var frame = frameState[0], setFrame = frameState[1];
      var lineState = React.useState("");
      var line = lineState[0], setLine = lineState[1];
      var hopState = React.useState(false);
      var hop = hopState[0], setHop = hopState[1];

      var live = React.useRef([]);
      var poked = React.useRef(false);

      /* The timer SERVICE, not setTimeout. Two reasons: a dynamic client half
       * traps the browser timer globals outright, and the service ties every
       * pending callback to the plugin fiber — so unloading the plugin cancels
       * them instead of leaving them to fire into a torn-down tree. Using one
       * mechanism in both the static and dynamic builds keeps them identical. */
      var later = React.useCallback(function (fn, ms) {
        var dispose = ctx.timeout(fn, ms);
        live.current.push(dispose);
        return dispose;
      }, []);

      /* Every pending reaction dies with the component. */
      React.useEffect(function () {
        return function () {
          live.current.forEach(function (d) {
            try { d(); } catch (e) { /* already fired */ }
          });
          live.current = [];
        };
      }, []);

      /* Idle blinking. Paused while a poke reaction plays, so the reaction
       * reads instead of being overwritten by a blink. */
      React.useEffect(function () {
        var alive = true;
        (function loop() {
          if (!alive) return;
          later(function () {
            if (!alive) return;
            if (poked.current) return loop();
            setFrame("blink");
            later(function () {
              if (!alive) return;
              setFrame("open");
              loop();
            }, 130);
          }, 2600 + Math.random() * 2600);
        })();
        return function () { alive = false; };
      }, [later]);

      /* Eye tracking: map pointer position to one of four look frames.
       * Deliberately quantised to the four frames the art actually has —
       * faking smooth pupils would mean redrawing the sprite. */
      React.useEffect(function () {
        function onMove(e) {
          var el = rootRef.current;
          if (el === null) return;
          if (poked.current) return;   // let the reaction hold the expression
          var r = el.getBoundingClientRect();
          var cx = r.left + r.width / 2;
          var cy = r.top + r.height / 2;
          var dx = e.clientX - cx;
          var dy = e.clientY - cy;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 34) { setFrame("open"); return; }   // too close: face front
          /* Pick the dominant axis, like the reference's four look frames. */
          if (Math.abs(dx) > Math.abs(dy)) {
            setFrame(dx < 0 ? "look-l" : "look-r");
          } else {
            setFrame(dy < 0 ? "look-u" : "look-d");
          }
        }
        window.addEventListener("pointermove", onMove, { passive: true });
        return function () { window.removeEventListener("pointermove", onMove); };
      }, []);

      /* Poke: hop, grin, and say something. */
      var poke = React.useCallback(function () {
        poked.current = true;
        setHop(true);
        setFrame("cheer");
        var sleepy = Math.random() < 0.18;
        var pool = sleepy ? LINES_SLEEPY : LINES;
        setLine(pool[Math.floor(Math.random() * pool.length)]);
        later(function () { setFrame("cheer-mid"); }, 300);
        later(function () {
          setFrame("open");
          setHop(false);
        }, 900);
        later(function () { poked.current = false; }, 1400);
        later(function () { setLine(""); }, 3400);
      }, [later]);

      function onKey(e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          poke();
        }
      }

      return h(
        "div",
        {
          ref: rootRef,
          className: "clawd3d",
          role: "button",
          tabIndex: 0,
          "aria-label": "Clawd",
          "data-hop": hop ? "1" : "0",
          onClick: poke,
          onKeyDown: onKey,
        },
        h("div", { className: "clawd3d-say", "data-on": line ? "1" : "0" }, line),
        h("div", {
          ref: pxRef,
          className: "clawd3d-px",
          style: { boxShadow: FRAME(frame) },
        }),
      );
    }

    function apply(ctx) {
      /* Tell the skin's inert crab to stand down: exactly one Clawd. */
      ctx.effect(function () {
        document.body.setAttribute("data-clawd-interactive", "");
        return function () { document.body.removeAttribute("data-clawd-interactive"); };
      }, "dsh-claude-crab:marker");

      ctx.effect(function () {
        var el = document.createElement("style");
        el.setAttribute("data-dcc", "dsh-claude-crab");
        el.textContent = CSS;
        document.head.appendChild(el);
        return function () { if (el.parentNode) el.parentNode.removeChild(el); };
      }, "dsh-claude-crab:styles");

      var slots = ctx.get("slots");
      if (slots === undefined) return;

      slots.inject("conversation.input.overlay", function () {
        return slots.register(
          { name: "conversation.input.overlay", id: "clawd", order: 50 },
          Clawd,
        );
      });
    }

    exports.name = "dsh-claude-crab";
    exports.inject = ["slots", "timer"];
    exports.apply = apply;
    return module.exports;
  },
});
