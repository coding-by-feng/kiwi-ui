import request from '@/router/axios'
import kiwiConst from '@/const/kiwiConsts'

export default {

  getVO (type) {
    return request({
      url: `/wordBiz/word/review/getVO/${type}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  getReviewBreakpointPageNumber (listId) {
    return request({
      url: `/wordBiz/word/review/getReviewBreakpointPageNumber/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  translateWordCharacter (wordCharacter) {
    let result = kiwiConst.WORD_CHARACTER_TRANSLATE_MAP.get(wordCharacter)
    if (result && result.length > 0) {
      return result
    }
    result = '词性翻译缺失'
    return result
  },

}




