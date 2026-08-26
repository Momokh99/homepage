import { getWidget, registry } from './registry.js'
import { renderSchemaForm } from './schemaForm.js'

let expandedId = null

function renderGroups(content, draft, onChange) {
  const groups = draft.groups || {}
  const names = Object.keys(groups)

  const section = document.createElement('div')
  section.className = 'wm-groups'

  const title = document.createElement('div')
  title.className = 'wm-groups-title'
  title.textContent = 'Groups'
  section.append(title)

  for (const name of names) {
    const g = groups[name]
    const row = document.createElement('div')
    row.className = 'wm-group-row'

    const label = document.createElement('span')
    label.className = 'wm-group-name'
    label.textContent = name

    const sliders = document.createElement('div')
    sliders.className = 'wm-group-sliders'

    const xSchema = [{ key: 'positionX', label: 'X %', type: 'range', min: 0, max: 100, step: 1 }]
    const xForm = renderSchemaForm(xSchema, g, (key, val) => {
      draft.groups[name][key] = val
      onChange()
    })
    const ySchema = [{ key: 'positionY', label: 'Y %', type: 'range', min: 0, max: 100, step: 1 }]
    const yForm = renderSchemaForm(ySchema, g, (key, val) => {
      draft.groups[name][key] = val
      onChange()
    })
    sliders.append(xForm, yForm)

    const del = document.createElement('button')
    del.className = 'wm-group-del'
    del.textContent = '✕'
    del.addEventListener('click', () => {
      delete draft.groups[name]
      for (const w of draft.widgets) {
        if (w.config?.group === name) w.config.group = ''
      }
      onChange()
      renderGroups(content, draft, onChange)
      renderList(content, draft, onChange)
    })

    row.append(label, sliders, del)
    section.append(row)
  }

  const addBtn = document.createElement('button')
  addBtn.className = 'wm-group-add'
  addBtn.textContent = '+ Add Group'
  addBtn.addEventListener('click', () => {
    const name = prompt('Group name:')
    if (!name) return
    draft.groups = draft.groups || {}
    draft.groups[name] = { positionX: 50, positionY: 50 }
    onChange()
    renderGroups(content, draft, onChange)
  })
  section.append(addBtn)

  content.append(section)
}

function renderList(content, draft, onChange) {
  content.innerHTML = ''
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
    renderList(content, draft, onChange)
  })
  addBar.append(select)
  content.append(addBar)

  // Instance list
  for (const instance of widgets) {
    const def = getWidget(instance.type)
    if (!def) continue

    const row = document.createElement('div')
    row.className = 'wm-row'

    const header = document.createElement('div')
    header.className = 'wm-row-header'

    const name = document.createElement('span')
    name.className = 'wm-row-name'
    name.textContent = def.name

    const groupBadge = document.createElement('span')
    groupBadge.className = 'wm-row-group'
    const wg = instance.config?.group
    if (wg) groupBadge.textContent = wg

    header.append(name, groupBadge)

    // Move buttons
    const moveUp = document.createElement('button')
    moveUp.textContent = '▲'
    moveUp.addEventListener('click', (e) => {
      e.stopPropagation()
      const i = draft.widgets.findIndex(w => w.instanceId === instance.instanceId)
      if (i > 0) {
        [draft.widgets[i - 1], draft.widgets[i]] = [draft.widgets[i], draft.widgets[i - 1]]
        onChange()
        renderList(content, draft, onChange)
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
        renderList(content, draft, onChange)
      }
    })

    const remove = document.createElement('button')
    remove.textContent = '✕'
    remove.addEventListener('click', (e) => {
      e.stopPropagation()
      draft.widgets = draft.widgets.filter(w => w.instanceId !== instance.instanceId)
      onChange()
      renderList(content, draft, onChange)
    })

    header.append(moveUp, moveDown, remove)

    // Expandable form
    const formWrap = document.createElement('div')
    formWrap.className = 'wm-form'
    const isOpen = expandedId === instance.instanceId
    formWrap.style.display = isOpen ? 'block' : 'none'

    if (isOpen && def.settingsSchema) {
      const isGrouped = !!instance.config?.group

      const layoutSchema = []

      // Group selector
      const groupField = { key: 'group', label: 'Group', type: 'select', options: ['(none)', ...groupNames] }
      layoutSchema.push(groupField)

      // Position only for ungrouped
      if (!isGrouped) {
        layoutSchema.push(
          { key: 'positionX', label: 'X Position %', type: 'range', min: 0, max: 100, step: 1 },
          { key: 'positionY', label: 'Y Position %', type: 'range', min: 0, max: 100, step: 1 }
        )
      }

      layoutSchema.push(
        { key: 'width',     label: 'Width px',     type: 'range', min: 50, max: 1200, step: 10 },
        { key: 'height',    label: 'Height px',    type: 'range', min: 0, max: 800, step: 10 },
        { key: 'margin',    label: 'Margin px',    type: 'range', min: 0, max: 50, step: 2 }
      )

      const fullSchema = [...def.settingsSchema, ...layoutSchema]
      const form = renderSchemaForm(fullSchema, instance.config || {}, (key, val) => {
        const inst = draft.widgets.find(w => w.instanceId === instance.instanceId)
        if (inst) {
          inst.config = inst.config || {}
          if (key === 'group') {
            inst.config.group = val === '(none)' ? '' : val
          } else {
            inst.config[key] = val
          }
          onChange()
          if (key === 'group') renderList(content, draft, onChange)
        }
      })
      formWrap.append(form)
    }

    header.addEventListener('click', () => {
      expandedId = expandedId === instance.instanceId ? null : instance.instanceId
      renderList(content, draft, onChange)
    })

    row.append(header, formWrap)
    content.append(row)
  }
}

export function mountWidgetManager(content, draft, onChange) {
  content.innerHTML = ''
  renderGroups(content, draft, onChange)
  renderList(content, draft, onChange)
}
