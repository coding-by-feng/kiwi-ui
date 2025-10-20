// filepath: /src/api/todo.js
import request from '@/router/axios'

// Helpers
function ensureSuccess(res) {
  const r = res && res.data ? res.data : null
  if (!r || typeof r.code === 'undefined') {
    throw new Error('Invalid API response')
  }
  if (r.code !== 1) {
    const msg = r.msg || 'Request failed'
    const err = new Error(msg)
    err.response = res
    throw err
  }
  return r.data
}

function headerETag(res) {
  try { return res.headers && (res.headers['etag'] || res.headers['ETag'] || res.headers['Etag']) } catch (_) { return undefined }
}

function withAuthHeaders(extra = {}) {
  return { isToken: true, ...(extra || {}) }
}

function genIdempotencyKey() {
  // Simple UUIDv4 generator
  const rnd = (len = 8) => Math.random().toString(16).slice(2, 2 + len)
  return `${rnd(8)}-${rnd(4)}-${rnd(4)}-${rnd(4)}-${rnd(12)}`
}

const BASE = '/tools/todo'

// Tasks
export async function listTasks(params = {}) {
  const res = await request({ url: `${BASE}/tasks`, method: 'get', headers: withAuthHeaders(), params })
  const data = ensureSuccess(res)
  const inner = data || {}
  return { tasks: inner.data || [], meta: inner.meta || { page: 1, pageSize: (params.pageSize || 20), total: (inner.data || []).length } }
}

export async function createTask(body, { idempotencyKey } = {}) {
  const headers = withAuthHeaders(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {})
  const res = await request({ url: `${BASE}/tasks`, method: 'post', headers, data: body })
  const data = ensureSuccess(res)
  return { task: (data && data.data) || null, etag: headerETag(res) }
}

export async function getTask(id) {
  const res = await request({ url: `${BASE}/tasks/${id}`, method: 'get', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return { task: (data && data.data) || null, etag: headerETag(res) }
}

export async function updateTask(id, patch, { ifMatch } = {}) {
  const headers = withAuthHeaders(ifMatch ? { 'If-Match': ifMatch } : {})
  const res = await request({ url: `${BASE}/tasks/${id}`, method: 'patch', headers, data: patch })
  const data = ensureSuccess(res)
  return { task: (data && data.data) || null, etag: headerETag(res) }
}

export async function deleteTask(id) {
  const res = await request({ url: `${BASE}/tasks/${id}`, method: 'delete', headers: withAuthHeaders() })
  ensureSuccess(res)
  return true
}

export async function completeTask(id, status, { idempotencyKey } = {}) {
  const headers = withAuthHeaders({ 'Idempotency-Key': idempotencyKey || genIdempotencyKey() })
  const res = await request({ url: `${BASE}/tasks/${id}/complete`, method: 'post', headers, data: { status } })
  const data = ensureSuccess(res)
  return { task: data.task, history: data.history, ranking: data.ranking }
}

export async function resetTaskStatus(id) {
  const res = await request({ url: `${BASE}/tasks/${id}/reset-status`, method: 'post', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data.data
}

export async function resetAllTaskStatuses() {
  const res = await request({ url: `${BASE}/tasks/reset-statuses`, method: 'post', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

export async function demoSeed() {
  const res = await request({ url: `${BASE}/tasks/demo`, method: 'post', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

// Trash
export async function listTrash(params = {}) {
  const res = await request({ url: `${BASE}/trash`, method: 'get', headers: withAuthHeaders(), params })
  const data = ensureSuccess(res)
  const inner = data || {}
  return { items: inner.data || [], meta: inner.meta || { page: 1, pageSize: (params.pageSize || 20), total: (inner.data || []).length } }
}

export async function clearTrash() {
  const res = await request({ url: `${BASE}/trash`, method: 'delete', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

export async function deleteTrashItem(id) {
  const res = await request({ url: `${BASE}/trash/${id}`, method: 'delete', headers: withAuthHeaders() })
  ensureSuccess(res)
  return true
}

export async function restoreTrashItem(id) {
  const res = await request({ url: `${BASE}/trash/${id}/restore`, method: 'post', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data.data
}

// History
export async function getHistory(date, params = {}) {
  const res = await request({ url: `${BASE}/history`, method: 'get', headers: withAuthHeaders(), params: { date, ...params } })
  const data = ensureSuccess(res)
  const inner = data || {}
  return { records: inner.data || [], meta: inner.meta || {} }
}

export async function deleteHistory(id) {
  const res = await request({ url: `${BASE}/history/${id}`, method: 'delete', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

// Analytics
export async function getAnalyticsMonthly(months = 6) {
  const res = await request({ url: `${BASE}/analytics/monthly`, method: 'get', headers: withAuthHeaders(), params: { months } })
  const data = ensureSuccess(res)
  return data
}

export async function getAnalyticsSummary(month /* YYYY-MM */) {
  const res = await request({ url: `${BASE}/analytics/summary`, method: 'get', headers: withAuthHeaders(), params: { month } })
  const data = ensureSuccess(res)
  return data
}

// Ranking
export async function getRankingCurrent() {
  const res = await request({ url: `${BASE}/ranking/current`, method: 'get', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

export async function getRankingDefinitions() {
  const res = await request({ url: `${BASE}/ranking/ranks`, method: 'get', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

// Import/Export
export async function exportTodo() {
  const res = await request({ url: `${BASE}/export/todo`, method: 'get', headers: withAuthHeaders() })
  const data = ensureSuccess(res)
  return data
}

export async function importTodo(payload) {
  // payload can be a JS object (JSON) or a File/Blob
  if (payload instanceof File || payload instanceof Blob) {
    const form = new FormData()
    form.append('file', payload)
    const res = await request({ url: `${BASE}/import/todo`, method: 'post', headers: withAuthHeaders({}), data: form })
    const data = ensureSuccess(res)
    return data
  } else {
    const res = await request({ url: `${BASE}/import/todo`, method: 'post', headers: withAuthHeaders({ 'Content-Type': 'application/json' }), data: payload })
    const data = ensureSuccess(res)
    return data
  }
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

