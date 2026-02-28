const { app, BrowserWindow, Tray, Menu, nativeImage, Notification, shell, ipcMain } = require('electron')
const path = require('path')
const http = require('http')
const https = require('https')

const CONFIG = {
  LOCAL_API:   'http://localhost:8080',
  RAILWAY_API: 'https://nzci-flexi-webhook-production.up.railway.app',
  DASH_PASS:   'SamCentral2026',
  CHECK_MINS:  5
}

let tray = null
let win  = null
let lastUnread = 0

// Register samcentral:// URL scheme
app.setAsDefaultProtocolClient('samcentral')

// Single instance
if (!app.requestSingleInstanceLock()) { app.quit() }
app.on('second-instance', (_, argv) => {
  const url = argv.find(a => a.startsWith('samcentral://'))
  if (url) handleUrl(url)
})
app.on('open-url', (e, url) => { e.preventDefault(); handleUrl(url) })

function fetchJSON(url) {
  return new Promise((resolve) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => { try { resolve(JSON.parse(d)) } catch(e) { resolve({}) } })
    }).on('error', () => resolve({}))
  })
}

function notify(title, body) {
  if (!Notification.isSupported()) return
  new Notification({ title, body }).show()
}

function handleUrl(url) {
  const action = url.replace('samcentral://', '').split('?')[0]
  const actions = {
    'open': showDashboard,
    'dashboard': showDashboard,
    'emails': showDashboard,
    'status': checkStatusAndNotify,
    'briefing': morningBriefing
  }
  if (actions[action]) actions[action]()
}

function showDashboard() {
  if (win && !win.isDestroyed()) { win.show(); win.focus(); return }
  win = new BrowserWindow({
    width: 1200, height: 820,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0f1117',
    webPreferences: { nodeIntegration: false, contextIsolation: true },
    show: false
  })
  win.loadURL(`${CONFIG.LOCAL_API}/dashboard?auth=${CONFIG.DASH_PASS}`)
  win.once('ready-to-show', () => win.show())
  win.on('close', e => { e.preventDefault(); win.hide() })
}

function buildMenu(unread, emails) {
  const emailItems = (emails || []).slice(0, 4).map(e => ({
    label: `  ${e.from}: ${e.subject}`.substring(0, 50),
    click: showDashboard
  }))
  return Menu.buildFromTemplate([
    { label: 'SAM CENTRAL', enabled: false },
    { type: 'separator' },
    { label: `📧 ${unread} unread emails`, click: showDashboard },
    ...emailItems,
    { type: 'separator' },
    { label: '🖥️  Open Dashboard',    click: showDashboard },
    { label: '🤖 Agent Zero',         click: () => shell.openExternal('http://localhost:80') },
    { label: '💰 Gumroad Sales',      click: () => shell.openExternal('https://app.gumroad.com/sales') },
    { label: '📅 Google Calendar',    click: () => shell.openExternal('https://calendar.google.com') },
    { label: '📊 Railway Logs',       click: () => shell.openExternal('https://railway.app') },
    { label: '🌐 NZCI Flexi Site',    click: () => shell.openExternal('https://nzciflexi.wordpress.com') },
    { label: '📝 LinkedIn',           click: () => shell.openExternal('https://linkedin.com/company/south-consultants') },
    { type: 'separator' },
    { label: '🔔 Morning Briefing',   click: morningBriefing },
    { label: '🔄 Refresh Now',        click: checkAndUpdate },
    { type: 'separator' },
    { label: 'Quit', click: () => app.exit(0) }
  ])
}

async function checkAndUpdate() {
  const data = await fetchJSON(`${CONFIG.LOCAL_API}/dashboard/emails`)
  const unread = data.unread_count || 0
  const emails = data.emails || []
  if (typeof unread === 'number' && unread > lastUnread && lastUnread !== 0) {
    notify('📧 New Email - Sam Central', `${unread - lastUnread} new email(s) received`)
  }
  lastUnread = unread
  if (tray) {
    tray.setTitle(unread > 0 ? ` ${unread}` : '')
    tray.setContextMenu(buildMenu(unread, emails))
  }
}

async function checkStatusAndNotify() {
  const s = await fetchJSON(`${CONFIG.LOCAL_API}/dashboard/status`)
  notify('⚙️ Sam Central Status', `Railway: ${s.railway || '?'} | Gmail: ${s.gmail || '?'} | KB: ${s.kb_files || 8} files`)
}

async function morningBriefing() {
  const [status, emails] = await Promise.all([
    fetchJSON(`${CONFIG.LOCAL_API}/dashboard/status`),
    fetchJSON(`${CONFIG.LOCAL_API}/dashboard/emails`)
  ])
  notify(
    '☀️ Good Morning Sam!',
    `${emails.unread_count || 0} unread emails | Railway: ${status.railway || 'live'} | Open dashboard for priorities`
  )
  showDashboard()
}

function scheduleMorning() {
  const now = new Date()
  const target = new Date()
  target.setHours(8, 0, 0, 0)
  if (target <= now) target.setDate(target.getDate() + 1)
  setTimeout(() => {
    morningBriefing()
    setInterval(morningBriefing, 86400000)
  }, target - now)
}

app.whenReady().then(() => {
  app.setName('Sam Central')
  if (app.dock) app.dock.hide()

  // Create tray
  // Use a simple colored square as icon if no icon file
  let img
  try { img = nativeImage.createFromPath(path.join(__dirname, 'assets', 'tray.png')) }
  catch(e) { img = nativeImage.createEmpty() }

  tray = new Tray(img)
  tray.setTitle(' SC')
  tray.setToolTip('Sam Central')
  tray.setContextMenu(buildMenu(0, []))
  tray.on('click', showDashboard)

  // Initial check + schedule
  checkAndUpdate()
  scheduleMorning()
  setInterval(checkAndUpdate, CONFIG.CHECK_MINS * 60 * 1000)

  // Handle URL scheme on launch
  const urlArg = process.argv.find(a => a.startsWith('samcentral://'))
  if (urlArg) handleUrl(urlArg)
})

app.on('window-all-closed', () => {})
