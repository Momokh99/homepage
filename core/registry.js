import { clockWidget } from '../widgets/clock.js'
import { searchWidget } from '../widgets/search.js'
import { bookmarksWidget } from '../widgets/bookmarks.js'

export const registry = {
  [clockWidget.id]: clockWidget,
  [searchWidget.id]: searchWidget,
  [bookmarksWidget.id]: bookmarksWidget
}

export function getWidget(type) {
  return registry[type] ?? null
}
