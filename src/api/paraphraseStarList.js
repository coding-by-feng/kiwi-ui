import request from '@/router/axios'

export default {

  getParaphraseStarList () {
    return request({
      url: '/wordBiz/word/paraphrase/star/list/getCurrentUserList',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  removeParaphraseStar (data) {
    return request({
      url: '/wordBiz/word/paraphrase/star/list/removeParaphraseStar',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'delete',
      params: {
        paraphraseId: data.paraphraseId,
        listId: data.listId
      }
    })
  },

  getListItems (page, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/getListItems/${page.size}/${page.current}/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  getReviewListItems (page, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/getReviewListItems/${page.size}/${page.current}/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  getEnhanceListItems (page, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/getRememberListItems/${page.size}/${page.current}/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  getItemDetail (paraphraseId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/getItemDetail/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  putParaphraseStarList (data) {
    return request({
      url: '/wordBiz/word/paraphrase/star/list/putIntoStarList',
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
      url: '/wordBiz/word/paraphrase/star/list/updateById',
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
      url: '/wordBiz/word/paraphrase/star/list/save',
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post',
      params: data
    })
  },

  delById (paraphraseId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/delById/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'delete'
    })
  },

  rememberOne (paraphraseId, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/rememberOne`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'put',
      params: {
        paraphraseId: paraphraseId,
        listId: listId
      }
    })
  },

  keepInMind (paraphraseId, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/keepInMind`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'put',
      params: {
        paraphraseId: paraphraseId,
        listId: listId
      }
    })
  },

  forgetOne (paraphraseId, listId) {
    return request({
      url: `/wordBiz/word/paraphrase/star/list/forgetOne`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'put',
      params: {
        paraphraseId: paraphraseId,
        listId: listId
      }
    })
  }

}

