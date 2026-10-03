const api = globalThis.browser ?? globalThis.chrome

api.action.onClicked.addListener(async (tab) => {
  const base = api.runtime.getURL('newtab.html')
  const url = base + '?settings=open'
  if (tab.url && tab.url.split('?')[0] === base) {
    await api.tabs.update(tab.id, { url })
  } else {
    await api.tabs.create({ url })
  }
})