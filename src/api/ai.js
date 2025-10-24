import request from '@/router/axios'

export function callAiChatCompletion(selectedMode, targetLanguage, nativeLanguage, originalText) {
    console.log('callAiChatCompletion selectedMode: ' + selectedMode + ' targetLanguage: ' + targetLanguage + ' nativeLanguage: ' + nativeLanguage + ' originalText: ' + originalText)
    return request({
        url: `/ai-biz/ai/v2/${selectedMode}/${targetLanguage}/${nativeLanguage}/${encodeURIComponent(encodeURIComponent(originalText))}`,
        headers: {
            isToken: true
        },
        method: 'get'
    })
}

// AI Call History API calls
export function getAiCallHistory(current, size, filter = null) {
    const params = {
        current: current,
        size: size
    };
    
    // Add filter parameter if provided
    if (filter && filter !== '') {
        params.filter = filter;
    }
    
    return request({
        url: `/ai-biz/ai/history`,
        method: 'get',
        params: params,
        headers: {
            isToken: true
        }
    })
}

// Archive AI call history item
export function archiveAiCallHistory(id) {
    return request({
        url: `/ai-biz/ai/history/${id}/archive`,
        method: 'put',
        headers: {
            isToken: true
        }
    })
}

// Delete AI call history item
export function deleteAiCallHistory(id) {
    return request({
        url: `/ai-biz/ai/history/${id}`,
        method: 'delete',
        headers: {
            isToken: true
        }
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

// Favorites API
export function favoriteChannel(channelId) {
  return request({
    url: `/ai-biz/ai/ytb/channel/${channelId}/favorite`,
    method: 'post',
    headers: { isToken: true }
  })
}

export function unfavoriteChannel(channelId) {
  return request({
    url: `/ai-biz/ai/ytb/channel/${channelId}/favorite`,
    method: 'delete',
    headers: { isToken: true }
  })
}

export function favoriteVideo(videoId) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/${videoId}/favorite`,
    method: 'post',
    headers: { isToken: true }
  })
}

export function unfavoriteVideo(videoId) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/${videoId}/favorite`,
    method: 'delete',
    headers: { isToken: true }
  })
}

// New: toggle video favorite by URL when backend videoId is unavailable/invalid
export function favoriteVideoByUrl(videoUrl) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/favorite`,
    method: 'post',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

export function unfavoriteVideoByUrl(videoUrl) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/favorite`,
    method: 'delete',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

export function getFavoriteChannels(current, size) {
  return request({
    url: `/ai-biz/ai/ytb/channel/favorites/channels`,
    method: 'get',
    params: { current, size },
    headers: { isToken: true }
  })
}

export function getFavoriteVideos(current, size) {
  return request({
    url: `/ai-biz/ai/ytb/channel/favorites/videos`,
    method: 'get',
    params: { current, size },
    headers: { isToken: true }
  })
}

// Check favorite status by backend video ID (Long)
export function checkVideoFavoriteById(videoId) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/${videoId}/favorite`,
    method: 'get',
    headers: { isToken: true }
  })
}

// Check favorite status by video URL
export function checkVideoFavoriteByUrl(videoUrl) {
  return request({
    url: `/ai-biz/ai/ytb/channel/video/favorite`,
    method: 'get',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

// YouTube Video-related API calls - UPDATED FOR SEPARATED ENDPOINTS
export function downloadVideoScrollingSubtitles(videoUrl) {
    const url = `/ai-biz/ai/ytb/video/subtitles/scrolling?url=${encodeURIComponent(videoUrl)}`;
    return request({
        url: url,
        headers: {
            isToken: true
        },
        method: 'get'
    });
}

export function downloadVideoTranslatedSubtitles(videoUrl, language) {
    let url = `/ai-biz/ai/ytb/video/subtitles/translated?url=${encodeURIComponent(videoUrl)}`;
    if (language) {
        url += `&language=${language}`;
    }
    return request({
        url: url,
        headers: {
            isToken: true
        },
        method: 'get'
    });
}

// Keep the original function for backward compatibility (deprecated)
export function downloadVideoSubtitles(videoUrl, language) {
    let url;
    if (!language) {
        language = 'EN';
    }
    url = `/ai-biz/ai/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}&language=${language}`;
    return request({
        url: url,
        headers: {
            isToken: true
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
            isToken: true
        },
        method: 'delete'
    });
}

export function downloadVideo(videoUrl) {
    return request({
        url: `/ai-biz/ai/ytb/video/download?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true
        },
        method: 'get',
        responseType: 'blob'
    })
}

export function getVideoTitle(videoUrl) {
    return request({
        url: `/ai-biz/ai/ytb/video/title?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true
        },
        method: 'get'
    })
}