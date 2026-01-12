// Method 1: Pure Utility Functions (Recommended)
// utils/languageUtils.js
import kiwiConsts from "@/const/kiwiConsts";
import {getStore, setStore} from "@/util/store";

/**
 * Save language setting for a specific mode
 * @param {string} mode - The search mode
 * @param {string} language - The language code
 */
export function saveLanguageForMode(mode, language) {
    const modeSpecificKey = mode + '-' + kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE;
    setStore({
        name: modeSpecificKey,
        content: language,
        type: 'local'
    });
}

/**
 * Get language setting for a specific mode
 * @param {string} mode - The search mode
 * @returns {string} - The language code
 */
export function getInitialSelectedLanguage(route, fallbackMode = kiwiConsts.SEARCH_DEFAULT_MODE) {
    // Check for language parameter in URL first
    const languageFromUrl = route?.query?.language;
    if (languageFromUrl) {
        return decodeURIComponent(languageFromUrl);
    }

    const currentMode = route?.query?.selectedMode
        ? decodeURIComponent(route.query.selectedMode)
        : fallbackMode;

    return getLanguageForMode(currentMode);
}

export function getLanguageForMode(mode) {
    const modeSpecificKey = mode + '-' + kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE;
    const storedLanguage = getStore({ name: modeSpecificKey });
    console.log('getLanguageForMode', modeSpecificKey, storedLanguage);

    if (storedLanguage) {
        return storedLanguage;
    }

    // Fallback to default language
    return kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese;
}