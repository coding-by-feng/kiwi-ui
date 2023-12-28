import kiwiConst from '@/const/kiwiConsts'
import {getStore} from '@/util/store'
import cacheUtil from "@/util/cacheUtil";

let CH2_EN_INDEX_SLEEP_MS_MAP = null
const IS_PLAY_EXAMPLE = getStore({name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE})

export default {

    extractedEn2ChUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        let wordSpellingUrl = this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING)
        let paraphraseChUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH)
        let paraphraseEnUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN)
        let characterUrl = this.assembleCharacterReviseAudioUrl(characterCode)

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
            urls.push(wordSpellingUrl)
        }
        urls.push(characterUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)

        let isExampleInvalid = IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0
        console.log('extractedEn2ChUrls')
        console.log('exampleList: ', exampleList)
        console.log('isExampleInvalid: ', isExampleInvalid)
        if (isExampleInvalid) {
            return urls
        }
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

        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

        if (exampleList.length === 1) {
            urls.push(exampleChUrl0)
            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
        } else {
            let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH)
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN)

            urls.push(exampleChUrl0)
            urls.push(exampleChUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleEnUrl0)
            urls.push(exampleChUrl0)
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
        return `/wordBiz/word/review/downloadReviewAudio/${sourceId}/${type}`
    },

    assembleCharacterReviseAudioUrl(characterCode) {
        return `/wordBiz/word/review/character/downloadReviewAudio/${characterCode}`
    },

    assembleReviseAudioFile(sourceId, type) {
        let blob = cacheUtil.get(cacheUtil.buildReviewAudioKey(sourceId, type))
        if (!blob) {
            return null
        }
        return new Window.File([blob], `${sourceId}_${type}.mp3`, {type: 'blob'})
    }

}