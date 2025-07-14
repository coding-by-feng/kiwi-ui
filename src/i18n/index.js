import Vue from 'vue'
import VueI18n from 'vue-i18n'
import {getStore, setStore} from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

// Import language files
import en from './locales/en'
import zhCN from './locales/zh-CN'
import zhTW from './locales/zh-TW'
import ja from './locales/ja'
import ko from './locales/ko'
import fr from './locales/fr'
import de from './locales/de'
import es from './locales/es'

// Import Element UI locales
import enLocale from 'element-ui/lib/locale/lang/en'
import zhCNLocale from 'element-ui/lib/locale/lang/zh-CN'
import zhTWLocale from 'element-ui/lib/locale/lang/zh-TW'
import jaLocale from 'element-ui/lib/locale/lang/ja'
import koLocale from 'element-ui/lib/locale/lang/ko'
import frLocale from 'element-ui/lib/locale/lang/fr'
import deLocale from 'element-ui/lib/locale/lang/de'
import esLocale from 'element-ui/lib/locale/lang/es'

Vue.use(VueI18n)

const messages = {
    'en': {
        ...en,
        el: enLocale.el
    },
    'zh-CN': {
        ...zhCN,
        el: zhCNLocale.el
    },
    'zh-TW': {
        ...zhTW,
        el: zhTWLocale.el
    },
    'ja': {
        ...ja,
        el: jaLocale.el
    },
    'ko': {
        ...ko,
        el: koLocale.el
    },
    'fr': {
        ...fr,
        el: frLocale.el
    },
    'de': {
        ...de,
        el: deLocale.el
    },
    'es': {
        ...es,
        el: esLocale.el
    }
}

// Get saved locale or determine from browser/translation language
function getInitialLocale() {
    // First check if user has saved preference
    const savedLocale = getStore({ name: kiwiConsts.CONFIG_KEY.UI_LANGUAGE })
    if (savedLocale && messages[savedLocale]) {
        return savedLocale
    }

    // Check current translation language and map to UI language
    const translationLang = getStore({ name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE }) ||
        getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG })

    const langMapping = {
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.English]: 'en',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese]: 'zh-CN',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Traditional_TW_Chinese]: 'zh-TW',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Traditional_HK_Chinese]: 'zh-TW',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Japanese]: 'ja',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Korean]: 'ko',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.French]: 'fr',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.German]: 'de',
        [kiwiConsts.TRANSLATION_LANGUAGE_CODE.Spanish]: 'es'
    }

    if (translationLang && langMapping[translationLang]) {
        return langMapping[translationLang]
    }

    // Fallback to browser language
    const browserLang = navigator.language || navigator.userLanguage
    const shortLang = browserLang.split('-')[0]

    // Check exact match first
    if (messages[browserLang]) {
        return browserLang
    }

    // Check short language code matches
    const availableLanguages = Object.keys(messages)
    const matchingLang = availableLanguages.find(lang => lang.startsWith(shortLang))

    return matchingLang || 'en' // Default to English
}

const locale = getInitialLocale()

// Save initial locale
setStore({
    name: kiwiConsts.CONFIG_KEY.UI_LANGUAGE,
    content: locale,
    type: 'local'
})

export const i18n = new VueI18n({
    locale,
    fallbackLocale: 'en',
    messages,
    silentTranslationWarn: process.env.NODE_ENV === 'production',
    silentFallbackWarn: process.env.NODE_ENV === 'production'
})

// Language switching function
export function setLanguage(lang) {
    if (messages[lang]) {
        i18n.locale = lang
        setStore({
            name: kiwiConsts.CONFIG_KEY.UI_LANGUAGE,
            content: lang,
            type: 'local'
        })

        // Update document language attribute
        document.querySelector('html').setAttribute('lang', lang)

        return lang
    }
    return i18n.locale
}

// Get available languages
export function getAvailableLanguages() {
    return Object.keys(messages).map(code => ({
        code,
        name: messages[code].language.nativeName,
        englishName: messages[code].language.englishName
    }))
}

// Set initial document language
document.querySelector('html').setAttribute('lang', locale)

export default i18n