# Contributing

Thanks for taking a look. This project is a browser extension built on
[WXT](https://wxt.dev) with no UI framework and no runtime dependencies, so the
bar for a change is low — but a few conventions keep the codebase consistent.

## Getting started

Requires Node.js and npm.

```bash
npm install
npm run dev          # Chrome, with hot module replacement
npm run dev:firefox  # Firefox, with hot module replacement
```

`npm run dev` opens a browser window automatically. There is no flag to suppress
it. If you prefer to load a build manually, run `npm run build` and follow
[Install](README.md#install).

| Command | Description |
| --- | --- |
| `npm run dev` | Chrome with hot module replacement |
| `npm run dev:firefox` | Firefox with hot module replacement |
| `npm run build` | Typecheck, then build both targets |
| `npm run check` | Typecheck only (`tsc --noEmit`) |
| `npm run zip:firefox` | Build an AMO submission zip |

WXT generates the manifest from `wxt.config.ts`. **Firefox requires `--mv3`** —
WXT targets MV2 for Firefox by default, so the `--mv3` flags in `package.json`
are not optional.

## Project structure

```
entrypoints/
  background.js        toolbar action → opens settings
  newtab/              the new tab page (index.html, main.js, style.css)
core/                  storage, theme, layout, settings, widget manager
widgets/               one module per widget
public/icons/          extension icons
```

Files are plain JavaScript ES modules with JSDoc types — TypeScript is only used
for typechecking, not compilation. Keep new code in `.js` and annotate with
JSDoc so `npm run check` stays meaningful.

## Adding a widget

A widget is a plain object. There is no framework and no build-time
registration:

```js
/** @type {import('../core/types.js').WidgetDefinition} */
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

Then register it in `core/registry.js`:

```js
import { notesWidget } from '../widgets/notes.js'

export const registry = {
  // ...
  [notesWidget.id]: notesWidget,
}
```

`settingsSchema` drives the settings UI automatically. Supported field types:

| Type | Notes |
| --- | --- |
| `text` | Single-line text input |
| `textarea` | Multi-line text input |
| `number` | Numeric input |
| `range` | Slider — requires `min`, `max`, `step` |
| `select` | Dropdown — requires `options` |
| `toggle` | Checkbox |
| `color` | Colour picker |
| `list` | Repeatable group — requires `itemSchema` |

A few things to keep in mind:

- `defaults` is the source of truth. `render` merges it with the saved config, so
  adding a key to `defaults` is backwards compatible with existing settings.
- `render` runs on every page load and after every settings change. Do not leak
  timers or listeners — the clock widget stores its `setInterval` handle in a
  module-level `WeakMap` keyed by element for exactly this reason.
- Avoid `innerHTML` with user-controlled values; use `textContent`.

## Conventions

- Two-space indent, single quotes, no semicolon-free style — match the file you
  are editing.
- Keep widgets self-contained. Cross-widget logic belongs in `core/`.
- Settings are stored in `chrome.storage.local` (via the `storage` abstraction
  in `core/storage.js`). Do not add network calls or new permissions without
  discussing it first.

## Testing

There is **no automated test suite.** `npm run check` is a typecheck only, not
a test runner. All verification is manual:

1. Run `npm run check` — it must pass clean.
2. Run `npm run build` — both targets must build without errors.
3. Load the extension (see [Install](README.md#install)) and work through the
   checklist in [README → Testing](README.md#testing).

The Firefox build emits a `data_collection_permissions` warning. That is
expected for a new extension and is not a failure.

## Pull requests

- Keep commits focused — one logical change per commit.
- Use an imperative, short subject line in the repo's existing style, e.g.
  `Remove Gemini search destination`.
- Describe what you verified manually in the PR body, since there is no CI test
  suite to point at.
- Update the README when you change user-facing behaviour, defaults, or commands.

## Reporting bugs

Open an issue with your browser and version, what you did, what you expected,
and what happened instead. If it is specific to one browser, say which — the
Chrome and Firefox code paths differ in a few places (storage, toolbar action).