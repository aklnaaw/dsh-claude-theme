window.__ModuleLoader__.load({
  id: "dsh-claude-crab",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* Only the settings page needs React -- the crab itself is a plain DOM
     * element (see the note on why below). Resolved once here rather than on
     * every render of the settings page. */
    var React = require("react");

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
     * The crab's pixel GEOMETRY is the mascot's own (credited to claudenoshujin /
     * claude-web in the repo LICENSE). Behaviour and CSS are original here.
     * ===================================================================== */

    /* Pixel frames, embedded so the plugin is self-contained: it does NOT
     * depend on the skin being installed. Coordinates are anchored exactly the
     * way the skin anchors them, so both carriers draw identical art.
     *
     * Geometry credit: claudenoshujin (github.com/claudenoshujin/claude-web) — see the repo LICENSE. */
    var ART_W = 48, ART_H = 36;
    var FRAMES = {
      "open": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-eye), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-eye), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "blink": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "look-u": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-eye), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-eye), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-eye), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-eye), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-body), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-body), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "look-d": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-eye), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-eye), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "look-l": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-eye), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-eye), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-eye), 12px 15px 0 .3px var(--dcc-body), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-eye), 33px 15px 0 .3px var(--dcc-body), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "look-r": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-eye), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-eye), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-body), 15px 15px 0 .3px var(--dcc-eye), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-body), 36px 15px 0 .3px var(--dcc-eye), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "shut": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-eye), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-eye), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 12px 30px 0 .3px var(--dcc-body), 18px 30px 0 .3px var(--dcc-body), 27px 30px 0 .3px var(--dcc-body), 33px 30px 0 .3px var(--dcc-body)",
      "cheer": "3px 6px 0 .3px var(--dcc-body), 42px 6px 0 .3px var(--dcc-body), 0px 0px 0 .3px var(--dcc-body), 3px 0px 0 .3px var(--dcc-body), 42px 0px 0 .3px var(--dcc-body), 45px 0px 0 .3px var(--dcc-body), 0px 3px 0 .3px var(--dcc-body), 3px 3px 0 .3px var(--dcc-body), 42px 3px 0 .3px var(--dcc-body), 45px 3px 0 .3px var(--dcc-body), 6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-eye), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-eye), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "cheer-mid": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 0px 12px 0 .3px var(--dcc-body), 3px 12px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-eye), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-eye), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 42px 12px 0 .3px var(--dcc-body), 45px 12px 0 .3px var(--dcc-body), 0px 15px 0 .3px var(--dcc-body), 3px 15px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 42px 15px 0 .3px var(--dcc-body), 45px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 9px 30px 0 .3px var(--dcc-body), 15px 30px 0 .3px var(--dcc-body), 30px 30px 0 .3px var(--dcc-body), 36px 30px 0 .3px var(--dcc-body), 9px 33px 0 .3px var(--dcc-body), 15px 33px 0 .3px var(--dcc-body), 30px 33px 0 .3px var(--dcc-body), 36px 33px 0 .3px var(--dcc-body)",
      "tucked": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-eye), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-eye), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 12px 30px 0 .3px var(--dcc-body), 18px 30px 0 .3px var(--dcc-body), 27px 30px 0 .3px var(--dcc-body), 33px 30px 0 .3px var(--dcc-body)",
      "tucked-blink": "6px 6px 0 .3px var(--dcc-body), 9px 6px 0 .3px var(--dcc-body), 12px 6px 0 .3px var(--dcc-body), 15px 6px 0 .3px var(--dcc-body), 18px 6px 0 .3px var(--dcc-body), 21px 6px 0 .3px var(--dcc-body), 24px 6px 0 .3px var(--dcc-body), 27px 6px 0 .3px var(--dcc-body), 30px 6px 0 .3px var(--dcc-body), 33px 6px 0 .3px var(--dcc-body), 36px 6px 0 .3px var(--dcc-body), 39px 6px 0 .3px var(--dcc-body), 6px 9px 0 .3px var(--dcc-body), 9px 9px 0 .3px var(--dcc-body), 12px 9px 0 .3px var(--dcc-body), 15px 9px 0 .3px var(--dcc-body), 18px 9px 0 .3px var(--dcc-body), 21px 9px 0 .3px var(--dcc-body), 24px 9px 0 .3px var(--dcc-body), 27px 9px 0 .3px var(--dcc-body), 30px 9px 0 .3px var(--dcc-body), 33px 9px 0 .3px var(--dcc-body), 36px 9px 0 .3px var(--dcc-body), 39px 9px 0 .3px var(--dcc-body), 6px 12px 0 .3px var(--dcc-body), 9px 12px 0 .3px var(--dcc-body), 12px 12px 0 .3px var(--dcc-body), 15px 12px 0 .3px var(--dcc-body), 18px 12px 0 .3px var(--dcc-body), 21px 12px 0 .3px var(--dcc-body), 24px 12px 0 .3px var(--dcc-body), 27px 12px 0 .3px var(--dcc-body), 30px 12px 0 .3px var(--dcc-body), 33px 12px 0 .3px var(--dcc-body), 36px 12px 0 .3px var(--dcc-body), 39px 12px 0 .3px var(--dcc-body), 6px 15px 0 .3px var(--dcc-body), 9px 15px 0 .3px var(--dcc-body), 12px 15px 0 .3px var(--dcc-eye), 15px 15px 0 .3px var(--dcc-body), 18px 15px 0 .3px var(--dcc-body), 21px 15px 0 .3px var(--dcc-body), 24px 15px 0 .3px var(--dcc-body), 27px 15px 0 .3px var(--dcc-body), 30px 15px 0 .3px var(--dcc-body), 33px 15px 0 .3px var(--dcc-eye), 36px 15px 0 .3px var(--dcc-body), 39px 15px 0 .3px var(--dcc-body), 6px 18px 0 .3px var(--dcc-body), 9px 18px 0 .3px var(--dcc-body), 12px 18px 0 .3px var(--dcc-body), 15px 18px 0 .3px var(--dcc-body), 18px 18px 0 .3px var(--dcc-body), 21px 18px 0 .3px var(--dcc-body), 24px 18px 0 .3px var(--dcc-body), 27px 18px 0 .3px var(--dcc-body), 30px 18px 0 .3px var(--dcc-body), 33px 18px 0 .3px var(--dcc-body), 36px 18px 0 .3px var(--dcc-body), 39px 18px 0 .3px var(--dcc-body), 0px 21px 0 .3px var(--dcc-body), 3px 21px 0 .3px var(--dcc-body), 6px 21px 0 .3px var(--dcc-body), 9px 21px 0 .3px var(--dcc-body), 12px 21px 0 .3px var(--dcc-body), 15px 21px 0 .3px var(--dcc-body), 18px 21px 0 .3px var(--dcc-body), 21px 21px 0 .3px var(--dcc-body), 24px 21px 0 .3px var(--dcc-body), 27px 21px 0 .3px var(--dcc-body), 30px 21px 0 .3px var(--dcc-body), 33px 21px 0 .3px var(--dcc-body), 36px 21px 0 .3px var(--dcc-body), 39px 21px 0 .3px var(--dcc-body), 42px 21px 0 .3px var(--dcc-body), 45px 21px 0 .3px var(--dcc-body), 0px 24px 0 .3px var(--dcc-body), 3px 24px 0 .3px var(--dcc-body), 6px 24px 0 .3px var(--dcc-body), 9px 24px 0 .3px var(--dcc-body), 12px 24px 0 .3px var(--dcc-body), 15px 24px 0 .3px var(--dcc-body), 18px 24px 0 .3px var(--dcc-body), 21px 24px 0 .3px var(--dcc-body), 24px 24px 0 .3px var(--dcc-body), 27px 24px 0 .3px var(--dcc-body), 30px 24px 0 .3px var(--dcc-body), 33px 24px 0 .3px var(--dcc-body), 36px 24px 0 .3px var(--dcc-body), 39px 24px 0 .3px var(--dcc-body), 42px 24px 0 .3px var(--dcc-body), 45px 24px 0 .3px var(--dcc-body), 6px 27px 0 .3px var(--dcc-body), 9px 27px 0 .3px var(--dcc-body), 12px 27px 0 .3px var(--dcc-body), 15px 27px 0 .3px var(--dcc-body), 18px 27px 0 .3px var(--dcc-body), 21px 27px 0 .3px var(--dcc-body), 24px 27px 0 .3px var(--dcc-body), 27px 27px 0 .3px var(--dcc-body), 30px 27px 0 .3px var(--dcc-body), 33px 27px 0 .3px var(--dcc-body), 36px 27px 0 .3px var(--dcc-body), 39px 27px 0 .3px var(--dcc-body), 12px 30px 0 .3px var(--dcc-body), 18px 30px 0 .3px var(--dcc-body), 27px 30px 0 .3px var(--dcc-body), 33px 30px 0 .3px var(--dcc-body)"
    };

    /* Rendered scale of the 48x36 native art. */
    var SIZE = 0.85;

    /* Lines by situation, not one flat pool.
     *
     * A single pool means the crab says the same thing whether it was just
     * poked awake, is mid-generation, or has been ignored for an hour -- which
     * is what made it read as a static prop. The reference implementation this
     * art came from keys its lines the same way, and the situations are read
     * from the page rather than invented, so the crab reacts to what is
     * actually happening. See pickLine().
     */
    var LINES = {
      /* Nothing poked yet this session. */
      first: [
        "哦，你来了。",
        "嗯，在。",
        "你好呀。",
        "找到我了。",
        "小螃蟹上线。",
      ],
      /* Something is streaming in the conversation. */
      generating: [
        "忙着呢。",
        "等等，在写了。",
        "别催，手上有活。",
        "正在搅拌 token。",
        "快了快了。",
        "……别打断我。",
      ],
      /* Generation just finished, within a short window. */
      justDone: [
        "好了。",
        "给，收着。",
        "呼——",
        "齐活。",
        "搞定。",
      ],
      /* Nothing has happened for a long while, but not asleep yet. */
      idle: [
        "还在吗？",
        "……你在吗？",
        "喂。",
        "我可以等。",
        "这儿好安静。",
      ],
      /* Late at night. */
      late: [
        "还不睡？",
        "几点了这是。",
        "明天再说吧？",
        "去睡吧。",
        "夜猫子。",
      ],
      /* Asleep. Only reachable after the idle timer, which is the whole point
       * of the tucked frames that previously had no code path at all. */
      sleeping: [
        "呼……呼……",
        "别吵，我在做螃蟹的梦。",
        "……嗯？你刚才说什么。",
        "再五分钟……",
        "嘘……",
      ],
      /* The everyday pool. */
      default: [
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
      ],
      /* Poked repeatedly. Escalates, so the fourth one lands differently from
       * the second -- otherwise poking feels like a slot machine. */
      third: [
        "又戳？",
        "还在戳？",
        "很执着啊你。",
        "……痒。",
      ],
      fourth: [
        "停。",
        "手拿开。",
        "我的壳！",
        "私人空间，谢谢。",
      ],
    };

    /* The drowsy window opens at this fraction of the sleep delay -- eyes shut,
     * but not yet curled up. Kept as a ratio rather than a second setting, so
     * the two cannot be configured into a contradictory order (drowsy after
     * asleep). The reference implementation uses the same 75%. */
    var DROWSY_AT = 0.75;

    /* Every coordinate is a plain number formatted once — no CSS calc() and no
     * string arithmetic spread across the sheet. */
    function px(n) { return (Math.round(n * 1000) / 1000) + "px"; }

    var CSS = [
      /* The embedded frames reference these two, so the crab is fully
       * self-contained: no skin required, and it still follows the theme when
       * one is present because these read the same coral.
       *
       * Every one of these is overridden at runtime by the Clawd settings page
       * (see applyConfig); the values here are the defaults a fresh install
       * gets, and are deliberately identical to what shipped before settings
       * existed. */
      ".dcc-crab{--dcc-body:#d97757;--dcc-eye:#141413;--dcc-right:" + px(32) + ";",
      "--dcc-size:" + SIZE + "}",
      "body[data-ds-dark-theme] .dcc-crab{--dcc-eye:#181715}",

      /* Size is a variable rather than a literal so the settings page can
       * change it. The width, height, hover lift, bubble offset and heart
       * offset all derive from it, so they have to be expressed through the
       * same variable or the pieces would drift apart when it changes. */
      ".dcc-crab{position:absolute;right:var(--dcc-right);",
      "top:calc(-1 * " + px(ART_H) + " * var(--dcc-size) - 1px);",
      "width:calc(" + px(ART_W) + " * var(--dcc-size));",
      "height:calc(" + px(ART_H) + " * var(--dcc-size));",
      "cursor:pointer;user-select:none;-webkit-user-select:none;",
      "z-index:30;background:transparent;border:0;padding:0;",
      "transition:top .13s ease,right .2s ease}",

      ".dcc-px{position:absolute;left:0;top:0;width:3px;height:3px;",
      "background:transparent;transform-origin:0 0;",
      "transform:scale(var(--dcc-size));",
      "pointer-events:none}",

      /* Reactions animate this wrapper, never .dcc-px.
       *
       * The sprite's size lives in .dcc-px's own `transform`, and an animation
       * on that same element REPLACES it for its whole duration -- the crab
       * snapped to full size for every poke. Keeping the animation one level
       * out leaves the size untouched, and gives rotation a sane pivot: the
       * feet, rather than the art's top-left corner as .dcc-px's origin would. */
      ".dcc-anim{position:absolute;left:0;top:0;",
      "width:calc(" + px(ART_W) + " * var(--dcc-size));",
      "height:calc(" + px(ART_H) + " * var(--dcc-size));",
      "transform-origin:center bottom;pointer-events:none}",

      ".dcc-crab:hover{top:calc(-1 * " + px(ART_H) + " * var(--dcc-size) - 4px)}",

      ".dcc-crab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);",
      "outline-offset:3px;border-radius:4px}",

      ".dcc-say{position:absolute;right:0;",
      "bottom:calc(" + px(ART_H) + " * var(--dcc-size) + 8px);",
      "max-width:200px;padding:6px 10px;border-radius:10px;",
      "background:var(--dsw-alias-bg-overlay,#fff);",
      "border:1px solid var(--dsw-alias-border-l2);",
      "box-shadow:var(--dsw-shadow-lv2);",
      "color:var(--dsw-alias-label-primary);",
      "font-family:var(--dsw-font-family,sans-serif);",
      "font-size:12px;line-height:1.45;white-space:nowrap;",
      "pointer-events:none;opacity:0;transition:opacity .16s ease}",

      ".dcc-say[data-on='1']{opacity:1}",

      /* Six poke reactions, picked from a shuffled bag (see nextReaction) so
       * the same one never lands twice running. They come from the reference
       * implementation's BUTTON_REACTIONS set, which is the same six: hop,
       * wiggle, nod, peek, shy, nudge.
       *
       * All six animate the wrapper, not the sprite -- see the note on
       * .dcc-anim for why. Each only moves and squashes the existing art; none
       * of them needs a new pixel frame, which is how six reactions came out of
       * one cheerful frame. */
      "@keyframes dcc-hop{0%,100%{transform:translateY(0)}35%{transform:translateY(-5px)}70%{transform:translateY(-1px)}}",
      "@keyframes dcc-wiggle{",
      "0%,100%{transform:translateX(0) rotate(0)}",
      "18%{transform:translateX(-4px) rotate(-7deg)}",
      "36%{transform:translateX(4px) rotate(7deg)}",
      "54%{transform:translateX(-3px) rotate(-5deg)}",
      "72%{transform:translateX(2px) rotate(3deg)}",
      "88%{transform:translateX(-1px) rotate(-1deg)}}",
      /* A nod reads as agreement, so it dips and comes back rather than
       * travelling sideways. */
      "@keyframes dcc-nod{",
      "0%,100%{transform:translateY(0) scale(1)}",
      "26%{transform:translateY(3px) scale(1.03,.9)}",
      "48%{transform:translateY(-2px) scale(.99,1.04)}",
      "68%{transform:translateY(2px) scale(1.02,.94)}",
      "84%{transform:translateY(-1px) scale(1,1.02)}}",
      /* Peek leans out and holds, like looking around the edge of something. */
      "@keyframes dcc-peek{",
      "0%,100%{transform:translateX(0) translateY(0) rotate(0)}",
      "22%{transform:translateX(4px) translateY(-2px) rotate(5deg)}",
      "56%{transform:translateX(5px) translateY(-3px) rotate(6deg)}",
      "78%{transform:translateX(-1px) translateY(1px) rotate(-2deg)}}",
      /* Shy pulls the whole body down and in. */
      "@keyframes dcc-shy{",
      "0%,100%{transform:translateY(0) scale(1) rotate(0)}",
      "22%{transform:translateY(2px) scale(1.06,.82) rotate(-4deg)}",
      "52%{transform:translateY(3px) scale(1.08,.78) rotate(3deg)}",
      "76%{transform:translateY(-1px) scale(.98,1.04) rotate(-1deg)}}",
      /* The nuzzle: the whole crab leans to one side and springs back. Lighter
       * than a hop and fonder than a wiggle, which is why it is the one the
       * settings page gates and the only one that brings a heart. */
      "@keyframes dcc-nudge{",
      "0%,100%{transform:translateX(0) translateY(0) rotate(0)}",
      "30%{transform:translateX(-5px) translateY(1px) rotate(-3deg)}",
      "62%{transform:translateX(3px) translateY(0) rotate(2deg)}",
      "84%{transform:translateX(-1px) translateY(0) rotate(-1deg)}}",

      ".dcc-crab[data-react='hop'] .dcc-anim{animation:dcc-hop 520ms cubic-bezier(.34,1.2,.64,1)}",
      ".dcc-crab[data-react='wiggle'] .dcc-anim{animation:dcc-wiggle 620ms cubic-bezier(.2,.8,.25,1.15)}",
      ".dcc-crab[data-react='nod'] .dcc-anim{animation:dcc-nod 520ms cubic-bezier(.2,.8,.25,1.15)}",
      ".dcc-crab[data-react='peek'] .dcc-anim{animation:dcc-peek 680ms cubic-bezier(.2,.82,.22,1)}",
      ".dcc-crab[data-react='shy'] .dcc-anim{animation:dcc-shy 720ms cubic-bezier(.2,.76,.22,1)}",
      ".dcc-crab[data-react='nudge'] .dcc-anim{animation:dcc-nudge 480ms cubic-bezier(.3,.7,.3,1.2)}",

      /* A heart that rises and fades. Decoration only, so it is suppressed
       * under reduced-motion like everything else. */
      "@keyframes dcc-heart{",
      "0%{opacity:0;transform:translateY(0) scale(.6)}",
      "18%{opacity:1;transform:translateY(-6px) scale(1)}",
      "100%{opacity:0;transform:translateY(-26px) scale(.9)}}",
      ".dcc-heart{position:absolute;right:2px;",
      "bottom:calc(" + px(ART_H) + " * var(--dcc-size));",
      "font-size:12px;line-height:1;color:#e07a9a;",
      "pointer-events:none;opacity:0;",
      "animation:dcc-heart 1100ms ease-out forwards}",

      "@media (prefers-reduced-motion:reduce){",
      ".dcc-crab,.dcc-say{transition:none}",
      /* One rule for every reaction: they all animate the wrapper now. */
      ".dcc-crab .dcc-anim{animation:none}",
      ".dcc-heart{display:none}}",
    ].join("");

    /* ------------------------------------------------------------------ *
     * Settings.
     *
     * Defaults are exactly what shipped in 1.0.0, so an install that never
     * opens the Clawd page behaves identically to before. Stored in
     * localStorage because that is where the other small plugins in this repo
     * keep browser-local preferences, and a static client half has nowhere
     * else to put them.
     * ------------------------------------------------------------------ */
    var STORE_KEY = "dsh-claude-crab.prefs";

    var DEFAULTS = {
      /* Follow the active theme's brand colour instead of the fixed coral.
       * Off by default: the coral is the crab's identity. */
      followTheme: false,
      /* Distance from the composer's right edge, in px. */
      right: 32,
      /* Rendered scale of the sprite. 0.85 is the size 1.0.0 shipped. */
      size: SIZE,
      /* Quiet time before it drops off, in ms. 180000 is three minutes, which
       * is what the reference implementation uses. The drowsy threshold is
       * derived from this rather than set separately, so the two cannot be
       * configured into a contradictory order. */
      sleepAfter: 180000,
      /* Chance a poke gets a sleepy line rather than a normal one. */
      sleepyChance: 0.18,
      /* The nuzzle reaction, and the heart that comes with it. On by default
       * because that is what makes the crab feel fond rather than just
       * reactive; the switch is here for anyone who finds it too much. */
      nuzzle: true,
      /* Line pools. null means "use the built-in pool for this situation". */
      lines: null,
    };

    function readPrefs() {
      var out = {};
      for (var k in DEFAULTS) {
        if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) out[k] = DEFAULTS[k];
      }
      try {
        if (typeof localStorage === "undefined") return out;
        var raw = localStorage.getItem(STORE_KEY);
        if (raw === null) return out;
        var parsed = JSON.parse(raw);
        if (typeof parsed !== "object" || parsed === null) return out;
        if (typeof parsed.followTheme === "boolean") out.followTheme = parsed.followTheme;
        if (typeof parsed.right === "number" && isFinite(parsed.right)) {
          out.right = Math.max(0, Math.min(400, Math.round(parsed.right)));
        }
        if (typeof parsed.sleepyChance === "number" && isFinite(parsed.sleepyChance)) {
          out.sleepyChance = Math.max(0, Math.min(1, parsed.sleepyChance));
        }
        if (typeof parsed.nuzzle === "boolean") out.nuzzle = parsed.nuzzle;
        if (typeof parsed.size === "number" && isFinite(parsed.size)) {
          out.size = Math.max(0.5, Math.min(1.4, parsed.size));
        }
        if (typeof parsed.sleepAfter === "number" && isFinite(parsed.sleepAfter)) {
          out.sleepAfter = Math.max(30000, Math.min(600000, parsed.sleepAfter));
        }
        if (parsed.lines && typeof parsed.lines === "object") out.lines = parsed.lines;
      } catch (e) { /* unreadable storage falls back to defaults */ }
      return out;
    }

    function writePrefs(patch) {
      var next = readPrefs();
      for (var k in patch) {
        if (Object.prototype.hasOwnProperty.call(patch, k)) next[k] = patch[k];
      }
      try {
        if (typeof localStorage !== "undefined") {
          localStorage.setItem(STORE_KEY, JSON.stringify(next));
        }
      } catch (e) { /* storage blocked; the page still updates */ }
      notify(next);
    }

    /* Subscribers are React state setters or no-arg appliers, so the current
     * value is passed rather than left to each one to re-read.
     *
     * This used to call every subscriber with no arguments. The settings page
     * registers a useState setter, so a slider drag ran setPrefs(undefined) --
     * React stored undefined as the state, the next render read prefs.lines
     * off it, and the whole settings page unmounted on the first input event.
     * That is what made the sliders appear frozen. */
    var subscribers = new Set();
    function notify(value) {
      subscribers.forEach(function (fn) {
        try { fn(value); } catch (e) { /* detached */ }
      });
    }

    /**
     * Resolve the pool for one situation.
     *
     * A user-supplied pool for a situation wins; otherwise the built-in one is
     * used. An empty user pool is treated as "no opinion" rather than "say
     * nothing", so clearing a textarea restores the default instead of
     * silencing the crab.
     */
    function poolFor(prefs, situation) {
      var custom = prefs.lines && prefs.lines[situation];
      if (custom && custom.length) return custom;
      return LINES[situation] || LINES["default"];
    }

    /* ------------------------------------------------------------------ *
     * Settings page.
     * ------------------------------------------------------------------ */
    var SITUATIONS = [
      { key: "first", label: "第一次见面", hint: "还没戳过时的开场" },
      { key: "default", label: "日常", hint: "最常用的一池" },
      { key: "generating", label: "它看到你在生成", hint: "对话正在流式输出" },
      { key: "justDone", label: "生成刚结束", hint: "回答刚写完的几秒内" },
      { key: "idle", label: "被冷落", hint: "安静了一阵子" },
      { key: "late", label: "深夜", hint: "凌晨 5 点前" },
      { key: "sleeping", label: "睡着时被戳", hint: "入睡后被吵醒" },
      { key: "third", label: "连戳第三次", hint: "开始不耐烦" },
      { key: "fourth", label: "连戳第四次", hint: "真的烦了" },
    ];

    function CrabSection() {
      var h = React.createElement;

      var state = React.useState(readPrefs);
      var prefs = state[0], setPrefs = state[1];
      var draftState = React.useState(null);
      var draft = draftState[0], setDraft = draftState[1];

      React.useEffect(function () {
        subscribers.add(setPrefs);
        return function () { subscribers.delete(setPrefs); };
      }, []);

      function update(patch) {
        writePrefs(patch);
      }

      /* The pools are edited as one line per entry, which is the shape people
       * actually read and edit. An empty box means "use the built-in pool",
       * so clearing a field restores the default rather than silencing the
       * crab -- silence would look like a bug. */
      function poolText(key) {
        var custom = prefs.lines && prefs.lines[key];
        var builtin = LINES[key] || [];
        return (custom && custom.length ? custom : builtin).join("\n");
      }

      function savePool(key, text) {
        var lines = text.split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
        var builtin = LINES[key] || [];
        var nextLines = {};
        var cur = prefs.lines || {};
        for (var k in cur) if (Object.prototype.hasOwnProperty.call(cur, k)) nextLines[k] = cur[k];
        /* Identical to the built-in pool means no override, which keeps
         * localStorage small and lets a future default change show through. */
        var same = lines.length === builtin.length && lines.every(function (v, i) { return v === builtin[i]; });
        if (!lines.length || same) delete nextLines[key];
        else nextLines[key] = lines;
        update({ lines: Object.keys(nextLines).length ? nextLines : null });
      }

      var rows = SITUATIONS.map(function (sit) {
        var isCustom = !!(prefs.lines && prefs.lines[sit.key] && prefs.lines[sit.key].length);
        return h(
          "div",
          { className: "dcc-row", key: sit.key },
          h(
            "div",
            { className: "dcc-rowhead" },
            h("span", { className: "dcc-lbl" }, sit.label),
            h("span", { className: "dcc-hint" }, sit.hint),
            isCustom ? h("span", { className: "dcc-tag" }, "已自定义") : null,
          ),
          h("textarea", {
            className: "dcc-ta",
            rows: 3,
            spellCheck: false,
            value: poolText(sit.key),
            onChange: function (e) { savePool(sit.key, e.target.value); },
          }),
        );
      });

      return h(
        "div",
        { className: "dcc-sec" },

        h(
          "div",
          { className: "dcc-row" },
          h("div", { className: "dcc-lbl" }, "行为"),
          h(
            "label",
            { className: "dcc-check" },
            h("input", {
              type: "checkbox",
              checked: prefs.followTheme,
              onChange: function (e) { update({ followTheme: e.target.checked }); },
            }),
            h("span", null, "跟随主题强调色"),
          ),
          h(
            "div",
            { className: "dcc-hint" },
            "勾上后蟹身用当前主题的品牌色，而不是固定的珊瑚橙。",
          ),
          h(
            "label",
            { className: "dcc-check" },
            h("input", {
              type: "checkbox",
              checked: prefs.nuzzle,
              onChange: function (e) { update({ nuzzle: e.target.checked }); },
            }),
            h("span", null, "抚摸（蹭蹭）"),
          ),
          h(
            "div",
            { className: "dcc-hint" },
            "开着时，六种反应里会有「蹭蹭」——整只往一侧蹭过来再弹回，并冒一颗爱心；" +
              "关掉就只剩另外五种。",
          ),
        ),

        h(
          "div",
          { className: "dcc-row" },
          h("div", { className: "dcc-lbl" }, "尺寸 " + Math.round(prefs.size * 100) + "%"),
          h("input", {
            className: "dcc-range",
            type: "range",
            min: 50,
            max: 140,
            step: 5,
            value: Math.round(prefs.size * 100),
            onChange: function (e) { update({ size: Number(e.target.value) / 100 }); },
          }),
        ),

        h(
          "div",
          { className: "dcc-row" },
          h("div", { className: "dcc-lbl" }, "距右边缘 " + prefs.right + " px"),
          h("input", {
            className: "dcc-range",
            type: "range",
            min: 0,
            max: 200,
            step: 2,
            value: prefs.right,
            onChange: function (e) { update({ right: Number(e.target.value) }); },
          }),
        ),

        h(
          "div",
          { className: "dcc-row" },
          h(
            "div",
            { className: "dcc-lbl" },
            "闲置多久睡着 " + Math.round(prefs.sleepAfter / 1000) + " 秒",
          ),
          h("input", {
            className: "dcc-range",
            type: "range",
            min: 30,
            max: 600,
            step: 30,
            value: Math.round(prefs.sleepAfter / 1000),
            onChange: function (e) { update({ sleepAfter: Number(e.target.value) * 1000 }); },
          }),
          h(
            "div",
            { className: "dcc-hint" },
            "到 " + Math.round((prefs.sleepAfter / 1000) * DROWSY_AT) +
              " 秒开始合眼，之后蜷起来睡着；有动静就醒。",
          ),
        ),

        h(
          "div",
          { className: "dcc-row" },
          h("div", { className: "dcc-lbl" }, "犯困概率 " + Math.round(prefs.sleepyChance * 100) + "%"),
          h("input", {
            className: "dcc-range",
            type: "range",
            min: 0,
            max: 100,
            step: 5,
            value: Math.round(prefs.sleepyChance * 100),
            onChange: function (e) { update({ sleepyChance: Number(e.target.value) / 100 }); },
          }),
          h("div", { className: "dcc-hint" }, "戳一下时说到困话的几率，其余走当前情境的台词。"),
        ),

        h(
          "div",
          { className: "dcc-actions" },
          h(
            "button",
            {
              type: "button",
              className: "dcc-btn",
              onClick: function () {
                var next = {};
                for (var k in DEFAULTS) if (Object.prototype.hasOwnProperty.call(DEFAULTS, k)) next[k] = DEFAULTS[k];
                update(next);
              },
            },
            "恢复默认",
          ),
        ),

        h("div", { className: "dcc-sep" }, "台词池"),

        h(
          "div",
          { className: "dcc-hint dcc-note" },
          "每行一句，留空的行会被忽略。整池与默认一致时不算自定义，所以清空就等于恢复默认。",
        ),

        rows,
      );
    }

    var SETTINGS_CSS = [
      ".dcc-sec{display:flex;flex-direction:column;gap:16px;padding:4px 0 8px}",
      ".dcc-row{display:flex;flex-direction:column;gap:6px}",
      ".dcc-rowhead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}",
      ".dcc-lbl{font-size:13px;font-weight:500;color:var(--dsw-alias-label-primary)}",
      ".dcc-hint{font-size:12px;color:var(--dsw-alias-label-tertiary);line-height:1.6}",
      ".dcc-note{line-height:1.7}",
      ".dcc-tag{font-size:11px;padding:1px 6px;border-radius:6px;",
      "color:var(--dsw-alias-label-tertiary);",
      "border:1px solid var(--dsw-alias-border-l2)}",
      ".dcc-check{display:flex;align-items:center;gap:8px;cursor:pointer;",
      "font-size:13px;color:var(--dsw-alias-label-primary)}",
      ".dcc-range{width:100%;cursor:pointer;accent-color:var(--dsw-alias-brand-primary)}",
      ".dcc-ta{",
      "font-family:var(--dsw-font-family-mono,monospace);font-size:12px;line-height:1.6;",
      "padding:8px 10px;border-radius:10px;resize:vertical;width:100%;box-sizing:border-box;",
      "color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-base);",
      "border:1px solid var(--dsw-alias-border-l2);outline:none}",
      ".dcc-ta:focus{border-color:var(--dsw-alias-brand-primary)}",
      ".dcc-actions{display:flex;gap:8px;flex-wrap:wrap}",
      ".dcc-btn{font-family:inherit;font-size:12px;cursor:pointer;",
      "padding:6px 12px;border-radius:8px;color:var(--dsw-alias-label-primary);",
      "background:transparent;border:1px solid var(--dsw-alias-border-l2)}",
      ".dcc-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}",
      ".dcc-sep{font-size:12px;font-weight:500;color:var(--dsw-alias-label-secondary);",
      "padding-top:6px;border-top:1px solid var(--dsw-alias-border-l2)}",
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
      var animEl = null;        // the .dcc-anim wrapper the reactions move
      var pxEl = null;
      var sayEl = null;
      var timers = [];
      var poked = false;
      var blinkOn = false;

      /* Behaviour state. `drowsy` and `asleep` are the states the tucked and
       * shut frames were drawn for; before this they had no code path at all,
       * which is why the crab never looked tired. */
      var state = "awake";       // awake | drowsy | asleep
      var lastActivityAt = Date.now();
      var pokeCount = 0;
      var pokeAt = 0;
      var lastDoneAt = 0;
      var hasStreamed = false;
      var wokeAt = 0;

      /* One-shot timers, so unmount can cancel anything still pending.
       *
       * A fired timer must also remove itself. `timers` used to accumulate
       * every disposer it was ever handed, and because blink() reschedules
       * itself forever that array grew without bound -- roughly 900 entries an
       * hour. The one-second tick added below would have made it 4500. Each
       * entry is a closure and a disposer for a timeout that already fired, so
       * the waste is small per item but unbounded over a long session. */
      function clearTimers() {
        for (var i = 0; i < timers.length; i++) {
          try { timers[i](); } catch (e) { /* already fired */ }
        }
        timers = [];
      }

      function later(fn, ms) {
        var i = timers.length;
        var d = ctx.timeout(function () {
          /* Drop this entry before running: the callback may queue another
           * timer, and re-entering with a stale index would corrupt the list. */
          if (timers[i] === d) timers.splice(i, 1);
          fn();
        }, ms);
        timers.push(d);
        return d;
      }

      /* Recurring timers are held by name instead of in `timers`, because only
       * the pending one matters and there is never more than one of each. */
      var recurring = {};
      function repeat(name, fn, ms) {
        recurring[name] = ctx.timeout(fn, ms);
      }
      function stopRecurring() {
        for (var k in recurring) {
          if (Object.prototype.hasOwnProperty.call(recurring, k)) {
            try { recurring[k](); } catch (e) { /* already fired */ }
          }
        }
        recurring = {};
      }

      function setFrame(name) {
        if (pxEl === null) return;
        pxEl.style.boxShadow = FRAMES[name] || FRAMES.open;
      }

      /* ------------------------------------------------------------------ *
       * Situation.
       *
       * Where the crab's mood comes from. Each branch reads something real
       * about the page rather than rolling dice, so a line matches what is
       * actually happening -- this is the difference between a mascot and a
       * random quote generator.
       * ------------------------------------------------------------------ */
      function isStreaming() {
        /* The chat surface marks an in-flight assistant message with
         * data-streaming. That is the signal used here rather than inferring
         * from a button's label, which is locale-dependent. */
        return document.querySelector("[data-streaming]") !== null;
      }

      function situation() {
        var prefs = readPrefs();
        var now = Date.now();

        if (state === "asleep") return "sleeping";
        if (!pokeAt) return "first";
        if (now - wokeAt < 2500) return "sleeping";
        /* Repeated poking escalates, so the fourth poke is not the second. */
        if (pokeCount >= 4) return "fourth";
        if (pokeCount === 3) return "third";
        if (isStreaming()) return "generating";
        if (lastDoneAt && now - lastDoneAt < 4000) return "justDone";
        if (state === "drowsy") return "idle";
        if (new Date().getHours() < 5) return "late";
        if (now - lastActivityAt > 60000) return "idle";
        return "default";
      }

      /**
       * Pick a line, avoiding an immediate repeat.
       *
       * With a pool of five and no tracking, the same line lands twice in a
       * row often enough to read as broken.
       */
      var lastSaid = "";
      function pickLine(sit) {
        var prefs = readPrefs();
        var pool = poolFor(prefs, sit);
        if (!pool || !pool.length) return "";
        /* Vestigial: kept so a user pool of one item still works, and so the
         * sleepy pool can be forced by the setting below. */
        if (pool.length === 1) return pool[0];
        var pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick === lastSaid) {
          pick = pool[(pool.indexOf(pick) + 1 + Math.floor(Math.random() * (pool.length - 1))) % pool.length];
        }
        lastSaid = pick;
        return pick;
      }

      /* Idle blink: off/on, rescheduled each cycle so it drifts rather than
       * pulsing on a metronome. Suppressed while a poke reaction plays, and
       * replaced by the slow breathing blink when asleep. */
      function blink() {
        if (root === null) return;
        if (blinkOn) return;
        blinkOn = true;
        var wait = state === "asleep" ? 5200 + Math.random() * 2600 : 2600 + Math.random() * 2600;
        repeat("blink", function () {
          blinkOn = false;
          if (root === null) return;
          if (poked) { blink(); return; }
          if (state === "asleep") setFrame("tucked-blink");
          else if (state === "drowsy") setFrame("shut");
          else setFrame("blink");
          later(function () {
            if (root === null) return;
            if (poked) { blink(); return; }
            setFrame(frameForState());
            blink();
          }, state === "asleep" ? 420 : 130);
        }, wait);
      }

      /** The resting frame for the current state. */
      function frameForState() {
        if (state === "asleep") return "tucked";
        if (state === "drowsy") return "shut";
        return "open";
      }

      function settle() {
        setFrame(frameForState());
      }

      /* ------------------------------------------------------------------ *
       * Idle progression: awake -> drowsy -> asleep.
       *
       * Polled rather than scheduled per-state, because activity can arrive at
       * any moment and a scheduled wake would have to be cancelled from three
       * different places. A one-second tick is cheap and keeps one source of
       * truth.
       * ------------------------------------------------------------------ */
      function tick() {
        if (root === null) return;
        var idle = Date.now() - lastActivityAt;

        var sleepAfter = readPrefs().sleepAfter;
        if (state !== "asleep" && idle > sleepAfter) {
          state = "asleep";
          settle();
        } else if (state === "awake" && idle > sleepAfter * DROWSY_AT) {
          state = "drowsy";
          settle();
        }

        repeat("tick", tick, 1000);
      }

      /** Anything the user does resets the idle clock and wakes the crab. */
      function noteActivity() {
        lastActivityAt = Date.now();
        if (state !== "awake") {
          var wasAsleep = state === "asleep";
          state = "awake";
          if (wasAsleep) wokeAt = Date.now();
          if (!poked) settle();
        }
      }

      function say(text) {
        if (sayEl === null) return;
        sayEl.textContent = text;
        sayEl.setAttribute("data-on", text ? "1" : "0");
      }

      /**
       * Float a heart above the crab, then remove it.
       *
       * Added to the crab rather than to the document so it inherits the same
       * coordinate space and disappears with the crab on unmount. Removed on
       * its own animationend instead of on a timer, so a background tab (where
       * animations do not run) cannot leave one stuck on screen.
       */
      function spawnHeart(host) {
        var heart = document.createElement("div");
        heart.className = "dcc-heart";
        heart.textContent = "\u2665";
        heart.setAttribute("aria-hidden", "true");
        heart.addEventListener("animationend", function () {
          if (heart.parentNode) heart.parentNode.removeChild(heart);
        }, { once: true });
        host.appendChild(heart);
      }

      /* The six reactions, in the reference implementation's own order. */
      var REACTIONS = ["hop", "wiggle", "nod", "peek", "shy", "nudge"];

      /* A shuffled bag rather than a random pick.
       *
       * Random picking repeats often enough to read as broken -- with six
       * reactions a repeat lands about one poke in six. Dealing from a
       * reshuffled bag guarantees no reaction repeats until all the others
       * have been used. */
      var bag = [];
      function nextReaction(nuzzleOn) {
        var pool = [];
        for (var i = 0; i < REACTIONS.length; i++) {
          /* With the nuzzle switched off the crab keeps the other five and
           * simply never nuzzles. */
          if (REACTIONS[i] === "nudge" && !nuzzleOn) continue;
          pool.push(REACTIONS[i]);
        }
        if (!bag.length) bag = pool.slice();
        /* Drop anything the settings changed out from under the bag. */
        for (var j = 0; j < bag.length; j++) {
          if (pool.indexOf(bag[j]) === -1) { bag.splice(j, 1); j--; }
        }
        if (!bag.length) bag = pool.slice();
        return bag.splice(Math.floor(Math.random() * bag.length), 1)[0];
      }

      function poke() {
        if (root === null || poked) return;
        noteActivity();
        poked = true;

        /* Count rapid pokes; a pause resets the streak so the escalation is
         * about a burst, not about total lifetime pokes. */
        var now = Date.now();
        pokeCount = now - pokeAt < 2600 ? pokeCount + 1 : 1;
        pokeAt = now;

        /* One of six reactions rather than the same hop every time. The bag is
         * shuffled so the same one never lands twice running; the reactions are
         * CSS transforms on .dcc-anim, so six of them came out of the single
         * cheerful frame.
         *
         * The nuzzle is the fond one, and the setting gates it: with nuzzle off
         * it leaves the bag entirely, so the crab keeps five reactions and just
         * never nuzzles. */
        var prefs = readPrefs();
        var reaction = nextReaction(prefs.nuzzle);
        root.setAttribute("data-react", reaction);
        if (reaction === "nudge") spawnHeart(root);
        setFrame("cheer");

        var sit = situation();
        var pool = poolFor(prefs, sit);
        var text = pickLine(sit);
        /* The sleepy pool is a mood, not a situation: a setting decides how
         * often a normal poke gets a sleepy line instead. */
        if (sit !== "sleeping" && Math.random() < prefs.sleepyChance) {
          text = pickLine("sleeping");
        }
        say(text);

        later(function () { setFrame("cheer-mid"); }, 300);
        later(function () {
          settle();
          /* Clearing the attribute is what stops the animation: the rules are
           * keyed on the value, so any non-matching value would do, but an
           * empty string also lets a re-poke re-trigger the same reaction
           * (the attribute changes, so the animation restarts). */
          root.removeAttribute("data-react");
        }, 900);
        later(function () { poked = false; }, 1400);
        later(function () { say(""); }, 3400);
      }

      /* Eyes follow the pointer, quantised to the four look frames that exist.
       * A smooth pupil would mean redrawing the sprite, so the crab glances. */
      function onMove(e) {
        if (root === null || poked) return;
        noteActivity();
        if (state === "asleep") return;
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

        /* Remove every stray crab in this card before adding ours.
         *
         * The guard above only knows about THIS closure's `root`. If apply()
         * ever runs twice against the same card — two fibers, a re-activation,
         * a hot reload — each closure holds its own `root`, both pass the
         * guard, and the card ends up with two crabs stacked at identical
         * coordinates. Ownership must be decided from the DOM, not from a
         * per-closure variable. */
        var strays = card.querySelectorAll(".dcc-crab");
        for (var i = 0; i < strays.length; i++) {
          var s = strays[i];
          if (s !== root && s.parentNode) s.parentNode.removeChild(s);
        }

        unmount();

        root = document.createElement("div");
        root.className = "dcc-crab";
        root.setAttribute("role", "button");
        root.setAttribute("tabindex", "0");
        root.setAttribute("aria-label", "Clawd");
        root.addEventListener("click", poke);
        root.addEventListener("keydown", onKey);

        sayEl = document.createElement("div");
        sayEl.className = "dcc-say";
        sayEl.setAttribute("data-on", "0");

        /* Reactions animate this wrapper, not .dcc-px: an animation on .dcc-px
         * would replace its own `transform:scale(--dcc-size)`, blowing the crab
         * up to full size for the length of every poke. The sprite keeps its
         * transform here, one level in. */
        animEl = document.createElement("div");
        animEl.className = "dcc-anim";

        pxEl = document.createElement("div");
        pxEl.className = "dcc-px";
        setFrame("open");

        animEl.appendChild(pxEl);
        root.appendChild(sayEl);
        root.appendChild(animEl);
        card.appendChild(root);

        /* The card is position:relative by the owner's own stylesheet, so the
         * crab's absolute coordinates resolve against it. Assert it instead of
         * trusting it: if the card is not positioned, the crab would be placed
         * against some far ancestor and drift. */
        var pos = getComputedStyle(card).position;
        if (pos === "static") card.style.position = "relative";

        document.body.setAttribute("data-clawd-interactive", "");
        applyConfig();
        settle();
        blink();
        tick();
        return true;
      }

      /**
       * Push the current settings onto the crab.
       *
       * Written as inline custom properties on the element rather than by
       * regenerating the stylesheet: this runs on every settings change, and
       * rewriting a <style> tag would make the whole sheet re-parse for a
       * colour tweak.
       */
      function applyConfig() {
        if (root === null) return;
        var prefs = readPrefs();
        if (prefs.followTheme) {
          /* Follow the brand token when it exists, which is what makes the
           * crab match a theme other than this one. */
          root.style.setProperty("--dcc-body", "var(--dsw-alias-brand-primary, #d97757)");
        } else {
          root.style.removeProperty("--dcc-body");
        }
        root.style.setProperty("--dcc-right", px(prefs.right));
        root.style.setProperty("--dcc-size", String(prefs.size));
      }

      /* ------------------------------------------------------------------ *
       * Generation tracking.
       *
       * Watches the same mutation stream the composer does, so "just finished"
       * is a real event rather than a guess. Transitions are detected here
       * rather than polled, because the moment of completion matters for the
       * justDone window and a one-second tick would blur it.
       * ------------------------------------------------------------------ */
      function watchStreaming() {
        var was = isStreaming();
        hasStreamed = hasStreamed || was;
        var obs = new MutationObserver(function () {
          var now = isStreaming();
          if (was && !now) {
            lastDoneAt = Date.now();
            /* A finished generation is activity: pull the crab out of drowsy
             * so it does not look asleep right after being used. */
            noteActivity();
          }
          hasStreamed = hasStreamed || now;
          was = now;
        });
        obs.observe(document.documentElement, {
          childList: true, subtree: true, attributes: true,
          attributeFilter: ["data-streaming"],
        });
        return function () { obs.disconnect(); };
      }

      function unmount() {
        clearTimers();
        /* Recurring timers live outside `timers`, so they need their own stop
         * or the tick would keep firing against a detached crab. */
        stopRecurring();
        if (root !== null && root.parentNode) root.parentNode.removeChild(root);
        root = null; pxEl = null; animEl = null; sayEl = null;
        poked = false; blinkOn = false;
        state = "awake";
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

        /* Watching for generation start/end is separate from the mount
         * observer: that one batches to the next frame, which would blur the
         * moment a generation finishes. */
        var stopStreamWatch = watchStreaming();

        /* Re-apply settings the moment they change, so the sliders take effect
         * without a reload. */
        subscribers.add(applyConfig);

        return function () {
          observer.disconnect();
          stopStreamWatch();
          subscribers.delete(applyConfig);
          window.removeEventListener("pointermove", onMove);
          unmount();
        };
      }, "dsh-claude-crab:mount");

      /* ------------------------------------------------------------------ *
       * Settings page.
       * ------------------------------------------------------------------ */
      ctx.effect(function () {
        var el = document.createElement("style");
        el.setAttribute("data-dcc-settings", "dsh-claude-crab");
        el.textContent = SETTINGS_CSS;
        document.head.appendChild(el);
        return function () { if (el.parentNode) el.parentNode.removeChild(el); };
      }, "dsh-claude-crab:settings-styles");

      var slots = ctx.get("slots");
      if (slots === undefined) return;

      slots.inject("settings.section", function () {
        try {
          return slots.register(
            { name: "settings.section", id: "clawd", order: 60, label: "Clawd" },
            CrabSection,
          );
        } catch (e) {
          return function () {};
        }
      });

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
    exports.inject = ["timer", "slots"];
    exports.apply = apply;
    return module.exports;
  },
});
