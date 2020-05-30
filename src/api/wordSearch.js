import request from '@/router/axios'

export default {

  fuzzyQueryWord (word, current, size) {
    return request({
      url: '/wordBiz/word/main/fuzzyQueryList',
      headers: {
        isToken: false,
        'Authorization': 'Basic cGlnOnBpZw=='
      },
      method: 'post',
      params: {
        wordName: word,
        current: current,
        size: size
      }
    })
  },

  queryWordDetail (word) {
    return request({
      url: '/wordBiz/word/main/query/' + word,
      headers: {
        isToken: false,
        'Authorization': 'Basic cGlnOnBpZw=='
      },
      method: 'get',
      params: {}
    })
  },

  queryWordDetailById (id) {
    return request({
      url: '/wordBiz/word/main/queryById/' + id,
      headers: {
        isToken: false,
        'Authorization': 'Basic cGlnOnBpZw=='
      },
      method: 'get',
      params: {}
    })
  }

}




