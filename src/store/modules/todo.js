// filepath: /src/store/modules/todo.js
import Vue from 'vue'
import * as serverApi from '@/api/todo'
import * as localApi from '@/api/todo.local'
// Use centralized auth helper
import {isLoggedIn} from '@/util/auth'

function getApi() { return isLoggedIn() ? serverApi : localApi }

// Helpers to normalize server (axios) vs local API responses
function isAxiosResponse(obj) { return !!(obj && obj.config && Object.prototype.hasOwnProperty.call(obj, 'status') && obj.headers) }
function ensureServerSuccess(res) {
  const r = res && res.data ? res.data : null
  if (!r || typeof r.code === 'undefined') throw new Error('Invalid API response')
  if (r.code !== 1) throw new Error(r.msg || 'Request failed')
  return r.data
}
function headerETag(res) {
  try { const h = res.headers || {}; return h.etag || h.ETag || h.Etag } catch (_) { return undefined }
}

const state = {
  tasks: [],
  tasksMeta: { page: 1, pageSize: 20, total: 0 },
  taskEtags: {}, // { [taskId]: etag }

  history: [],
  historyMeta: {},

  trash: [],
  trashMeta: { page: 1, pageSize: 20, total: 0 },

  ranking: null, // RankingDTO
  ranks: [],

  analyticsMonthly: { labels: [], points: [] },
}

const getters = {
  todoTasks: s => s.tasks,
  todoTasksMeta: s => s.tasksMeta,
  todoTaskEtag: s => id => s.taskEtags[id],
  todoHistory: s => s.history,
  todoHistoryMeta: s => s.historyMeta,
  todoTrash: s => s.trash,
  todoTrashMeta: s => s.trashMeta,
  todoRanking: s => s.ranking,
  todoRanks: s => s.ranks,
  todoAnalyticsMonthly: s => s.analyticsMonthly,
}

const mutations = {
  SET_TASKS(state, { tasks, meta }) { state.tasks = tasks || []; state.tasksMeta = meta || { page: 1, pageSize: 20, total: 0 } },
  UPSERT_TASK(state, task) {
    if (!task || !task.id) return
    const idx = state.tasks.findIndex(t => t.id === task.id)
    if (idx === -1) state.tasks.unshift(task)
    else Vue.set(state.tasks, idx, task)
  },
  REMOVE_TASK(state, id) { state.tasks = state.tasks.filter(t => t.id !== id) },
  SET_TASK_ETAG(state, { id, etag }) { if (id) Vue.set(state.taskEtags, id, etag) },

  SET_HISTORY(state, { records, meta }) { state.history = records || []; state.historyMeta = meta || {} },

  SET_TRASH(state, { items, meta }) { state.trash = items || []; state.trashMeta = meta || { page: 1, pageSize: 20, total: 0 } },

  SET_RANKING(state, ranking) { state.ranking = ranking || null },
  SET_RANKS(state, ranks) { state.ranks = Array.isArray(ranks) ? ranks : [] },

  SET_ANALYTICS_MONTHLY(state, payload) { state.analyticsMonthly = payload || { labels: [], points: [] } },
}

