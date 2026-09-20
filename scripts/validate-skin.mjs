// Validate a skin with the REAL skin-center sanitizer + manifest validator, so
// failures surface here instead of silently in the browser.
import { createRequire } from 'node:module'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'

const PKG = '@linxin666/dsh-client-ui-skin-center'

/**
 * Locate the installed skin center.
 *
 * This used to be a hard-coded absolute path to one machine's profile, which
 * meant the script only ever ran for its author. INSTALL.md already states the
 * rule for this repo -- resolve $DSH_HOME, never hard-code it -- so the search
 * follows that: an explicit override, then every profile under DSH_HOME, then
 * the DSH install itself.
 *
 * Returns the package root, or exits with the paths it tried.
 */
function findSkinCenter() {
  const tried = []

  if (process.env.SKIN_CENTER_DIR) {
    const p = process.env.SKIN_CENTER_DIR
    tried.push(p)
    if (existsSync(join(p, 'lib', 'index.js'))) return p
  }

  const dshHome = process.env.DSH_HOME || join(homedir(), '.dsh')

  // Every profile, not just `web`: the skin center can be installed into any
  // of them, and hard-coding the profile name would reintroduce the same bug.
  const profilesDir = join(dshHome, 'profiles')
  if (existsSync(profilesDir)) {
    for (const name of readdirSync(profilesDir)) {
      const p = join(profilesDir, name, 'node_modules', PKG)
      tried.push(p)
      if (existsSync(join(p, 'lib', 'index.js'))) return p
    }
  }

  // The DSH install may carry it directly.
  for (const base of ['/usr/lib/node_modules/@deepseek-ai/dsh/node_modules',
                      '/usr/local/lib/node_modules/@deepseek-ai/dsh/node_modules']) {
    const p = join(base, PKG)
    tried.push(p)
    if (existsSync(join(p, 'lib', 'index.js'))) return p
  }

  console.error('✗ could not find ' + PKG)
  console.error('  tried:')
  for (const t of tried) console.error('    ' + t)
  console.error('')
  console.error('  install it, or point SKIN_CENTER_DIR at the package directory:')
  console.error('    SKIN_CENTER_DIR=/path/to/dsh-client-ui-skin-center node scripts/validate-skin.mjs')
  process.exit(2)
}

const SC = findSkinCenter()
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
