/**
 * Per-instance custom CSS for widgets.
 *
 * Injects a scoped stylesheet per widget into document.head. Scoping prefixes
 * each selector with the widget's own box selector so rules only apply to that
 * instance. Declaration-only snippets are applied to the widget box itself.
 *
 * @module customCSS
 */

/**
 * Scoped a CSS string to a single widget instance.
 *
 * @param {string} css
 * @param {string} scope
 * @returns {string}
 */
function scopeCSS(css, scope) {
  return css.split('}').map(rule => {
    const idx = rule.indexOf('{')
    if (idx === -1) return ''
    const sel = rule.slice(0, idx).trim()
    const body = rule.slice(idx + 1).trim()
    if (!sel || !body) return ''
    if (sel.indexOf(':') !== -1 && sel.indexOf(';') !== -1 && !sel.includes(',') && sel.indexOf('{') === -1 && /[a-z-]+\s*:/i.test(sel)) {
      return `${scope} { ${sel}${sel.endsWith(';') ? '' : ';'} }`
    }
    return sel.split(',').map(s => `${scope} ${s.trim()}`).join(', ') + ` { ${body} }`
  }).filter(Boolean).join('\n')
}

/**
 * Applies (or removes) a widget instance's custom CSS.
 *
 * @param {string} instanceId
 * @param {unknown} css
 */
export function applyWidgetCSS(instanceId, css) {
  const sel = `style[data-widget-css="${instanceId}"]`
  let el = /** @type {HTMLStyleElement | null} */ (document.head.querySelector(sel))
  if (typeof css !== 'string' || !css.trim()) {
    el?.remove()
    return
  }
  if (!el) {
    el = document.createElement('style')
    el.dataset.widgetCss = instanceId
    document.head.append(el)
  }
  el.textContent = scopeCSS(css, `.widget[data-instance-id="${instanceId}"]`)
}

/**
 * Extracts the currently applied style rules that target classes used inside
 * the given widget's subtree.
 *
 * @param {HTMLElement | null} box
 * @returns {string}
 */
export function currentCSSForWidget(box) {
  if (!box) return ''
  /** @type {Set<string>} */
  const classes = new Set()
  for (const c of box.classList) classes.add(c)
  for (const el of box.querySelectorAll('*')) {
    for (const c of el.classList) classes.add(c)
  }
  if (classes.size === 0) return ''

  /** @type {string[]} */
  const rules = []
  for (const sheet of document.styleSheets) {
    /** @type {CSSRuleList | undefined} */
    let list
    try { list = sheet.cssRules } catch { continue }
    if (!list) continue
    for (const rule of list) {
      if (rule.type !== CSSRule.STYLE_RULE) continue
      const sel = /** @type {CSSStyleRule} */ (rule).selectorText
      for (const c of classes) {
        if (sel.includes('.' + c)) {
          rules.push(/** @type {CSSStyleRule} */ (rule).cssText)
          break
        }
      }
    }
  }
  return rules.join('\n\n')
}
