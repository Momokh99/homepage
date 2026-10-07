import { applyBackground } from './theme.js'
import { renderSchemaForm } from './schemaForm.js'
import { saveSettings } from './storage.js'
import { getWidget } from './registry.js'
import { saveImageBlob, loadImageBlob } from './imageStore.js'

/**
 * @param {import('./types.js').Settings} settings
 */
export function mountSetupWizard(settings) {
  const searchInst = (settings.widgets || []).find(w => w.type === 'search')
  const bookmarkInst = (settings.widgets || []).find(w => w.type === 'bookmarks')

  /** @type {import('./types.js').BackgroundConfig} */
  const draftBackground = {
    type: 'color',
    value: 'hsl(220 15% 15%)',
    blur: 0,
    dim: 0,
    ...(settings.background || {})
  }

  /** @type {any[]} */
  const draftBookmarks = Array.isArray(bookmarkInst?.config?.bookmarks)
    ? [...bookmarkInst.config.bookmarks]
    : []

  /** @type {any[]} */
  const draftEngines = (() => {
    if (searchInst?.config && Array.isArray(searchInst.config.destinations)) {
      return searchInst.config.destinations.map(d => ({ ...d, enabled: !!d.enabled }))
    }
    const def = getWidget('search')
    const destinations = /** @type {any[]} */ (def?.defaults?.destinations) || []
    return destinations.map(d => ({ ...d, enabled: !!d.enabled }))
  })()

  const overlay = document.createElement('div')
  overlay.className = 'setup-overlay'

  const modal = document.createElement('div')
  modal.className = 'setup-modal'

  const title = document.createElement('h2')
  title.className = 'setup-title'

  const body = document.createElement('div')
  body.className = 'setup-body'

  const dots = document.createElement('div')
  dots.className = 'setup-dots'

  const footer = document.createElement('div')
  footer.className = 'setup-footer'

  const backBtn = document.createElement('button')
  backBtn.className = 'setup-btn'
  backBtn.textContent = 'Back'

  const skipBtn = document.createElement('button')
  skipBtn.className = 'setup-btn setup-btn-ghost'
  skipBtn.textContent = 'Skip'

  const nextBtn = document.createElement('button')
  nextBtn.className = 'setup-btn setup-btn-primary'
  nextBtn.textContent = 'Next'

  footer.append(skipBtn, backBtn, nextBtn)
  modal.append(title, body, dots, footer)
  overlay.append(modal)
  document.body.append(overlay)

  /** @type {{title: string, render: (body: HTMLElement) => void}[]} */
  const steps = [
    {
      title: 'Welcome',
      render(b) {
        const p = document.createElement('p')
        p.textContent = 'This is your new homepage. Set a background, add a few bookmarks, and pick your search engines — you can change everything later in the settings panel.'
        b.append(p)
      }
    },
    {
      title: 'Background',
      render(b) {
        // Type selector
        const typeRow = document.createElement('div')
        typeRow.className = 'appearance-bg-type'
        const typeLabel = document.createElement('span')
        typeLabel.className = 'schema-label'
        typeLabel.textContent = 'Background Type'
        const typeSelect = document.createElement('select')
        for (const opt of ['color', 'image']) {
          const option = document.createElement('option')
          option.value = opt
          option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1)
          if (opt === (draftBackground.type || 'color')) option.selected = true
          typeSelect.append(option)
        }
        typeSelect.addEventListener('change', () => {
          draftBackground.type = typeSelect.value === 'image' ? 'image' : 'color'
          applyBackground(draftBackground)
          renderStep()
        })
        typeRow.append(typeLabel, typeSelect)
        b.append(typeRow)

        const animRow = document.createElement('div')
        animRow.className = 'appearance-bg-type'
        const animLabel = document.createElement('span')
        animLabel.className = 'schema-label'
        animLabel.textContent = 'Animation'
        const animSelect = document.createElement('select')
        /** @type {{label: string, options: string[]}[]} */
        const animGroups = [
          { label: 'Light', options: ['none', 'gradient', 'stars'] },
          { label: 'Heavy', options: ['waves', 'shooting'] }
        ]
        for (const g of animGroups) {
          const groupEl = document.createElement('optgroup')
          groupEl.label = g.label
          for (const opt of g.options) {
            const option = document.createElement('option')
            option.value = opt
            option.textContent = opt.charAt(0).toUpperCase() + opt.slice(1)
            if (opt === (draftBackground.animation || 'none')) option.selected = true
            groupEl.append(option)
          }
          animSelect.append(groupEl)
        }
        animSelect.addEventListener('change', () => {
          draftBackground.animation = /** @type {any} */ (animSelect.value)
          applyBackground(draftBackground)
        })
        animRow.append(animLabel, animSelect)
        b.append(animRow)

        if ((draftBackground.type || 'color') === 'color') {
          /** @type {import('./types.js').Field[]} */
          const colorSchema = [{ key: 'value', label: 'Color', type: 'color' }]
          b.append(renderSchemaForm(colorSchema, draftBackground, (key, val) => {
            draftBackground[key] = val
            applyBackground(draftBackground)
          }))
        }

        if (draftBackground.type === 'image') {
          const fileSection = document.createElement('div')
          fileSection.className = 'appearance-file-upload'
          const fileLabel = document.createElement('span')
          fileLabel.className = 'schema-label'
          fileLabel.textContent = 'Image'
          fileLabel.style.display = 'block'
          fileLabel.style.marginBottom = '4px'
          const fileInput = document.createElement('input')
          fileInput.type = 'file'
          fileInput.accept = 'image/*'
          fileInput.addEventListener('change', async () => {
            const file = fileInput.files[0]
            if (!file) return
            await saveImageBlob(file)
            draftBackground.type = 'image'
            await applyBackground(draftBackground)
            renderStep()
          })
          fileSection.append(fileLabel, fileInput)
          const preview = document.createElement('div')
          preview.className = 'appearance-image-preview'
          const img = document.createElement('img')
          loadImageBlob().then(blob => {
            if (blob) {
              img.src = URL.createObjectURL(blob)
              preview.append(img)
            }
          })
          fileSection.append(preview)
          b.append(fileSection)
        }

        /** @type {import('./types.js').Field[]} */
        const slidersSchema = [
          { key: 'blur', label: 'Blur', type: 'range', min: 0, max: 20, step: 1 },
          { key: 'dim', label: 'Dim', type: 'range', min: 0, max: 80, step: 5 }
        ]
        b.append(renderSchemaForm(slidersSchema, draftBackground, (key, val) => {
          draftBackground[key] = val
          applyBackground(draftBackground)
        }))
      }
    },
    {
      title: 'Bookmarks',
      render(b) {
        const p = document.createElement('p')
        p.textContent = 'Add a few links to get started. You can edit these any time in Settings → Widgets.'
        b.append(p)
        b.append(renderSchemaForm([
          {
            key: 'bookmarks', label: 'Bookmarks', type: 'list',
            itemSchema: [
              { key: 'name', label: 'Name', type: 'text' },
              { key: 'url', label: 'URL', type: 'text' }
            ]
          }
        ], { bookmarks: draftBookmarks }, (key, val) => {
          draftBookmarks.length = 0
          draftBookmarks.push(...val)
        }))
      }
    },
    {
      title: 'Search engines',
      render(b) {
        const p = document.createElement('p')
        p.textContent = 'Choose which engines appear as chips in the search widget.'
        b.append(p)
        const list = document.createElement('div')
        list.className = 'setup-engines'
        for (const eng of draftEngines) {
          const row = document.createElement('label')
          row.className = 'setup-engine-row'
          const checkbox = document.createElement('input')
          checkbox.type = 'checkbox'
          checkbox.checked = !!eng.enabled
          checkbox.addEventListener('change', () => { eng.enabled = checkbox.checked })
          const name = document.createElement('span')
          name.textContent = eng.name ?? ''
          row.append(checkbox, name)
          list.append(row)
        }
        b.append(list)
      }
    }
  ]

  let current = 0

  function renderStep() {
    title.textContent = steps[current].title
    body.innerHTML = ''
    steps[current].render(body)
    backBtn.style.display = current === 0 ? 'none' : ''
    nextBtn.textContent = current === steps.length - 1 ? 'Finish' : 'Next'
    dots.innerHTML = ''
    for (let i = 0; i < steps.length; i++) {
      const dot = document.createElement('span')
      dot.className = 'setup-dot' + (i === current ? ' active' : '')
      dots.append(dot)
    }
  }

  async function finish() {
    settings.background = draftBackground
    if (bookmarkInst) {
      bookmarkInst.config = bookmarkInst.config || {}
      bookmarkInst.config.bookmarks = draftBookmarks
    }
    if (searchInst) {
      searchInst.config = searchInst.config || {}
      searchInst.config.destinations = draftEngines
    }
    settings.setupComplete = true
    await saveSettings(settings)
    location.reload()
  }

  async function skip() {
    settings.setupComplete = true
    // Background may have been modified in the draft; restore the saved one.
    settings.background = settings.background || draftBackground
    await saveSettings(settings)
    await applyBackground(settings.background)
    overlay.remove()
  }

  backBtn.addEventListener('click', () => {
    if (current > 0) {
      current--
      renderStep()
    }
  })
  nextBtn.addEventListener('click', async () => {
    if (current === steps.length - 1) await finish()
    else {
      current++
      renderStep()
    }
  })
  skipBtn.addEventListener('click', skip)

  renderStep()
}
