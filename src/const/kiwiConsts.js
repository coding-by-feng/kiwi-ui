export default {

    SITES: {
        VOICE_RSS: 'https://api.voicerss.org'
    },

    DEFAULT_MAX_REVIEW_COUNT_FOR_VOICE_RSS: 350,

    PRONUNCIATION_SOURCE: {
        CAMBRIDGE: 'Cambridge',
        LOCAL: 'Local'
    },

    REVIEW_DAILY_COUNTER_TYPE: {
        REMEMBER: 1,
        KEEP_IN_MIND: 2,
        REVIEW: 3,
        REVIEW_AUDIO_TTS_BAIDU: 4,
        REVIEW_AUDIO_TTS_VOICERSS: 5,
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
        .set('phrase', '短语'),

    API_KEY_VOICE_RSS: {
        AUTO: '自动选择',
        KEY1: '02df0a8f48b641548ec4224c24ebff0e',
        KEY2: '0e3c0a35570543249f743f74c027ef8b',
        KEY3: 'a65b84ea89b14011af581b3335e40d63',
        KEY4: '587527ea30b44778b6bbca2bcac95f38',
        KEY5: '664f011d4efc4937b4d75a8b962f0323',
        KEY6: '59a1e3301e4943edaab90166e3c1aafb',
        KEY7: '58d4baef52414088998cbbda9751c8e2'
    },

    CACHE_KEY: {
        TT_API_KEY: 'tts_api_key'
    },

}