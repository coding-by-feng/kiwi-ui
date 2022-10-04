import kiwiConst from '@/const/kiwiConsts'

let CH2_EN_INDEX_SLEEP_MS_MAP = null

export default {

    extractedEn2ChUrls: function (lastIsSame, paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING));
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        }
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        if (!lastIsSame) {
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING));
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
            urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        }
        urls.push(this.assembleCharacterReviseAudioUrl(characterCode))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN))
        if (!exampleList || exampleList.length === 0) {
            return urls;
        }
        if (exampleList.length === 1) {
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
        } else {
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
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

    extractedCh2EnUrls: function (paraphraseId, wordId, ukPronunciationUrl, usPronunciationUrl, characterCode, exampleList) {
        let urls = []
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleCharacterReviseAudioUrl(characterCode))
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING));
        urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        urls.push(ukPronunciationUrl)
        urls.push(usPronunciationUrl)
        urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        urls.push(this.assembleReviseAudioUrl(wordId, kiwiConst.REVIEW_AUDIO_TYPE.WORD_SPELLING))
        urls.push(this.assembleCharacterReviseAudioUrl(characterCode))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_CH))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN))
        urls.push(this.assembleReviseAudioUrl(paraphraseId, kiwiConst.REVIEW_AUDIO_TYPE.PARAPHRASE_EN))
        if (!exampleList || exampleList.length === 0) {
            return urls;
        }
        if (exampleList.length === 1) {
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
        } else {
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[0].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_CH));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
            urls.push(this.assembleReviseAudioUrl(exampleList[1].exampleId, kiwiConst.REVIEW_AUDIO_TYPE.EXAMPLE_EN));
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