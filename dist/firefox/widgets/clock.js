export const clockWidget = {
  id: 'clock',
  name: 'Clock',
  defaults: {
    format: '24h',
    fontSize: 48,
    color: 'black'
  },
  settingsSchema: [
    { key: 'format',   label: 'Format',   type: 'select', options: ['12h', '24h'] },
    { key: 'fontSize', label: 'Font Size', type: 'range', min: 12, max: 200, step: 2 },
    { key: 'color',    label: 'Color',    type: 'color' }
  ],
  render(box, config) {
    const conf = { ...this.defaults, ...config }
    box.style.fontSize = conf.fontSize + 'px'
    box.style.color = conf.color

    const update = () => {
      box.textContent = new Date().toLocaleTimeString([], {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: conf.format === '12h'
      })
    }
    update()
    setInterval(update, 1000)
  }
}
