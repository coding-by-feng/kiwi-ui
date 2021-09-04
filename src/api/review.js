import request from '@/router/axios'

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
  }


}




