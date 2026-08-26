import { api } from './api.js'

export async function loadSettings() {
  const result = await api.storage.local.get('settings')
  const s = result.settings
  return (s && typeof s === 'object') ? s : {}
}

export function saveSettings(settings) {
  return api.storage.local.set({ settings })
}


