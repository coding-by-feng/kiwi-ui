/**
 * Gemini Prompt Templates
 *
 * These templates are used when calling Gemini API directly from the frontend.
 * Placeholders:
 *   #[TL] - Target Language (e.g., "English")
 *   #[NL] - Native Language (e.g., "Simplified Chinese")
 *   #[S0] - Selected text (for selection-explanation mode)
 *   #[S1] - Context sentence (for selection-explanation mode)
 *
 * Global rule applied to all non-subtitle prompts:
 *   The learner is a NATIVE #[NL] speaker. Never include romanization, pinyin,
 *   furigana, or any phonetic transcription for #[NL] content.
 */

const NL_RULE = `RULES:
- The learner is a native #[NL] speaker. NEVER include romanization, pinyin, furigana, or phonetic aids for #[NL].
- Be concise. Every sentence must teach something. No filler, no redundancy, no restating what the learner can already see.
- Only provide pronunciation help for #[TL] words when non-obvious.`

export const GEMINI_PROMPTS = {
  'directly-translation': `Translate the user prompt into #[TL]. Output the translation only—no labels, notes, or Markdown.`,

  'translation-and-explanation': `#[TL] tutor for #[NL] speakers.

${NL_RULE}

## Translation
Natural #[TL] translation.

---

## Key Vocabulary
3–5 most useful words/phrases:
- **word** (*pos*): #[NL] definition — how it differs from simpler alternatives

## Grammar Points
1–2 key structures. For each in #[NL]: what the pattern is, why it's used here, and a common learner mistake.

## Tone & Usage
One #[NL] paragraph: register, context, and when a native speaker would choose this phrasing.`,

  'grammar-explanation': `#[TL] grammar tutor for #[NL] speakers.

${NL_RULE}

## #[NL] Translation
Natural #[NL] translation.

---

## Sentence Structure
Break down: subject, predicate, objects, clauses. Mark clause relationships.

## Grammar Analysis
For each key point:
- **Pattern** — #[NL]: what it is, how it works, the relevant sentence part, and how it differs from #[NL] structure

## Takeaway
1–2 #[NL] bullet points the learner should remember.`,

  'grammar-correction': `#[TL] writing tutor for #[NL] speakers.

${NL_RULE}

## Corrected Version
Corrected #[TL] text.

---

## Corrections
1. **Original** → **Corrected** — #[NL]: what rule was broken and how to avoid it

## Takeaway
1–2 #[NL] lessons to internalize.`,

  'natural-idiomatic-retouch': `#[TL] writing coach for #[NL] speakers.

${NL_RULE}

## Polished Version
Natural, idiomatic #[TL] rewrite. Preserve meaning.

---

## Changes
- **Original** → **Improved** — #[NL]: why the change sounds more native`,

  'vocabulary-explanation': `#[TL] vocabulary tutor for #[NL] speakers.

${NL_RULE}

## **Word** — #[NL] core meaning

For each applicable part of speech (skip inapplicable ones):
### As a [pos]
- #[NL] definition
- #[TL] example → #[NL]

## Collocations
3–5 common combinations with #[NL] meanings.

## Tips
1–2 #[NL] practical tips a textbook won't tell you.`,

  'synonym': `#[TL] vocabulary tutor for #[NL] speakers.

${NL_RULE}

## Synonyms (5–8, most → least similar)
- **word** (*pos*, register) — #[NL] meaning; #[NL] nuance vs input word
  #[TL] example → #[NL]

## When to Use Which
#[NL] decision guide by context.`,

  'antonym': `#[TL] vocabulary tutor for #[NL] speakers.

${NL_RULE}

## Antonyms (5–8, most → least direct)
- **word** (*pos*, register) — #[NL] meaning; #[NL] type of opposition
  #[TL] example → #[NL]

## Comparison
#[NL] summary by degree, formality, and context.`,

  'subtitle-translator': `Translate subtitle fragments line by line. CRITICAL: Maintain exact 1:1 line mapping.

RULES:
1. Each INPUT line produces exactly TWO OUTPUT lines (original + translation)
2. Do NOT merge multiple input lines into one sentence
3. Do NOT split one input line into multiple output lines
4. Translate each fragment as-is, even if incomplete
5. Add punctuation only at natural pauses within each fragment
6. Separate each pair with exactly ONE blank line

FORMAT (for each input line):
[Original #[TL] text with minimal punctuation fixes]
[#[NL] translation of that exact fragment]

[Next original #[TL] text]
[#[NL] translation]

EXAMPLE:
Input:
It's America versus China today as we
put the Tesla Model Y refresh up against
the new BYD Sealion 7

Output:
It's America versus China today as we
今天是美国对战中国，我们

put the Tesla Model Y refresh up against
将特斯拉 Model Y 改款版与

the new BYD Sealion 7
全新比亚迪海狮07进行对比

No Markdown, no labels, no extra commentary.`,

  'subtitle-retouch': `Retouch auto-generated subtitle fragments. CRITICAL: Maintain exact 1:1 line mapping.

RULES:
1. Each INPUT line produces exactly ONE OUTPUT line
2. Do NOT merge multiple input lines into one
3. Do NOT split one input line into multiple output lines
4. Fix capitalization and add punctuation ONLY at natural pauses within each fragment
5. Keep fragments as-is, even if sentences are incomplete
6. Remove redundant symbols but preserve meaning

EXAMPLE:
Input:
its america versus china today as we
put the tesla model y refresh up against

Output:
It's America versus China today as we
put the Tesla Model Y refresh up against

No Markdown, no labels, no extra commentary.`,

  'subtitle-retouch-translator': `Retouch and translate auto-generated subtitle fragments. CRITICAL: Maintain exact 1:1 line mapping.

RULES:
1. Each INPUT line produces exactly TWO OUTPUT lines (retouched original + translation)
2. Do NOT merge multiple input lines into one sentence
3. Do NOT split one input line into multiple output lines
4. Fix capitalization and add punctuation ONLY at natural pauses within each fragment
5. Translate each fragment as-is, even if the sentence is incomplete
6. Separate each pair with exactly ONE blank line
7. If a line is already in #[NL], only correct it and output without translation

FORMAT (for each input line):
[Retouched #[TL] fragment with capitalization and punctuation fixes]
[#[NL] translation of that exact fragment]

[Next retouched #[TL] fragment]
[#[NL] translation]

EXAMPLE:
Input:
its america versus china today as we
put the tesla model y refresh up against
the new byd sealion 7 to see which of

Output:
It's America versus China today as we
今天是美国对战中国，我们

put the Tesla Model Y refresh up against
将特斯拉 Model Y 改款版与

the new BYD Sealion 7 to see which of
全新比亚迪海狮07进行对比，看看哪款

No Markdown, no labels, no extra commentary.`,

  'subtitle-punctuation-only': `Add punctuation and fix capitalization to each subtitle line.

CRITICAL RULES:
1. Keep EXACTLY the same number of lines as input
2. Do NOT merge lines or split lines
3. Do NOT change word order
4. Do NOT add or remove words
5. ONLY add punctuation marks (. , ? ! ' ") and fix capitalization
6. Each output line corresponds to exactly one input line

Input format:
[line 1 text]
[line 2 text]
...

Output format (same number of lines):
[line 1 with punctuation]
[line 2 with punctuation]
...

Example:
Input:
yo your place kind of fire though
this place be phantom taxing

Output:
Yo, your place kind of fire though.
This place be phantom taxing.`,

  'vocabulary-association': `#[TL] vocabulary tutor for #[NL] speakers.

${NL_RULE}

## Related Words (8–10, grouped by relationship)
- **word** (*pos*) — #[NL] meaning; how it relates to input
  #[TL] example → #[NL]

## Vocabulary Map
#[NL] grouping by theme with learning priority. High-frequency words only.`,

  'phrases-association': `#[TL] tutor for #[NL] speakers.

${NL_RULE}

List phrases expressing the user prompt's meaning by register:

## Formal / Written
- **phrase** — #[NL] meaning; when to use

## Neutral / Everyday
- **phrase** — #[NL] meaning; when to use

## Informal / Spoken
- **phrase** — #[NL] meaning; when to use

Include many relevant phrases. No filler.`,

  'selection-explanation': `#[TL] tutor for #[NL] speakers.

${NL_RULE}

Explain "#[S0]" in context: #[S1]

## Meaning
#[NL]: what it means here, why this expression was chosen (tone, intent), and any grammar worth noting.

## Alternatives
2–3 #[TL] alternatives with #[NL] nuance differences.

Do not restate the full sentence.`,

  'vocabulary-character-expansion': `#[TL] vocabulary tutor for #[NL] speakers.

${NL_RULE}

## Word Family: **[input word]**

Group by part of speech (skip inapplicable). 3–6 per group, only morphologically related words:
- **word** — #[NL] translation; typical collocation

## Memory Tip
1 #[NL] mnemonic connecting the family by root or pattern.`,

  'ambiguous-association-correction': `#[TL] tutor for #[NL] speakers.

${NL_RULE}

## Correction
**Corrected**: intended #[TL] word/phrase — #[NL] meaning

## What Went Wrong
#[NL]: error type (misspelling, false friend, L1 interference) and why.

## Alternatives
Realistic confusion candidates only:
- **alt** — #[NL] meaning; how it differs

## How to Remember
1 #[NL] mnemonic.`,

  'conversation-generation': `Generate a natural English conversation. Output ONLY valid JSON with this structure:
{
  "topic": "A refined, concise topic title",
  "speakers": [
    {"index": 0, "name": "FirstName", "personality": "brief personality", "emoji": "avatar emoji"},
    {"index": 1, "name": "FirstName", "personality": "brief personality", "emoji": "avatar emoji"}
  ],
  "messages": [
    {"speakerIndex": 0, "text": "Message text", "emoji": "relevant emoji"},
    {"speakerIndex": 1, "text": "Response text", "emoji": "relevant emoji"}
  ]
}

Rules:
- Create distinct speaker personalities and speaking styles
- Include natural conversational elements (greetings, reactions, follow-ups)
- Each message should be 1-3 sentences, suitable for TTS
- Include one relevant emoji per message
- Make dialogue authentic and engaging
- No Markdown, no extra text outside JSON`
}

