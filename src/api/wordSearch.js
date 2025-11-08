import request from '@/router/axios'
import util from '@/util/util'
import kiwiConsts from '@/const/kiwiConsts'

export default {

  fuzzyQueryWord (word, current, size) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/main/fuzzyQueryList`,
      headers: { isToken: false },
      method: 'post',
      params: { wordName: util.convertWord(word), current, size }
    })
  },

  queryWordDetail (word, current, size) {
    let url
    if (util.isEmptyStr(word)) {
      url = `${kiwiConsts.API_BASE.WORD_BIZ}/main/query/gate`
    } else {
      url = `${kiwiConsts.API_BASE.WORD_BIZ}/main/query/gate/${util.convertWord(word)}`
    }
    return request({
      url,
      headers: { isToken: false },
      method: 'post',
      params: { current, size }
    })
  },

  queryWordDetailById (id) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/main/queryById/${id}`,
      headers: { isToken: false },
      method: 'get',
      params: {}
    })
  },

  removeByWordName (wordName) {
    return request({
      url: `${kiwiConsts.API_BASE.WORD_BIZ}/main/removeByWordName/${util.convertWord(wordName)}`,
      headers: { isToken: true },
      method: 'get',
      params: {}
    })
  }

}
