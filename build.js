import { readFileSync, writeFileSync, mkdirSync, existsSync, cpSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(__dirname, 'manifest.json'), 'utf8'))

const files = ['newtab.html', 'newtab.js', 'background.js', 'style.css']
const dirs = ['core', 'widgets', 'icons']

// Chrome build (service_worker)
const chromeDir = join(__dirname, 'dist', 'chrome')
if (!existsSync(chromeDir)) mkdirSync(chromeDir, { recursive: true })
writeFileSync(join(chromeDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
for (const f of files) cpSync(join(__dirname, f), join(chromeDir, f))
for (const d of dirs) cpSync(join(__dirname, d), join(chromeDir, d), { recursive: true })

// Firefox build (scripts + gecko)
const firefoxManifest = JSON.parse(JSON.stringify(manifest))
firefoxManifest.background = { scripts: ['background.js'] }
firefoxManifest.browser_specific_settings = {
  gecko: {
    id: 'custom-homepage@example.com',
    strict_min_version: '109.0'
  }
}

const firefoxDir = join(__dirname, 'dist', 'firefox')
if (!existsSync(firefoxDir)) mkdirSync(firefoxDir, { recursive: true })
writeFileSync(join(firefoxDir, 'manifest.json'), JSON.stringify(firefoxManifest, null, 2))
for (const f of files) cpSync(join(__dirname, f), join(firefoxDir, f))
for (const d of dirs) cpSync(join(__dirname, d), join(firefoxDir, d), { recursive: true })

console.log('Built:')
console.log('  dist/chrome/   (service_worker)')
console.log('  dist/firefox/  (scripts + gecko)')
