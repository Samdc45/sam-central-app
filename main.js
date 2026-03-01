const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, shell, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const https = require('https')

// ============================================================
// CONFIG — edit these if your URLs change
// ============================================================
const CONFIG = {
  LOCAL_API:    'http://localhost:8080',
  RAILWAY_API:  'https://nzci-flexi-webhook-production.up.railway.app',
  DASH_PASS:    'SamCentral2026',
  CHECK_MINS:   5,
  AGENT_ZERO:   'http://localhost:80',
  WORDPRESS:    'https://nzciflexi.wordpress.com',
  GUMROAD:      'https://app.gumroad.com/sales',
  LINKEDIN:     'https://linkedin.com/company/south-consultants',
  RAILWAY_DASH: 'https://railway.app',
  CALENDAR:     'https://calendar.google.com'
}

let tray       = null
let win        = null
let lastUnread = 0
let apiBase    = CONFIG.RAILWAY_API   // start with Railway (always live)

// ============================================================
// URL SCHEME — samcentral://
// ============================================================
app.setAsDefaultProtocolClient('samcentral')
if (!app.requestSingleInstanceLock()) { app.quit() }
app.on('second-instance', (_, argv) => {
  const url = argv.find(a => a.startsWith('samcentral://'))
  if (url) handleUrl(url)
})
app.on('open-url', (e, url) => { e.preventDefault(); handleUrl(url) })

// ============================================================
// SMART API FETCH — tries local first, falls back to Railway
// ============================================================
function fetchJSON(url, timeoutMs = 4000) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http
    const req = mod.get(url, { timeout: timeoutMs }, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { resolve(null) } })
    })
    req.on('error', () => resolve(null))
    req.on('timeout', () => { req.destroy(); resolve(null) })
  })
}

async function smartFetch(endpoint) {
  // Try local Docker first
  const local = await fetchJSON(`${CONFIG.LOCAL_API}${endpoint}`, 2000)
  if (local !== null) {
    apiBase = CONFIG.LOCAL_API
    return local
  }
  // Fall back to Railway
  apiBase = CONFIG.RAILWAY_API
  const remote = await fetchJSON(`${CONFIG.RAILWAY_API}${endpoint}`)
  return remote || {}
}

// ============================================================
// NOTIFICATIONS
// ============================================================
function notify(title, body) {
  if (!Notification.isSupported()) return
  const n = new Notification({ title, body, silent: false })
  n.on('click', showDashboard)
  n.show()
}

// ============================================================
// URL HANDLER
// ============================================================
function handleUrl(url) {
  const action = url.replace('samcentral://', '').split('?')[0]
  const map = {
    'open':     showDashboard,
    'dashboard': showDashboard,
    'emails':   showDashboard,
    'status':   checkStatusAndNotify,
    'briefing': morningBriefing
  }
  if (map[action]) map[action]()
}

// ============================================================
// DASHBOARD WINDOW
// ============================================================
function showDashboard() {
  if (win && !win.isDestroyed()) { win.show(); win.focus(); return }
  win = new BrowserWindow({
    width: 1280, height: 860,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f1117',
    title: 'Sam Central',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    show: false
  })
  // Use whichever API is live
  const dashUrl = `${apiBase}/dashboard?auth=${CONFIG.DASH_PASS}`
  win.loadURL(dashUrl)
  win.once('ready-to-show', () => win.show())
  win.on('close', e => { e.preventDefault(); win.hide() })
}

// ============================================================
// TRAY ICON — inline base64 PNG (no file needed)
// ============================================================
function makeTrayIcon() {
  // 16x16 white gear icon as base64 PNG
  const b64 = 'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAh0lEQVQ4y2NgGAWkAkZGRgYGJIaRkdH/////MzExMTCAAsi2gBjItkAEkG2BKiDbAlVAtgWqgGwLVAHZFqgCsi1QBWQ7oArItkAVkG2BKiDbAlVAtgWqgGwLVAHZFqgCsi1QBWQ7oArItkAVkG2BKiDbAlVAtgWqgGwLVAHZFqgCsi0AACcMGSBLwtXgAAAAAElFTkSuQmCC'
  return nativeImage.createFromDataURL(`data:image/png;base64,${b64}`)
}

