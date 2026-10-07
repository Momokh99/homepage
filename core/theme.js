import { loadImageBlob } from './imageStore.js'

let currentUrl = null

/** @type {number | null} */
let rafId = null
/** @type {'stars' | 'waves' | 'shooting' | null} */
let canvasMode = null
/** @type {HTMLCanvasElement | null} */
let canvasEl = null
/** @type {{x:number,y:number,r:number,phase:number,tw:number,speed:number}[]} */
let stars = []
/** @type {{x:number,y:number,vx:number,vy:number,life:number,maxLife:number,len:number}[]} */
let meteors = []
/** @type {number} */
let lastSpawn = 0
/** @type {number} */
let nextGap = 1200
/** @type {boolean} */
let resizeBound = false
/** @type {number} */
let cw = 0
/** @type {number} */
let ch = 0

const GRADIENT_BG =
  'linear-gradient(135deg, hsl(220 35% 14%) 0%, hsl(260 35% 18%) 25%, hsl(200 45% 12%) 50%, hsl(280 30% 16%) 75%, hsl(220 35% 14%) 100%)'

function ensureCanvas() {
  if (canvasEl && canvasEl.isConnected) return canvasEl
  canvasEl = document.createElement('canvas')
  canvasEl.id = 'bg-canvas'
  document.body.append(canvasEl)
  return canvasEl
}

function resizeCanvas() {
  if (!canvasEl) return
  const dpr = window.devicePixelRatio || 1
  cw = window.innerWidth
  ch = window.innerHeight
  canvasEl.width = Math.max(1, Math.floor(cw * dpr))
  canvasEl.height = Math.max(1, Math.floor(ch * dpr))
  canvasEl.style.width = cw + 'px'
  canvasEl.style.height = ch + 'px'
  const ctx = canvasEl.getContext('2d')
  if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (canvasMode === 'stars') seedStars()
}

function seedStars() {
  stars = []
  const count = Math.round((cw * ch) / 12000)
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      r: Math.random() * 1.6 + 0.4,
      phase: Math.random() * Math.PI * 2,
      tw: 0.4 + Math.random() * 1.6,
      speed: 0.02 + Math.random() * 0.08
    })
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} t
 */
function drawStars(ctx, t) {
  ctx.clearRect(0, 0, cw, ch)
  for (const s of stars) {
    s.x -= s.speed
    if (s.x < -2) s.x = cw + 2
    const alpha = 0.25 + 0.75 * Math.abs(Math.sin(t * 0.001 * s.tw + s.phase))
    ctx.beginPath()
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
    ctx.fillStyle = `hsla(0 0% 100% / ${alpha})`
    ctx.fill()
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} t
 */
function drawWaves(ctx, t) {
  ctx.clearRect(0, 0, cw, ch)
  const layers = [
    { amp: 50, freq: 0.007, speed: 0.0005, yBase: 0.55, color: 'hsla(220 45% 60% / 0.12)' },
    { amp: 70, freq: 0.004, speed: 0.0003, yBase: 0.68, color: 'hsla(200 55% 65% / 0.10)' },
    { amp: 35, freq: 0.011, speed: 0.0008, yBase: 0.82, color: 'hsla(260 40% 70% / 0.08)' }
  ]
  for (const L of layers) {
    ctx.beginPath()
    ctx.moveTo(0, ch)
    for (let x = 0; x <= cw; x += 4) {
      const y = ch * L.yBase + Math.sin(x * L.freq + t * L.speed) * L.amp
      ctx.lineTo(x, y)
    }
    ctx.lineTo(cw, ch)
    ctx.closePath()
    ctx.fillStyle = L.color
    ctx.fill()
  }
}

/**
 * @param {number} t
 */
function tick(t) {
  if (!canvasEl || !canvasMode) return
  const ctx = canvasEl.getContext('2d')
  if (!ctx) return
  if (canvasMode === 'stars') drawStars(ctx, t)
  else if (canvasMode === 'shooting') drawShooting(ctx, t)
  else drawWaves(ctx, t)
  rafId = requestAnimationFrame(tick)
}

/**
 * @param {number} x
 * @param {number} y
 * @returns {{x:number,y:number,vx:number,vy:number,life:number,maxLife:number,len:number}}
 */
function spawnMeteor(x, y) {
  const angle = (3 * Math.PI) / 4 + (Math.random() - 0.5) * (Math.PI / 12)
  const speed = 6 + Math.random() * 5
  return {
    x, y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 50 + Math.random() * 40,
    len: 180 + Math.random() * 160
  }
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} t
 */
function drawShooting(ctx, t) {
  ctx.clearRect(0, 0, cw, ch)
  if (t - lastSpawn > nextGap && meteors.length < 12) {
    lastSpawn = t
    nextGap = 120 + Math.random() * 220
    meteors.push(spawnMeteor(cw * 0.35 + Math.random() * cw * 0.7, Math.random() * ch * 0.35))
  }
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i]
    m.x += m.vx
    m.y += m.vy
    m.life++
    if (m.life > m.maxLife || m.x < -200 || m.x > cw + 200 || m.y > ch + 200) {
      meteors.splice(i, 1)
      continue
    }
    const fade = 1 - m.life / m.maxLife
    const tx = m.x - (m.vx / Math.hypot(m.vx, m.vy)) * m.len
    const ty = m.y - (m.vy / Math.hypot(m.vx, m.vy)) * m.len
    const grad = ctx.createLinearGradient(m.x, m.y, tx, ty)
    grad.addColorStop(0, `hsla(0 0% 100% / ${0.9 * fade})`)
    grad.addColorStop(1, 'hsla(0 0% 100% / 0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = 1.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(m.x, m.y)
    ctx.lineTo(tx, ty)
    ctx.stroke()

    // Star head: small bright dot with a soft halo (box-shadow style glow)
    const halo = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, 10)
    halo.addColorStop(0, `rgba(255,255,255,${fade})`)
    halo.addColorStop(0.4, `rgba(255,255,255,${0.18 * fade})`)
    halo.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = halo
    ctx.beginPath()
    ctx.arc(m.x, m.y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `rgba(255,255,255,${0.95 * fade})`
    ctx.beginPath()
    ctx.arc(m.x, m.y, 2, 0, Math.PI * 2)
    ctx.fill()
  }
}

