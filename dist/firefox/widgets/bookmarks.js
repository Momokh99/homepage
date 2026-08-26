export const bookmarksWidget = {
  id: 'bookmarks',
  name: 'Bookmarks',
  defaults: {
    bookmarks: [],
    columns: 5,
    orientation: 'grid',
    openInNewTab: true
  },
  settingsSchema: [
    { key: 'columns', label: 'Columns', type: 'range', min: 2, max: 10, step: 1 },
    { key: 'orientation', label: 'Layout', type: 'select', options: ['grid', 'horizontal', 'vertical'] },
    { key: 'openInNewTab', label: 'Open in new tab', type: 'toggle' },
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
      tile.href = bm.url
      if (conf.openInNewTab) {
        tile.target = '_blank'
        tile.rel = 'noopener,noreferrer'
      }

      const img = document.createElement('img')
      try {
        const host = new URL(bm.url).hostname
        img.src = `https://www.google.com/s2/favicons?domain=${host}&sz=32`
      } catch {
        img.style.display = 'none'
      }
      img.alt = bm.name
      img.loading = 'lazy'
      img.addEventListener('error', () => {
        img.style.display = 'none'
      })

      const span = document.createElement('span')
      span.textContent = bm.name

      tile.append(img, span)
      grid.append(tile)
    }

    box.append(grid)
  }
}
