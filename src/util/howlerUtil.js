import kiwiConst from '@/const/kiwiConsts'
import {getStore} from '@/util/store'

let CH2_EN_INDEX_SLEEP_MS_MAP = null
const IS_PLAY_EXAMPLE = getStore({name: 'is_play_example'})

export default {

    extractedEn2ChUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        let wordSpellingUrl = this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING);
        let paraphraseChUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH);
        let paraphraseEnUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN);
        let characterUrl = this.assembleCharacterReviseAudioUrl(characterCode);

        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl);
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl);
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

        let isExampleInvalid = IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0;
        if (isExampleInvalid) {
            return urls;
        }
        for (let example in exampleList) {
            if (!example.exampleTranslate) {
                isExampleInvalid = true
                break
            }
        }
        if (isExampleInvalid) {
            return urls;
        }

        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH);
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN);

        if (exampleList.length === 1) {
            urls.push(exampleChUrl0);
            urls.push(exampleChUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
        } else {
            let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH);
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN);

            urls.push(exampleChUrl0);
            urls.push(exampleChUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleChUrl0);
            urls.push(exampleEnUrl1);
            urls.push(exampleEnUrl1);
        }
        return urls;
    },

    acquireCh2EnIndexSleepMsMap() {
        if (CH2_EN_INDEX_SLEEP_MS_MAP === null) {
            CH2_EN_INDEX_SLEEP_MS_MAP = new Map()
                .set(0, 3000)
                .set(1, 3000)
                .set(17, 3000)
        }
        return CH2_EN_INDEX_SLEEP_MS_MAP;
    },

    extractedCh2EnUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        let wordSpellingUrl = this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING);
        let paraphraseChUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH);
        let paraphraseEnUrl = this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN);
        let characterUrl = this.assembleCharacterReviseAudioUrl(characterCode);

        urls.push(paraphraseChUrl)
        urls.push(paraphraseChUrl)
        urls.push(characterUrl)
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl);
            urls.push(wordSpellingUrl)
            urls.push(wordSpellingUrl)
        }
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(wordSpellingUrl);
            urls.push(wordSpellingUrl)
        }
        urls.push(characterUrl)
        urls.push(paraphraseChUrl)
        urls.push(paraphraseEnUrl)
        urls.push(paraphraseEnUrl)
        if (IS_PLAY_EXAMPLE === kiwiConst.IS_PLAY_EXAMPLE.DISABLE || !exampleList || exampleList.length === 0) {
            return urls;
        }

        let exampleChUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH);
        let exampleEnUrl0 = this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN);

        if (exampleList.length === 1) {
            urls.push(exampleChUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
        } else {
            let exampleChUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH);
            let exampleEnUrl1 = this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN);

            urls.push(exampleChUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleEnUrl0);
            urls.push(exampleChUrl1);
            urls.push(exampleEnUrl1);
            urls.push(exampleEnUrl1);
        }
        return urls;
    },

    assembleReviseAudioUrl(sourceId, type) {
        return `/wordBiz/word/review/downloadReviewAudio/${sourceId}/${type}`
    },

    assembleCharacterReviseAudioUrl(characterCode) {
        return `/wordBiz/word/review/character/downloadReviewAudio/${characterCode}`;
    }

}