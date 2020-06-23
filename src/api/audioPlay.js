export default {
  playWordDetail (wordInfo, audio) {
    let wordName = wordInfo.wordName + ''
    let wordAlphabet = ''
    for (let i = 0; i < wordName.length; i++) {
      wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
    }
    let wordCharacterVOList = wordInfo.wordCharacterVOList
    let wordOtherText = ''
    let textStart = '接下来播报的单词是:'
    for (let i = 0; i < wordCharacterVOList.length; i++) {
      let wordCharacterVO = wordCharacterVOList[i]
      wordOtherText += '词性' + wordCharacterVO.wordCharacter + '。'
      if (!wordCharacterVO.wordLabel && '' !== wordCharacterVO.wordLabel) {
        wordOtherText += '词性标签是：' + wordCharacterVO.wordLabel + '。'
      }
      let wordParaphraseVOList = wordCharacterVO.wordParaphraseVOList
      wordOtherText += '词义有' + wordParaphraseVOList.length + '个。'
      for (let j = 0; j < wordParaphraseVOList.length; j++) {
        let wordParaphraseVO = wordParaphraseVOList[j]
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
    单词的词性有${wordCharacterVOList.length}个。
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
    let wordCharacterVOList = wordInfo.wordCharacterVOList
    let wordOtherText = ''
    let textStart = '接下来播报的单词是:'
    for (let i = 0; i < wordCharacterVOList.length; i++) {
      let wordCharacterVO = wordCharacterVOList[i]
      wordOtherText += '词性' + wordCharacterVO.wordCharacter + '。'
      if (!wordCharacterVO.wordLabel && '' !== wordCharacterVO.wordLabel) {
        wordOtherText += '词性标签是：' + wordCharacterVO.wordLabel + '。'
      }
      let wordParaphraseVOList = wordCharacterVO.wordParaphraseVOList
      wordOtherText += '词义有' + wordParaphraseVOList.length + '个。'
      for (let j = 0; j < wordParaphraseVOList.length; j++) {
        let wordParaphraseVO = wordParaphraseVOList[j]
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
    // let url = 'http://tts.baidu.com/text2audio?lan=zh&ie=UTF-8&text=' + encodeURI(text)
    let url = 'http://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=24.97599789737006322e0c6570fe596a85.2592000.1593269970.282335-20116041&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
    audio.src = url
  },

  /* Refactor the code */

  createAudioFromText (text) {
    let url = 'http://tsn.baidu.com/text2audio?lan=zh&ctp=1&cuid=f0:18:98:13:93:1e&tok=24.97599789737006322e0c6570fe596a85.2592000.1593269970.282335-20116041&tex=' + encodeURI(text) + '&per=0&spd=5&pit=5&aue=3'
    let autoAudio = new Audio()
    autoAudio.pause()
    autoAudio.loop = false
    autoAudio.src = url
    // 播放完成之后注意删除掉
    document.body.appendChild(autoAudio)
    return autoAudio
  },

  getWordAlphabet (wordName) {
    let wordAlphabet = ''
    for (let i = 0; i < wordName.length; i++) {
      wordAlphabet += wordName.substring(i, i + 1).toUpperCase() + '。\n'
    }
    return wordAlphabet
  }

}