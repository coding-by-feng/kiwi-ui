// filepath: /src/api/todo.local.js
// Local, offline-compatible Todo API client matching the server API shapes.
// Decides logic at the store level; this module only implements local behavior.

// Storage helpers
const LS_KEY = 'kiwi_todo_local_v1'

function load() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return init()
    const parsed = JSON.parse(raw)
    return normalize(parsed)
  } catch (_) {
    return init()
  }
}

function save(db) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(db)) } catch (_) {}
}

function init() {
  const db = {
    tasks: [],         // TaskDTO[]
    history: [],       // HistoryRecordDTO[]
    trash: [],         // TrashItemDTO[]
    etags: {},         // { [id]: string }
    nextId: 1,         // for simple ID generation
    ranks: defaultRanks(),
  }
  save(db)
  return db
}

function normalize(db) {
  if (!db.tasks) db.tasks = []
  if (!db.history) db.history = []
  if (!db.trash) db.trash = []
  if (!db.etags) db.etags = {}
  if (!db.nextId || typeof db.nextId !== 'number') db.nextId = 1
  if (!Array.isArray(db.ranks)) db.ranks = defaultRanks()
  return db
}

function genId() { const db = load(); const id = String(db.nextId++); save(db); return id }
function nowIso() { return new Date().toISOString() }
function newEtag() { return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2,10)}` }

// Ranking helpers
function defaultRanks() {
  return [
    { key: 'beginner', threshold: 0, level: 1 },
    { key: 'trainee', threshold: 50, level: 2 },
    { key: 'novice', threshold: 100, level: 3 },
    { key: 'apprentice', threshold: 200, level: 4 },
    { key: 'wood', threshold: 300, level: 5 },
    { key: 'stone', threshold: 450, level: 6 },
    { key: 'steel', threshold: 600, level: 7 },
    { key: 'iron', threshold: 800, level: 8 },
    { key: 'bronze', threshold: 1000, level: 9 },
    { key: 'silver', threshold: 1300, level: 10 },
    { key: 'gold', threshold: 1700, level: 11 },
    { key: 'platinum', threshold: 2200, level: 12 },
    { key: 'diamond', threshold: 2800, level: 13 },
    { key: 'master', threshold: 3500, level: 14 },
    { key: 'grandmaster', threshold: 4300, level: 15 },
    { key: 'celestial', threshold: 5200, level: 16 },
    { key: 'divine', threshold: 6200, level: 17 },
    { key: 'immortal', threshold: 7300, level: 18 },
    { key: 'mythic', threshold: 8500, level: 19 },
    { key: 'legendary', threshold: 10000, level: 20 },
  ]
}

function computeTotalPoints(db) {
  return (db.history || []).reduce((sum, h) => sum + (h.pointsApplied || 0), 0)
}

function computeRanking(db) {
  const totalPoints = computeTotalPoints(db)
  const ranks = [...(db.ranks || [])].sort((a,b)=> a.threshold - b.threshold)
  let current = ranks[0]
  let next = null
  for (let i=0; i<ranks.length; i++) {
    if (totalPoints >= ranks[i].threshold) { current = ranks[i]; next = ranks[i+1] || null } else break
  }
  const progressPct = next ? Math.max(0, Math.min(100, ((totalPoints - current.threshold) / (next.threshold - current.threshold)) * 100)) : 100
  return { totalPoints, currentRank: current, nextRank: next, progressPct }
}

// Filtering and pagination helpers
function applyTaskFilters(tasks, params = {}) {
  let out = Array.isArray(tasks) ? [...tasks] : []
  const { status, frequency, search, date } = params
  if (status && status !== 'all') {
    out = out.filter(t => t.status === status)
  }
  if (frequency && frequency !== 'all') {
    out = out.filter(t => (t.frequency || 'once') === frequency)
  }
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    out = out.filter(t => (t.title && t.title.toLowerCase().includes(q)) || (t.description && t.description.toLowerCase().includes(q)))
  }
  if (date) {
    const ymd = String(date)
    out = out.filter(t => (t.createdAt || '').slice(0,10) === ymd)
  }
  // sort
  switch (params.sort) {
    case 'created_desc': out.sort((a,b)=> new Date(b.createdAt||0)-new Date(a.createdAt||0)); break
    case 'updated_desc': out.sort((a,b)=> new Date(b.updatedAt||0)-new Date(a.updatedAt||0)); break
    case 'points_desc':
    default:
      out.sort((a,b)=> (b.successPoints||0) - (a.successPoints||0) || (new Date(b.updatedAt||b.createdAt||0)-new Date(a.updatedAt||a.createdAt||0)))
  }
  return out
}

function paginate(items, page=1, pageSize=20) {
  const total = items.length
  const p = Math.max(1, Number(page)||1)
  const ps = Math.max(1, Math.min(100, Number(pageSize)||20))
  const start = (p-1)*ps
  return { data: items.slice(start, start+ps), meta: { page: p, pageSize: ps, total } }
}

// Public API (mirror server api/todo.js return shapes)

// Tasks
export async function listTasks(params = {}) {
  const db = load()
  const filtered = applyTaskFilters(db.tasks, params)
  const { data, meta } = paginate(filtered, params.page || 1, params.pageSize || 20)
  return { tasks: data, meta }
}

export async function createTask(body) {
  const db = load()
  const id = genId()
  const now = nowIso()
  const task = {
    id,
    userId: 'local',
    title: body.title,
    description: body.description || null,
    successPoints: Number(body.successPoints || 10),
    failPoints: Number(body.failPoints || -5),
    frequency: body.frequency || 'once',
    customDays: body.frequency === 'custom' ? Number(body.customDays || 7) : null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    metadata: null
  }
  db.tasks.unshift(task)
  db.etags[id] = newEtag()
  save(db)
  return { task, etag: db.etags[id] }
}

export async function getTask(id) {
  const db = load()
  const task = db.tasks.find(t => t.id === String(id)) || null
  const etag = db.etags[String(id)] || newEtag()
  return { task, etag }
}

export async function updateTask(id, patch /*, { ifMatch }*/ ) {
  const db = load()
  const idx = db.tasks.findIndex(t => t.id === String(id))
  if (idx === -1) throw new Error('Task not found')
  const t = db.tasks[idx]
  const updated = {
    ...t,
    title: (patch.title != null ? patch.title : t.title),
    description: (patch.description !== undefined ? patch.description : t.description),
    successPoints: (patch.successPoints != null ? Number(patch.successPoints) : t.successPoints),
    failPoints: (patch.failPoints != null ? Number(patch.failPoints) : t.failPoints),
    frequency: (patch.frequency || t.frequency),
    customDays: (patch.frequency === 'custom' ? Number(patch.customDays || t.customDays || 7) : (patch.frequency ? null : t.customDays)),
    updatedAt: nowIso(),
  }
  db.tasks[idx] = updated
  db.etags[id] = newEtag()
  save(db)
  return { task: updated, etag: db.etags[id] }
}

export async function deleteTask(id) {
  const db = load()
  const idx = db.tasks.findIndex(t => t.id === String(id))
  if (idx === -1) return true
  const t = db.tasks[idx]
  const trash = {
    id: t.id,
    title: t.title,
    description: t.description,
    successPoints: t.successPoints,
    failPoints: t.failPoints,
    frequency: t.frequency,
    customDays: t.customDays,
    status: t.status,
    originalDate: t.createdAt,
    deletedDate: nowIso()
  }
  db.trash.unshift(trash)
  db.tasks.splice(idx, 1)
  delete db.etags[id]
  save(db)
  return true
}

export async function completeTask(id, status) {
  const db = load()
  const idx = db.tasks.findIndex(t => t.id === String(id))
  if (idx === -1) throw new Error('Task not found')
  const t = db.tasks[idx]
  const isSuccess = status === 'success'
  const points = isSuccess ? Number(t.successPoints||0) : Number(t.failPoints||0)
  const completedAt = nowIso()
  const updatedTask = { ...t, status: isSuccess ? 'success' : 'fail', updatedAt: completedAt }
  db.tasks[idx] = updatedTask

  const history = {
    id: `${t.id}-${completedAt}`,
    userId: 'local',
    taskId: t.id,
    title: t.title,
    description: t.description,
    successPoints: t.successPoints,
    failPoints: t.failPoints,
    status: isSuccess ? 'success' : 'fail',
    pointsApplied: points,
    completedAt
  }
  db.history.unshift(history)
  const ranking = computeRanking(db)
  save(db)
  return { task: updatedTask, history, ranking }
}

export async function resetTaskStatus(id) {
  const db = load()
  const idx = db.tasks.findIndex(t => t.id === String(id))
  if (idx === -1) throw new Error('Task not found')
  db.tasks[idx] = { ...db.tasks[idx], status: 'pending', updatedAt: nowIso() }
  save(db)
  return db.tasks[idx]
}

export async function resetAllTaskStatuses() {
  const db = load()
  let resetCount = 0
  db.tasks = db.tasks.map(t => {
    if (t.status !== 'pending') { resetCount++; return { ...t, status: 'pending', updatedAt: nowIso() } }
    return t
  })
  save(db)
  return { resetCount }
}

export async function demoSeed() {
  const sample = [
    { title: 'Read 10 pages', successPoints: 10, failPoints: -5, frequency: 'daily' },
    { title: 'Walk 5,000 steps', successPoints: 8, failPoints: -4, frequency: 'daily' },
    { title: 'Declutter desk', successPoints: 15, failPoints: -7, frequency: 'once' },
  ]
  let created = 0
  for (const s of sample) { await createTask(s); created++ }
  return { tasksCreated: created, historyCreated: 0, trashCreated: 0 }
}

// Trash
export async function listTrash(params = {}) {
  const db = load()
  const { data, meta } = paginate(db.trash, params.page || 1, params.pageSize || 20)
  return { items: data, meta }
}

export async function clearTrash() {
  const db = load()
  const deletedCount = db.trash.length
  db.trash = []
  save(db)
  return { deletedCount }
}

export async function deleteTrashItem(id) {
  const db = load()
  const idx = db.trash.findIndex(t => t.id === String(id))
  if (idx !== -1) db.trash.splice(idx, 1)
  save(db)
  return true
}

export async function restoreTrashItem(id) {
  const db = load()
  const idx = db.trash.findIndex(t => t.id === String(id))
  if (idx === -1) throw new Error('Trash item not found')
  const tr = db.trash[idx]
  const now = nowIso()
  const newTask = {
    id: genId(),
    userId: 'local',
    title: tr.title,
    description: tr.description,
    successPoints: tr.successPoints,
    failPoints: tr.failPoints,
    frequency: tr.frequency,
    customDays: tr.customDays || null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    metadata: null
  }
  db.tasks.unshift(newTask)
  db.trash.splice(idx, 1)
  db.etags[newTask.id] = newEtag()
  save(db)
  return newTask
}

// History
export async function getHistory(date, params = {}) {
  if (!date) throw new Error('date is required')
  const db = load()
  const ymd = String(date)
  const recordsForDate = (db.history || []).filter(h => (h.completedAt || '').slice(0,10) === ymd)
  const { data, meta } = paginate(recordsForDate, params.page || 1, params.pageSize || 20)
  return { records: data, meta: { ...meta, date: ymd } }
}

export async function deleteHistory(id) {
  const db = load()
  const idx = db.history.findIndex(h => h.id === String(id))
  if (idx !== -1) db.history.splice(idx, 1)
  const ranking = computeRanking(db)
  save(db)
  return { data: { ok: true }, meta: { ranking } }
}

// Analytics
export async function getAnalyticsMonthly(months = 6) {
  const db = load()
  const labels = []
  const points = []
  const now = new Date()
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const label = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
    labels.push(label)
    const monthPoints = (db.history || []).filter(h => (h.completedAt||'').slice(0,7) === label).reduce((sum,h)=> sum + (h.pointsApplied||0), 0)
    points.push(monthPoints)
  }
  return { labels, points }
}

export async function getAnalyticsSummary(month /* YYYY-MM */) {
  const db = load()
  const monthStr = String(month)
  const records = (db.history || []).filter(h => (h.completedAt||'').slice(0,7) === monthStr)
  const totalPoints = records.reduce((sum,h)=> sum + (h.pointsApplied||0), 0)
  const completedCount = records.length
  const successes = records.filter(r=> r.status === 'success').length
  const successRatePct = completedCount ? Math.round((successes / completedCount) * 100) : 0
  return { month: monthStr, totalPoints, completedCount, successRatePct }
}

// Ranking
export async function getRankingCurrent() {
  const db = load()
  return computeRanking(db)
}

export async function getRankingDefinitions() {
  const db = load()
  return db.ranks
}

// Import/Export
export async function exportTodo() {
  const db = load()
  const version = '1.1'
  const exportDate = nowIso()
  const tasksByDate = {}
  ;(db.tasks || []).forEach(t => {
    const key = (t.createdAt||'').slice(0,10)
    if (!tasksByDate[key]) tasksByDate[key] = []
    tasksByDate[key].push(t)
  })
  const historyByDate = {}
  ;(db.history || []).forEach(h => {
    const key = (h.completedAt||'').slice(0,10)
    if (!historyByDate[key]) historyByDate[key] = []
    historyByDate[key].push(h)
  })
  const exportedDates = Array.from(new Set([
    ...Object.keys(tasksByDate),
    ...Object.keys(historyByDate),
  ])).sort()
  const metadata = {
    totalTasks: (db.tasks || []).length,
    totalHistoryRecords: (db.history || []).length,
    totalTrashItems: (db.trash || []).length,
    exportedDates
  }
  return { version, exportDate, tasks: tasksByDate, history: historyByDate, trash: db.trash || [], metadata }
}

export async function importTodo(payload) {
  const db = load()
  const input = payload && payload.version ? payload : null
  if (!input) throw new Error('Invalid import payload in local mode')
  let importedTasks = 0, importedHistory = 0, importedTrash = 0, skippedDuplicates = 0

  if (input.tasks && typeof input.tasks === 'object') {
    for (const dateKey of Object.keys(input.tasks)) {
      for (const t of input.tasks[dateKey]) {
        if (db.tasks.find(x => x.id === t.id)) { skippedDuplicates++; continue }
        db.tasks.push({ ...t })
        db.etags[t.id] = newEtag()
        importedTasks++
      }
    }
  }
  if (input.history && typeof input.history === 'object') {
    for (const dateKey of Object.keys(input.history)) {
      for (const h of input.history[dateKey]) {
        if (db.history.find(x => x.id === h.id)) { skippedDuplicates++; continue }
        db.history.push({ ...h })
        importedHistory++
      }
    }
  }
  if (Array.isArray(input.trash)) {
    for (const tr of input.trash) {
      if (db.trash.find(x => x.id === tr.id)) { skippedDuplicates++; continue }
      db.trash.push({ ...tr })
      importedTrash++
    }
  }
  save(db)
  return { importedTasks, importedHistory, importedTrash, skippedDuplicates }
}

export default {
  listTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  resetTaskStatus,
  resetAllTaskStatuses,
  demoSeed,
  listTrash,
  clearTrash,
  deleteTrashItem,
  restoreTrashItem,
  getHistory,
  deleteHistory,
  getAnalyticsMonthly,
  getAnalyticsSummary,
  getRankingCurrent,
  getRankingDefinitions,
  exportTodo,
  importTodo,
}