// ============================================================
// MENU BUILDER
// ============================================================
function buildMenu(unread, emails, source) {
  const sourceLabel = source === 'local' ? '🟢 Local (Docker)' : '🔵 Railway (Cloud)'
  const emailItems = (emails || []).slice(0, 4).map(e => ({
    label: `  ${(e.from || '').substring(0,20)}: ${(e.subject || '').substring(0,30)}`,
    click: showDashboard
  }))

  return Menu.buildFromTemplate([
    { label: '⚙️  SAM CENTRAL v2.0',  enabled: false },
    { label: sourceLabel,              enabled: false },
    { type: 'separator' },
    { label: `📧 ${unread} unread emails`,   click: showDashboard },
    ...(emailItems.length ? emailItems : [{ label: '  No recent emails', enabled: false }]),
    { type: 'separator' },
    { label: '🖥️  Open Dashboard',    click: showDashboard },
    { label: '🤖 Agent Zero (AI)',    click: () => shell.openExternal(CONFIG.AGENT_ZERO) },
    { type: 'separator' },
    { label: 'BUSINESS',             enabled: false },
    { label: '💰 Gumroad Sales',      click: () => shell.openExternal(CONFIG.GUMROAD) },
    { label: '📅 Google Calendar',    click: () => shell.openExternal(CONFIG.CALENDAR) },
    { label: '🌐 NZCI Flexi Site',    click: () => shell.openExternal(CONFIG.WORDPRESS) },
    { label: '📝 LinkedIn',           click: () => shell.openExternal(CONFIG.LINKEDIN) },
    { label: '📊 Railway Logs',       click: () => shell.openExternal(CONFIG.RAILWAY_DASH) },
    { type: 'separator' },
    { label: 'TOOLS',                enabled: false },
    { label: '☀️  Morning Briefing',  click: morningBriefing },
    { label: '🔄 Refresh Now',        click: checkAndUpdate },
    { label: '🔗 Check All Links',    click: checkAllLinks },
    { type: 'separator' },
    { label: 'Quit Sam Central',      click: () => app.exit(0) }
  ])
}

// ============================================================
// LINK CHECKER — new feature!
// ============================================================
async function checkAllLinks() {
  notify('🔗 Checking Links...', 'Testing all connections — this takes ~10 seconds')

  const checks = [
    { name: 'Railway',    url: `${CONFIG.RAILWAY_API}/health` },
    { name: 'WordPress',  url: CONFIG.WORDPRESS },
    { name: 'Gumroad',    url: 'https://gumroad.com' },
    { name: 'Gmail',      url: 'https://gmail.com' },
    { name: 'Agent Zero', url: CONFIG.AGENT_ZERO },
    { name: 'Dashboard',  url: `${apiBase}/dashboard/status` },
  ]

  const results = await Promise.all(checks.map(async c => {
    const r = await fetchJSON(c.url, 5000)
    return `${r !== null ? '✅' : '❌'} ${c.name}`
  }))

  notify('🔗 Link Check Complete', results.join('  |  '))
  showDashboard()
}

// ============================================================
// STATUS + BRIEFING
// ============================================================
async function checkAndUpdate() {
  const data = await smartFetch('/dashboard/emails')
  const unread = data.unread_count || 0
  const emails = data.emails || []
  const source = apiBase === CONFIG.LOCAL_API ? 'local' : 'railway'

  if (typeof unread === 'number' && unread > lastUnread && lastUnread !== 0) {
    notify('📧 New Email — Sam Central', `${unread - lastUnread} new email(s) in civilbesafe@gmail.com`)
  }
  lastUnread = unread

  if (tray) {
    tray.setTitle(unread > 0 ? ` ${unread}` : ' SC')
    tray.setToolTip(`Sam Central | ${unread} unread | ${source}`)
    tray.setContextMenu(buildMenu(unread, emails, source))
  }
}

async function checkStatusAndNotify() {
  const s = await smartFetch('/dashboard/status')
  const src = apiBase === CONFIG.LOCAL_API ? 'Local' : 'Railway'
  notify('⚙️ Sam Central Status',
    `Railway: ${s.railway || '✅'} | Gmail: ${s.gmail || '✅'} | Source: ${src}`
  )
}

async function morningBriefing() {
  const [status, emails] = await Promise.all([
    smartFetch('/dashboard/status'),
    smartFetch('/dashboard/emails')
  ])
  const unread = emails.unread_count || 0
  const src = apiBase === CONFIG.LOCAL_API ? 'Local' : 'Railway'
  notify('☀️ Good Morning Sam!',
    `${unread} unread emails | Courses live | API: ${src} | Tap to open dashboard`
  )
  setTimeout(showDashboard, 1500)
}

function scheduleMorning() {
  const now    = new Date()
  const target = new Date()
  target.setHours(8, 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  const ms = target - now
  setTimeout(() => {
    morningBriefing()
    setInterval(morningBriefing, 86400000)
  }, ms)
}

// ============================================================
// APP READY
// ============================================================
app.whenReady().then(() => {
  app.setName('Sam Central')
  if (app.dock) app.dock.hide()  // menu bar only

  const img = makeTrayIcon()
  tray = new Tray(img)
  tray.setTitle(' SC')
  tray.setToolTip('Sam Central — Loading...')
  tray.setContextMenu(buildMenu(0, [], 'railway'))
  tray.on('click', showDashboard)

  // Startup
  checkAndUpdate()
  scheduleMorning()
  setInterval(checkAndUpdate, CONFIG.CHECK_MINS * 60 * 1000)

  // Handle URL scheme from command line
  const urlArg = process.argv.find(a => a.startsWith('samcentral://'))
  if (urlArg) handleUrl(urlArg)

  // Startup notification
  setTimeout(() => {
    notify('⚙️ Sam Central Ready', 'Menu bar app is running. Click SC to open dashboard.')
  }, 3000)
})

app.on('window-all-closed', () => {})  // keep running in tray
