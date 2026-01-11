import kiwiConst from '@/const/kiwiConsts'
import {getStore} from '@/util/store'
import cacheUtil from "@/util/cacheUtil";
import db from "@/util/db";
import reviewAudioApi from "@/api/reviewAudio";

let CH2_EN_INDEX_SLEEP_MS_MAP = null
const IS_PLAY_EXAMPLE = getStore({name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE})
const SPELL_TYPE = getStore({name: kiwiConst.CONFIG_KEY.SPELL_TYPE})

// TTS Audio caching - track audio config and cache state
let ttsAudioConfig = null
let ttsDbObject = null

/**
 * Get the current access token for authenticated requests
 * @returns {string|null} The access token or null
 */
function getAccessToken() {
    return getStore({ name: 'access_token' })
}

export default {

    extractedEn2ChUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        let wordSpellingUrl = this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING)
        let paraphraseChUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH)
        let paraphraseEnUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN)
        let characterUrl = this.assembleCharacterReviseAudioUrl(characterCode)

        // Add pronunciation and spelling
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        let isPlaySpelling = SPELL_TYPE === kiwiConst.SPELL_TYPE.ENABLE;
        if (!lastIsSame && isPlaySpelling) {
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame && isPlaySpelling) {
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }

        // Add character and paraphrase information
        urls.push(characterUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)

        // Check if example playback is enabled and examples exist
        let isExampleInvalid = IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0
        console.log('extractedEn2ChUrls')
        console.log('exampleList: ', exampleList)
        console.log('isExampleInvalid: ', isExampleInvalid)
        if (isExampleInvalid) {
            return urls
        }

        // Check if examples have translations
        for (let i = 0; i < 2 && i < exampleList.length; i++) {
            let example = exampleList[i]
            if (example.exampleTranslate === undefined || example.exampleTranslate === null || example.exampleTranslate === '') {
                isExampleInvalid = true
                break
            }
        }
        if (isExampleInvalid) {
            return urls
        }

        // Add example audio URLs
        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

        if (exampleList.length === 1) {
            urls.push(exampleChUrl0)
            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
        } else {
            let exampleChUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

            urls.push(exampleChUrl0)
            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl1)
            urls.push(exampleChUrl1)
            urls.push(exampleEnUrl1)
            urls.push(exampleEnUrl1)
        }
        return urls
    },

    acquireCh2EnIndexSleepMsMap() {
        if (CH2_EN_INDEX_SLEEP_MS_MAP === null) {
            CH2_EN_INDEX_SLEEP_MS_MAP = new Map()
                .set(0, 3000)
                .set(1, 3000)
                .set(17, 3000)
        }
        return CH2_EN_INDEX_SLEEP_MS_MAP
    },

    extractedCh2EnUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, wordCharacter, exampleList) {
        let urls = []
        let wordSpellingUrl = this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING)
        let paraphraseChUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH)
        let paraphraseEnUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN)
        let characterUrl = this.assembleCharacterReviseAudioUrl(wordCharacter)

        urls.push(paraphraseChUrl)
        urls.push(paraphraseChUrl)
        urls.push(characterUrl)
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }
        urls.push(characterUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseEnUrl)
        if (IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0) {
            return urls
        }

        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

        if (exampleList.length === 1) {
            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
        } else {
            let exampleChUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleChUrl1)
            urls.push(exampleEnUrl1)
            urls.push(exampleEnUrl1)
        }
        return urls
    },

    extractedCh2En: function (params) {
        let files = []
        let wordSpelling = this.assembleReviseAudioFile(params.wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING)
        if (!wordSpelling) {
            wordSpelling = this.assembleReviseAudioUrl(params.wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING)
        }
        let ukPronunciation = this.assembleReviseAudioFile(params.ukPronunciation.id, kiwiConst.REVIEW_AUDIO_TYPE.PRONUNCIATION)
        if (!ukPronunciation) {
            ukPronunciation = params.ukPronunciationUrl
        }
        let usPronunciation = this.assembleReviseAudioFile(params.usPronunciation.id, kiwiConst.REVIEW_AUDIO_TYPE.PRONUNCIATION)
        if (!usPronunciation) {
            usPronunciation = params.usPronunciationUrl
        }
        let paraphraseCh = this.assembleReviseAudioFile(params.paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH)
        let paraphraseEn = this.assembleReviseAudioFile(params.paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN)
        let character = this.assembleCharacterReviseAudioUrl(params.wordCharacter)
        let exampleList = params.exampleList

        files.push(paraphraseCh)
        files.push(paraphraseCh)
        files.push(character)
        files.push(ukPronunciation)
        files.push(usPronunciation)
        if (!params.lastIsSame) {
            files.push(wordSpelling)
            files.push(wordSpelling)
            files.push(wordSpelling)
        }
        files.push(params.ukPronunciationUrl)
        files.push(params.ukPronunciationUrl)
        if (!params.lastIsSame) {
            files.push(wordSpelling)
            files.push(wordSpelling)
        }
        files.push(character)
        files.push(paraphraseCh)
        files.push(paraphraseEn)
        files.push(paraphraseEn)
        if (IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0) {
            return files
        }

        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

        if (exampleList.length === 1) {
            files.push(exampleChUrl0)
            files.push(exampleEnUrl0)
            files.push(exampleEnUrl0)
            files.push(exampleEnUrl0)
        } else {
            let exampleChUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

            files.push(exampleChUrl0)
            files.push(exampleEnUrl0)
            files.push(exampleEnUrl0)
            files.push(exampleChUrl1)
            files.push(exampleEnUrl1)
            files.push(exampleEnUrl1)
        }
        return files
    },

    assembleReviseAudioUrl(sourceId, type) {
        return `/api/word/review/downloadReviewAudio/${sourceId}/${type}`
    },
    assembleCharacterReviseAudioUrl(characterCode) {
        return `/api/word/review/character/downloadReviewAudio/${characterCode}`
    },

    assembleReviseAudioFile(sourceId, type) {
        let blob = cacheUtil.get(cacheUtil.buildReviewAudioKey(sourceId, type))
        if (!blob) {
            return null
        }
        return new Window.File([blob], `${sourceId}_${type}.mp3`, {type: 'blob'})
    },

    rebuildUrls: async function (urls) {
        let multipleThreads = []
        let commonDbObject = null
        await db.openDB(kiwiConst.DB_NAME, kiwiConst.DB_VERSION)
            .then(async dbObject => {
                console.log('dbObject object', dbObject)
                commonDbObject = dbObject
            }).catch(err => {
                throw err
            })

        let uniqueRebuiltUrls = new Map()
        for (let urlsKey in urls) {
            let url = urls[urlsKey];
            let builtUrl = uniqueRebuiltUrls.get(url)
            if (builtUrl === 1) {
                continue
            }
            uniqueRebuiltUrls.set(url, 1)
        }
        uniqueRebuiltUrls.forEach((key, originalUrl) => {
            multipleThreads.push(this.createUniqueThreadToRebuildSoundUrl(commonDbObject, originalUrl, uniqueRebuiltUrls))
        })
        await Promise.all(multipleThreads)
            .then(response => {
                console.log('multipleThreads handle ', response)
                for (let urlsKey in urls) {
                    urls[urlsKey] = uniqueRebuiltUrls.get(urls[urlsKey])
                }
            }).catch(err => {
                throw err
            })
    },
    createUniqueThreadToRebuildSoundUrl: function (commonDbObject, url, uniqueRebuiltUrls) {
        return new Promise((resolve, reject) => {
            let dataKey = db.buildDataKey(url)
            db.getDataByKey(commonDbObject, kiwiConst.DB_STORE_NAME, dataKey)
                .then(async data => {
                    if (data) {
                        console.log('get audio data from DB', data)
                        let reBuiltUrl = URL.createObjectURL(data.audio);
                        uniqueRebuiltUrls.set(url, reBuiltUrl)
                        resolve(kiwiConst.SUCCESS)
                    } else {
                        await fetch(url).then(async response => {
                            console.log('Downloading audio from API', response)
                            console.log('Downloading audio url', url)
                            return response.blob()
                        }).then(async buffer => {
                            console.log('buffer', buffer)
                            let blob = new Blob([buffer], {type: 'audio/mpeg'});
                            await db.addData(commonDbObject, kiwiConst.DB_STORE_NAME, {
                                sequenceKey: dataKey,
                                audio: blob
                            }).then(async response => {
                                let reBuiltUrl = URL.createObjectURL(blob);
                                uniqueRebuiltUrls.set(url, reBuiltUrl)
                                resolve(kiwiConst.SUCCESS)
                            }).catch(err => {
                                throw err
                            })
                        }).catch(err => {
                            throw err
                        })
                    }
                }).catch(err => {
                reject(kiwiConst.FAIL)
                throw err
            })
        });
    },

    // ============================================
    // NEW TTS AUDIO METHODS WITH INDEXEDDB CACHING
    // ============================================

    /**
     * Initialize TTS audio system - get config and open DB
     * @returns {Promise<object>} Audio configuration from server
     */
    async initTtsAudioSystem() {
        if (ttsAudioConfig !== null) {
            return ttsAudioConfig
        }
        try {
            const response = await reviewAudioApi.getAudioConfig()
            ttsAudioConfig = response.data?.data || { enabled: false }
            console.log('TTS Audio config loaded:', ttsAudioConfig)

            // Open TTS audio DB
            if (ttsAudioConfig.enabled) {
                await this.openTtsAudioDb()
            }
            return ttsAudioConfig
        } catch (e) {
            console.warn('Failed to load TTS audio config, using defaults:', e)
            ttsAudioConfig = { enabled: false }
            return ttsAudioConfig
        }
    },

    /**
     * Open TTS audio IndexedDB store
     */
    async openTtsAudioDb() {
        if (ttsDbObject !== null) {
            return ttsDbObject
        }
        try {
            ttsDbObject = await db.openDB(kiwiConst.DB_NAME, kiwiConst.DB_VERSION)
            return ttsDbObject
        } catch (e) {
            console.error('Failed to open TTS audio DB:', e)
            throw e
        }
    },

    /**
     * Build the cache key for TTS audio
     * @param {number} paraphraseId - Paraphrase ID
     * @returns {string} Cache key
     */
    buildTtsAudioCacheKey(paraphraseId) {
        return `TTS_${paraphraseId}`
    },

    /**
     * Get TTS audio download URL
     * @param {number} paraphraseId - Paraphrase ID
     * @returns {string} Download URL
     */
    getTtsAudioUrl(paraphraseId) {
        return reviewAudioApi.getAudioDownloadUrl(paraphraseId)
    },

    /**
     * Check if TTS audio is cached in IndexedDB
     * @param {number} paraphraseId - Paraphrase ID
     * @returns {Promise<boolean>} True if cached
     */
    async isTtsAudioCached(paraphraseId) {
        try {
            const dbObject = await this.openTtsAudioDb()
            const cacheKey = this.buildTtsAudioCacheKey(paraphraseId)
            const data = await db.getDataByKey(dbObject, kiwiConst.DB_STORE_NAME, cacheKey)
            return data !== null && data !== undefined
        } catch (e) {
            console.warn('Failed to check TTS audio cache:', e)
            return false
        }
    },

    /**
     * Get TTS audio blob URL from cache or download and cache it
     * @param {number} paraphraseId - Paraphrase ID
     * @param {boolean} forceDownload - Force download even if cached
     * @returns {Promise<string|null>} Blob URL or null if failed
     */
    async getTtsAudioBlobUrl(paraphraseId, forceDownload = false) {
        try {
            const dbObject = await this.openTtsAudioDb()
            const cacheKey = this.buildTtsAudioCacheKey(paraphraseId)

            // Check cache first (unless forceDownload)
            if (!forceDownload) {
                const cachedData = await db.getDataByKey(dbObject, kiwiConst.DB_STORE_NAME, cacheKey)
                if (cachedData && cachedData.audio) {
                    console.log('TTS audio loaded from cache:', paraphraseId)
                    return URL.createObjectURL(cachedData.audio)
                }
            }

            // Download from API with authentication
            const downloadUrl = this.getTtsAudioUrl(paraphraseId)
            console.log('Downloading TTS audio:', downloadUrl)

            const token = getAccessToken()
            const headers = {}
            if (token) {
                headers['Authorization'] = 'Bearer ' + token
            }

            const response = await fetch(downloadUrl, { headers })
            if (!response.ok) {
                console.warn('TTS audio download failed:', response.status)
                return null
            }

            const buffer = await response.blob()
            const blob = new Blob([buffer], { type: 'audio/mpeg' })

            // Cache in IndexedDB
            try {
                await db.addData(dbObject, kiwiConst.DB_STORE_NAME, {
                    sequenceKey: cacheKey,
                    audio: blob
                })
                console.log('TTS audio cached:', paraphraseId)
            } catch (cacheError) {
                console.warn('Failed to cache TTS audio (may already exist):', cacheError)
            }

            return URL.createObjectURL(blob)
        } catch (e) {
            console.error('Failed to get TTS audio:', e)
            return null
        }
    },

    /**
     * Pre-generate audio for a review session.
     * Downloads and caches all audio files for the given paraphrase IDs.
     * @param {number[]} paraphraseIds - Array of paraphrase IDs
     * @param {function} onProgress - Callback for progress updates (current, total, paraphraseId)
     * @returns {Promise<{success: number[], failed: number[], cached: number[]}>}
     */
    async prepareReviewSessionAudio(paraphraseIds, onProgress = null) {
        const result = { success: [], failed: [], cached: [] }

        if (!paraphraseIds || paraphraseIds.length === 0) {
            return result
        }

        // Initialize TTS system
        const config = await this.initTtsAudioSystem()
        if (!config.enabled) {
            console.log('TTS audio is disabled on server')
            return result
        }

        const total = paraphraseIds.length

        for (let i = 0; i < paraphraseIds.length; i++) {
            const paraphraseId = paraphraseIds[i]

            try {
                // Check if already cached
                const isCached = await this.isTtsAudioCached(paraphraseId)
                if (isCached) {
                    result.cached.push(paraphraseId)
                    if (onProgress) onProgress(i + 1, total, paraphraseId, 'cached')
                    continue
                }

                // Download and cache
                const blobUrl = await this.getTtsAudioBlobUrl(paraphraseId)
                if (blobUrl) {
                    result.success.push(paraphraseId)
                    // Revoke the blob URL since we just wanted to cache it
                    URL.revokeObjectURL(blobUrl)
                    if (onProgress) onProgress(i + 1, total, paraphraseId, 'success')
                } else {
                    result.failed.push(paraphraseId)
                    if (onProgress) onProgress(i + 1, total, paraphraseId, 'failed')
                }
            } catch (e) {
                console.error('Failed to prepare audio for paraphrase:', paraphraseId, e)
                result.failed.push(paraphraseId)
                if (onProgress) onProgress(i + 1, total, paraphraseId, 'failed')
            }
        }

        console.log('Audio preparation complete:', result)
        return result
    },

    /**
     * Generate audio on server for a list of paraphrases, then download and cache.
     * This calls the batch generation API first, then downloads the generated audio.
     * @param {number} listId - Star list ID
     * @param {function} onProgress - Callback for progress updates
     * @returns {Promise<object>} Generation and caching result
     */
    async generateAndCacheAudioForList(listId, onProgress = null) {
        try {
            // First, trigger server-side generation
            const genResponse = await reviewAudioApi.generateAudioForReviewItems(listId)
            const genResult = genResponse.data?.data || {}

            console.log('Server audio generation result:', genResult)

            if (!genResult.enabled) {
                return { enabled: false, message: 'Audio generation is disabled on server' }
            }

            // Now download and cache the successfully generated audio
            const successIds = genResult.successIds || []
            const skippedIds = genResult.skippedIds || []

            // All IDs that now have audio available
            const availableIds = [...successIds, ...skippedIds]

            if (availableIds.length > 0) {
                const cacheResult = await this.prepareReviewSessionAudio(availableIds, onProgress)
                return {
                    enabled: true,
                    generated: genResult,
                    cached: cacheResult
                }
            }

            return {
                enabled: true,
                generated: genResult,
                cached: { success: [], failed: [], cached: [] }
            }
        } catch (e) {
            console.error('Failed to generate and cache audio:', e)
            throw e
        }
    },

    /**
     * Check if TTS audio feature is enabled (checks cached config)
     * @returns {boolean}
     */
    isTtsAudioEnabled() {
        return ttsAudioConfig?.enabled === true
    },

    /**
     * Get TTS audio configuration
     * @returns {object|null}
     */
    getTtsAudioConfig() {
        return ttsAudioConfig
    },

    /**
     * Clear TTS audio cache for specific paraphrase
     * @param {number} paraphraseId - Paraphrase ID
     */
    async clearTtsAudioCache(paraphraseId) {
        try {
            const dbObject = await this.openTtsAudioDb()
            const cacheKey = this.buildTtsAudioCacheKey(paraphraseId)
            // Note: db.js doesn't have a delete method, we'll need to use the store directly
            const transaction = dbObject.transaction([kiwiConst.DB_STORE_NAME], 'readwrite')
            const store = transaction.objectStore(kiwiConst.DB_STORE_NAME)
            store.delete(cacheKey)
            console.log('TTS audio cache cleared:', paraphraseId)
        } catch (e) {
            console.warn('Failed to clear TTS audio cache:', e)
        }
    }
}