import request from '@/router/axios'
import util from '@/util/util'

export default {

  fuzzyQueryWord (word, current, size) {
    return request({
      url: '/wordBiz/word/main/fuzzyQueryList',
      headers: {
        isToken: true
      },
      method: 'post',
      params: {
        wordName: util.convertWord(word),
        current: current,
        size: size
      }
    })
  },

  queryWordDetail (word, current, size) {
    let url
    if (util.isEmptyStr(word)) {
      url = `/wordBiz/word/main/query/gate`
    } else {
      url = `/wordBiz/word/main/query/gate/${util.convertWord(word)}`
    }
    return request({
      url: url,
      headers: {
        isToken: false
      },
      method: 'post',
      params: {
        current: current,
        size: size
      }
    })
  },

  queryWordDetailById (id) {
    return request({
      url: '/wordBiz/word/main/queryById/' + id,
      headers: {
        isToken: false
      },
      method: 'get',
      params: {}
    })
  },

  removeByWordName (wordName) {
    return request({
      url: '/wordBiz/word/main/removeByWordName/' + util.convertWord(wordName),
      headers: {
        isToken: true
      },
      method: 'get',
      params: {}
    })
  }

}




