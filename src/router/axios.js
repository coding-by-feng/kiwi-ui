import {serialize} from '@/util/util'
import {getStore} from '@/util/store'
import NProgress from 'nprogress'
import responseCode from '@/const/responseCode'
import router from '@/router/router'
import {Message} from 'element-ui'
import 'nprogress/nprogress.css'
import store from '@/store'
import axios from 'axios'
import {baseUrl, isElectron} from '@/config/env'

// Configure axios defaults
axios.defaults.timeout = 100000
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status <= 500
}

// Only set withCredentials if not in Electron (to avoid CORS issues)
if (!isElectron) {
  axios.defaults.withCredentials = true
}

// Set base URL for Electron to your local server
if (isElectron && baseUrl) {
  axios.defaults.baseURL = baseUrl
  console.log('Axios configured for Electron with baseURL:', baseUrl)
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

  // Add CORS headers for Electron
  if (isElectron) {
    // Only set Content-Type if not sending FormData; let browser set proper boundary for multipart
    const isFormData = (typeof FormData !== 'undefined') && (config.data instanceof FormData)
    if (!isFormData && !config.headers['Content-Type']) {
      config.headers['Content-Type'] = 'application/json'
    }
    config.headers['Access-Control-Allow-Origin'] = '*'
    config.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    config.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization'

    // Log the full URL being requested
    const fullUrl = config.baseURL ? config.baseURL + config.url : config.url
    console.log('Making request to:', fullUrl)
  }

  // headers中配置serialize为true开启序列化
  if (config.methods === 'post' && config.headers.serialize) {
    config.data = serialize(config.data)
    delete config.data.serialize
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
        Message({
          message: responseCode['autoLoginSuccess'],
          type: 'success',
          center: true,
          showClose: true
        })
      })
    } else {
      store.dispatch('LogOut').then(() => {
        if (isElectron) {
          // In Electron, just navigate to login page
          router.push('/index/tools/detail?active=login')
        } else {
          window.location.href = '/#/index/tools/detail?active=login'
        }
      })
    }
  }

  if (status.indexOf('2') !== 0 || res.data.code === responseCode.ERROR) {
    Message({
      message: message,
      type: 'error',
      center: true,
      showClose: true
    })
    return Promise.reject(new Error(message))
  }

  return res
}, error => {
  NProgress.done()

  // Handle network errors in Electron
  if (isElectron && (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND')) {
    Message({
      message: `Unable to connect to server at ${baseUrl}. Please check if your server is running and accessible.`,
      type: 'error',
      center: true,
      showClose: true,
      duration: 5000
    })
    console.error('Connection error:', error.message, 'Server URL:', baseUrl)
  } else {
    Message({
      message: responseCode['default'],
      type: 'error',
      center: true,
      showClose: true
    })
  }

  return Promise.reject(new Error(error))
})

export default axios