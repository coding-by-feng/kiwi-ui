import kiwiConsts from '@/const/kiwiConsts'
import { getStore } from '@/util/store'

const DEFAULT_PRESERVE_KEYS = ['source', 'ytbMode']

const hasValue = value => value !== undefined && value !== null && value !== ''

/**
 * Build a minimal query payload for the AI tab, ensuring only required keys
 * are retained and values are sourced from overrides, route query, or sensible
 * defaults.
 *
 * @param {Object} params
 * @param {string} params.text - The raw (unencoded) text to send.
 * @param {Vue['$route']} params.route - Current route for fallback values.
 * @param {Object} [params.overrides] - Explicit values that should take
 * precedence over route/query defaults.
 * @param {string[]} [params.preserveKeys] - Additional query keys that should
 * be copied over when present (e.g. `source`, `ytbMode`).
 * @returns {Record<string, string>} Normalized query parameters.
 */
export function buildAiTabQuery({ text = '', route, overrides = {}, preserveKeys = DEFAULT_PRESERVE_KEYS } = {}) {
  const routeQuery = { ...(route?.query || {}) }
  const sanitizedText = typeof text === 'string' ? text.trim() : ''
  const encodedText = overrides.originalText || encodeURIComponent(sanitizedText)

  const pickValue = (key, fallback) => {
    if (hasValue(overrides[key])) return overrides[key]
    if (hasValue(routeQuery[key])) return routeQuery[key]
    return fallback
  }

  const languageFallback = getStore({ name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE })
    || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
  const nativeLanguageFallback = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG })
    || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese

  const query = {
    active: pickValue('active', 'search'),
    selectedMode: pickValue('selectedMode', kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value),
    language: pickValue('language', languageFallback),
    nativeLanguage: pickValue('nativeLanguage', nativeLanguageFallback),
    originalText: encodedText
  }

  const keysToPreserve = Array.isArray(preserveKeys) && preserveKeys.length > 0
    ? preserveKeys
    : DEFAULT_PRESERVE_KEYS

  keysToPreserve.forEach(key => {
    const overrideValue = overrides[key]
    const value = hasValue(overrideValue) ? overrideValue : routeQuery[key]
    if (hasValue(value)) {
      query[key] = value
    }
  })

  return query
}

export default {
  buildAiTabQuery
}
