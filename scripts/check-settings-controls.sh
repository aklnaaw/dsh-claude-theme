#!/usr/bin/env bash
#
# Regression check for the settings-page "frozen control" bug.
#
# WHAT IT CATCHES
#
# A plugin keeps a Set of subscribers and notifies them when a preference
# changes. One of those subscribers is a React useState setter. If the notify
# call passes no argument, the setter stores `undefined`, the next render reads
# a property off it, React unmounts the tree, and the control the user just
# touched stops responding -- the page looks frozen. This shipped in both the
# Clawd plugin and the font switcher.
#
# The check drives each plugin's real settings component in headless Chrome,
# operates its control, and asserts the component is still mounted afterwards.
#
# USE
#
#   scripts/check-settings-controls.sh
#
# Needs google-chrome-stable (or CHROME=...) on PATH. Exits 0 when every
# control survives being operated, 1 otherwise.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CHROME="${CHROME:-$(command -v google-chrome-stable || command -v google-chrome || true)}"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

if [ -z "$CHROME" ]; then
  echo "check-settings-controls: no Chrome found; set CHROME=/path/to/chrome" >&2
  exit 2
fi

# React is fetched rather than vendored: the plugins themselves never bundle
# it (the host supplies it), so there is nothing in the repo to reuse.
fetch_react() {
  [ -f "$WORK/react.js" ] && return 0
  curl -fsSL -o "$WORK/react.js" https://unpkg.com/react@18.3.1/umd/react.production.min.js || return 1
  curl -fsSL -o "$WORK/react-dom.js" https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js || return 1
}

pass=0
fail=0

# run_case <label> <client.js> <body-js>
run_case() {
  local label="$1" client="$2" body="$3"
  cp "$client" "$WORK/client.js"

  cat > "$WORK/case.html" <<HTML
<!doctype html><html><head><meta charset="utf-8"></head><body>
<div data-composer-card></div><div id="host"></div><pre id="out">PENDING</pre>
<script>window.__errors=[];</script>
<script src="react.js"></script><script src="react-dom.js"></script>
<script>window.__ModuleLoader__={load:function(r){window.__reg=r}};</script>
<script src="client.js"></script>
<script>
var origErr = console.error;
console.error = function(){ window.__errors.push(String(arguments[0]).slice(0,160)); return origErr.apply(console,arguments); };
window.onerror = function(m){ window.__errors.push('onerror: '+m); };
var R = {};
try {
$body
} catch (e) { R.fatal = e.message; }
setTimeout(function(){
  document.getElementById('out').textContent = 'RESULT:' + JSON.stringify(Object.assign(R, { errors: window.__errors.slice(0,2) }));
}, 900);
</script></body></html>
HTML

  local out
  out="$("$CHROME" --headless=new --disable-gpu --virtual-time-budget=15000 \
    --user-data-dir="$WORK/profile-$label" --dump-dom "file://$WORK/case.html" 2>/dev/null \
    | grep -o 'RESULT:{.*}' | head -1 | sed 's/^RESULT://')"

  if [ -z "$out" ]; then
    echo "  FAIL  $label — harness produced no result"
    fail=$((fail + 1))
    return
  fi

  local alive
  alive="$(printf '%s' "$out" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d.get("alive",0))')"
  local errs
  errs="$(printf '%s' "$out" | python3 -c 'import json,sys; d=json.load(sys.stdin); print(len(d.get("errors",[])))')"

  if [ "$alive" -gt 0 ] && [ "$errs" -eq 0 ]; then
    echo "  ok    $label — control survived (${alive} still mounted)"
    pass=$((pass + 1))
  else
    echo "  FAIL  $label — alive=$alive errors=$errs"
    echo "        $out"
    fail=$((fail + 1))
  fi
}

if ! fetch_react; then
  echo "check-settings-controls: could not fetch React UMD builds" >&2
  exit 2
fi
echo "check-settings-controls"

# --- Clawd: drag the size slider. ------------------------------------------
run_case "clawd/size-slider" "$ROOT/crab-plugin/lib/client.js" '
  var mod = window.__reg.factory(function(n){ if(n==="react") return window.React; throw new Error(n); });
  var captured = null;
  var slots = { inject: function(k,cb){ cb(); return function(){}; },
                register: function(s,c){ if (s.id==="clawd") captured=c; return function(){}; } };
  mod.apply({ effect: function(f){ var d=f(); return typeof d==="function"?d:function(){}; },
              get: function(n){ return n==="slots"?slots:undefined; },
              timeout: function(fn,ms){ return function(){}; } });
  ReactDOM.createRoot(document.getElementById("host")).render(React.createElement(captured,null));
  setTimeout(function(){
    var s = document.querySelectorAll(".dcc-range")[0];
    var set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,"value").set;
    set.call(s, "130");
    s.dispatchEvent(new Event("input", { bubbles: true }));
    setTimeout(function(){ R.alive = document.querySelectorAll(".dcc-range").length; }, 200);
  }, 400);
'

# --- Font switcher: choose a font. -----------------------------------------
run_case "font-switcher/select" "$ROOT/plugins/font-switcher/lib/client.js" '
  window.fetch = function(){ return Promise.resolve({ ok:true, json:function(){
    return Promise.resolve({ skinId:"claude", folder:"/tmp/x", canReveal:true,
      fonts:[{file:"A.woff2",label:"A",url:"x",purpose:"serif",source:"name"}] }); }}); };
  var mod = window.__reg.factory(function(n){ if(n==="react") return window.React; throw new Error(n); });
  var captured = null;
  var slots = { inject: function(k,cb){ cb(); return function(){}; },
                register: function(s,c){ if (s.id==="fonts") captured=c; return function(){}; } };
  mod.apply({ effect: function(f){ var d=f(); return typeof d==="function"?d:function(){}; },
              get: function(n){ return n==="slots"?slots:undefined; } });
  ReactDOM.createRoot(document.getElementById("host")).render(React.createElement(captured,null));
  setTimeout(function(){
    var sel = document.querySelectorAll(".dfs-sel")[0];
    var set = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value").set;
    set.call(sel, "A.woff2");
    sel.dispatchEvent(new Event("change", { bubbles: true }));
    setTimeout(function(){ R.alive = document.querySelectorAll(".dfs-sel").length; }, 200);
  }, 400);
'

echo
if [ "$fail" -eq 0 ]; then
  echo "check-settings-controls: $pass passed"
  exit 0
fi
echo "check-settings-controls: $fail failed, $pass passed"
exit 1