/**
 * @param {'stars' | 'waves' | 'shooting'} mode
 */
function startCanvas(mode) {
  ensureCanvas()
  resizeCanvas()
  if (!resizeBound) {
    resizeBound = true
    window.addEventListener('resize', resizeCanvas)
  }
  if (canvasMode !== mode) {
    canvasMode = mode
    if (mode === 'stars') seedStars()
    if (mode === 'shooting') { meteors = []; lastSpawn = 0; nextGap = 400 }
  }
  if (rafId == null) rafId = requestAnimationFrame(tick)
}

function stopCanvas() {
  if (rafId != null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  canvasMode = null
  meteors = []
  canvasEl?.remove()
  canvasEl = null
}

/**
 * @param {import('./types.js').BackgroundConfig} [bg]
 * @returns {Promise<void>}
 */
export async function applyBackground(bg) {
  const root = document.documentElement
  root.style.setProperty('--blur', (bg?.blur ?? 0) + 'px')
  root.style.setProperty('--dim', (bg?.dim ?? 0) + '%')

  const animation = bg?.animation || 'none'
  document.body.dataset.bgAnim = animation

  if (animation === 'stars' || animation === 'waves' || animation === 'shooting') {
    // Keep the color/image as the backdrop; canvas draws over it.
    if (bg?.type === 'color') {
      root.style.setProperty('--bg', bg.value || 'hsl(220 15% 15%)')
    } else if (bg?.type === 'image') {
      const blob = await loadImageBlob()
      if (blob) {
        if (currentUrl) URL.revokeObjectURL(currentUrl)
        currentUrl = URL.createObjectURL(blob)
        root.style.setProperty('--bg', `url("${currentUrl}") center / cover no-repeat`)
      }
    }
    startCanvas(animation)
    return
  }

  stopCanvas()

  if (animation === 'gradient') {
    root.style.setProperty('--bg', GRADIENT_BG)
    return
  }

  if (bg?.type === 'color') {
    root.style.setProperty('--bg', bg.value)
  } else if (bg?.type === 'image') {
    const blob = await loadImageBlob()
    if (!blob) return
    if (currentUrl) URL.revokeObjectURL(currentUrl)
    currentUrl = URL.createObjectURL(blob)
    root.style.setProperty('--bg', `url("${currentUrl}") center / cover no-repeat`)
  }

  if (!root.style.getPropertyValue('--bg')) {
    root.style.setProperty('--bg', 'hsl(220 15% 15%)')
  }
}
