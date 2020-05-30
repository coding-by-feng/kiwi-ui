import request from '@/router/axios'

export default {

  getWordStarList () {
    return request({
      url: '/wordBiz/word/star/list/getCurrentUserList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  findAllWordId (listId) {
    return request({
      url: `/wordBiz/word/star/list/findAllWordId/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  putWordStarList (data) {
    return request({
      url: '/wordBiz/word/star/list/putWordStarList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: data
    })
  },

  removeWordStarList (data) {
    return request({
      url: '/wordBiz/word/star/list/removeWordStarList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: data
    })
  },

  getListItems (page, listId) {
    return request({
      url: `/wordBiz/word/star/list/getListItems/${page.size}/${page.current}`,
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

  updateById (data) {
    return request({
      url: '/wordBiz/word/star/list/updateById',
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
      url: '/wordBiz/word/star/list/save',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: data
    })
  },

  delById (id) {
    return request({
      url: `/wordBiz/word/star/list/del/${id}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post'
    })
  }
}
