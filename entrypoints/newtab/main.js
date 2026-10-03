import { loadSettings, saveSettings } from '~~/core/storage.js'
import { getWidget } from '~~/core/registry.js'
import { applyBackground } from '~~/core/theme.js'
import { applyGroupLayout, applyWidgetLayout } from '~~/core/layout.js'
import { mountSettings, openPanelWithDraft as openPanel } from '~~/core/settings.js'

/** @param {import('~~/core/types.js').Settings} settings */
function seedSettings(settings) {
  settings.background ??= { type: 'color', value: 'hsl(220 15% 15%)' }
  settings.widgets ??= [
    { instanceId: 'search-1', type: 'search', config: {} },
    { instanceId: 'clock-1', type: 'clock', config: {} },
    { instanceId: 'bookmarks-1', type: 'bookmarks', config: {} }
  ]
  settings.groups ??= {}
  settings.initialized = true
}

;(async () => {
  const settings = await loadSettings()

  if (!settings.initialized) {
    seedSettings(settings)
    await saveSettings(settings)
  }

  await applyBackground(settings.background)

  const container = document.createElement('div')
  container.id = 'widgets'
  document.body.append(container)

  /** @type {Record<string, HTMLElement>} */
  const groupContainers = {}
  for (const [name, g] of Object.entries(settings.groups || {})) {
    const gc = document.createElement('div')
    gc.className = 'widget-group'
    gc.dataset.group = name
    applyGroupLayout(gc, g)
    container.append(gc)
    groupContainers[name] = gc
  }

  /** @type {import('~~/core/types.js').WidgetInstance[]} */
  const ungrouped = []
  /** @type {import('~~/core/types.js').WidgetInstance[]} */
  const grouped = []
  for (const instance of settings.widgets || []) {
    const wg = instance.config?.group
    if (wg && groupContainers[wg]) {
      grouped.push(instance)
    } else {
      ungrouped.push(instance)
    }
  }

  /**
   * @param {HTMLElement} parent
   * @param {import('~~/core/types.js').WidgetInstance} instance
   * @param {number} index
   * @param {number} total
   * @param {string} [extraClass]
   */
  function mount(parent, instance, index, total, extraClass) {
    const widget = getWidget(instance.type)
    if (!widget) return null

    const box = document.createElement('div')
    box.className = extraClass ? 'widget ' + extraClass : 'widget'
    box.dataset.type = instance.type
    box.dataset.instanceId = instance.instanceId
    applyWidgetLayout(box, instance.config, index, total)
    parent.append(box)
    widget.render(box, instance.config)
    return box
  }

  ungrouped.forEach((instance, idx) => {
    mount(container, instance, idx, ungrouped.length)
  })

  for (const instance of grouped) {
    mount(groupContainers[instance.config.group], instance, 0, 1, 'widget-grouped')
  }

  mountSettings()

  const params = new URLSearchParams(location.search)
  if (params.get('settings') === 'open') {
    history.replaceState(null, '', location.pathname)
    openPanel()
  }

  browser.runtime.onMessage.addListener((msg) => {
    if (msg && msg.action === 'openSettings') openPanel()
  })
})()