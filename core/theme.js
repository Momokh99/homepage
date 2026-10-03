import { loadImageBlob } from './imageStore.js'

let currentUrl = null

/**
 * @param {import('./types.js').BackgroundConfig} [bg]
 * @returns {Promise<void>}
 */
export async function applyBackground(bg) {
  const root = document.documentElement
  root.style.setProperty('--blur', (bg?.blur ?? 0) + 'px')
  root.style.setProperty('--dim', (bg?.dim ?? 0) + '%')

  if (bg?.type === 'color') {
    root.style.setProperty('--bg', bg.value)
  } else if (bg?.type === 'image') {
    const blob = await loadImageBlob()
    if (!blob) return
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    currentUrl = URL.createObjectURL(blob)
    root.style.setProperty('--bg', `url("${currentUrl}") center / cover no-repeat`)
  }

  if (!root.style.getPropertyValue('--bg')) {
    root.style.setProperty('--bg', 'hsl(220 15% 15%)')
  }
}
