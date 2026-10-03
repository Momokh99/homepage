import { loadSettings, saveSettings } from './storage.js'
import { applyBackground } from './theme.js'
import { applyGroupLayout, relayoutWidget } from './layout.js'
import { renderSchemaForm } from './schemaForm.js'
import { mountWidgetManager } from './widgetManager.js'
import { saveImageBlob, loadImageBlob } from './imageStore.js'

/** @type {HTMLElement | null} */
let panel = null
/** @type {HTMLElement | null} */
let content = null
/** @type {import('./types.js').Settings | null} */
let draft = null
/** @type {import('./types.js').Settings | null} */
let originalSettings = null

function renderAppearance() {
    content.innerHTML = ''

    const bg = draft.background || {}

    // Background type selector
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
        if (opt === (bg.type || 'color')) option.selected = true
        typeSelect.append(option)
    }
    typeSelect.addEventListener('change', () => {
        const next = typeSelect.value === 'image' ? 'image' : 'color'
        draft.background = draft.background || {}
        draft.background.type = next
        renderAppearance()
    })
    typeRow.append(typeLabel, typeSelect)
    content.append(typeRow)

    // Color picker (only when type=color)
    if ((bg.type || 'color') === 'color') {
        /** @type {import('./types.js').Field[]} */
        const colorSchema = [
            { key: 'value', label: 'Color', type: 'color' }
        ]
        const colorForm = renderSchemaForm(colorSchema, bg, (key, val) => {
            draft.background = draft.background || {}
            draft.background[key] = val
            applyBackground(draft.background)
        })
        content.append(colorForm)
    }

    // File upload (only when type=image)
    if (bg.type === 'image') {
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
            draft.background = draft.background || {}
            draft.background.type = 'image'
            await applyBackground(draft.background)
            renderAppearance()
        })

        fileSection.append(fileLabel, fileInput)

        // Show current image preview if one exists
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

        content.append(fileSection)
    }

    // Blur and Dim sliders
    /** @type {import('./types.js').Field[]} */
    const slidersSchema = [
        { key: 'blur', label: 'Blur', type: 'range', min: 0, max: 20, step: 1 },
        { key: 'dim', label: 'Dim', type: 'range', min: 0, max: 80, step: 5 }
    ]
    const slidersForm = renderSchemaForm(slidersSchema, bg, (key, val) => {
        draft.background = draft.background || {}
        draft.background[key] = val
        applyBackground(draft.background)
    })
    content.append(slidersForm)
}

/**
 * Applies a draft layout change to the live page without persisting.
 *
 * @param {import('./types.js').WidgetInstance} [instance]
 * @param {string} [groupName]
 */
function previewDraft(instance, groupName) {
    if (groupName != null) {
        const gc = /** @type {HTMLElement | null} */ (
            document.querySelector('.widget-group[data-group="' + CSS.escape(groupName) + '"]')
        )
        if (gc) applyGroupLayout(gc, draft?.groups?.[groupName])
        return
    }
    if (!instance) return
    const box = /** @type {HTMLElement | null} */ (
        document.querySelector('.widget[data-instance-id="' + CSS.escape(instance.instanceId) + '"]')
    )
    if (box) relayoutWidget(box, instance.config)
}

function revertDraft() {
    if (!originalSettings) return
    applyBackground(originalSettings.background)
    for (const [name, g] of Object.entries(originalSettings.groups || {})) {
        const gc = /** @type {HTMLElement | null} */ (
            document.querySelector('.widget-group[data-group="' + CSS.escape(name) + '"]')
        )
        if (gc) applyGroupLayout(gc, g)
    }
    const instances = originalSettings.widgets || []
    for (const el of document.querySelectorAll('.widget[data-instance-id]')) {
        const box = /** @type {HTMLElement} */ (el)
        const inst = instances.find(w => w.instanceId === box.dataset.instanceId)
        if (inst) relayoutWidget(box, inst.config)
    }
}

function renderWidgets() {
    content.innerHTML = ''
    mountWidgetManager(content, draft, previewDraft)
}

const tabRenderers = {
    Appearance: renderAppearance,
    Widgets: renderWidgets
}

function exportSettings() {
    const json = JSON.stringify(draft, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'homepage-settings.json'
    a.click()
    URL.revokeObjectURL(url)
}

function importSettings() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.addEventListener('change', async () => {
        const file = input.files[0]
        if (!file) return
        try {
            const text = await file.text()
            const data = JSON.parse(text)
            if (typeof data !== 'object' || data === null) throw new Error('Invalid')
            if (!data.background || !Array.isArray(data.widgets)) throw new Error('Missing fields')
            await saveSettings(data)
            location.reload()
        } catch (e) {
            alert('Invalid settings file: ' + e.message)
        }
    })
    input.click()
}

let activeTab = 'Appearance'

export function openPanel() {
    panel?.classList.add('open')
}

export function closePanel() {
    revertDraft()
    draft = null
    panel?.classList.remove('open')
}

export function mountSettings() {
    panel = document.createElement('div')
    panel.className = 'settings-panel'

    // Header
    const header = document.createElement('div')
    header.className = 'settings-header'
    header.textContent = 'Settings'

    const closeBtn = document.createElement('button')
    closeBtn.className = 'settings-close'
    closeBtn.textContent = '✕'
    closeBtn.addEventListener('click', closePanel)
    header.append(closeBtn)

    // Tabs
    const tabs = document.createElement('div')
    tabs.className = 'settings-tabs'

    const tabNames = ['Appearance', 'Widgets']

    content = document.createElement('div')
    content.className = 'settings-content'

    for (const name of tabNames) {
        const tab = document.createElement('button')
        tab.className = 'settings-tab' + (name === activeTab ? ' active' : '')
        tab.textContent = name
        tab.addEventListener('click', () => {
            activeTab = name
            tabs.querySelectorAll('.settings-tab').forEach(t =>
                t.classList.toggle('active', t.textContent === name))
            tabRenderers[name]()
        })
        tabs.append(tab)
    }

    // Footer with Export, Import, Save buttons
    const footer = document.createElement('div')
    footer.className = 'settings-footer'

    const exportBtn = document.createElement('button')
    exportBtn.className = 'settings-save'
    exportBtn.textContent = 'Export'
    exportBtn.addEventListener('click', exportSettings)

    const importBtn = document.createElement('button')
    importBtn.className = 'settings-save'
    importBtn.textContent = 'Import'
    importBtn.addEventListener('click', importSettings)

    const saveBtn = document.createElement('button')
    saveBtn.className = 'settings-save'
    saveBtn.textContent = 'Save'
    saveBtn.addEventListener('click', async () => {
        if (draft) {
            await saveSettings(draft)
        }
        location.reload()
    })
    footer.append(exportBtn, importBtn, saveBtn)

    panel.append(header, tabs, content, footer)
    document.body.append(panel)
}

// Intercept openPanel to create draft
const originalOpen = openPanel
export function openPanelWithDraft() {
    loadSettings().then(settings => {
        originalSettings = JSON.parse(JSON.stringify(settings))
        draft = JSON.parse(JSON.stringify(settings))
        activeTab = 'Appearance'
        panel?.querySelectorAll('.settings-tab').forEach(t =>
            t.classList.toggle('active', t.textContent === activeTab))
        tabRenderers[activeTab]()
        originalOpen()
    })
}
