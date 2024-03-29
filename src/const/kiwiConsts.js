export default {

  DEFAULT_MAX_REVIEW_COUNT_FOR_VOICE_RSS: 50,

  PRONUNCIATION_SOURCE: {
    CAMBRIDGE: 'Cambridge',
    LOCAL: 'Local'
  },

  REVIEW_DAILY_COUNTER_TYPE: {
    REMEMBER: 1,
    KEEP_IN_MIND: 2,
    REVIEW: 3
  },

  /**
   * 导播模式，是否附带中文导播
   * 1：去除中文导播
   * 2：附带中文导播
   */
  REVIEW_TYPE: {
    ONLY_ENGLISH: 1,
    WITH_CHINESE: 2,
  },

  /**
   * 英文释义播报模式，是否附带英文释义
   * 1：去除英文释义
   * 2：附带英文释义
   */
  ENGLISH_PARAPHRASE_TYPE: {
    DISABLE: 1,
    ENABLE: 2
  },

  /**
   * 是否播放单词拼写
   * 1：去除单词拼写
   * 2：附带单词拼写
   */
  SPELL_TYPE: {
    DISABLE: 1,
    ENABLE: 2
  },

  /**
   * 是否播放例句
   * 1：开启
   * 2：关闭
   */
  IS_PLAY_EXAMPLE: {
    ENABLE: 1,
    DISABLE: 2
  },

  /**
   * 词性类别
   */
  WORD_CHARACTER: {
    PHRASE: 'phrase'
  },

  WORD_CHARACTER_TRANSLATE_MAP: new Map()
    .set('adjective', '形容词')
    .set('adj', '形容词')
    .set('noun', '名词')
    .set('verb', '动词')
    .set('adverb', '副词')
    .set('conjunction', '连词')
    .set('plural', '名词复数形式')
    .set('preposition', '介词或者前置词')
    .set('phrase', '短语')

}