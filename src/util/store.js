import {validateEmpty} from '@/util/validate'
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

  try {
    // Always try to save to localStorage first (more persistent)
    window.localStorage.setItem(name, JSON.stringify(obj))

    // Also save to sessionStorage as backup
    if (!type) {
      window.sessionStorage.setItem(name, JSON.stringify(obj))
    }

    console.log(`Stored ${name} successfully`)
  } catch (error) {
    console.error('Error storing data:', error)
    // Fallback to sessionStorage if localStorage fails
    try {
      window.sessionStorage.setItem(name, JSON.stringify(obj))
    } catch (sessionError) {
      console.error('Error storing to sessionStorage:', sessionError)
    }
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

  // Try localStorage first (more persistent)
  obj = window.localStorage.getItem(name)

  // If not found in localStorage, try sessionStorage
  if (validateEmpty(obj)) {
    obj = window.sessionStorage.getItem(name)
  }

  if (validateEmpty(obj)) {
    return
  }

  try {
    obj = JSON.parse(obj)
  } catch (error) {
    console.error('Error parsing stored data:', error)
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

  // Remove from both storages to ensure cleanup
  window.sessionStorage.removeItem(name)
  window.localStorage.removeItem(name)
}