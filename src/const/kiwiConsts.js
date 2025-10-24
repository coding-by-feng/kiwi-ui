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
        BGM: 'bgm',
        SELECTED_LANGUAGE: 'selected_language',
        SUBTITLES_TRANSLATION_SELECTED_LANGUAGE: 'subtitles_translation_selected_language',
        IF_SUBTITLES_TRANSLATION: 'if_subtitles_translation',
        NATIVE_LANG: 'native_lang',
        UI_LANGUAGE: 'ui_language', // Add UI language key
        CLIPBOARD_DETECTION: 'clipboard_detection',
        SUBTITLES_AUTO_CENTER: 'subtitles_auto_center', // New: persist subtitles auto-center preference
        // New: hotkey configuration keys
        SEARCH_MODE_HOTKEYS: 'search_mode_hotkeys',
        // New: feature tabs enable/disable map
        ENABLED_TABS: 'enabled_tabs',
        // New: onboarding/guided tour completion flag
        ONBOARDING_TOUR_DONE: 'onboarding_tour_done'
    },

    // Default visibility for feature tabs. Users can override in settings.
    DEFAULT_ENABLED_TABS: Object.freeze({
        starList: true,
        todo: true,
        youtube: true,
        about: true,
        aiHistory: true // New: AI History tab enabled by default
    }),

    DB_NAME: 'KIWI_VOCABULARY',
    DB_STORE_NAME: 'REVIEW_AUDIO_STORE',
    DB_VERSION: 1,

    SUCCESS: 'S',
    FAIL: 'F',

    SEARCH_DEFAULT_MODE: 'detail',
    ROUTER_VIEW_DEFAULT_MODE: 'detail',
    ROUTER_VIEW_AI_MODE: 'aiResponseDetail',
    ROUTER_VIEW_AI_HISTORY_MODE: 'aiCallHistory',

    SEARCH_MODES: {
        DETAIL: {label: 'Dictionary', value: 'detail'}
    },

    SEARCH_AI_MODES: {
        DIRECTLY_TRANSLATION: {label: 'Direct Translation', value: 'directly-translation'},
        TRANSLATION_AND_EXPLANATION: {label: 'Explanation', value: 'translation-and-explanation'},
        GRAMMAR_EXPLANATION: {label: 'Grammar Explanation', value: 'grammar-explanation'},
        GRAMMAR_CORRECTION: {label: 'Grammar Correction', value: 'grammar-correction'},
        VOCABULARY_EXPLANATION: {label: 'Vocabulary Explanation', value: 'vocabulary-explanation'},
        SYNONYM: {label: 'Synonym', value: 'synonym'},
        ANTONYM: {label: 'Antonym', value: 'antonym'},
        VOCABULARY_ASSOCIATION: {label: 'Vocabulary Association', value: 'vocabulary-association'},
        PHRASES_ASSOCIATION: {label: 'Phrases Association', value: 'phrases-association'},
        // New modes
        VOCABULARY_CHARACTER_EXPANSION: { label: 'Vocabulary Character Expansion', value: 'vocabulary-character-expansion' },
        AMBIGUOUS_ASSOCIATION_CORRECTION: { label: 'Ambiguous Association Correction', value: 'ambiguous-association-correction' }
    },

    SEARCH_MODES_DATA: Object.freeze({
        DICTIONARY: {label: 'Dictionary', value: 'detail', width: '110px'},
        DIRECT_TRANSLATION: {label: 'Direct Translation', value: 'directly-translation', width: '140px'},
        TRANSLATION_AND_EXPLANATION: {
            label: 'Explanation',
            value: 'translation-and-explanation',
            width: '190px'
        },
        GRAMMAR_EXPLANATION: {label: 'Grammar Explanation', value: 'grammar-explanation', width: '170px'},
        GRAMMAR_CORRECTION: {label: 'Grammar Correction', value: 'grammar-correction', width: '160px'},
        VOCABULARY_EXPLANATION: {label: 'Vocabulary Explanation', value: 'vocabulary-explanation', width: '180px'},
        SYNONYM: {label: 'Synonym', value: 'synonym', width: '100px'},
        ANTONYM: {label: 'Antonym', value: 'antonym', width: '100px'},
        VOCABULARY_ASSOCIATION: {label: 'Vocabulary Association', value: 'vocabulary-association', width: '155px'},
        PHRASES_ASSOCIATION: {label: 'Phrases Association', value: 'phrases-association', width: '145px'},
        // New modes with approximate widths
        VOCABULARY_CHARACTER_EXPANSION: { label: 'Vocabulary Character Expansion', value: 'vocabulary-character-expansion', width: '230px' },
        AMBIGUOUS_ASSOCIATION_CORRECTION: { label: 'Ambiguous Association Correction', value: 'ambiguous-association-correction', width: '240px' }
    }),

    // Default hotkeys: use Ctrl+Shift+Number to switch modes quickly
    // These can be overridden by saving a custom mapping to CONFIG_KEY.SEARCH_MODE_HOTKEYS
    DEFAULT_SEARCH_MODE_HOTKEYS: Object.freeze({
        '1': 'detail',                         // Dictionary
        '2': 'directly-translation',           // Direct Translation
        '3': 'translation-and-explanation',    // Explanation
        '4': 'grammar-explanation',            // Grammar Explanation
        '5': 'grammar-correction',             // Grammar Correction
        '6': 'vocabulary-explanation',         // Vocabulary Explanation
        '7': 'synonym',                        // Synonym
        '8': 'antonym',                        // Antonym
        '9': 'vocabulary-association',         // Vocabulary Association
        '0': 'phrases-association'             // Phrases Association
    }),

    // Default hotkeys (new format): mapping of normalized combo strings to modes.
    // Normalized combo format: 'Ctrl+Shift+1', 'Meta+Shift+1', 'Alt+S', 'Ctrl+Alt+G', etc.
    // This coexists with legacy DEFAULT_SEARCH_MODE_HOTKEYS (digit->mode) for backward compatibility.
    DEFAULT_SEARCH_HOTKEY_BINDINGS: Object.freeze({
        'Ctrl+Shift+1': 'detail',
        'Meta+Shift+1': 'detail',
        'Ctrl+Shift+2': 'directly-translation',
        'Meta+Shift+2': 'directly-translation',
        'Ctrl+Shift+3': 'translation-and-explanation',
        'Meta+Shift+3': 'translation-and-explanation',
        'Ctrl+Shift+4': 'grammar-explanation',
        'Meta+Shift+4': 'grammar-explanation',
        'Ctrl+Shift+5': 'grammar-correction',
        'Meta+Shift+5': 'grammar-correction',
        'Ctrl+Shift+6': 'vocabulary-explanation',
        'Meta+Shift+6': 'vocabulary-explanation',
        'Ctrl+Shift+7': 'synonym',
        'Meta+Shift+7': 'synonym',
        'Ctrl+Shift+8': 'antonym',
        'Meta+Shift+8': 'antonym',
        'Ctrl+Shift+9': 'vocabulary-association',
        'Meta+Shift+9': 'vocabulary-association',
        'Ctrl+Shift+0': 'phrases-association',
        'Meta+Shift+0': 'phrases-association'
        // Users can add custom bindings for new modes via settings
    }),

    TOGGLE: {
        OFF: 'off',
        ON: 'on'
    },

    INPUT_TYPE: {
        TEXT: 'text',
        TEXTAREA: 'textarea'
    },

    TRANSLATION_LANGUAGE_CODE: {
        English: 'EN',
        Simplified_Chinese: 'ZH_CN',
        Traditional_TW_Chinese: 'ZH_TW',
        Traditional_HK_Chinese: 'ZH_HK',
        Thai: 'TH',
        Japanese: 'JA',
        Korean: 'KO',
        French: 'FR',
        German: 'DE',
        Spanish: 'ES',
        Italian: 'IT',
        Portuguese: 'PT',
        Russian: 'RU',
        Vietnamese: 'VI',
        Polish: 'PL',
        Danish: 'DA',
        Finnish: 'FI',
        Swedish: 'SV',
        Dutch: 'NL',
        Norwegian: 'NO',
        Greek: 'EL'
    },

    // UI Language mapping to locale codes
    UI_LANGUAGE_MAPPING: {
        'EN': 'en',
        'ZH_CN': 'zh-CN',
        'ZH_TW': 'zh-TW',
        'ZH_HK': 'zh-TW',
        'TH': 'th',
        'JA': 'ja',
        'KO': 'ko',
        'FR': 'fr',
        'DE': 'de',
        'ES': 'es'
    },

    SEARCH_PLACEHOLDER_SUGGESTIONS: {
        DICTIONARY: 'input vocabulary',
        DIRECTLY_TRANSLATION: 'input anything',
        TRANSLATION_AND_EXPLANATION: 'input anything',
        GRAMMAR_EXPLANATION: 'input anything',
        GRAMMAR_CORRECTION: 'input anything',
        SYNONYM: 'input vocabulary',
        ANTONYM: 'input vocabulary',
        VOCABULARY_ASSOCIATION: 'input anything',
        PHRASES_ASSOCIATION: 'input anything',
        // New modes
        VOCABULARY_CHARACTER_EXPANSION: 'input anything',
        AMBIGUOUS_ASSOCIATION_CORRECTION: 'input anything'
    },

    SUBTITLES_TYPE: {
        SMALL_AUTO_GENERATED_VTT_RETURN_STRING: "auto_generated_return_string",
        LARGE_AUTO_GENERATED_VTT_RETURN_LIST: "auto_generated_return_list",
        SMALL_PROFESSIONAL_SRT_RETURN_STRING: "small_professional_return_string",
        LARGE_PROFESSIONAL_SRT_RETURN_LIST: "large_professional_return_list"
    },

    YTB_MODE: {
        PLAYER: 'player',
        CHANNEL: 'channel',
        FAVORITES: 'favorites'
    },

    AI_MODE_TAG: {
        SPLITTER: '#[SPLITTER]',
        SELECTION_EXPLANATION: '#[SM]'
    },

    // Add these constants to your kiwiConsts.js file

    CLIPBOARD_DETECTION: {
        ENABLE: 'enable',
        DISABLE: 'disable'
    }

}