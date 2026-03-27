import request from '@/router/axios'
import kiwiConsts from '@/const/kiwiConsts'
import { extractVideoId } from '@/util/youtubeSubtitles'

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
        url: `${kiwiConsts.API_BASE.AI_BIZ}/history`,
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
        url: `${kiwiConsts.API_BASE.AI_BIZ}/history/${id}/archive`,
        method: 'put',
        headers: {
            isToken: true
        }
    })
}

// Delete AI call history item
export function deleteAiCallHistory(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/history/${id}`,
        method: 'delete',
        headers: {
            isToken: true
        }
    })
}

// Get single AI call history item detail (includes aiResponse)
export function getAiCallHistoryDetail(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/history/${id}`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

// Create new AI call history item (used for Gemini local API mode)
export function saveAiCallHistory(data) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/history`,
        method: 'post',
        data: {
            aiUrl: data.aiUrl,
            prompt: data.prompt,
            aiResponse: data.aiResponse,
            promptMode: data.promptMode,
            targetLanguage: data.targetLanguage,
            nativeLanguage: data.nativeLanguage
        },
        headers: {
            isToken: true
        }
    })
}

// YouTube Channel API calls
export function getChannelList(current, size) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/page`,
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
        url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel`,
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
        url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/id/${channelId}/videos`,
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
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/id/${channelId}/favorite`,
    method: 'post',
    headers: { isToken: true }
  })
}

export function unfavoriteChannel(channelId) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/id/${channelId}/favorite`,
    method: 'delete',
    headers: { isToken: true }
  })
}

export function favoriteVideo(videoId) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/${videoId}/favorite`,
    method: 'post',
    headers: { isToken: true }
  })
}

export function unfavoriteVideo(videoId) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/${videoId}/favorite`,
    method: 'delete',
    headers: { isToken: true }
  })
}

// New: toggle video favorite by URL when backend videoId is unavailable/invalid
export function favoriteVideoByUrl(videoUrl) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/favorite`,
    method: 'post',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

export function unfavoriteVideoByUrl(videoUrl) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/favorite`,
    method: 'delete',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

export function getFavoriteChannels(current, size) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/favorites/channels`,
    method: 'get',
    params: { current, size },
    headers: { isToken: true }
  })
}

export function getFavoriteVideos(current, size) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/favorites/videos`,
    method: 'get',
    params: { current, size },
    headers: { isToken: true }
  })
}

// Check favorite status by backend video ID (Long)
export function checkVideoFavoriteById(videoId) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/${videoId}/favorite`,
    method: 'get',
    headers: { isToken: true }
  })
}

// Check favorite status by video URL
export function checkVideoFavoriteByUrl(videoUrl) {
  return request({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/channel/video/favorite`,
    method: 'get',
    params: { videoUrl },
    headers: { isToken: true }
  })
}

// YouTube Video-related API calls - UPDATED FOR SEPARATED ENDPOINTS
export function downloadVideoScrollingSubtitles(videoUrl) {
    const url = `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/subtitles/scrolling?url=${encodeURIComponent(videoUrl)}`;
    return request({
        url: url,
        headers: {
            isToken: true
        },
        method: 'get'
    });
}

export function downloadVideoTranslatedSubtitles(videoUrl, language) {
    let url = `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/subtitles/translated?url=${encodeURIComponent(videoUrl)}`;
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
    url = `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}&language=${language}`;
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
        url = `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}&language=${language}`;
    } else {
        url = `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/subtitles?url=${encodeURIComponent(videoUrl)}`;
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
        url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/download?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true
        },
        method: 'get',
        responseType: 'blob'
    })
}

export function getVideoTitle(videoUrl) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/ytb/video/title?url=${encodeURIComponent(videoUrl)}`,
        headers: {
            isToken: true
        },
        method: 'get'
    })
}

function formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function transcriptToSrt(transcript) {
    return transcript.map((item, index) => {
        const isMs = Number.isInteger(item.offset) && (item.offset > 500 || item.duration > 500);
        const startSec = isMs ? item.offset / 1000 : item.offset;
        const endSec = startSec + (isMs ? item.duration / 1000 : item.duration);
        return `${index + 1}\n${formatSrtTime(startSec)} --> ${formatSrtTime(endSec)}\n${item.text}\n`;
    }).join('\n');
}

/**
 * Fetch YouTube subtitles via the dev server youtube-transcript endpoint.
 * @param {string} videoUrl - YouTube video URL or video ID
 * @param {string} [lang='en'] - Language code
 * @returns {Promise<Object>}
 */
export async function fetchSubtitlesWithFallback(videoUrl, lang = 'en') {
    const videoID = extractVideoId(videoUrl);
    if (!videoID) {
        throw new Error('Invalid YouTube URL or video ID');
    }

    const res = await window.fetch(`/ytb/transcript?videoId=${encodeURIComponent(videoID)}&lang=${encodeURIComponent(lang)}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to fetch subtitles');
    }
    const { data: transcript } = await res.json();
    if (!transcript || transcript.length === 0) {
        throw new Error('No subtitles found');
    }
    const scrollingSubtitles = transcriptToSrt(transcript);
    return { status: 200, data: { data: { scrollingSubtitles } } };
}

/**
 * Get video ID from URL
 * @param {string} videoUrl - YouTube video URL
 * @returns {string|null}
 */
export function getVideoIdFromUrl(videoUrl) {
    return extractVideoId(videoUrl);
}

// ==================== AI Conversation Generator API ====================

/**
 * Get conversation generator configuration
 */
export function getConversationConfig() {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/config`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

/**
 * Get conversation by ID
 */
export function getConversationById(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${id}`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

/**
 * List user's conversations
 */
export function listConversations() {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/list`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

/**
 * Delete conversation (soft delete)
 */
export function deleteConversation(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${id}`,
        method: 'delete',
        headers: {
            isToken: true
        }
    })
}

/**
 * Get audio stream URL for a message
 */
export function getConversationAudioUrl(conversationId, messageId) {
    return `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${conversationId}/audio/${messageId}`
}