// filepath: /src/store/modules/focus.js
import Vue from 'vue'
import { isLoggedIn } from '@/util/auth'

// Points calculation constants
const POINTS_PER_30_MIN = 100
const PENALTY_POINTS = 100

// API helper - will be implemented when backend is ready
// For now, use local storage as fallback
function getApi() {
  // When server API is available, return it here
  // return isLoggedIn() ? serverApi : localApi
  return localApi
}

// Local storage based API for offline/development
const localApi = {
  STORAGE_KEY: 'kiwi_focus_sessions',
  STATS_KEY: 'kiwi_focus_stats',
  FOREST_KEY: 'kiwi_focus_forest',

  _getStorage() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []
    } catch (_) {
      return []
    }
  },

  _setStorage(data) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data))
  },

  _getStats() {
    try {
      return JSON.parse(localStorage.getItem(this.STATS_KEY)) || {
        todayTrees: 0,
        todayMinutes: 0,
        currentStreak: 0,
        lastSessionDate: null,
        totalTrees: 0,
        totalMinutes: 0,
        totalPoints: 0,
        plantedTrees: []
      }
    } catch (_) {
      return {
        todayTrees: 0,
        todayMinutes: 0,
        currentStreak: 0,
        lastSessionDate: null,
        totalTrees: 0,
        totalMinutes: 0,
        totalPoints: 0,
        plantedTrees: []
      }
    }
  },

  _setStats(stats) {
    localStorage.setItem(this.STATS_KEY, JSON.stringify(stats))
  },

  _getTodayKey() {
    return new Date().toISOString().split('T')[0]
  },

  async getStats() {
    const stats = this._getStats()
    const today = this._getTodayKey()

    // Reset daily stats if it's a new day
    if (stats.lastSessionDate !== today) {
      // Check if streak should continue or reset
      const lastDate = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null
      const todayDate = new Date(today)

      if (lastDate) {
        const dayDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
        if (dayDiff > 1) {
          // Streak broken
          stats.currentStreak = 0
        }
      }

      stats.todayTrees = 0
      stats.todayMinutes = 0
    }

    return stats
  },

  async createSession({ duration, treeType, potentialPoints }) {
    const sessions = this._getStorage()
    const session = {
      id: Date.now().toString(),
      duration,
      treeType: treeType || 'oak',
      potentialPoints: potentialPoints || Math.round((duration / 30) * POINTS_PER_30_MIN),
      startTime: new Date().toISOString(),
      status: 'active',
      completedAt: null,
      points: 0
    }
    sessions.push(session)
    this._setStorage(sessions)
    return { session }
  },

  async completeSession({ treeType, duration, points }) {
    const sessions = this._getStorage()
    const session = sessions.find(s => s.status === 'active')

    if (session) {
      session.status = 'completed'
      session.completedAt = new Date().toISOString()
      session.treeType = treeType || session.treeType
      session.duration = duration || session.duration
      session.points = points || Math.round((session.duration / 30) * POINTS_PER_30_MIN)
      this._setStorage(sessions)

      // Update stats
      const stats = this._getStats()
      const today = this._getTodayKey()

      // Reset daily stats if new day
      if (stats.lastSessionDate !== today) {
        const lastDate = stats.lastSessionDate ? new Date(stats.lastSessionDate) : null
        const todayDate = new Date(today)

        if (lastDate) {
          const dayDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24))
          if (dayDiff > 1) {
            stats.currentStreak = 0
          }
        }

        stats.todayTrees = 0
        stats.todayMinutes = 0
      }

      // Increment streak if this is first session of the day
      if (stats.todayTrees === 0) {
        stats.currentStreak++
      }

      stats.todayTrees++
      stats.todayMinutes += session.duration
      stats.totalTrees++
      stats.totalMinutes += session.duration
      stats.totalPoints = (stats.totalPoints || 0) + session.points
      stats.lastSessionDate = today

      // Add planted tree record
      if (!stats.plantedTrees) stats.plantedTrees = []
      stats.plantedTrees.push({
        type: session.treeType,
        plantedAt: session.completedAt,
        duration: session.duration,
        points: session.points
      })

      this._setStats(stats)

      return { session, stats }
    }

    return { session: null, stats: this._getStats() }
  },

  async cancelSession(sessionId) {
    const sessions = this._getStorage()
    const session = sessions.find(s => s.id === sessionId || s.status === 'active')

    if (session) {
      session.status = 'cancelled'
      session.cancelledAt = new Date().toISOString()
      this._setStorage(sessions)
    }

    return { session }
  },

  async failSession({ reason, penalty }) {
    const sessions = this._getStorage()
    const session = sessions.find(s => s.status === 'active')

    if (session) {
      session.status = 'failed'
      session.failedAt = new Date().toISOString()
      session.failReason = reason
      session.penalty = penalty || PENALTY_POINTS
      this._setStorage(sessions)

      // Deduct penalty points from stats
      const stats = this._getStats()
      stats.totalPoints = Math.max(0, (stats.totalPoints || 0) - session.penalty)
      this._setStats(stats)

      return { session, stats }
    }

    return { session: null, stats: this._getStats() }
  },

  async getSessions(params = {}) {
    const sessions = this._getStorage()
    const { page = 1, pageSize = 20, status } = params

    let filtered = sessions
    if (status) {
      filtered = sessions.filter(s => s.status === status)
    }

    // Sort by start time descending
    filtered.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))

    // Paginate
    const start = (page - 1) * pageSize
    const end = start + pageSize

    return {
      sessions: filtered.slice(start, end),
      meta: {
        page,
        pageSize,
        total: filtered.length
      }
    }
  }
}