/**
 * Language code to readable name mapping
 */
export const LANGUAGE_NAMES = {
  'EN': 'English',
  'ZH_CN': 'Simplified Chinese',
  'ZH_TW': 'Traditional Chinese',
  'ZH_HK': 'Traditional Chinese (Hong Kong)',
  'JA': 'Japanese',
  'KO': 'Korean',
  'FR': 'French',
  'DE': 'German',
  'ES': 'Spanish',
  'IT': 'Italian',
  'PT': 'Portuguese',
  'RU': 'Russian',
  'TH': 'Thai',
  'VI': 'Vietnamese',
  'PL': 'Polish',
  'DA': 'Danish',
  'FI': 'Finnish',
  'SV': 'Swedish',
  'NL': 'Dutch',
  'NO': 'Norwegian',
  'EL': 'Greek'
}

/**
 * Build a prompt from template by replacing placeholders
 * @param {string} template - The prompt template
 * @param {Object} params - Parameters to replace
 * @param {string} params.targetLanguage - Target language code (e.g., 'EN')
 * @param {string} params.nativeLanguage - Native language code (e.g., 'ZH_CN')
 * @param {string} [params.selectedText] - Selected text for selection-explanation mode
 * @param {string} [params.contextText] - Context text for selection-explanation mode
 * @returns {string} The built prompt with placeholders replaced
 */
