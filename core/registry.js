import { clockWidget } from '../widgets/clock.js'
import { searchWidget } from '../widgets/search.js'
import { bookmarksWidget } from '../widgets/bookmarks.js'

/** @type {Record<string, import('./types.js').WidgetDefinition>} */
export const registry = {
  [clockWidget.id]: clockWidget,
  [searchWidget.id]: searchWidget,
  [bookmarksWidget.id]: bookmarksWidget
}

/**
 * @param {string} type
 * @returns {import('./types.js').WidgetDefinition | null}
 */
export function getWidget(type) {
  return registry[type] ?? null
}