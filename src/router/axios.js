import { serialize } from '@/util/util'
import { getStore } from '@/util/store'
import NProgress from 'nprogress'
import responseCode from '@/const/responseCode'
import router from '@/router/router'
import { Message } from 'element-ui'
import 'nprogress/nprogress.css'
import store from '@/store'
import axios from 'axios'

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
  const isToken = (config.headers || {}).isToken === false
  // let token = store.getters.access_token;
  let token = getStore({
    name: 'access_token'
  })
  if (token && !isToken) {
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
  console.log(JSON.stringify(res))
  const status = String(res.status) || '200'
  const message = res.data.msg || responseCode[status] || responseCode['default']
  if (status === 401) {
    store.dispatch('FedLogOut').then(() => {
      router.push({ path: '/login' })
    })
  }

  if (status.indexOf('2') !== 0 || res.data.code === responseCode.ERROR) {
    Message({
      message: message,
      type: 'error'
    })
    return Promise.reject(new Error(message))
  }

  return res
}, error => {
  NProgress.done()
  return Promise.reject(new Error(error))
})

export default axios
