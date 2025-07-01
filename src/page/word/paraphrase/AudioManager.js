// mixins/AudioManager.js
import audioUtil from '@/util/audioUtil'
import kiwiConst from '@/const/kiwiConsts'
import NoSleep from 'nosleep.js'

let noSleep

export default {
    data() {
        return {
            audioConstants: {
                skipWorkSpellingIndexEn2Ch: 10,
                skipWorkSpellingIndexEn2Ch_2nd: 17,
                skipWorkSpellingIndexWhenLastIsSameEn2Ch: 4,
                skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd: 11,
                skipWorkSpellingIndexCh2En: 12,
                skipWorkSpellingIndexCh2En_2nd: 19,
                skipWorkSpellingIndexWhenLastIsSameCh2En: 7,
                skipWorkSpellingIndexWhenLastIsSameCh2En_2nd: 14
            },
            audioVolumes: {
                en2Ch: [0.3, 0.3, 1, 1, 1, 0.3, 0.3, 1, 1, 1, 0.3, 1, 1, 1, 1, 1, 1],
                en2ChWhenLastIsSame: [0.3, 0.3, 0.3, 0.3, 0.3, 1, 1, 1, 1, 1, 1]
            }
        }
    },

    beforeCreate() {
        noSleep = new NoSleep()
    },

    methods: {
        // Audio Creation and Management
        createNewAudio() {
            let audio = new Audio()
            audio.volume = 0.7
            audio.loop = false
            audio.preload = 'auto'
            this.reviseAudioCandidates.push(audio)
            return audio
        },

        // Pronunciation Methods
        assemblePronunciationUrl(isUS) {
            if (!this.detail.paraphraseVO.pronunciationVOList ||
                this.detail.paraphraseVO.pronunciationVOList.length < 1) {
                return audioUtil.assembleReviseAudioUrl(
                    this.detail.paraphraseVO.wordId,
                    kiwiConst.REVIEW_AUDIO_TYPE.PHRASE_PRONUNCIATION
                )
            }
            return this.getPronunciationUrl(this.getPronunciationVO(isUS))
        },

        getPronunciationVO(isUS) {
            let isExistUS = this.detail.paraphraseVO.pronunciationVOList[1]
            return isUS && isExistUS ?
                this.detail.paraphraseVO.pronunciationVOList[1] :
                this.detail.paraphraseVO.pronunciationVOList[0]
        },

        getPronunciationUrl(pronunciationVO) {
            if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
                return '/wordBiz/word/pronunciation/downloadVoice/' + pronunciationVO.pronunciationId
            } else {
                return pronunciationVO.sourceUrl
            }
        },

        async playPronunciation(id, sourceUrl, soundmarkType) {
            if (this.isReview) {
                this.$message.warning('自动复习期间不允许播放音标')
                return
            }

            try {
                if (soundmarkType) {
                    if (this.isUKPronunciationPlaying || this.isUSPronunciationPlaying) {
                        return
                    }
                    if (soundmarkType === 'UK') {
                        this.isUKPronunciationPlaying = true
                    } else {
                        this.isUSPronunciationPlaying = true
                    }
                }

                let audio = this.createNewAudio()
                if (this.source === kiwiConst.PRONUNCIATION_SOURCE.LOCAL) {
                    audio.src = '/wordBiz/word/pronunciation/downloadVoice/' + id
                } else {
                    audio.src = sourceUrl
                }

                audio.pause()
                audio.loop = false
                await audio.play()
            } catch (e) {
                console.error(e)
            } finally {
                setTimeout(() => {
                    if (soundmarkType) {
                        this.isUSPronunciationPlaying = false
                        this.isUKPronunciationPlaying = false
                    }
                }, 1)
            }
        },

        // Audio Control Methods
        pauseAllPlayingAudio() {
            if (this.detail.audioPlayer) {
                this.detail.audioPlayer.pause()
            }
            this.detail.audioPlayerMap.forEach((audio, url) => {
                if (!audio.paused) {
                    audio.pause()
                }
            })
        },

        getCurrentAudioPlayer(index) {
            return this.detail.audioPlayerMap.get(
                this.detail.audioPlayerUrls[index ? index : this.detail.playIndex]
            )
        },

        // Audio Queue Creation
        extractReviewAudioUrls() {
            console.log('this.isLastReviewWordSame() in extractReviewAudioUrls', this.isLastReviewWordSame())

            let paraphraseId = this.detail.paraphraseVO.paraphraseId
            let wordId = this.detail.paraphraseVO.wordId
            let wordCharacter = this.detail.paraphraseVO.wordCharacter
            let ukPronunciationUrl = this.assemblePronunciationUrl(false)
            let usPronunciationUrl = this.assemblePronunciationUrl(true)

            if (this.isDownloadReviewAudio) {
                let ch2EnUrls = audioUtil.extractedCh2EnUrls(
                    this.isLastReviewWordSame(),
                    paraphraseId,
                    wordId,
                    ukPronunciationUrl,
                    usPronunciationUrl,
                    wordCharacter,
                    this.detail.paraphraseVO.exampleVOList
                )
                let en2ChUrls = audioUtil.extractedEn2ChUrls(
                    this.isLastReviewWordSame(),
                    paraphraseId,
                    wordId,
                    ukPronunciationUrl,
                    usPronunciationUrl,
                    wordCharacter,
                    this.detail.paraphraseVO.exampleVOList
                )
                return this.mergeAndFilter(ch2EnUrls, en2ChUrls)
            } else {
                if (this.isChToEn) {
                    return audioUtil.extractedCh2EnUrls(
                        this.isLastReviewWordSame(),
                        paraphraseId,
                        wordId,
                        ukPronunciationUrl,
                        usPronunciationUrl,
                        wordCharacter,
                        this.detail.paraphraseVO.exampleVOList
                    )
                } else {
                    return audioUtil.extractedEn2ChUrls(
                        this.isLastReviewWordSame(),
                        paraphraseId,
                        wordId,
                        ukPronunciationUrl,
                        usPronunciationUrl,
                        wordCharacter,
                        this.detail.paraphraseVO.exampleVOList
                    )
                }
            }
        },

        // Audio Event Listeners
        setSoundListener(sound, token) {
            const that = this

            sound.addEventListener('ended', async function () {
                that.isReviewPlaying = false

                if (that.isChToEn) {
                    let sleepMs = audioUtil.acquireCh2EnIndexSleepMsMap().get(that.detail.playIndex)
                    if (sleepMs) {
                        that.$message.success('停留3秒时间，请在脑海联想对应的单词或句子')
                        await that.sleep(sleepMs).then(() => {
                            if (that.detail.playIndex === 1) {
                                that.detail.showWord = true
                            }
                        })
                    }
                }

                if (token !== that.detail.audioPlayerToken || that.isReviewStop) {
                    return
                }

                console.log('Audio ended, moving to next:', that.detail.playIndex)
                if (++that.detail.playIndex < that.detail.audioPlayerUrls.length) {
                    that.detail.audioPlayer = that.getCurrentAudioPlayer()
                    that.detail.audioPlayer.play()
                } else {
                    ++that.playWordIndex
                }
            })

            sound.addEventListener('play', function () {
                that.isReviewPlaying = true
                that.detail.reviewLoading = false
            })

            sound.addEventListener('pause', function () {
                that.isReviewPlaying = false
            })

            sound.addEventListener('error', function () {
                that.isReviewPlaying = false
                that.detail.reviewLoading = false
                console.error('Audio playback error')
            })
        },

        // Audio Queue Management
        async createReviseQueue(token) {
            if (token !== this.detail.audioPlayerToken) {
                return []
            }

            if (this.isDownloadReviewAudio) {
                this.$message.success(`${this.detail.paraphraseVO.wordName} audio resources is downloading`, 4000)
            }

            let urls = this.extractReviewAudioUrls()
            console.log('Extracting URLs:', urls)

            await audioUtil.rebuildUrls(urls)
            console.log('URLs rebuilt:', urls)

            this.detail.audioPlayerUrls = urls

            if (this.isDownloadReviewAudio) {
                let msg = `${this.detail.paraphraseVO.wordName} audio resources successfully downloaded`
                this.$message.success(msg, 4000)
                console.log(msg)
            }

            this.detail.playIndex = 0

            for (let i = 0; i < this.detail.audioPlayerUrls.length; i++) {
                let sound = this.detail.audioPlayerMap.get(urls[i])

                if (sound === null || sound === undefined) {
                    sound = new Audio(urls[i])

                    if (!this.isChToEn) {
                        if (!this.isLastReviewWordSame() && i < this.audioVolumes.en2Ch.length) {
                            sound.volume = this.audioVolumes.en2Ch[i]
                        } else if (this.isLastReviewWordSame() && i < this.audioVolumes.en2ChWhenLastIsSame.length) {
                            sound.volume = this.audioVolumes.en2ChWhenLastIsSame[i]
                        }
                    }

                    sound.loop = false
                    this.setSoundListener(sound, token)
                    this.detail.audioPlayerMap.set(urls[i], sound)
                }
            }
        },

        // Skip Audio Functionality
        skipSomeAudio() {
            console.log('Skip some audio')
            this.pauseAllPlayingAudio()

            const isFirstSkip = this.detail.skippedCount % 2 === 0
            this.detail.skippedCount++

            let skipIndex

            if (!this.isChToEn) {
                if (this.isLastReviewWordSame()) {
                    skipIndex = isFirstSkip ?
                        this.audioConstants.skipWorkSpellingIndexWhenLastIsSameEn2Ch :
                        this.audioConstants.skipWorkSpellingIndexWhenLastIsSameEn2Ch_2nd
                } else {
                    skipIndex = isFirstSkip ?
                        this.audioConstants.skipWorkSpellingIndexEn2Ch :
                        this.audioConstants.skipWorkSpellingIndexEn2Ch_2nd
                }
            } else {
                if (this.isLastReviewWordSame()) {
                    skipIndex = isFirstSkip ?
                        this.audioConstants.skipWorkSpellingIndexWhenLastIsSameCh2En :
                        this.audioConstants.skipWorkSpellingIndexWhenLastIsSameCh2En_2nd
                } else {
                    skipIndex = isFirstSkip ?
                        this.audioConstants.skipWorkSpellingIndexCh2En :
                        this.audioConstants.skipWorkSpellingIndexCh2En_2nd
                }
            }

            this.detail.playIndex = skipIndex
            this.detail.audioPlayer = this.getCurrentAudioPlayer(skipIndex)
            this.detail.audioPlayer.play()
        },

        // NoSleep Management
        enableNoSleepMode() {
            if (!this.detail.isEnableNoSleepMode) {
                this.detail.isEnableNoSleepMode = true
                noSleep.enable()
            }
        },

        disableNoSleepMode() {
            if (this.detail.isEnableNoSleepMode) {
                this.detail.isEnableNoSleepMode = false
                noSleep.disable()
            }
        },

        // Cleanup Methods
        async cleanRevising() {
            this.reviseAudioCandidates = []
            this.detail.firstReviewWord = null
            this.detail.secondReviewWord = null
            this.detail.paraphraseVO = {}
            this.detail.dialogVisible = false
            this.detail.audioPlayerToken = new Date().getTime()
            this.detail.audioPlayerMap.clear()
        },

        async cleanDetailRevising() {
            await this.stopPlaying()
            await this.cleanRevising()
        },

        async cleanInitRevising() {
            await this.stopPlaying()
            await this.cleanRevising()
            this.detail.showIndex = 0
            this.playWordIndex = 0
            this.listItems = []
            if (this.isChToEn) {
                this.detail.showWord = false
            }
        },

        // Utility Methods
        isLastReviewWordSame() {
            return this.detail.firstReviewWord === this.detail.secondReviewWord
        },

        handoffReviewWordSame() {
            this.detail.firstReviewWord = this.detail.secondReviewWord
            this.detail.secondReviewWord = this.detail.paraphraseVO.wordName
        },

        async sleep(ms) {
            return new Promise(resolve => setTimeout(resolve, ms))
        },

        mergeAndFilter(arr1, arr2) {
            // Utility method to merge and filter arrays
            const combined = [...arr1, ...arr2]
            return [...new Set(combined)] // Remove duplicates
        }
    }
}