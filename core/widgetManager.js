import { getWidget, registry } from './registry.js'
import { renderSchemaForm } from './schemaForm.js'
import { currentCSSForWidget } from './customCSS.js'

let expandedId = null

/**
 * Merged view of a widget's effective config, so form controls show the
 * value that will actually be used rather than falling back to the
 * schema minimum.
 *
 * @param {import('./types.js').WidgetDefinition} def
 * @param {import('./types.js').WidgetInstance} instance
 */
function formValues(def, instance) {
  return { ...(def.defaults || {}), ...(instance.config || {}) }
}

function renderGroups(content, draft, onChange, onRerender) {
  const groups = draft.groups || {}
  const names = Object.keys(groups)

  const section = document.createElement('div')
  section.className = 'wm-section'

  const title = document.createElement('div')
  title.className = 'wm-section-title'
  title.textContent = 'Groups'
  section.append(title)

  if (names.length === 0) {
    const empty = document.createElement('div')
    empty.className = 'wm-groups-empty'
    empty.textContent = 'No groups yet. Create a group to move multiple widgets together.'
    section.append(empty)
  }

  for (const name of names) {
    const g = groups[name]
    const card = document.createElement('div')
    card.className = 'wm-group-card'

    const header = document.createElement('div')
    header.className = 'wm-group-card-header'

    const nameInput = document.createElement('input')
    nameInput.type = 'text'
    nameInput.value = name
    nameInput.className = 'wm-group-name-input'
    nameInput.addEventListener('change', () => {
      const newName = nameInput.value.trim()
      if (!newName || newName === name) {
        nameInput.value = name
        return
      }
      if (draft.groups[newName]) {
        nameInput.value = name
        return
      }
      draft.groups[newName] = draft.groups[name]
      delete draft.groups[name]
      for (const w of draft.widgets) {
        if (w.config?.group === name) w.config.group = newName
      }
      onChange()
      onRerender()
    })

    const del = document.createElement('button')
    del.className = 'wm-group-del'
    del.textContent = 'Delete'
    del.addEventListener('click', () => {
      delete draft.groups[name]
      for (const w of draft.widgets) {
        if (w.config?.group === name) w.config.group = ''
      }
      onChange()
      onRerender()
    })

    header.append(nameInput, del)

    const sliders = document.createElement('div')
    sliders.className = 'wm-group-sliders'

    /** @type {import('./types.js').Field[]} */
const xSchema = [{ key: 'positionX', label: 'X Position %', type: 'range', min: 0, max: 100, step: 1 }]
    const xForm = renderSchemaForm(xSchema, g, (key, val) => {
      draft.groups[name][key] = val
      onChange(undefined, name)
    })
    /** @type {import('./types.js').Field[]} */
    const ySchema = [{ key: 'positionY', label: 'Y Position %', type: 'range', min: 0, max: 100, step: 1 }]
    const yForm = renderSchemaForm(ySchema, g, (key, val) => {
      draft.groups[name][key] = val
      onChange(undefined, name)
    })
    sliders.append(xForm, yForm)

    const members = draft.widgets.filter(w => w.config?.group === name)
    const count = document.createElement('div')
    count.className = 'wm-group-count'
    count.textContent = members.length ? `${members.length} widget${members.length > 1 ? 's' : ''}` : 'No widgets assigned'

    card.append(header, sliders, count)
    section.append(card)
  }

  const addRow = document.createElement('div')
  addRow.className = 'wm-group-add-row'
  const addInput = document.createElement('input')
  addInput.type = 'text'
  addInput.placeholder = 'New group name…'
  addInput.className = 'wm-group-add-input'
  const addBtn = document.createElement('button')
  addBtn.className = 'wm-group-add-btn'
  addBtn.textContent = '+ Add'
  addBtn.addEventListener('click', () => {
    const name = addInput.value.trim()
    if (!name || draft.groups[name]) return
    draft.groups = draft.groups || {}
    draft.groups[name] = { positionX: 50, positionY: 50 }
    addInput.value = ''
    onChange()
    onRerender()
  })
  addInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addBtn.click()
  })
  addRow.append(addInput, addBtn)
  section.append(addRow)

  content.append(section)
}

