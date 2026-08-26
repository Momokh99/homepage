import { loadSettings, saveSettings } from './core/storage.js'
import { getWidget } from './core/registry.js'
import { applyBackground } from './core/theme.js'
import { mountSettings, openPanelWithDraft as openPanel } from './core/settings.js'
import { api } from './core/api.js'

;(async () => {
  const settings = await loadSettings()

  await applyBackground(settings.background)

  if (!settings.widgets || settings.widgets.length === 0) {
    settings.theme = 'dark'
    settings.background = { type: 'color', value: 'hsl(220 15% 15%)' }
    settings.widgets = [
      { instanceId: 'search-1', type: 'search', config: {} },
      { instanceId: 'clock-1', type: 'clock', config: {} },
      { instanceId: 'bookmarks-1', type: 'bookmarks', config: {} }
    ]
    await saveSettings(settings)
  }

  const container = document.createElement('div')
  container.id = 'widgets'
  document.body.append(container)

  const groups = settings.groups || {}
  const groupContainers = {}

  // Create group containers
  for (const [name, g] of Object.entries(groups)) {
    const gc = document.createElement('div')
    gc.className = 'widget-group'
    gc.style.left = (g.positionX ?? 50) + '%'
    gc.style.top = (g.positionY ?? 50) + '%'
    container.append(gc)
    groupContainers[name] = gc
  }

  // Separate grouped vs ungrouped
  const ungrouped = []
  const grouped = []
  for (const instance of settings.widgets) {
    const wg = instance.config?.group
    if (wg && groupContainers[wg]) {
      grouped.push(instance)
    } else {
      ungrouped.push(instance)
    }
  }

  // Render ungrouped widgets (absolute position)
  const total = ungrouped.length
  for (let idx = 0; idx < ungrouped.length; idx++) {
    const instance = ungrouped[idx]
    const widget = getWidget(instance.type)
    if (!widget) continue

    const box = document.createElement('div')
    box.className = 'widget'
    box.dataset.type = instance.type
    box.dataset.instanceId = instance.instanceId
    const cfg = instance.config || {}
    if (cfg.positionX != null) {
      box.style.left = cfg.positionX + '%'
    } else {
      box.style.left = '50%'
    }
    if (cfg.positionY != null) {
      box.style.top = cfg.positionY + '%'
    } else {
      const spacing = 100 / (total + 1)
      box.style.top = spacing * (idx + 1) + '%'
    }
    if (cfg.positionX == null || cfg.positionY == null) {
      const tx = cfg.positionX == null ? '-50%' : '0'
      const ty = cfg.positionY == null ? '-50%' : '0'
      box.style.transform = `translate(${tx}, ${ty})`
    }
    if (cfg.width != null) box.style.width = cfg.width + 'px'
    if (cfg.height != null && cfg.height > 0) box.style.height = cfg.height + 'px'
    if (cfg.margin != null) box.style.margin = cfg.margin + 'px'
    container.append(box)
    widget.render(box, instance.config)
  }

  // Render grouped widgets (relative inside group container)
  for (const instance of grouped) {
    const widget = getWidget(instance.type)
    if (!widget) continue

    const box = document.createElement('div')
    box.className = 'widget widget-grouped'
    box.dataset.type = instance.type
    box.dataset.instanceId = instance.instanceId
    const cfg = instance.config || {}
    if (cfg.width != null) box.style.width = cfg.width + 'px'
    if (cfg.height != null && cfg.height > 0) box.style.height = cfg.height + 'px'
    if (cfg.margin != null) box.style.margin = cfg.margin + 'px'
    groupContainers[cfg.group].append(box)
    widget.render(box, instance.config)
  }

  mountSettings()

  const params = new URLSearchParams(location.search)
  if (params.get('settings') === 'open') openPanel()

  api.runtime.onMessage.addListener((msg) => {
    if (msg.action === 'openSettings') openPanel()
  })
})()
