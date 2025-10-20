// filepath: /src/store/modules/todo.js
import Vue from 'vue'
import * as api from '@/api/todo'

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
    const res = await api.listTasks(params)
    commit('SET_TASKS', res)
    return res
  },
  async createTask({ commit }, { body, idempotencyKey }) {
    const { task, etag } = await api.createTask(body, { idempotencyKey })
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async fetchTask({ commit }, id) {
    const { task, etag } = await api.getTask(id)
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async updateTask({ commit, getters }, { id, patch }) {
    const ifMatch = getters.todoTaskEtag(id)
    const { task, etag } = await api.updateTask(id, patch, { ifMatch })
    if (task) {
      commit('UPSERT_TASK', task)
      commit('SET_TASK_ETAG', { id: task.id, etag })
    }
    return { task, etag }
  },
  async deleteTask({ commit }, id) {
    await api.deleteTask(id)
    commit('REMOVE_TASK', id)
    return true
  },
  async completeTask({ commit }, { id, status, idempotencyKey }) {
    const res = await api.completeTask(id, status, { idempotencyKey })
    if (res && res.task) commit('UPSERT_TASK', res.task)
    if (res && res.ranking) commit('SET_RANKING', res.ranking)
    return res
  },
  async resetTaskStatus({ commit }, id) {
    const task = await api.resetTaskStatus(id)
    if (task) commit('UPSERT_TASK', task)
    return task
  },
  async resetAllTaskStatuses({ dispatch }) {
    const res = await api.resetAllTaskStatuses()
    // Refresh first page after reset
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return res
  },
  async demoSeed({ dispatch }) {
    const res = await api.demoSeed()
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return res
  },

  async fetchTrash({ commit }, params = {}) {
    const res = await api.listTrash(params)
    commit('SET_TRASH', res)
    return res
  },
  async clearTrash({ dispatch }) {
    const res = await api.clearTrash()
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    return res
  },
  async deleteTrashItem({ dispatch }, id) {
    await api.deleteTrashItem(id)
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    return true
  },
  async restoreTrashItem({ dispatch }, id) {
    const task = await api.restoreTrashItem(id)
    await dispatch('fetchTrash', { page: 1, pageSize: 50 })
    await dispatch('fetchTasks', { page: 1, pageSize: 100 })
    return task
  },

  async fetchHistory({ commit }, { date, page = 1, pageSize = 100 }) {
    const res = await api.getHistory(date, { page, pageSize })
    commit('SET_HISTORY', { records: res.records, meta: res.meta })
    return res
  },
  async deleteHistory({ dispatch, commit, state }, id) {
    const res = await api.deleteHistory(id)
    if (res && res.meta && res.meta.ranking) commit('SET_RANKING', res.meta.ranking)
    // refresh history list for currently loaded date if exists
    const date = state.historyMeta && state.historyMeta.date
    if (date) await dispatch('fetchHistory', { date, page: state.historyMeta.page || 1, pageSize: state.historyMeta.pageSize || 100 })
    return true
  },

  async fetchRanking({ commit }) { const r = await api.getRankingCurrent(); commit('SET_RANKING', r); return r },
  async fetchRanks({ commit }) { const r = await api.getRankingDefinitions(); commit('SET_RANKS', r); return r },

  async fetchAnalyticsMonthly({ commit }, months = 6) { const r = await api.getAnalyticsMonthly(months); commit('SET_ANALYTICS_MONTHLY', r); return r },
  async fetchAnalyticsSummary(_, month) { return api.getAnalyticsSummary(month) },

  async exportTodo() { return api.exportTodo() },
  async importTodo({ dispatch }, payload) { const r = await api.importTodo(payload); await dispatch('fetchTasks', { page: 1, pageSize: 100 }); await dispatch('fetchTrash', { page: 1, pageSize: 50 }); return r },
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
}

