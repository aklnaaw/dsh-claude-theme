// Validate a skin with the REAL skin-center sanitizer + manifest validator, so
// failures surface here instead of silently in the browser.
import { createRequire } from 'node:module'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const SC = '/home/aklnaaw/.dsh/profiles/web/node_modules/@linxin666/dsh-client-ui-skin-center'
const require = createRequire(import.meta.url)
const mod = require(resolve(SC, 'lib/index.js'))

const skinDir = process.argv[2] || 'claude'
const manifest = JSON.parse(readFileSync(resolve(skinDir, 'skin.json'), 'utf8'))
const id = manifest.id

let failed = false

// 1. Manifest
try {
  if (typeof mod.validateSkinManifestV2 === 'function') {
    mod.validateSkinManifestV2(manifest)
    console.log('✓ skin.json: PASS (v2 validator)')
  } else {
    console.log('- skin.json: no exported validator; schema-checking only')
  }
} catch (e) {
  failed = true
  console.log(`✗ skin.json: FAIL — ${e.message}`)
}

// 2. Stylesheets, through the real transform
for (const [file, declared] of [
  ['skin.css', manifest.contributes?.stylesheet],
  ['patches.css', manifest.contributes?.patches],
]) {
  if (!declared) { console.log(`- ${file}: not declared, skipped`); continue }
  const abs = resolve(skinDir, declared)
  if (!existsSync(abs)) { failed = true; console.log(`✗ ${file}: declared but MISSING on disk`); continue }
  const css = readFileSync(abs, 'utf8')
  const isSheet = declared === manifest.contributes.stylesheet
  try {
    const res = mod.transformSkinCss(css, {
      skinId: id,
      filename: isSheet ? 'skin.css' : 'patches.css',
      deriveFallbacks: isSheet,
    })
    const code = res?.code ?? ''
    const warns = res?.warnings ?? []
    if (!code.trim()) { failed = true; console.log(`✗ ${file}: transform produced EMPTY output`) ; continue }
    console.log(`✓ ${file}: PASS  (${css.length} -> ${code.length} bytes, ${warns.length} warning(s))`)
    for (const w of warns.slice(0, 8)) console.log(`    warn: ${typeof w === 'string' ? w : JSON.stringify(w)}`)
  } catch (e) {
    failed = true
    console.log(`✗ ${file}: FAIL — ${e.message}`)
    if (e.violations) console.log('  ' + JSON.stringify(e.violations, null, 1).slice(0, 1200))
  }
}

// 3. Referenced assets must exist (relative, in-directory)
const cssAll = ['skin.css', 'patches.css']
  .map(f => resolve(skinDir, f)).filter(existsSync)
  .map(f => readFileSync(f, 'utf8')).join('\n')
const urls = [...cssAll.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(m => m[1])
let missing = 0
for (const u of new Set(urls)) {
  if (!existsSync(resolve(skinDir, u))) { console.log(`✗ asset missing: ${u}`); missing++; failed = true }
}
console.log(`✓ assets: ${new Set(urls).size} referenced, ${missing} missing`)
for (const p of ['preview/light.jpg', 'preview/dark.jpg']) {
  if (!existsSync(resolve(skinDir, p))) console.log(`  note: ${p} absent (optional, but expected by convention)`)
}
process.exit(failed ? 1 : 0)
