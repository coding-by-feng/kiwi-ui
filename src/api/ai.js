import request from '@/router/axios'

export function callAiChatCompletion(urlPrefix, language, originalText) {
    console.log('callAiChatCompletion urlPrefix: ' + urlPrefix + ' language: ' + language + ' originalText: ' + originalText)
    return request({
        url: `/ai-biz/ai/${urlPrefix}/${language}/${originalText}`,
        headers: {
            isToken: true
        },
        method: 'get'
    })
}

// YouTube-related API calls (based on YouTuBeController)
export function downloadVideoSubtitles(videoUrl) {
    return request({
        url: `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true // Adjust based on your authentication requirements
        },
        method: 'get'
    })
}

export function downloadVideo(videoUrl) {
    return request({
        url: `/ai-biz/ai/ytb/video/download?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true // Adjust based on your authentication requirements
        },
        method: 'get',
        responseType: 'blob' // For streaming binary data (e.g., video file)
    })
}

export function getVideoTitle(videoUrl) {
    return request({
        url: `/ai-biz/ai/ytb/video/title?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true // Adjust based on your authentication requirements
        },
        method: 'get'
    })
}