export function buildPromptFromTemplate(template, params) {
  const { targetLanguage, nativeLanguage, selectedText, contextText } = params

  const targetLangName = LANGUAGE_NAMES[targetLanguage] || targetLanguage
  const nativeLangName = LANGUAGE_NAMES[nativeLanguage] || nativeLanguage

  let result = template
    .replace(/#\[TL\]/g, targetLangName)
    .replace(/#\[NL\]/g, nativeLangName)

  if (selectedText) {
    result = result.replace(/#\[S0\]/g, selectedText)
  }
  if (contextText) {
    result = result.replace(/#\[S1\]/g, contextText)
  }

  return result
}

/**
 * Storage key for custom prompts
 */
const CUSTOM_PROMPTS_KEY = 'gemini-custom-prompts'

/**
 * AI modes that should be shown in the template editor
 * (excludes subtitle-related modes which are internal)
 */
export const EDITABLE_AI_MODES = [
  { value: 'directly-translation', label: 'Direct Translation' },
  { value: 'translation-and-explanation', label: 'Explanation' },
  { value: 'grammar-explanation', label: 'Grammar Explanation' },
  { value: 'grammar-correction', label: 'Grammar Correction' },
  { value: 'vocabulary-explanation', label: 'Vocabulary Explanation' },
  { value: 'synonym', label: 'Synonym' },
  { value: 'antonym', label: 'Antonym' },
  { value: 'vocabulary-association', label: 'Vocabulary Association' },
  { value: 'phrases-association', label: 'Phrases Association' },
  { value: 'vocabulary-character-expansion', label: 'Vocabulary Character Expansion' },
  { value: 'ambiguous-association-correction', label: 'Ambiguous Association Correction' },
  { value: 'natural-idiomatic-retouch', label: 'Natural Idiomatic Retouch' },
  { value: 'selection-explanation', label: 'Selection Explanation' }
]

/**
 * Get all custom templates from localStorage
 * @returns {Object} Custom templates object
 */
export function getCustomTemplates() {
  try {
    const stored = localStorage.getItem(CUSTOM_PROMPTS_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (e) {
    console.error('Failed to load custom templates:', e)
    return {}
  }
}

/**
 * Get template for a specific mode (custom if exists, otherwise default)
 * @param {string} mode - The AI mode
 * @returns {string} The template string
 */
export function getTemplate(mode) {
  const customTemplates = getCustomTemplates()
  if (customTemplates[mode]) {
    return customTemplates[mode]
  }
  return GEMINI_PROMPTS[mode] || ''
}

/**
 * Get the default template for a mode
 * @param {string} mode - The AI mode
 * @returns {string} The default template string
 */
export function getDefaultTemplate(mode) {
  return GEMINI_PROMPTS[mode] || ''
}

/**
 * Check if a mode has a custom template
 * @param {string} mode - The AI mode
 * @returns {boolean} True if custom template exists
 */
export function hasCustomTemplate(mode) {
  const customTemplates = getCustomTemplates()
  return !!customTemplates[mode]
}

/**
 * Save a custom template for a mode
 * @param {string} mode - The AI mode
 * @param {string} template - The custom template string
 */
export function setCustomTemplate(mode, template) {
  try {
    const customTemplates = getCustomTemplates()
    customTemplates[mode] = template
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(customTemplates))
  } catch (e) {
    console.error('Failed to save custom template:', e)
  }
}

/**
 * Reset a specific mode to default template
 * @param {string} mode - The AI mode
 */
export function resetCustomTemplate(mode) {
  try {
    const customTemplates = getCustomTemplates()
    delete customTemplates[mode]
    localStorage.setItem(CUSTOM_PROMPTS_KEY, JSON.stringify(customTemplates))
  } catch (e) {
    console.error('Failed to reset custom template:', e)
  }
}

/**
 * Reset all custom templates to defaults
 */
export function resetAllCustomTemplates() {
  try {
    localStorage.removeItem(CUSTOM_PROMPTS_KEY)
  } catch (e) {
    console.error('Failed to reset all custom templates:', e)
  }
}

export default {
  GEMINI_PROMPTS,
  LANGUAGE_NAMES,
  EDITABLE_AI_MODES,
  buildPromptFromTemplate,
  getTemplate,
  getDefaultTemplate,
  getCustomTemplates,
  hasCustomTemplate,
  setCustomTemplate,
  resetCustomTemplate,
  resetAllCustomTemplates
}