const actions = {
  async fetchTasks({ commit }, params = {}) {
    const api = getApi()
    const raw = await api.listTasks(params)
    const res = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw) || {}; return { tasks: inner.data || [], meta: inner.meta || { page: 1, pageSize: (params.pageSize || 20), total: (inner.data || []).length } } })()
      : raw
    commit('SET_TASKS', res)
    return res
  },
  async createTask({ commit }, { body, idempotencyKey }) {
    const api = getApi()
    const raw = await api.createTask(body, { idempotencyKey })
    const { task, etag } = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw); return { task: (inner && inner.data) || null, etag: headerETag(raw) } })()
      : raw
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async fetchTask({ commit }, id) {
    const api = getApi()
    const raw = await api.getTask(id)
    const { task, etag } = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw); return { task: (inner && inner.data) || null, etag: headerETag(raw) } })()
      : raw
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async updateTask({ commit, getters }, { id, patch }) {
    const api = getApi()
    const ifMatch = getters.todoTaskEtag(id)
    const raw = await api.updateTask(id, patch, { ifMatch })
    const { task, etag } = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw); return { task: (inner && inner.data) || null, etag: headerETag(raw) } })()
      : raw
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async deleteTask({ commit }, id) {
    const api = getApi()
    const raw = await api.deleteTask(id)
    if (isAxiosResponse(raw)) { ensureServerSuccess(raw) }
    commit('REMOVE_TASK', id)
    return true
  },
  async completeTask({ commit }, { id, status, idempotencyKey }) {
    const api = getApi()
    const raw = await api.completeTask(id, status, { idempotencyKey })
    const res = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    if (res && res.task) commit('UPSERT_TASK', res.task)
    if (res && res.ranking) commit('SET_RANKING', res.ranking)
    return res
  },
  async resetTaskStatus({ commit }, id) {
    const api = getApi()
    const raw = await api.resetTaskStatus(id)
    const task = isAxiosResponse(raw) ? ensureServerSuccess(raw) && (ensureServerSuccess(raw).data || ensureServerSuccess(raw)) : raw
    // normalize: local returns task object; server likely returns { data: task }
    const normalizedTask = task && task.id ? task : (task && task.data ? task.data : task)
    if (normalizedTask) commit('UPSERT_TASK', normalizedTask)
    return normalizedTask
  },
  async resetAllTaskStatuses({ dispatch }) {
    const api = getApi()
    const raw = await api.resetAllTaskStatuses()
    const res = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    // Refresh first page after reset
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return res
  },
  async demoSeed({ dispatch }) {
    const api = getApi()
    const raw = await api.demoSeed()
    const res = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return res
  },

  async fetchTrash({ commit }, params = {}) {
    const api = getApi()
    const raw = await api.listTrash(params)
    const res = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw) || {}; return { items: inner.data || [], meta: inner.meta || { page: 1, pageSize: (params.pageSize || 20), total: (inner.data || []).length } } })()
      : raw
    commit('SET_TRASH', res)
    return res
  },
  async clearTrash({ dispatch }) {
    const api = getApi()
    const raw = await api.clearTrash()
    const res = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    return res
  },
  async deleteTrashItem({ dispatch }, id) {
    const api = getApi()
    const raw = await api.deleteTrashItem(id)
    if (isAxiosResponse(raw)) { ensureServerSuccess(raw) }
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    return true
  },
  async restoreTrashItem({ dispatch }, id) {
    const api = getApi()
    const raw = await api.restoreTrashItem(id)
    const task = isAxiosResponse(raw) ? ensureServerSuccess(raw) && (ensureServerSuccess(raw).data || ensureServerSuccess(raw)) : raw
    const normalizedTask = task && task.id ? task : (task && task.data ? task.data : task)
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return normalizedTask
  },

  async fetchHistory({ commit }, { date, page = 1, pageSize = 100 }) {
    const api = getApi()
    const raw = await api.getHistory(date, { page, pageSize })
    const res = isAxiosResponse(raw)
      ? (() => { const inner = ensureServerSuccess(raw) || {}; return { records: inner.data || [], meta: inner.meta || {} } })()
      : raw
    commit('SET_HISTORY', { records: res.records, meta: res.meta })
    return res
  },
  async deleteHistory({ dispatch, commit, state }, id) {
    const api = getApi()
    const raw = await api.deleteHistory(id)
    const res = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    // normalize ranking possibly nested under meta.ranking.data
    if (res && res.meta && res.meta.ranking) {
      const rk = res.meta.ranking
      const normalizedRank = rk && rk.data ? rk.data : rk
      commit('SET_RANKING', normalizedRank)
    }
    // refresh history list for currently loaded date if exists
    const date = state.historyMeta && state.historyMeta.date
    if (date) await dispatch('fetchHistory', { date, page: state.historyMeta.page || 1, pageSize: state.historyMeta.pageSize || 100 })
    return true
  },

  async fetchRanking({ commit }) {
    const api = getApi()
    const raw = await api.getRankingCurrent()
    const r = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    const normalized = r && r.data ? r.data : r
    commit('SET_RANKING', normalized)
    return normalized
  },
  async fetchRanks({ commit }) {
    const api = getApi()
    const raw = await api.getRankingDefinitions()
    const r = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    const normalized = Array.isArray(r) ? r : (Array.isArray(r && r.data) ? r.data : r)
    commit('SET_RANKS', normalized)
    return normalized
  },

  async fetchAnalyticsMonthly({ commit }, months = 6) {
    const api = getApi()
    const raw = await api.getAnalyticsMonthly(months)
    const r = isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
    commit('SET_ANALYTICS_MONTHLY', r)
    return r
  },
  async fetchAnalyticsSummary(_, month) {
    const api = getApi()
    const raw = await api.getAnalyticsSummary(month)
    return isAxiosResponse(raw) ? ensureServerSuccess(raw) : raw
  },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}
