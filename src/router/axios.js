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
  // New: check token expiry (if expires_in & token_issue_at exist)
  try {
    const expiresIn = parseInt(getStore({ name: 'expires_in' }) || '0', 10)
    const tokenIssueAt = parseInt(getStore({ name: 'token_issue_at' }) || '0', 10)
    const now = Date.now()
    if (expiresIn > 0 && tokenIssueAt > 0) {
      // Consider token expired slightly earlier (5s safety window)
      const safetyWindowMs = 5000
      const expiryMs = tokenIssueAt + (expiresIn * 1000) - safetyWindowMs
      if (now >= expiryMs) {
        console.warn('Access token expired (local check); forcing logout redirect.')
        store.dispatch('LogOut').finally(() => {
          if (isElectron) {
            router.push(`${kiwiConsts.ROUTES.DETAIL}?active=login`)
          } else {
            window.location.href = `/#${kiwiConsts.ROUTES.DETAIL}?active=login`
          }
        })
        return Promise.reject(new Error('Token expired'))
      }
    }
  } catch (e) { /* ignore expiry check errors */ }

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

  // New: handle payload-level auth error codes when HTTP status isn't 401
  try {
    const payloadCode = (res.data && (res.data.errorCode || res.data.code || res.data.error)) || ''
    const normalizedPayloadCode = String(payloadCode).toUpperCase()
    const authCodes = ['AUTHENTICATION_ERROR','UNAUTHORIZED','TOKEN_EXPIRED','INVALID_TOKEN']
    if (authCodes.includes(normalizedPayloadCode)) {
      console.warn('Detected auth failure in payload, redirecting to login:', normalizedPayloadCode)
      store.dispatch('LogOut').finally(() => {
        if (isElectron) {
          router.push(`${kiwiConsts.ROUTES.DETAIL}?active=login`)
        } else {
          window.location.href = `/#${kiwiConsts.ROUTES.DETAIL}?active=login`
        }
      })
      return Promise.reject(new Error('Authentication failed'))
    }
  } catch (e) { /* ignore */ }

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
  // New: if error response indicates auth failure, force redirect
  try {
    const resp = error && error.response
    const status = resp && resp.status
    const errPayload = resp && resp.data
    const payloadCode = (errPayload && (errPayload.errorCode || errPayload.code || errPayload.error)) || ''
    const normalizedPayloadCode = String(payloadCode).toUpperCase()
    const authCodes = ['AUTHENTICATION_ERROR','UNAUTHORIZED','TOKEN_EXPIRED','INVALID_TOKEN']
    if (status === responseCode.UNAUTHORIZED || authCodes.includes(normalizedPayloadCode)) {
      console.warn('Authentication error in error handler, redirecting to login.')
      store.dispatch('LogOut').finally(() => {
        if (isElectron) {
          router.push(`${kiwiConsts.ROUTES.DETAIL}?active=login`)
        } else {
          window.location.href = `/#${kiwiConsts.ROUTES.DETAIL}?active=login`
        }
      })
    }
  } catch (e) { /* ignore */ }

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