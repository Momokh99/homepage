const api = globalThis.browser ?? globalThis.chrome

api.action.onClicked.addListener(async (tab) => {
  try {
    await api.tabs.sendMessage(tab.id, { action: 'openSettings' })
  } catch {
    api.tabs.create({ url: 'newtab.html?settings=open' })
  }
})
