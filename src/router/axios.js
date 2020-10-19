import { serialize } from '@/util/util'
import { getStore } from '@/util/store'
import NProgress from 'nprogress'
import responseCode from '@/const/responseCode'
import website from '@/const/website'
import router from '@/router/router'
import { Message } from 'element-ui'
import 'nprogress/nprogress.css'
import store from '@/store'
import axios from 'axios'
import el from 'element-ui/src/locale/lang/el'

axios.defaults.timeout = 100000
axios.defaults.validateStatus = function (status) {
  return status >= 200 && status <= 500
}
axios.defaults.withCredentials = true
NProgress.configure({
  showSpinner: false
})
axios.interceptors.request.use(config => {
  NProgress.start()
  let isToken = !!(config.headers || {}).isToken
  let token = getStore({ name: 'access_token' })
  // let token = store.getters.access_token
  if (token && isToken) {
    config.headers['Authorization'] = 'Bearer ' + token
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
  const message = res.data.msg || responseCode[status] || responseCode['default']
  let refreshToken = getStore({ name: 'refresh_token' })
  if (responseCode.UNAUTHORIZED == status) {
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
        window.location.href = '/#/index/vocabulary/detail?active=login'
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
  Message({
    message: responseCode['default'],
    type: 'error',
    center: true,
    showClose: true
  })
  return Promise.reject(new Error(error))
})

export default axios
