window.__ModuleLoader__.load({
  id: "dsh-claude-crab",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* =====================================================================
     * Clawd — the interactive pixel crab, as a plain DOM element.
     *
     * WHY NOT A SLOT OCCUPANT
     * An earlier version registered a React component into
     * `conversation.input.overlay`. The skin's fallback crab disappeared (so
     * the plugin WAS loading), but no crab appeared — the occupant never
     * rendered. A slot occupant that throws is swallowed by the renderer's
     * error boundary, which makes that class of failure invisible.
     *
     * This version mounts the element directly and owns its whole lifecycle, so
     * there is no React render path to fail silently. It also means the crab
     * survives composer re-renders without depending on slot internals.
     *
     * Trade-off, stated honestly: this couples to the composer's DOM contract
     * (`[data-composer-card]`, which is an official attribute the conversation
     * package emits) rather than to the slot system. If that attribute ever
     * changes, the crab stops appearing — and the SKIN's fallback crab takes
     * over, so the composer is never left empty.
     *
     * The crab's pixel GEOMETRY is the mascot's own (credited to lulu /
     * claude-web in the repo LICENSE). Behaviour and CSS are original here.
     * ===================================================================== */

    var SIZE = 0.85;
    var ART_W = 48 * SIZE;   // 40.8
    var ART_H = 36 * SIZE;   // 30.6

    var LINES = [
      "钳子在这儿呢。",
      "戳我干嘛，我正忙着发呆。",
      "别戳了，壳要掉了。",
      "……你这样我很难专注。",
      "海边的风不错，就是有点咸。",
      "再戳一下我就夹你。",
      "在的，一直在的。",
      "咕噜。",
      "你的光标挡到我晒太阳了。",
      "我什么都不想吃，谢谢。",
    ];
    var SLEEPY = [
      "呼……呼……",
      "别吵，我在做螃蟹的梦。",
      "……嗯？你刚才说什么。",
    ];

    /* Every coordinate is a plain number formatted once — no CSS calc() and no
     * string arithmetic spread across the sheet. */
    function px(n) { return (Math.round(n * 1000) / 1000) + "px"; }

    var CSS = [
      ".dcc-crab{position:absolute;right:32px;top:" + px(-ART_H - 1) + ";",
      "width:" + px(ART_W) + ";height:" + px(ART_H) + ";",
      "cursor:pointer;user-select:none;-webkit-user-select:none;",
      "z-index:30;background:transparent;border:0;padding:0;",
      "transition:top .13s ease}",

      ".dcc-px{position:absolute;left:0;top:0;width:3px;height:3px;",
      "background:transparent;transform-origin:0 0;transform:scale(" + SIZE + ");",
      "pointer-events:none}",

      ".dcc-crab:hover{top:" + px(-ART_H - 4) + "}",

      ".dcc-crab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);",
      "outline-offset:3px;border-radius:4px}",

      ".dcc-say{position:absolute;right:0;bottom:" + px(ART_H + 8) + ";",
      "max-width:200px;padding:6px 10px;border-radius:10px;",
      "background:var(--dsw-alias-bg-overlay,#fff);",
      "border:1px solid var(--dsw-alias-border-l2);",
      "box-shadow:var(--dsw-shadow-lv2);",
      "color:var(--dsw-alias-label-primary);",
      "font-family:var(--dsw-font-family,sans-serif);",
      "font-size:12px;line-height:1.45;white-space:nowrap;",
      "pointer-events:none;opacity:0;transition:opacity .16s ease}",

      ".dcc-say[data-on='1']{opacity:1}",

      "@keyframes dcc-hop{0%,100%{transform:translateY(0)}35%{transform:translateY(-5px)}70%{transform:translateY(-1px)}}",
      ".dcc-crab[data-hop='1'] .dcc-px{animation:dcc-hop 520ms cubic-bezier(.34,1.2,.64,1)}",

      "@media (prefers-reduced-motion:reduce){",
      ".dcc-crab,.dcc-say{transition:none}",
      ".dcc-crab[data-hop='1'] .dcc-px{animation:none}}",
    ].join("");

    function apply(ctx) {
      /* ---------------------------------------------------------------- *
       * Style tag: owned by this fiber.
       * ---------------------------------------------------------------- */
      ctx.effect(function () {
        var el = document.createElement("style");
        el.setAttribute("data-dcc", "dsh-claude-crab");
        el.textContent = CSS;
        document.head.appendChild(el);
        return function () { if (el.parentNode) el.parentNode.removeChild(el); };
      }, "dsh-claude-crab:styles");

      /* ---------------------------------------------------------------- *
       * One crab, mounted into whichever composer card currently exists.
       * ---------------------------------------------------------------- */
      var root = null;          // the .dcc-crab element
      var pxEl = null;
      var sayEl = null;
      var timers = [];
      var poked = false;
      var blinkOn = false;

      function clearTimers() {
        for (var i = 0; i < timers.length; i++) {
          try { timers[i](); } catch (e) { /* already fired */ }
        }
        timers = [];
      }
      function later(fn, ms) {
        var d = ctx.timeout(fn, ms);
        timers.push(d);
        return d;
      }

      function setFrame(name) {
        if (pxEl === null) return;
        pxEl.style.boxShadow = "var(--crab-f-" + name + ")";
      }

      /* Idle blink: off/on, rescheduled each cycle so it drifts rather than
       * pulsing on a metronome. Suppressed while a poke reaction plays. */
      function blink() {
        if (root === null) return;
        if (blinkOn) return;
        blinkOn = true;
        later(function () {
          blinkOn = false;
          if (root === null) return;
          if (!poked) setFrame("blink");
          later(function () {
            if (root === null) return;
            if (!poked) setFrame("open");
            blink();
          }, 130);
        }, 2600 + Math.random() * 2600);
      }

      function say(text) {
        if (sayEl === null) return;
        sayEl.textContent = text;
        sayEl.setAttribute("data-on", text ? "1" : "0");
      }

      function poke() {
        if (root === null || poked) return;
        poked = true;
        root.setAttribute("data-hop", "1");
        setFrame("cheer");
        var pool = Math.random() < 0.18 ? SLEEPY : LINES;
        say(pool[Math.floor(Math.random() * pool.length)]);
        later(function () { setFrame("cheer-mid"); }, 300);
        later(function () {
          setFrame("open");
          root.setAttribute("data-hop", "0");
        }, 900);
        later(function () { poked = false; }, 1400);
        later(function () { say(""); }, 3400);
      }

      /* Eyes follow the pointer, quantised to the four look frames that exist.
       * A smooth pupil would mean redrawing the sprite, so the crab glances. */
      function onMove(e) {
        if (root === null || poked) return;
        var r = root.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 34) { setFrame("open"); return; }
        if (Math.abs(dx) > Math.abs(dy)) setFrame(dx < 0 ? "look-l" : "look-r");
        else setFrame(dy < 0 ? "look-u" : "look-d");
      }

      function onKey(e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); poke(); }
      }

      function mount() {
        var card = document.querySelector("[data-composer-card]");
        if (card === null) return false;
        if (root !== null && root.parentNode === card) return true;   // already there
        unmount();

        root = document.createElement("div");
        root.className = "dcc-crab";
        root.setAttribute("role", "button");
        root.setAttribute("tabindex", "0");
        root.setAttribute("aria-label", "Clawd");
        root.setAttribute("data-hop", "0");
        root.addEventListener("click", poke);
        root.addEventListener("keydown", onKey);

        sayEl = document.createElement("div");
        sayEl.className = "dcc-say";
        sayEl.setAttribute("data-on", "0");

        pxEl = document.createElement("div");
        pxEl.className = "dcc-px";
        setFrame("open");

        root.appendChild(sayEl);
        root.appendChild(pxEl);
        card.appendChild(root);

        /* The card is position:relative by the owner's own stylesheet, so the
         * crab's absolute coordinates resolve against it. Assert it instead of
         * trusting it: if the card is not positioned, the crab would be placed
         * against some far ancestor and drift. */
        var pos = getComputedStyle(card).position;
        if (pos === "static") card.style.position = "relative";

        document.body.setAttribute("data-clawd-interactive", "");
        blink();
        return true;
      }

      function unmount() {
        clearTimers();
        if (root !== null && root.parentNode) root.parentNode.removeChild(root);
        root = null; pxEl = null; sayEl = null;
        poked = false; blinkOn = false;
        document.body.removeAttribute("data-clawd-interactive");
      }

      /* ---------------------------------------------------------------- *
       * Mount now if the composer exists, and keep it mounted across the
       * re-renders that replace the card (new session, view switch, ...).
       * ---------------------------------------------------------------- */
      ctx.effect(function () {
        mount();
        var pending = false;
        var observer = new MutationObserver(function () {
          if (pending) return;
          pending = true;
          /* Batch to the next frame: the composer re-renders a lot. */
          requestAnimationFrame(function () {
            pending = false;
            var card = document.querySelector("[data-composer-card]");
            if (card === null) { if (root !== null) unmount(); return; }
            if (root === null || root.parentNode !== card) mount();
          });
        });
        observer.observe(document.documentElement, { childList: true, subtree: true });

        window.addEventListener("pointermove", onMove, { passive: true });

        return function () {
          observer.disconnect();
          window.removeEventListener("pointermove", onMove);
          unmount();
        };
      }, "dsh-claude-crab:mount");

      /* Diagnostics: if the crab is not in the DOM shortly after activation,
       * say so loudly instead of failing invisibly. */
      later(function () {
        if (root === null) {
          console.warn(
            "[dsh-claude-crab] no crab mounted: no [data-composer-card] found. " +
            "The skin's fallback crab remains in place.",
          );
        }
      }, 2500);
    }

    exports.name = "dsh-claude-crab";
    exports.inject = ["timer"];
    exports.apply = apply;
    return module.exports;
  },
});
