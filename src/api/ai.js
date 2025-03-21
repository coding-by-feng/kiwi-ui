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

// YouTube Channel API calls
export function getChannelList(current, size) {
    return request({
        url: `/ai-biz/ai/ytb/channel/page`,
        method: 'get',
        params: {
            current: current,
            size: size
        },
        headers: {
            isToken: true
        }
    })
}

export function submitChannel(channelLinkOrName) {
    return request({
        url: `/ai-biz/ai/ytb/channel`,
        method: 'post',
        params: {
            channelLinkOrName: channelLinkOrName.trim()
        },
        headers: {
            isToken: true
        }
    })
}

export function getChannelVideos(channelId, current, size) {
    return request({
        url: `/ai-biz/ai/ytb/channel/${channelId}/videos`,
        method: 'get',
        params: {
            current: current,
            size: size
        },
        headers: {
            isToken: true
        }
    })
}

// YouTube Video-related API calls
export function downloadVideoSubtitles(videoUrl, language) {
    let url;
    if (language) {
        url = `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}&language=${language}`;
    } else {
        url = `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}`;
    }
    return request({
        url: url,
        headers: {
            isToken: true // Adjust based on your authentication requirements
        },
        method: 'get'
    });
}

export function deleteVideoSubtitles(videoUrl, language) {
    let url;
    if (language) {
        url = `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}&language=${language}`;
    } else {
        url = `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}`;
    }
    return request({
        url: url,
        headers: {
            isToken: true // Adjust based on your authentication requirements
        },
        method: 'delete'
    });
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