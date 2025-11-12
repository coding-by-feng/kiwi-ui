import { getStore, setStore } from '@/util/store'
import { loginByUsername, logout, refreshToken } from '@/api/login'
import { encryption } from '@/util/util'
import router from '@/router/router'

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
    }) || ''
  },
  actions: {
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
          commit('clearLock')
          resolve()
        }).catch(error => {
          commit('setAccessToken', '')
          commit('setRefreshToken', '')
          commit('setExpiresIn', '')
          commit('setUserName', '')
          commit('clearLock')
          window.location.reload()
        })
      })
    },
    // 登出
    LogOut ({ commit }) {
      return new Promise((resolve, reject) => {
        logout().then(() => {
          commit('setAccessToken', '')
          commit('setRefreshToken', '')
          commit('setExpiresIn', '')
          commit('setUserName', '')
          commit('clearLock')
          setStore({
            name: 'example_stars',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'paraphrase_stars',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'word_stars',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'pronunciation_source',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'bgm',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'review_type',
            content: null,
            type: 'local'
          })
          setStore({
            name: 'spell_type',
            content: null,
            type: 'local'
          })
         setStore({
            name: 'is_play_example',
            content: null,
            type: 'local'
          })
          resolve()
        }).catch(error => {
          reject(error)
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
    }

  }
}
export default user