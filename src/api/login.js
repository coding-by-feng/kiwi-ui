import request from '@/router/axios'

const scope = 'server'

export const loginByUsername = (username, password, code, randomStr) => {
  const grant_type = 'password'

  return request({
    url: '/auth/oauth/token',
    headers: {
      isToken: false,
      'Authorization': 'Basic dm9jYWJ1bGFyeTplbmhhbmNlcg=='
    },
    method: 'post',
    params: {
      username, password, randomStr, code, grant_type, scope
    }
  })
}

export const logout = $ => {
  return request({
    url: '/auth/kiwiTokenEndpoint/logout',
    headers: {
      isToken: true
    },
    method: 'delete'
  })
}

export const oneClickRegister = $ => {
  return request({
    url: '/admin/sys/user/oneClickRegister',
    method: 'get'
  })
}
