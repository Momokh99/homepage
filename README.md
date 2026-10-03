# Homepage

A customizable new tab page browser extension. Replaces the browser's new tab
with a configurable surface of widgets, written in plain ES modules with no UI
framework.

## Features

- **Three widgets** — multi-engine search, clock, bookmarks
- **Widget management** — add, remove, and group widgets; position each with
  X/Y percentage sliders
- **Appearance** — solid colour or uploaded image background, with blur and dim
- **Live preview** — every settings change previews on the page and reverts on cancel
- **Import / export** — settings as JSON
- **Firefox and Chrome** — single build system, both targets

## Install

### Chrome (unpacked)

1. `npm run build`
2. Open `chrome://extensions`, enable **Developer mode**
3. **Load unpacked** → select `.output/chrome-mv3`

### Firefox

1. `npm run build`
2. Open `about:debugging#/runtime/this-firefox`
3. **Load Temporary Add-on** → select `.output/firefox-mv3/manifest.json`

Note the version suffix on the output directories (`chrome-mv3`, not `chrome`).

## Development

| Command | Description |
| --- | --- |
| `npm run dev` | Chrome with hot module replacement |
| `npm run dev:firefox` | Firefox with hot module replacement |
| `npm run build` | Typecheck, then build both targets |
| `npm run check` | Typecheck only (`tsc --noEmit`) |
| `npm run zip:firefox` | Build an AMO submission zip |

WXT generates the manifest from `wxt.config.ts`. **Firefox requires `--mv3`** —
WXT targets MV2 for Firefox by default, so the Firefox flags in `package.json`
are not optional.

`npm run dev` opens a browser window automatically; there is no flag to
suppress it.

## Project structure

```
entrypoints/
  background.js        toolbar action → opens settings
  newtab/              the new tab page (index.html, main.js, style.css)
core/                  storage, theme, layout, settings, widget manager
widgets/               one module per widget
public/icons/          extension icons
```

## Adding a widget

Widgets are plain objects. No framework, no registration step:

```js
export const notesWidget = {
  id: 'notes',
  name: 'Notes',
  defaults: { text: '' },
  settingsSchema: [
    { key: 'text', label: 'Text', type: 'text' },
  ],
  render(box, config) {
    const conf = { ...this.defaults, ...config }
    box.textContent = conf.text
  },
}
```

`settingsSchema` drives the settings UI automatically — a `text`, `number`,
`range`, `select`, `toggle`, `color`, or `list` field. Register it in
`core/registry.js`.

## Testing

There is **no automated test suite**. `npm run check` is a typecheck only, not a
test runner. All verification is manual — load the extension using the Install
steps above, then work through the checklist.

| # | Check | Notes |
| --- | --- | --- |
| 1 | First new tab shows search, clock and bookmarks | Seeded on first run |
| 2 | Toolbar icon **on a new tab** updates that tab | No second tab opens |
| 3 | Toolbar icon **on any other page** opens a new tab | |
| 4 | Colour, blur and dim preview live | Reverts on cancel |
| 5 | Background type → Image → upload | Preview shows, survives reload |
| 6 | X/Y sliders move widgets live | ✕ reverts the move |
| 7 | Save persists across reload | |
| 8 | Deleting **all** widgets does not restore defaults | Regression guard |
| 9 | Search chips switch engine, Tab cycles, Enter searches | Disabled engines hidden |
| 10 | Bookmarks empty state, then add entries | Columns and orientation apply |
| 11 | Group created and assigned a widget | Group X/Y applies |
| 12 | Export and Import round-trip | Reloads with imported settings |
| 13 | Firefox: toolbar action works | Runs via `background.scripts` |

Chrome and Firefox keep **separate** extension storage, so settings do not
transfer between them.

## Publishing

- **Firefox** — `npm run zip:firefox`, then upload to AMO. New extensions
  require a `data_collection_permissions` declaration, which the build warns
  about.
- **Chrome** — `npm run build`, then upload `.output/chrome-mv3` as an unpacked
  extension.

## License

MIT — see [LICENSE](LICENSE).