// Alert configuration storage
const ALERT_CONFIG_KEY = 'kiwi_focus_alert_config'
const DEFAULT_ALERT_CONFIG = {
  quarterAlert: true,
  halfAlert: true,
  endAlert: true,
  endAlertRepeatCount: 5
}

function loadAlertConfig() {
  try {
    const stored = JSON.parse(localStorage.getItem(ALERT_CONFIG_KEY))
    return { ...DEFAULT_ALERT_CONFIG, ...stored }
  } catch (_) {
    return { ...DEFAULT_ALERT_CONFIG }
  }
}

const state = {
  stats: {
    todayTrees: 0,
    todayMinutes: 0,
    currentStreak: 0,
    totalTrees: 0,
    totalMinutes: 0,
    totalPoints: 0,
    plantedTrees: []
  },
  activeSession: null,
  sessions: [],
  sessionsMeta: { page: 1, pageSize: 20, total: 0 },
  // Global timer state for floating icon
  timerState: {
    isRunning: false,
    isPaused: false,
    remainingSeconds: 0,
    totalSeconds: 0,
    treeType: 'oak',
    treeColor: '#4CAF50',
    treeStage: 'seed'
  },
  // Alert configuration
  alertConfig: loadAlertConfig()
}

const getters = {
  focusStats: s => s.stats,
  activeSession: s => s.activeSession,
  focusSessions: s => s.sessions,
  focusSessionsMeta: s => s.sessionsMeta,
  totalPoints: s => s.stats.totalPoints || 0,
  plantedTrees: s => s.stats.plantedTrees || [],
  timerState: s => s.timerState,
  alertConfig: s => s.alertConfig
}

const mutations = {
  SET_STATS(state, stats) {
    state.stats = stats || {
      todayTrees: 0,
      todayMinutes: 0,
      currentStreak: 0,
      totalTrees: 0,
      totalMinutes: 0,
      totalPoints: 0,
      plantedTrees: []
    }
  },
  SET_ACTIVE_SESSION(state, session) {
    state.activeSession = session
  },
  SET_SESSIONS(state, { sessions, meta }) {
    state.sessions = sessions || []
    state.sessionsMeta = meta || { page: 1, pageSize: 20, total: 0 }
  },
  ADD_SESSION(state, session) {
    if (session) {
      state.sessions.unshift(session)
    }
  },
  UPDATE_POINTS(state, points) {
    state.stats.totalPoints = points
  },
  ADD_PLANTED_TREE(state, tree) {
    if (!state.stats.plantedTrees) state.stats.plantedTrees = []
    state.stats.plantedTrees.push(tree)
  },
  SET_TIMER_STATE(state, timerState) {
    state.timerState = { ...state.timerState, ...timerState }
  },
  SET_ALERT_CONFIG(state, config) {
    state.alertConfig = { ...state.alertConfig, ...config }
    localStorage.setItem(ALERT_CONFIG_KEY, JSON.stringify(state.alertConfig))
  }
}

const actions = {
  async fetchFocusStats({ commit }) {
    const api = getApi()
    const stats = await api.getStats()
    commit('SET_STATS', stats)
    return stats
  },

  async createFocusSession({ commit }, { duration, treeType, potentialPoints }) {
    const api = getApi()
    const { session } = await api.createSession({ duration, treeType, potentialPoints })
    commit('SET_ACTIVE_SESSION', session)
    return { session }
  },

  async completeFocusSession({ commit, state }, { treeType, duration, points }) {
    const api = getApi()
    const { session, stats } = await api.completeSession({ treeType, duration, points })

    commit('SET_ACTIVE_SESSION', null)
    commit('SET_STATS', stats)

    if (session) {
      commit('ADD_SESSION', session)
    }

    return { session, stats }
  },

  async cancelFocusSession({ commit, state }) {
    const api = getApi()
    const sessionId = state.activeSession?.id
    const { session } = await api.cancelSession(sessionId)
    commit('SET_ACTIVE_SESSION', null)
    return { session }
  },

  async failFocusSession({ commit, state }, { reason, penalty }) {
    const api = getApi()
    const { session, stats } = await api.failSession({ reason, penalty })
    commit('SET_ACTIVE_SESSION', null)
    commit('SET_STATS', stats)
    return { session, stats }
  },

  async fetchFocusSessions({ commit }, params = {}) {
    const api = getApi()
    const { sessions, meta } = await api.getSessions(params)
    commit('SET_SESSIONS', { sessions, meta })
    return { sessions, meta }
  },

  updateTimerState({ commit }, timerState) {
    commit('SET_TIMER_STATE', timerState)
  },

  updateAlertConfig({ commit }, config) {
    commit('SET_ALERT_CONFIG', config)
  }
}

export default {
  namespaced: true,
  state,
  getters,
  mutations,
  actions
}
