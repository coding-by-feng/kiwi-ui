import request from '@/router/axios'
import kiwiConsts from '@/const/kiwiConsts'

export default {

  getWordStarList () {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/getCurrentUserList`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'get'
    })
  },

  findAllWordId (listId) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/findAllWordId/${listId}`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'get'
    })
  },

  putWordStarList (data) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/putWordStarList`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'put',
      params: data
    })
  },

  removeWordStarList (data) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/removeWordStarList`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'delete',
      params: data
    })
  },

  getListItems (page, listId) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/getListItems/${page.size}/${page.current}/${listId}`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'get'
    })
  },

  updateById (data) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/updateById`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'put',
      params: data
    })
  },

  save (data) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/save`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'post',
      params: data
    })
  },

  delById (id) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/star/list/del/${id}`,
      headers: { isToken: true, 'Content-Type': 'application/json' },
      method: 'delete'
    })
  }
}
