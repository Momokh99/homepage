const MIN_PERCENT = 4
const MAX_PERCENT = 96

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function num(value, fallback) {
  const n = Number(value)
  return Number.isFinite(n) ? n : fallback
}

/**
 * @param {unknown} value
 * @param {number} fallback
 * @returns {number}
 */
function percent(value, fallback) {
  return Math.min(MAX_PERCENT, Math.max(MIN_PERCENT, num(value, fallback)))
}

/**
 * @param {HTMLElement} box
 * @param {Record<string, any> | undefined} config
 * @param {number} [index]
 * @param {number} [total]
 */
export function applyWidgetLayout(box, config, index = 0, total = 1) {
  const cfg = config || {}
  const inGroup = box.classList.contains('widget-grouped') || !!box.closest('.widget-group')

  // Geometry is expressed as CSS custom properties; style.css owns the
  // position/transform/sizing rules.
  box.style.left = ''
  box.style.top = ''
  box.style.transform = ''

  if (inGroup) {
    box.style.removeProperty('--widget-x')
    box.style.removeProperty('--widget-y')
  } else {
    const x = percent(cfg.positionX, 50)
    const y = percent(cfg.positionY, (100 / (total + 1)) * (index + 1))
    box.style.setProperty('--widget-x', x + '%')
    box.style.setProperty('--widget-y', y + '%')
  }

  const width = cfg.width != null ? num(cfg.width, 0) : null
  if (width != null && width > 0) box.style.setProperty('--widget-width', width + 'px')
  else box.style.removeProperty('--widget-width')

  const height = cfg.height != null ? num(cfg.height, 0) : 0
  if (height > 0) box.style.setProperty('--widget-height', height + 'px')
  else box.style.removeProperty('--widget-height')

  if (cfg.margin != null) box.style.setProperty('--widget-margin', num(cfg.margin, 0) + 'px')
  else box.style.removeProperty('--widget-margin')

  box.dataset.layoutIndex = String(index)
  box.dataset.layoutTotal = String(total)
}

/**
 * @param {HTMLElement} box
 * @param {Record<string, any> | undefined} config
 */
export function applyGroupLayout(box, config) {
  const cfg = config || {}
  box.style.left = ''
  box.style.top = ''
  box.style.transform = ''
  box.style.setProperty('--widget-x', percent(cfg.positionX, 50) + '%')
  box.style.setProperty('--widget-y', percent(cfg.positionY, 50) + '%')
}

/**
 * Re-applies layout for a single mounted widget, using the auto-layout
 * fallbacks recorded at mount time.
 *
 * @param {HTMLElement} box
 * @param {Record<string, any> | undefined} config
 */
export function relayoutWidget(box, config) {
  applyWidgetLayout(
    box,
    config,
    num(box.dataset.layoutIndex, 0),
    num(box.dataset.layoutTotal, 1)
  )
}
