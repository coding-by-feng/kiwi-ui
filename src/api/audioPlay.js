import kiwiConsts from '@/const/kiwiConsts'
import webSite from '@/const/website'

export default {
  isIos () {
    return 'iPhone' === navigator.platform || 'iPod' === navigator.platform || 'iPad' === navigator.platform
  },
  playWordDetail (wordInfo, audio) {
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

  getPlayWordText (wordInfo) {
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

  playText2Audio (text) {
    return this.playText(text, new Audio())
  },

  playText (text, audio) {
    // let url = 'https://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&text=' + encodeURI(text)
    // let url = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=' +  webSite.baiduTtsToken +'&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
    audio.src = 'https://api.voicerss.org/?key=02df0a8f48b641548ec4224c24ebff0e&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=' + encodeURI(text)
    audio.volume = 1
  },

  playTextPlus (reviewCount, text, audio) {
    if (reviewCount > kiwiConsts.DEFAULT_MAX_REVIEW_COUNT_FOR_VOICE_RSS) {
      audio.src = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=' +  webSite.baiduTtsToken +'&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
      audio.volume = 0.7
    } else {
      audio.src = 'https://api.voicerss.org/?key=02df0a8f48b641548ec4224c24ebff0e&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=' + encodeURI(text)
      audio.volume = 1
    }
  },

  /* Refactor the code */

  createAudioFromText (audio, text, isEnglish) {
    let url = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=' +  webSite.baiduTtsToken +'&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3&vol=4'
    if (isEnglish) {
      // url = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=' +  webSite.baiduTtsToken +'&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
      url = 'https://api.voicerss.org/?key=02df0a8f48b641548ec4224c24ebff0e&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=' + encodeURI(text)
      audio.volume = 1
    } else {
      audio.volume = 0.7
    }
    console.log('text ' + text)
    console.log('url ' + url)
    audio.src = url
    // 播放完成之后注意删除掉
    // document.body.appendChild(audio)
    return audio
  },
  createAudioFromTextPlus (reviewCount, audio, text, isEnglish) {
    let url = 'https://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=d0:18:98:13:93:1e&tok=' +  webSite.baiduTtsToken +'&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3&vol=4'
    if (isEnglish) {
      if (reviewCount > kiwiConsts.DEFAULT_MAX_REVIEW_COUNT_FOR_VOICE_RSS) {
        audio.volume = 0.7
      } else {
        url = 'https://api.voicerss.org/?key=02df0a8f48b641548ec4224c24ebff0e&r=-2&hl=en-us&v=Mary&c=MP3&f=16khz_16bit_stereo&src=' + encodeURI(text)
        audio.volume = 1
      }
    } else {
      audio.volume = 0.7
    }
    console.log('text ' + text)
    console.log('url ' + url)
    audio.src = url
    // 播放完成之后注意删除掉
    // document.body.appendChild(audio)
    return audio
  },

  getWordAlphabet (wordName) {
    let wordAlphabet = ''
    for (let i = 0; i < wordName.length; i++) {
      wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
    }
    return wordAlphabet
  }

}