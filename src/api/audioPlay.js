import kiwiConsts from '@/const/kiwiConsts'
import webSite from '@/const/website'
import review from '@/api/review'
import {getStore, setStore} from '@/util/store'

export default {
    isIos() {
        return 'iPhone' === navigator.platform || 'iPod' === navigator.platform || 'iPad' === navigator.platform
    },
    playWordDetail(wordInfo, audio) {
        let wordName = wordInfo.wordName + ''
        let wordAlphabet = ''
        for (let i = 0; i < wordName.length; i++) {
            wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
        }
        let characterVOList = wordInfo.characterVOList
        let wordOtherText = ''
        let textStart = '接下来播报的单词是:'
        for (let i = 0; i < characterVOList.length; i++) {
            let wordCharacterVO = characterVOList[i]
            wordOtherText += '词性' + wordCharacterVO.wordCharacter + '。'
            if (!wordCharacterVO.wordLabel && '' !== wordCharacterVO.wordLabel) {
                wordOtherText += '词性标签是：' + wordCharacterVO.wordLabel + '。'
            }
            let paraphraseVOList = wordCharacterVO.paraphraseVOList
            wordOtherText += '词义有' + paraphraseVOList.length + '个。'
            for (let j = 0; j < paraphraseVOList.length; j++) {
                let wordParaphraseVO = paraphraseVOList[j]
                wordOtherText += `词义${j + 1}的英文解释为：${wordParaphraseVO.paraphraseEnglish}。`
                wordOtherText += `再读一遍英文解释：${wordParaphraseVO.paraphraseEnglish}。`
                wordOtherText += `对应的中文词义是：${wordParaphraseVO.meaningChinese}。`
                wordOtherText += `再读一遍英文解释：${wordParaphraseVO.paraphraseEnglish}。`
            }
        }

        let text = `
    ${textStart}${wordName}。
     ${wordName}。
    单词拼写是：${wordAlphabet}。
     ${wordName}。
    再读一次拼写：${wordAlphabet}。
     ${wordName}。
    单词的词性有${characterVOList.length}个。
    ${wordOtherText}
    `
        this.playText(text, audio)
    },

    getPlayWordText(wordInfo) {
        let wordName = wordInfo.wordName + ''
        let wordAlphabet = ''
        for (let i = 0; i < wordName.length; i++) {
            wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
        }
        let characterVOList = wordInfo.characterVOList
        let wordOtherText = ''
        let textStart = '接下来播报的单词是:'
        for (let i = 0; i < characterVOList.length; i++) {
            let wordCharacterVO = characterVOList[i]
            wordOtherText += '词性' + wordCharacterVO.wordCharacter + '。'
            if (!wordCharacterVO.wordLabel && '' !== wordCharacterVO.wordLabel) {
                wordOtherText += '词性标签是：' + wordCharacterVO.wordLabel + '。'
            }
            let paraphraseVOList = wordCharacterVO.paraphraseVOList
            wordOtherText += '词义有' + paraphraseVOList.length + '个。'
            for (let j = 0; j < paraphraseVOList.length; j++) {
                let wordParaphraseVO = paraphraseVOList[j]
                wordOtherText += `词义${j + 1}的英文解释为：${wordParaphraseVO.paraphraseEnglish}。`
                wordOtherText += `再读一遍英文解释：${wordParaphraseVO.paraphraseEnglish}。`
                wordOtherText += `对应的中文词义是：${wordParaphraseVO.meaningChinese}。`
                wordOtherText += `再读一遍英文解释：${wordParaphraseVO.paraphraseEnglish}。`
            }
        }

        return {
            textStart: textStart,
            wordAlphabet: wordAlphabet,
            wordOtherText: wordAlphabet
        }
    },

    playText2Audio(text) {
        let audio = new Audio();
        audio.src = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=' + webSite.baiduTtsToken + '&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
        audio.volume = 0.7
        audio.play()
    },

    playText(text, audio) {
        audio.volume = 1
    },

    createAudioForChinese(audio, text) {
        if (text === '') {
            text = null
        }
        return this.createAudioFromTextPlus(0, audio, text ? text : '中文释义缺失', false);
    },

    createAudioForEnglish(apiKey, audio, text) {
        if (text === '') {
            text = null
        }
        return this.createAudioFromTextPlus(apiKey, audio, text ? text : 'English text missing', true)
    },

    createAudioFromTextPlus(apiKey, audio, text, isEnglish) {
        let url = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=d0:18:98:13:93:1e&tok=' + webSite.baiduTtsToken + '&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3&vol=4'
        if (isEnglish) {
            review.increaseCounter(kiwiConsts.REVIEW_DAILY_COUNTER_TYPE.REVIEW_AUDIO_TTS_VOICERSS)
            audio.volume = 1
            review.increaseApiKeyUsedTime(apiKey)
            url = `https://api.voicerss.org/?key=${apiKey}&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=${encodeURI(text)}`
        } else {
            review.increaseCounter(kiwiConsts.REVIEW_DAILY_COUNTER_TYPE.REVIEW_AUDIO_TTS_BAIDU)
            audio.volume = 0.7
        }
        console.log('text ' + text)
        console.log('url ' + url)
        audio.src = url
        // 播放完成之后注意删除掉
        // document.body.appendChild(audio)
        console.log('audio >>>')
        console.log(audio)
        return audio
    },

    validateReviewAudio(audio, sourceId, type) {
        audio.volume = 1
        let url = `/wordBiz/word/review/downloadReviewAudio/${sourceId}/${type}`
        console.log('url ' + url)
        audio.src = url
        console.log('audio >>>')
        console.log(audio)
        return audio
    },

    async selectApiKeyForVoiceRss() {
        let ttsApiKey = getStore({name: kiwiConsts.CACHE_KEY.TT_API_KEY})
        if (ttsApiKey === undefined || ttsApiKey === null || ttsApiKey === 'undefined' || ttsApiKey === kiwiConsts.API_KEY_VOICE_RSS.AUTO) {
            await review.autoSelectApiKey().then(resp => {
                ttsApiKey = resp.data.data
                console.log('autoSelectApiKey is ' + ttsApiKey)
            });
        }
        console.log('apiKey is ' + ttsApiKey)
        if (ttsApiKey === null || ttsApiKey === undefined || ttsApiKey.length < 20) {
            alert('当前没有TTS KEY可用')
            window.location.reload()
        }
        setStore({
            name: kiwiConsts.CACHE_KEY.TTS_CURRENT_API_KEY,
            content: ttsApiKey,
            type: 'local'
        })
        return ttsApiKey;
    },

    getWordAlphabet(wordName) {
        let wordAlphabet = ''
        for (let i = 0; i < wordName.length; i++) {
            wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
        }
        return wordAlphabet
    }

}