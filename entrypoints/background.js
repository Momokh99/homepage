export default defineBackground(() => {
  browser.action.onClicked.addListener(async (tab) => {
    const base = browser.runtime.getURL('/newtab.html')
    const url = base + '?settings=open'
    if (tab.url && tab.url.split('?')[0] === base) {
      await browser.tabs.update(tab.id, { url })
    } else {
      await browser.tabs.create({ url })
    }
  })
})