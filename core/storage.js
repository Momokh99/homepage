import { api } from './api.js'

/** @returns {Promise<import('./types.js').Settings>} */
export async function loadSettings() {
  const result = await api.storage.local.get('settings')
  const s = result.settings
  return (s && typeof s === 'object') ? /** @type {import('./types.js').Settings} */ (s) : {}
}

/**
 * @param {import('./types.js').Settings} settings
 * @returns {Promise<void>}
 */
export function saveSettings(settings) {
  return api.storage.local.set({ settings })
}