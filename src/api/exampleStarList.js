import request from '@/router/axios'

export default {

  getExampleStarList () {
    return request({
      url: '/wordBiz/word/example/star/list/getCurrentUserList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  removeExampleStar (data) {
    return request({
      url: `/wordBiz/word/example/star/list/removeExampleStar/${data.exampleId}/${data.listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'delete'
    })
  },

  getExampleListItems (page, listId) {
    return request({
      url: `/wordBiz/word/example/star/list/getListItems/${page.size}/${page.current}/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  putExampleStarList (data) {
    return request({
      url: '/wordBiz/word/example/star/list/putIntoStarList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'put',
      params: data
    })
  },

  updateById (data) {
    return request({
      url: '/wordBiz/word/example/star/list/updateById',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'put',
      params: data
    })
  },

  save (data) {
    return request({
      url: '/wordBiz/word/example/star/list/save',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: data
    })
  },

  delById (exampleId) {
    return request({
      url: `/wordBiz/word/example/star/list/delById/${exampleId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'delete'
    })
  }

}

