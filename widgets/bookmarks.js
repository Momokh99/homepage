/**
 * @param {unknown} raw
 * @returns {string | null}
 */
function normalizeUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return null
  const trimmed = raw.trim()
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : 'https://' + trimmed
  try {
    return new URL(withScheme).href
  } catch {
    return null
  }
}

/**
 * @param {{name?: string}} bm
 * @param {string | null} url
 * @returns {HTMLElement}
 */
function createIcon(bm, url) {
  const letter = document.createElement('span')
  letter.className = 'bookmark-letter'
  letter.textContent = (bm.name || hostnameOf(url) || '?').charAt(0).toUpperCase()

  if (!url) return letter

  const img = document.createElement('img')
  img.src = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=32`
  img.alt = bm.name || ''
  img.loading = 'lazy'
  img.addEventListener('error', () => {
    img.replaceWith(letter)
  })
  return img
}

/**
 * @param {string | null} url
 * @returns {string}
 */
function hostnameOf(url) {
  if (!url) return ''
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

/** @type {import('../core/types.js').WidgetDefinition} */
export const bookmarksWidget = {
  id: 'bookmarks',
  name: 'Bookmarks',
  defaults: {
    bookmarks: [],
    columns: 5,
    orientation: 'grid',
    openInNewTab: true,
    showTitle: true
  },
  settingsSchema: [
    { key: 'columns', label: 'Columns', type: 'range', min: 2, max: 10, step: 1 },
    { key: 'orientation', label: 'Layout', type: 'select', options: ['grid', 'horizontal', 'vertical'] },
    { key: 'openInNewTab', label: 'Open in new tab', type: 'toggle' },
    { key: 'showTitle', label: 'Show titles', type: 'toggle' },
    { key: 'bookmarks', label: 'Bookmarks', type: 'list',
      itemSchema: [
        { key: 'name', label: 'Name', type: 'text' },
        { key: 'url',  label: 'URL',  type: 'text' }
      ]
    }
  ],
  render(box, config) {
    const conf = { ...this.defaults, ...config }
    const list = conf.bookmarks || []

    if (list.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'bookmarks-empty'
      empty.textContent = 'No bookmarks yet — add some in Settings → Widgets'
      box.append(empty)
      return
    }

    const grid = document.createElement('div')
    grid.className = 'bookmarks-grid'
    grid.style.setProperty('--cols', conf.columns)

    if (conf.orientation === 'horizontal') {
      grid.style.display = 'flex'
      grid.style.flexWrap = 'nowrap'
      grid.style.overflowX = 'auto'
    } else if (conf.orientation === 'vertical') {
      grid.style.display = 'flex'
      grid.style.flexDirection = 'column'
    }

    for (const bm of list) {
      const tile = document.createElement('a')
      tile.className = 'bookmark-tile'

      const url = normalizeUrl(bm.url)
      tile.href = url || '#'
      tile.setAttribute('aria-label', bm.name || url || '')
      if (conf.openInNewTab) {
        tile.target = '_blank'
        tile.rel = 'noopener,noreferrer'
      }

      const icon = createIcon(bm, url)
      tile.append(icon)

      if (conf.showTitle) {
        const hostname = url ? new URL(url).hostname : ''
        const span = document.createElement('span')
        span.className = 'bookmark-name'
        span.textContent = bm.name || hostname
        tile.append(span)
      }

      grid.append(tile)
    }

    box.append(grid)
  }
}
