import request from '@/router/axios'
import kiwiConsts from '@/const/kiwiConsts'

// Get conversation configuration
export function getConversationConfig() {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/config`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

// Get list of user's conversations
export function getConversationList() {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/list`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

// Get conversation by ID with all messages
export function getConversationById(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${id}`,
        method: 'get',
        headers: {
            isToken: true
        }
    })
}

// Delete conversation (soft delete)
export function deleteConversation(id) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${id}`,
        method: 'delete',
        headers: {
            isToken: true
        }
    })
}

// Stream audio for a specific message
export function getMessageAudioUrl(conversationId, messageId) {
    return `${kiwiConsts.API_BASE.AI_BIZ}/conversation/${conversationId}/audio/${messageId}`
}

// Generate random conversation topic via backend
export function generateRandomTopic(params = {}) {
    return request({
        url: `${kiwiConsts.API_BASE.AI_BIZ}/conversation/topic/random`,
        method: 'post',
        data: {
            category: params.category || 'lifestyle',
            difficulty: params.difficulty || 'intermediate',
            language: params.language || 'en'
        },
        headers: {
            isToken: true
        }
    })
}
