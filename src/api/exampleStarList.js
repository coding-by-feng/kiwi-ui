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
      url: '/wordBiz/word/example/star/list/removeExampleStar',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: {
        exampleId: data.exampleId,
        listId: data.listId
      }
    })
  },

  getExampleListItems (page, listId) {
    return request({
      url: `/wordBiz/word/example/star/list/getListItems/${page.size}/${page.current}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: {
        listId: listId
      }
    })
  },

  putExampleStarList (data) {
    return request({
      url: '/wordBiz/word/example/star/list/putIntoStarList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
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
      method: 'post',
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
      method: 'post'
    })
  }

}

