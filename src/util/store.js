import { validateEmpty } from '@/util/validate'
import website from '@/const/website'

const keyName = website.key + '-'

/*存储Storage*/
export const setStore = (params = {}) => {
  let {
    name,
    content,
    type
  } = params
  name = keyName + name
  let obj = {
    dataType: typeof content,
    content: content,
    type: type,
    datatime: new Date().getTime()
  }
  if (type) {
    /*保存的数据用于浏览器的一次会话（session），当会话结束（通常是窗口关闭），数据被清空*/
    // window.sessionStorage.setItem(name, JSON.stringify(obj))
    window.localStorage.setItem(name, JSON.stringify(obj))
  } else {
    /*保存的数据用于浏览器的一次会话（session），当会话结束（通常是窗口关闭），数据被清空*/
    // window.localStorage.setItem(name, JSON.stringify(obj))
    window.sessionStorage.setItem(name, JSON.stringify(obj))
  }
}

/*获取Storage*/
export const getStore = (params = {}) => {
  let {
    name,
    debug
  } = params
  name = keyName + name
  let obj = {}, content
  obj = window.sessionStorage.getItem(name)
  if (validateEmpty(obj)) {
    obj = window.localStorage.getItem(name)
  }
  if (validateEmpty(obj)) {
    return
  }
  try {
    obj = JSON.parse(obj)
  } catch {
    return obj
  }
  if (debug) {
    return obj
  }
  if (obj.dataType === 'string') {
    content = obj.content
  } else if (obj.dataType === 'number') {
    content = Number(obj.content)
  } else if (obj.dataType === 'boolean') {
    content = eval(obj.content)
  } else if (obj.dataType === 'object') {
    content = obj.content
  }
  return content
}

export const removeStore = (params = {}) => {
  let {
    name,
    type
  } = params
  name = keyName + name
  window.sessionStorage.removeItem(name)
  window.localStorage.removeItem(name)
  // if (type) {
  //   window.sessionStorage.removeItem(name)
  // } else {
  //   window.localStorage.removeItem(name)
  // }
}