function renderList(content, draft, onChange, onRerender) {
  const widgets = draft.widgets || []
  const groups = draft.groups || {}
  const groupNames = Object.keys(groups)

  // Add widget dropdown
  const addBar = document.createElement('div')
  addBar.className = 'wm-add-bar'

  const select = document.createElement('select')
  select.className = 'wm-add-select'
  const placeholder = document.createElement('option')
  placeholder.textContent = '+ Add widget…'
  placeholder.disabled = true
  placeholder.selected = true
  select.append(placeholder)
  for (const def of Object.values(registry)) {
    const opt = document.createElement('option')
    opt.value = def.id
    opt.textContent = def.name
    select.append(opt)
  }
  select.addEventListener('change', () => {
    const type = select.value
    if (!type) return
    const id = type + '-' + Date.now()
    draft.widgets.push({ instanceId: id, type, config: {} })
    select.selectedIndex = 0
    onChange()
    onRerender()
  })
  addBar.append(select)
  content.append(addBar)

  // Grouped widgets first
  for (const gName of groupNames) {
    const groupWidgets = widgets.filter(w => w.config?.group === gName)
    if (groupWidgets.length === 0) continue

    const groupSection = document.createElement('div')
    groupSection.className = 'wm-group-section'

    const groupLabel = document.createElement('div')
    groupLabel.className = 'wm-group-section-label'
    groupLabel.textContent = gName
    groupSection.append(groupLabel)

    for (const instance of groupWidgets) {
      groupSection.append(createWidgetRow(instance, draft, onChange, onRerender, true))
    }
    content.append(groupSection)
  }

  // Ungrouped widgets
  const ungrouped = widgets.filter(w => !w.config?.group || !groups[w.config.group])
  if (ungrouped.length > 0) {
    if (groupNames.length > 0) {
      const sep = document.createElement('div')
      sep.className = 'wm-separator'
      sep.textContent = 'Ungrouped'
      content.append(sep)
    }
    for (const instance of ungrouped) {
      content.append(createWidgetRow(instance, draft, onChange, onRerender, false))
    }
  }
}

