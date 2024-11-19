export default {

    SITES: {
        VOICE_RSS: 'https://api.voicerss.org'
    },

    PRONUNCIATION_SOURCE: {
        CAMBRIDGE: 'Cambridge',
        LOCAL: 'Local'
    },

    STORE_TYPE: {
        LOCAL: 'local'
    },

    IS_NOT_CACHE: {
        TRUE: true,
        FALSE: false
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
        DISABLE: 0,
        ENABLE: 1
    },

    /**
     * 英文释义播报模式，是否附带英文释义
     * 1：去除英文释义
     * 2：附带英文释义
     */
    ENABLE_MSG_HINT: {
        DISABLE: 0,
        ENABLE: 1
    },

    ENABLE_BGM: {
        DISABLE: 0,
        ENABLE: 1
    },

    /**
     * 是否播放单词拼写
     * 1：去除单词拼写
     * 2：附带单词拼写
     */
    SPELL_TYPE: {
        DISABLE: 0,
        ENABLE: 1
    },

    /**
     * 是否播放例句
     * 1：开启
     * 2：关闭
     */
    IS_PLAY_EXAMPLE: {
        ENABLE: 1,
        DISABLE: 0
    },

    IS_EN_TO_EN: {
        ENABLE: true,
        DISABLE: false
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

    REVIEW_AUDIO_TYPE: {
        WORD_SPELLING: 0,
        PARAPHRASE_EN: 1,
        PARAPHRASE_CH: 2,
        EXAMPLE_EN: 3,
        EXAMPLE_CH: 4,
        CHARACTER_EN: 6,
        CHARACTER_CH: 7,
        NON_REVIEW_SPELL: 8,
        PRONUNCIATION: 9,
        PHRASE_PRONUNCIATION: 10
    },

    DOWNLOAD_REVIEW_AUDIO_URL_PREFIX: 'https://www.kiwidict.com/wordBiz/word/review/downloadReviewAudio/',

    REVIEW_MODEL: {
        STOCK_REVIEW: 'stockReview',
        STOCK_READ: 'stockRead',
        ENHANCE_REVIEW: 'enhanceReview',
        ENHANCE_READ: 'enhanceRead',
        DOWNLOAD_REVIEW_AUDIO: 'downloadReviewAudio'
    },

    GRAMMAR_EN_TO_CH_HINT: new Map()
        .set('article', '冠词')
        .set('simple-present-tense', '一般现在时')
        .set('simple-past-tense', '一般过去时')
        .set('simple-future-tense', '一般将来时')
        .set('present-progressive', '现在进行时')
        .set('past-continuous-tense', '过去进行时')
        .set('future-continuous-tense', '将来进行时')
        .set('the-present-perfect', '现在完成时')
        .set('the-past-perfect', '过去完成时')
        .set('the-future-perfect', '将来完成时')
        .set('characteristic-of-the-continuous-tense', '进行时态的特性')
        .set('present-perfect-continuous-tense', '现在完成进行时')
        .set('past-perfect-continuous-tense', '过去完成进行时')
        .set('future-perfect-continuous-tense', '将来完成进行时')
        .set('simple-sentences-and-complex-sentences', '简单句和复杂句')
        .set('subjunctive-mood', '虚拟语气')
        .set('modal-1', '情态动词第一部分')
        .set('modal-2', '情态动词第二部分')
        .set('nominal-clause', '名词从句')
        .set('attributive-clause-1', '定语从句第一部分')
        .set('attributive-clause-2', '定语从句第二部分')
        .set('attributive-clause-3', '定语从句第三部分')
        .set('adverbial-clause', '状语从句'),

    CONFIG_KEY: {
        PRONUNCIATION_SOURCE: 'pronunciation_source',
        REVIEW_TYPE: 'review_type',
        SPELL_TYPE: 'spell_type',
        EN_PARA_TYPE: 'enPara_type',
        ENABLE_MSG_HINT: 'enable_msg_hint',
        IS_PLAY_EXAMPLE: 'is_play_example',
        IS_EN_TO_EN: 'is_en_to_en',
        BGM: 'bgm'
    },

    DB_NAME: 'KIWI_VOCABULARY',
    DB_STORE_NAME: 'REVIEW_AUDIO_STORE',
    DB_VERSION: 1,

    SUCCESS: 'S',
    FAIL: 'F'

}