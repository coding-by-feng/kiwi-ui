import request from '@/router/axios'

export function callAiChatCompletion(urlPrefix, language, originalText) {
    return request({
        url: `/ai-biz/ai/${urlPrefix}/${language}/${originalText}`,
        headers: {
            isToken: true
        },
        method: 'get'
    })
}