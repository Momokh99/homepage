/** @type {import('../core/types.js').WidgetDefinition} */
export const searchWidget = {
  id: 'search',
  name: 'Search',
  defaults: {
    placeholder: 'Search…',
    newTab: true,
    destinations: [
      { name: 'Google',     url: 'https://www.google.com/search?q=%s',     enabled: true },
      { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=%s',          enabled: true },
      { name: 'ChatGPT',    url: 'https://chatgpt.com/?q=%s',             enabled: true },
      { name: 'Claude',     url: 'https://claude.ai/new?q=%s',            enabled: true },
      { name: 'Perplexity', url: 'https://www.perplexity.ai/search?q=%s', enabled: true },
      { name: 'Copilot',    url: 'https://copilot.microsoft.com/?q=%s',   enabled: true },
      { name: 'Gemini',     url: 'https://gemini.google.com/app',         enabled: false }
    ]
  },
  settingsSchema: [
    { key: 'placeholder', label: 'Placeholder', type: 'text' },
    { key: 'newTab',      label: 'Open in new tab', type: 'toggle' },
    { key: 'destinations', label: 'Search engines', type: 'list',
      itemSchema: [
        { key: 'name',    label: 'Name',    type: 'text' },
        { key: 'url',     label: 'URL',     type: 'text' },
        { key: 'enabled', label: 'Enabled', type: 'toggle' }
      ]
    }
  ],
  render(box, config) {
    const conf = { ...this.defaults, ...config }
    const all = Array.isArray(conf.destinations) ? conf.destinations : []
    const enabled = all.filter(d => d && d.enabled && d.url)

    const chips = document.createElement('div')
    chips.className = 'chips'

    let activeIndex = 0

    const renderChips = () => {
      chips.innerHTML = ''
      enabled.forEach((dest, i) => {
        const chip = document.createElement('button')
        chip.textContent = dest.name
        chip.className = 'chip' + (i === activeIndex ? ' active' : '')
        chip.addEventListener('click', () => {
          activeIndex = i
          renderChips()
        })
        chips.append(chip)
      })
    }
    renderChips()

    const input = document.createElement('input')
    input.placeholder = conf.placeholder
    input.className = 'search-input'

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = input.value.trim()
        const dest = enabled[activeIndex]
        if (!query || !dest) return
        const url = dest.url.includes('%s')
          ? dest.url.replace('%s', encodeURIComponent(query))
          : dest.url + encodeURIComponent(query)
        if (conf.newTab) window.open(url, '_blank', 'noopener,noreferrer')
        else window.location.href = url
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        activeIndex = enabled.length
          ? e.shiftKey
            ? (activeIndex - 1 + enabled.length) % enabled.length
            : (activeIndex + 1) % enabled.length
          : 0
        renderChips()
      }
    })

    box.append(chips, input)
  }
}