function createWidgetRow(instance, draft, onChange, onRerender, isGrouped) {
  const def = getWidget(instance.type)
  if (!def) return document.createDocumentFragment()

  const row = document.createElement('div')
  row.className = 'wm-row' + (isGrouped ? ' wm-row-grouped' : '')

  const header = document.createElement('div')
  header.className = 'wm-row-header'

  const name = document.createElement('span')
  name.className = 'wm-row-name'
  name.textContent = def.name

  header.append(name)

  const moveUp = document.createElement('button')
  moveUp.textContent = '▲'
  moveUp.addEventListener('click', (e) => {
    e.stopPropagation()
    const i = draft.widgets.findIndex(w => w.instanceId === instance.instanceId)
    if (i > 0) {
      [draft.widgets[i - 1], draft.widgets[i]] = [draft.widgets[i], draft.widgets[i - 1]]
      onChange()
      onRerender()
    }
  })

  const moveDown = document.createElement('button')
  moveDown.textContent = '▼'
  moveDown.addEventListener('click', (e) => {
    e.stopPropagation()
    const i = draft.widgets.findIndex(w => w.instanceId === instance.instanceId)
    if (i < draft.widgets.length - 1) {
      [draft.widgets[i], draft.widgets[i + 1]] = [draft.widgets[i + 1], draft.widgets[i]]
      onChange()
      onRerender()
    }
  })

  const remove = document.createElement('button')
  remove.textContent = '✕'
  remove.addEventListener('click', (e) => {
    e.stopPropagation()
    draft.widgets = draft.widgets.filter(w => w.instanceId !== instance.instanceId)
    onChange()
    onRerender()
  })

  header.append(moveUp, moveDown, remove)

  // Expandable form
  const formWrap = document.createElement('div')
  formWrap.className = 'wm-form'
  const isOpen = expandedId === instance.instanceId
  formWrap.style.display = isOpen ? 'block' : 'none'

  if (isOpen) {
    const isCurrentlyGrouped = !!instance.config?.group
    const groupNames = Object.keys(draft.groups || {})
    const values = formValues(def, instance)

    // Layout section
    const layoutSection = document.createElement('div')
    layoutSection.className = 'wm-form-section'

    const layoutTitle = document.createElement('div')
    layoutTitle.className = 'wm-form-section-title'
    layoutTitle.textContent = 'Layout'
    layoutSection.append(layoutTitle)

    /** @type {import('./types.js').Field[]} */
    const layoutSchema = []
    if (groupNames.length > 0) {
      layoutSchema.push({ key: 'group', label: 'Group', type: 'select', options: ['(none)', ...groupNames] })
    }
    if (!isCurrentlyGrouped) {
      layoutSchema.push(
        { key: 'positionX', label: 'X Position %', type: 'range', min: 0, max: 100, step: 1 },
        { key: 'positionY', label: 'Y Position %', type: 'range', min: 0, max: 100, step: 1 }
      )
    }
    layoutSchema.push(
      { key: 'width',  label: 'Width px',  type: 'range', min: 50, max: 1200, step: 10 },
      { key: 'height', label: 'Height px', type: 'range', min: 0, max: 800, step: 10 }
    )

    const layoutForm = renderSchemaForm(layoutSchema, values, (key, val) => {
      const inst = draft.widgets.find(w => w.instanceId === instance.instanceId)
      if (inst) {
        inst.config = inst.config || {}
        if (key === 'group') {
          inst.config.group = val === '(none)' ? '' : val
        } else {
          inst.config[key] = val
        }
        onChange(inst, key)
        if (key === 'group') onRerender()
      }
    })
    layoutSection.append(layoutForm)

    // Spacing section
    const spacingSection = document.createElement('div')
    spacingSection.className = 'wm-form-section'

    const spacingTitle = document.createElement('div')
    spacingTitle.className = 'wm-form-section-title'
    spacingTitle.textContent = 'Spacing'
    spacingSection.append(spacingTitle)

    /** @type {import('./types.js').Field[]} */
    const spacingSchema = [
      { key: 'margin', label: 'Margin px', type: 'range', min: 0, max: 50, step: 2 }
    ]
    const spacingForm = renderSchemaForm(spacingSchema, values, (key, val) => {
      const inst = draft.widgets.find(w => w.instanceId === instance.instanceId)
      if (inst) {
        inst.config = inst.config || {}
        inst.config[key] = val
        onChange(inst, key)
      }
    })
    spacingSection.append(spacingForm)

    if (def.settingsSchema) {
      const widgetSection = document.createElement('div')
      widgetSection.className = 'wm-form-section'

      const widgetTitle = document.createElement('div')
      widgetTitle.className = 'wm-form-section-title'
      widgetTitle.textContent = def.name
      widgetSection.append(widgetTitle)

      const widgetForm = renderSchemaForm(def.settingsSchema, values, (key, val) => {
        const inst = draft.widgets.find(w => w.instanceId === instance.instanceId)
        if (inst) {
          inst.config = inst.config || {}
          inst.config[key] = val
          onChange(inst, key)
        }
      })
      widgetSection.append(widgetForm)

      const box = /** @type {HTMLElement | null} */ (
        document.querySelector('.widget[data-instance-id="' + CSS.escape(instance.instanceId) + '"]')
      )
      const cssValues = { ...values, customCSS: instance.config?.customCSS ?? currentCSSForWidget(box) }
      /** @type {import('./types.js').Field[]} */
      const cssSchema = [
        { key: 'customCSS', label: 'Custom CSS', type: 'textarea', rows: 8, placeholder: '.bookmark-tile { background: ... }' }
      ]
      const cssForm = renderSchemaForm(cssSchema, cssValues, (key, val) => {
        const inst = draft.widgets.find(w => w.instanceId === instance.instanceId)
        if (inst) {
          inst.config = inst.config || {}
          inst.config[key] = val
          onChange(inst, key)
        }
      })
      widgetSection.append(cssForm)
      formWrap.append(widgetSection)
    }

    formWrap.append(layoutSection, spacingSection)
  }

  header.addEventListener('click', () => {
    expandedId = expandedId === instance.instanceId ? null : instance.instanceId
    onRerender()
  })

  row.append(header, formWrap)
  return row
}

export function mountWidgetManager(content, draft, onChange) {
  content.innerHTML = ''

  const onRerender = () => {
    content.innerHTML = ''
    renderGroups(content, draft, onChange, onRerender)
    renderList(content, draft, onChange, onRerender)
  }

  renderGroups(content, draft, onChange, onRerender)
  renderList(content, draft, onChange, onRerender)
}
