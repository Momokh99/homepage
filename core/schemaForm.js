export function renderSchemaForm(schema, values, onChange) {
  const form = document.createElement('div')
  form.className = 'schema-form'

  for (const field of schema) {
    const row = document.createElement('div')
    row.className = 'schema-row'

    const label = document.createElement('span')
    label.textContent = field.label
    label.className = 'schema-label'

    const control = createControl(field, values?.[field.key], (val) => {
      onChange(field.key, val)
    })

    row.append(label, control)
    form.append(row)
  }

  return form
}

function createControl(field, value, onChange) {
  switch (field.type) {
    case 'text': {
      const input = document.createElement('input')
      input.type = 'text'
      input.value = value ?? ''
      input.addEventListener('input', () => onChange(input.value))
      return input
    }
    case 'number': {
      const input = document.createElement('input')
      input.type = 'number'
      input.value = value ?? field.min ?? 0
      if (field.min != null) input.min = field.min
      if (field.max != null) input.max = field.max
      if (field.step != null) input.step = field.step
      input.addEventListener('input', () => onChange(Number(input.value)))
      return input
    }
    case 'range': {
      const wrap = document.createElement('div')
      wrap.className = 'schema-range'
      const input = document.createElement('input')
      input.type = 'range'
      input.value = value ?? field.min ?? 0
      input.min = field.min
      input.max = field.max
      input.step = field.step ?? 1
      const val = document.createElement('span')
      val.textContent = input.value
      input.addEventListener('input', () => {
        val.textContent = input.value
        onChange(Number(input.value))
      })
      wrap.append(input, val)
      return wrap
    }
    case 'select': {
      const select = document.createElement('select')
      for (const opt of field.options) {
        const option = document.createElement('option')
        option.value = opt
        option.textContent = opt
        if (opt === String(value)) option.selected = true
        select.append(option)
      }
      select.addEventListener('change', () => onChange(select.value))
      return select
    }
    case 'toggle': {
      const input = document.createElement('input')
      input.type = 'checkbox'
      input.checked = value ?? false
      input.addEventListener('change', () => onChange(input.checked))
      return input
    }
    case 'color': {
      const input = document.createElement('input')
      input.type = 'color'
      input.value = value ?? '#ffffff'
      input.addEventListener('input', () => onChange(input.value))
      return input
    }
    case 'list': {
      const container = document.createElement('div')
      container.className = 'schema-list'
      const items = Array.isArray(value) ? [...value] : []

      const renderItems = () => {
        container.innerHTML = ''
        for (let i = 0; i < items.length; i++) {
          const row = document.createElement('div')
          row.className = 'schema-list-row'
          const fields = document.createElement('div')
          fields.className = 'schema-list-fields'
          for (const sub of field.itemSchema) {
            const lbl = document.createElement('span')
            lbl.textContent = sub.label
            lbl.className = 'schema-list-label'
            const subControl = createControl(sub, items[i]?.[sub.key], (val) => {
              items[i] = items[i] || {}
              items[i][sub.key] = val
              onChange([...items])
            })
            const fieldWrap = document.createElement('div')
            fieldWrap.className = 'schema-list-field'
            fieldWrap.append(lbl, subControl)
            fields.append(fieldWrap)
          }
          const del = document.createElement('button')
          del.textContent = '✕'
          del.className = 'schema-list-del'
          del.addEventListener('click', () => {
            items.splice(i, 1)
            onChange([...items])
            renderItems()
          })
          row.append(fields, del)
          container.append(row)
        }
        const add = document.createElement('button')
        add.textContent = '+ Add'
        add.className = 'schema-list-add'
        add.addEventListener('click', () => {
          items.push({})
          onChange([...items])
          renderItems()
        })
        container.append(add)
      }
      renderItems()
      return container
    }
    default:
      return document.createElement('span')
  }
}


