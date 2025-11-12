import {serialize} from '@/util/util'
import {getStore} from '@/util/store'
import NProgress from 'nprogress'
import responseCode from '@/const/responseCode'
import router from '@/router/router'
import messageCenter from '@/util/msg'
import 'nprogress/nprogress.css'
import store from '@/store'
import axios from 'axios'
import {baseUrl, isElectron} from '@/config/env'
import kiwiConsts from '@/const/kiwiConsts'

// Configure axios defaults
axios.defaults.timeout = 100000
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status <= 500
}

// Only set withCredentials if not in Electron (to avoid CORS issues)
if (!isElectron) {
  axios.defaults.withCredentials = true
}

// If running via Vue dev-server (localhost:8080), force no baseURL so proxy handles API
try {
  if (typeof window !== 'undefined' && /localhost:8080$/.test(window.location.host)) {
    axios.defaults.baseURL = ''
    console.log('Detected dev-server origin; forcing relative API paths (proxy).')
  }
} catch (e) {
  // no-op
}

// Set base URL if provided (e.g., packaged Electron or explicit KIWI_SERVER_URL)
if (baseUrl) {
  axios.defaults.baseURL = baseUrl
  console.log('Axios baseURL:', baseUrl, 'isElectron:', isElectron)
} else {
  console.log('Axios baseURL not set; using relative paths (dev proxy expected).')
}

NProgress.configure({
  showSpinner: false
})

axios.interceptors.request.use(config => {
  NProgress.start()

  let isToken = !!(config.headers || {}).isToken
  let token = getStore({ name: 'access_token' })

  if (token && isToken) {
    config.headers['Authorization'] = 'Bearer ' + token
  }

  // Force proxy usage on dev-server by removing any baseURL
  try {
    if (typeof window !== 'undefined' && /localhost:8080$/.test(window.location.host)) {
      config.baseURL = ''
    }
  } catch (e) { /* ignore */ }

  // Log the full URL being requested (helpful in Electron dev)
  try {
    const fullUrl = (config.baseURL || axios.defaults.baseURL || '') + (config.url || '')
    console.log('Making request to:', fullUrl)
  } catch (e) {
    // ignore
  }

  // headers中配置serialize为true开启序列化
  if (config.method === 'post' && config.headers && config.headers.serialize) {
    config.data = serialize(config.data)
    delete config.headers.serialize
  }

  return config
})

axios.interceptors.response.use(res => {
  NProgress.done()
  const status = String(res.status) || '200'
  // Prefer backend-provided message if available (e.g., "ETag mismatch"), then fallback to mapped/default
  const serverMsg = res && res.data && (res.data.msg || res.data.message)
  const message = serverMsg || responseCode[status] || responseCode['default']
  let refreshToken = getStore({ name: 'refresh_token' })

  if (String(responseCode.UNAUTHORIZED) === status) {
    if (refreshToken) {
      store.dispatch('RefreshToken').then(() => {
        messageCenter.success({
          message: responseCode['autoLoginSuccess'],
          showClose: true
        })
      })
    } else {
      store.dispatch('LogOut').then(() => {
        if (isElectron) {
          // In Electron, just navigate to login page
          router.push(`${kiwiConsts.ROUTES.DETAIL}?active=login`)
        } else {
          window.location.href = `/#${kiwiConsts.ROUTES.DETAIL}?active=login`
        }
      })
    }
  }

  if (status.indexOf('2') !== 0 || (res.data && res.data.code === responseCode.ERROR)) {
    messageCenter.error({
      message,
      showClose: true
    })
    return Promise.reject(new Error(message))
  }

  return res
}, error => {
  NProgress.done()

  // Handle network errors in Electron
  if (isElectron && (error && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND'))) {
    messageCenter.error({
      message: `Unable to connect to server at ${baseUrl}. Please check if your server is running and accessible.`,
      duration: 5000,
      showClose: true
    })
    console.error('Connection error:', error && error.message, 'Server URL:', baseUrl)
  } else {
    messageCenter.error({
      message: responseCode['default'],
      showClose: true
    })
  }

  return Promise.reject(error)
})

export default axios