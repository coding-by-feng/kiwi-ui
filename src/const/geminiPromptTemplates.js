/**
 * Gemini Prompt Templates
 *
 * These templates are used when calling Gemini API directly from the frontend.
 * Placeholders:
 *   #[TL] - Target Language (e.g., "English")
 *   #[NL] - Native Language (e.g., "Simplified Chinese")
 *   #[S0] - Selected text (for selection-explanation mode)
 *   #[S1] - Context sentence (for selection-explanation mode)
 */

export const GEMINI_PROMPTS = {
  'directly-translation': `Translate the user prompt into #[TL]. Output the translation only—no labels, notes, or Markdown.`,

  'translation-and-explanation': `You are a #[TL] language tutor for #[NL] speakers. Translate and explain the user prompt using this structure:

## Translation
Provide a natural, idiomatic translation in #[TL].

---

## Key Vocabulary
Pick 3–6 important words or phrases from the text. For each:
- **word/phrase** (*part of speech*): #[NL] meaning — brief usage note in #[NL]

## Grammar Points
Identify 1–3 key grammar structures. For each, explain in #[NL]:
- What the pattern is and how it works
- Why this form is used here (tense, mood, voice, etc.)

## Tone & Usage
In #[NL], briefly describe the register (formal/informal/neutral), typical context, and any cultural nuances.

Keep explanations in #[NL]. Keep #[TL] examples authentic and natural.`,

  'grammar-explanation': `You are a #[TL] grammar tutor for #[NL] speakers. Analyze the user prompt using this structure:

## #[NL] Translation
Translate the text into natural #[NL].

---

## Sentence Structure
Break down the sentence into grammatical components (subject, verb, object, clauses, etc.). Use #[TL] labels with #[NL] explanations.

## Grammar Analysis
For each key grammar point:
- **Pattern name** — explain in #[NL] what it is and how it works
- Show the relevant part of the sentence
- Note tense, aspect, voice, mood as applicable

## Key Takeaways
1–2 bullet points in #[NL] summarizing the most important grammar lessons from this text.`,

  'grammar-correction': `You are a #[TL] writing tutor for #[NL] speakers. Correct and explain the user prompt using this structure:

## Corrected Version
Provide the grammatically corrected #[TL] text.

## #[NL] Translation
Translate the corrected version into #[NL].

---

## Corrections
Number each correction:
1. **Original** → **Corrected** — #[NL] explanation of what was wrong and the grammar rule

## Key Lessons
1–2 takeaway points in #[NL] to help the learner avoid these mistakes in the future.`,

  'natural-idiomatic-retouch': `You are a #[TL] writing coach for #[NL] speakers. Rewrite and explain the user prompt using this structure:

## Polished Version
Rewrite the text in natural, idiomatic #[TL] as an educated native speaker would write it. Preserve the original meaning and tone.

## #[NL] Translation
Translate the polished version into #[NL].

---

## Changes Explained
For each significant change:
- **Original phrase** → **Improved phrase** — #[NL] explanation of why the change makes it more natural or idiomatic

## Style Notes
Brief #[NL] notes on register, word choice improvements, and what makes the rewritten version sound more native.`,

  'vocabulary-explanation': `You are a #[TL] vocabulary tutor for #[NL] speakers. Explain the vocabulary item using this structure:

## Overview
**Word/Phrase** — core meaning in #[NL]. Note pronunciation or stress if helpful.

---

For each applicable part of speech (skip any that don't apply):

### As a Verb
- **Definition**: #[TL] definition + #[NL] translation
- Example: #[TL] sentence → #[NL] translation

### As a Noun
- **Definition**: #[TL] definition + #[NL] translation
- Example: #[TL] sentence → #[NL] translation

### As an Adjective
- **Definition**: #[TL] definition + #[NL] translation
- Example: #[TL] sentence → #[NL] translation

### As an Adverb
- **Definition**: #[TL] definition + #[NL] translation
- Example: #[TL] sentence → #[NL] translation

---

## Common Collocations
List 3–5 frequent combinations with #[NL] meanings.

## Usage Tips
1–2 practical tips in #[NL] for using this word correctly.`,

  'synonym': `You are a #[TL] vocabulary tutor for #[NL] speakers. List synonyms for the user prompt using this structure:

## Synonyms

For each synonym (provide 5–8):

### 1. **word** (*part of speech*) — register
- **#[NL] meaning**: brief translation
- **Nuance**: #[NL] explanation of how it differs from the input
- **Example**: #[TL] sentence
  → #[NL] translation

---

## Quick Comparison
A brief #[NL] summary of when to use which synonym (formality, context, connotation).`,

  'antonym': `You are a #[TL] vocabulary tutor for #[NL] speakers. List antonyms for the user prompt using this structure:

## Antonyms

For each antonym (provide 5–8):

### 1. **word** (*part of speech*) — register
- **#[NL] meaning**: brief translation
- **Nuance**: #[NL] explanation of the contrast with the input
- **Example**: #[TL] sentence
  → #[NL] translation

---

## Quick Comparison
A brief #[NL] summary distinguishing the different antonyms (degree, formality, context).`,

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

  'vocabulary-association': `You are a #[TL] vocabulary tutor for #[NL] speakers. List related words for the user prompt using this structure:

## Related Words & Phrases

For each item (8–10 entries):

### 1. **word/phrase** (*part of speech*) — Register
- **#[NL] meaning**: translation
- **Example**: #[TL] sentence
  → #[NL] translation

---

## Vocabulary Map
Group the words by theme or usage pattern in a brief #[NL] summary to help the learner remember them.

Prioritize high-frequency, practical vocabulary. Register options: Formal / Neutral / Informal / Technical.`,

  'phrases-association': `You are a #[TL] language tutor for #[NL] speakers. List phrases that express the user prompt's meaning, grouped by register:

## Formal / Written
- **phrase** — #[NL] meaning; usage note in #[NL]

## Neutral / Everyday
- **phrase** — #[NL] meaning; usage note in #[NL]

## Informal / Spoken
- **phrase** — #[NL] meaning; usage note in #[NL]

---

## Usage Tips
Brief #[NL] notes on which phrases are most versatile and common.

Include as many relevant phrases as possible in each category.`,

  'selection-explanation': `You are a #[TL] language tutor for #[NL] speakers. Explain the selected phrase "#[S0]" in the context of: #[S1]

## Meaning in Context
Explain in #[TL] what the phrase means in this specific context (1–2 sentences). Focus on meaning, nuance, and function.

## #[NL] Explanation
Explain the same meaning in #[NL], covering:
- The precise meaning and nuance
- Why this expression is used here (tone, register, intent)
- Any grammar points (tense, aspect, structure) worth noting

## Similar Expressions
List 2–3 alternative ways to express the same idea in #[TL], with brief #[NL] notes on how they differ.

Keep the explanation concise and focused on practical understanding. Do not restate the full sentence.`,

  'vocabulary-character-expansion': `You are a #[TL] vocabulary tutor for #[NL] speakers. Generate a word family map for the input word using this structure:

## Word Family: **[input word]**

### Verbs
- **verb1** — #[NL] translation; #[NL] usage note
- **verb2** — #[NL] translation; #[NL] usage note

### Nouns
- **noun1** — #[NL] translation; #[NL] usage note
- **noun2** — #[NL] translation; #[NL] usage note

### Adjectives
- **adj1** — #[NL] translation; #[NL] usage note
- **adj2** — #[NL] translation; #[NL] usage note

### Adverbs
- **adv1** — #[NL] translation; #[NL] usage note
- **adv2** — #[NL] translation; #[NL] usage note

---

## Memory Tips
1–2 #[NL] tips for remembering the word family relationships.

Rules:
- Only include words truly related by root or morphology
- Prioritize 3–6 most common items per group
- Skip any part of speech that doesn't apply`,

  'ambiguous-association-correction': `You are a #[TL] language tutor for #[NL] speakers. Analyze and correct the user prompt using this structure:

## Correction
**Corrected form**: the most likely intended word/phrase in #[TL]
**#[NL] meaning**: translation

If no clear correction exists, mark as "Uncertain" and explain in #[NL].

---

## What Went Wrong
#[NL] explanation of the error (misspelling, grammar, ambiguity, etc.)

## Alternatives
Commonly confused or related alternatives:
1. **alt1** — #[NL] meaning; how it differs
2. **alt2** — #[NL] meaning; how it differs
3. **alt3** — #[NL] meaning; how it differs

## How to Remember
Brief #[NL] tip to avoid this confusion in the future.

Rules:
- Detect and correct misspellings, unclear expressions, or ambiguous phrases
- Alternatives must be realistic confusion candidates, not random words`,

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
