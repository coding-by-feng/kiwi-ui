import request from '@/router/axios'
import kiwiConst from '@/const/kiwiConsts'

export default {

    getReviewCounterVO(type) {
        return request({
            url: `/wordBiz/word/review/getReviewCounterVO/${type}`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    increaseCounter(type) {
        return request({
            url: `/wordBiz/word/review/increaseCounter/${type}`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    increaseApiKeyUsedTime(apiKey) {
        return request({
            url: `/wordBiz/word/review/increaseApiKeyUsedTime/${apiKey}`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    async isDeprecateApiKeyToday(apiKey) {
        console.log('isDeprecateApiKeyToday, apiKey is ' + apiKey)
        let flag = false
        await this.testVoiceRss(apiKey).then(resp => {
            if (resp && resp.startWith('ERROR: ')) {
                flag = true
            }
        })
        return flag;
    },

    testVoiceRss(apiKey) {
        console.log('testVoiceRss, apiKey = ' + apiKey)
        return request({
            url: `https://api.voicerss.org/?key=${apiKey}&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=test`,
            headers: {
                'Access-Control-Allow-Origin': '*',
                isToken: false,
            },
            method: 'get'
        })
    },

    autoSelectApiKey() {
        return request({
            url: `/wordBiz/word/review/autoSelectApiKey`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    getAllReviewCounterVO() {
        return request({
            url: `/wordBiz/word/review/getAllReviewCounterVO`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    getReviewBreakpointPageNumber(listId) {
        return request({
            url: `/wordBiz/word/review/getReviewBreakpointPageNumber/${listId}`,
            headers: {
                isToken: true,
                'Content-Type': 'application/json'
            },
            method: 'get'
        })
    },

    translateWordCharacter(wordCharacter) {
        let result = kiwiConst.WORD_CHARACTER_TRANSLATE_MAP.get(wordCharacter)
        if (result && result.length > 0) {
            return result
        }
        result = '词性翻译缺失'
        return result
    },

}




