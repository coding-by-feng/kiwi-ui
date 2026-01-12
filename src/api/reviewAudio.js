import request from '@/router/axios'
import kiwiConsts from '@/const/kiwiConsts'

/**
 * Review Audio API Module
 *
 * Provides API methods for the new TTS-based audio generation system.
 * These endpoints enable pre-generation and streaming of audio files
 * for vocabulary review sessions.
 */

const AUDIO_API_BASE = `${kiwiConsts.API_BASE.WORD_BIZ}/review/audio`

export default {

  /**
   * Get the current audio generation configuration/limits.
   * @returns {Promise} Response with audio config: enabled, maxGenerationCount, contentMode, asyncGeneration
   */
  getAudioConfig() {
    return request({
      url: `${AUDIO_API_BASE}/config`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  /**
   * Check whether audio has been generated for a paraphrase.
   * @param {number} paraphraseId - The paraphrase ID
   * @returns {Promise} Response with boolean data indicating if audio exists
   */
  checkAudioExists(paraphraseId) {
    return request({
      url: `${AUDIO_API_BASE}/exists/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'get'
    })
  },

  /**
   * Generate audio files for all paraphrases in a user's star list.
   * This is the primary endpoint for batch audio generation.
   * @param {number} listId - The star list ID
   * @returns {Promise} Response with generation results: successCount, failedCount, skippedCount, etc.
   */
  generateAudioForList(listId) {
    return request({
      url: `${AUDIO_API_BASE}/generate/list/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post'
    })
  },

  /**
   * Generate audio only for paraphrases that haven't been marked as "remembered" yet.
   * Useful for preparing audio for the current review session.
   * @param {number} listId - The star list ID
   * @returns {Promise} Response with generation results
   */
  generateAudioForReviewItems(listId) {
    return request({
      url: `${AUDIO_API_BASE}/generate/review-items/${listId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post'
    })
  },

  /**
   * Generate audio for a single paraphrase.
   * Useful for on-demand generation.
   * @param {number} paraphraseId - The paraphrase ID
   * @returns {Promise} Response with boolean data indicating success
   */
  generateAudioForParaphrase(paraphraseId) {
    return request({
      url: `${AUDIO_API_BASE}/generate/paraphrase/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post'
    })
  },

  /**
   * Get the download URL for a paraphrase audio.
   * This URL can be used directly with HTML5 Audio element.
   * @param {number} paraphraseId - The paraphrase ID
   * @returns {string} The download URL
   */
  getAudioDownloadUrl(paraphraseId) {
    return `${AUDIO_API_BASE}/download/${paraphraseId}`
  },

  /**
   * Delete the audio file for a paraphrase.
   * @param {number} paraphraseId - The paraphrase ID
   * @returns {Promise} Response with boolean data indicating success
   */
  deleteAudio(paraphraseId) {
    return request({
      url: `${AUDIO_API_BASE}/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'delete'
    })
  },

  /**
   * Delete existing audio and generate a new one.
   * Useful when the paraphrase content has been updated.
   * @param {number} paraphraseId - The paraphrase ID
   * @returns {Promise} Response with boolean data indicating success
   */
  regenerateAudio(paraphraseId) {
    return request({
      url: `${AUDIO_API_BASE}/regenerate/${paraphraseId}`,
      headers: {
        isToken: true,
        'Content-Type': 'application/json'
      },
      method: 'post'
    })
  },

  /**
   * Check multiple paraphrases for audio availability.
   * @param {number[]} paraphraseIds - Array of paraphrase IDs
   * @returns {Promise<Map<number, boolean>>} Map of paraphraseId to audio availability
   */
  async checkMultipleAudioExists(paraphraseIds) {
    const results = new Map()
    const promises = paraphraseIds.map(async (id) => {
      try {
        const response = await this.checkAudioExists(id)
        results.set(id, response.data?.data === true)
      } catch (e) {
        console.warn(`Failed to check audio for paraphrase ${id}:`, e)
        results.set(id, false)
      }
    })
    await Promise.all(promises)
    return results
  }

}
