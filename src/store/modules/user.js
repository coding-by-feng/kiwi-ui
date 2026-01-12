import {getStore, setStore} from '@/util/store'
import {loginByUsername, loginByUsernamePassword, logout, logoutNew, refreshToken, refreshTokenNew} from '@/api/login'
import {encryption} from '@/util/util'

const user = {
  store: {
    userInfo: {},
    permissions: {},
    roles: [],
    menu: getStore({
      name: 'menu'
    }) || [],
    menuAll: [],
    user_name: getStore({
      name: 'user_name'
    }) || '',
    expires_in: getStore({
      name: 'expires_in'
    }) || '',
    access_token: getStore({
      name: 'access_token'
    }) || '',
    refresh_token: getStore({
      name: 'refresh_token'
    }) || '',
    token_issue_at: getStore({
      name: 'token_issue_at'
    }) || ''
  },
  actions: {
    // New login action using /auth/login endpoint
    LoginByUsernamePassword ({ commit }, credentials) {
      return new Promise((resolve, reject) => {
        loginByUsernamePassword(credentials.username, credentials.password).then(response => {
          const body = response.data || {}
          const data = body.data || body
          const accessToken = data.access_token || data.accessToken || data.token
          const refreshTokenValue = data.refresh_token || data.refreshToken
          const expiresIn = data.expires_in || data.expiresIn
          const userInfo = data.userInfo || data.user || {}
          const userName = userInfo.username || userInfo.name || userInfo.email || credentials.username

          commit('setAccessToken', accessToken)
          commit('setRefreshToken', refreshTokenValue)
          commit('setExpiresIn', expiresIn)
          commit('setTokenIssueAt', Date.now())
          commit('setUserName', userName)
          commit('clearLock')
          resolve(data)
        }).catch(error => {
          reject(error)
        })
      })
    },

    // Legacy login action (OAuth2 style)
    LoginByUsername ({ commit }, userInfo) {
      const user = encryption({
        data: userInfo,
        key: 'MyKiwiVocabulary',
        param: ['password']
      })
      return new Promise((resolve, reject) => {
        loginByUsername(user.username, user.password, user.code, user.randomStr).then(response => {
          const data = response.data
          commit('setAccessToken', data.access_token)
          commit('setRefreshToken', data.refresh_token)
          commit('setExpiresIn', data.expires_in)
          commit('setTokenIssueAt', Date.now())
          commit('setUserName', data.user_name)
          commit('clearLock')
          resolve()
        }).catch(error => {
          reject(error)
        })
      })
    },
    // 刷新token
    RefreshToken ({ commit, state }) {
      return new Promise((resolve, reject) => {
        refreshToken().then(response => {
          const data = response.data
          commit('setAccessToken', data.access_token)
          commit('setRefreshToken', data.refresh_token)
          commit('setExpiresIn', data.expires_in)
          commit('setTokenIssueAt', Date.now())
          commit('clearLock')
          resolve()
        }).catch(error => {
          commit('setAccessToken', '')
          commit('setRefreshToken', '')
          commit('setExpiresIn', '')
          commit('setTokenIssueAt', '')
          commit('setUserName', '')
          commit('clearLock')
          // Reject instead of reload to avoid infinite loop on 503/server errors
          // The axios interceptor will handle the redirect to login
          reject(error)
        })
      })
    },
    // 登出
    LogOut ({ commit }) {
      // Helper to clear local state regardless of API result
      const clearLocalState = () => {
        commit('setAccessToken', '')
        commit('setRefreshToken', '')
        commit('setExpiresIn', '')
        commit('setTokenIssueAt', '')
        commit('setUserName', '')
        commit('clearLock')
        setStore({ name: 'example_stars', content: null, type: 'local' })
        setStore({ name: 'paraphrase_stars', content: null, type: 'local' })
        setStore({ name: 'word_stars', content: null, type: 'local' })
        setStore({ name: 'pronunciation_source', content: null, type: 'local' })
        setStore({ name: 'bgm', content: null, type: 'local' })
        setStore({ name: 'review_type', content: null, type: 'local' })
        setStore({ name: 'spell_type', content: null, type: 'local' })
        setStore({ name: 'is_play_example', content: null, type: 'local' })
      }

      return new Promise((resolve) => {
        logout().then(() => {
          clearLocalState()
          resolve()
        }).catch(() => {
          // Even if logout API fails (e.g., 503), still clear local state to allow user to re-login
          console.warn('Logout API failed, clearing local state anyway')
          clearLocalState()
          resolve()
        })
      })
    },
  },

  mutations: {
    setAccessToken: (state, access_token) => {
      state.access_token = access_token
      setStore({
        name: 'access_token',
        content: state.access_token,
        type: 'local'
      })
    },
    setRefreshToken: (state, refresh_token) => {
      state.refresh_token = refresh_token
      setStore({
        name: 'refresh_token',
        content: state.refresh_token,
        type: 'local'
      })
    },
    setExpiresIn: (state, expires_in) => {
      state.expires_in = expires_in
      setStore({
        name: 'expires_in',
        content: state.expires_in,
        type: 'local'
      })
    },
    setUserName: (state, user_name) => {
      state.user_name = user_name
      state.user_name =
        setStore({
          name: 'user_name',
          content: state.user_name,
          type: 'local'
        })
    },
    setTokenIssueAt: (state, token_issue_at) => {
      state.token_issue_at = token_issue_at
      setStore({
        name: 'token_issue_at',
        content: state.token_issue_at,
        type: 'local'
      })
    }

  }
}
export default user