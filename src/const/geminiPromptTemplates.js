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

  'translation-and-explanation': `Translate the user prompt into #[TL] on the first line. Then, in #[NL], give a thorough explanation covering word choice, tone/register, key grammar, and cultural/usage notes. No Markdown or extra headers.`,

  'grammar-explanation': `Translate the user prompt into #[NL]. Then, in #[NL], explain the grammar (parts of speech, sentence structure, tense/aspect, key patterns, and tricky points). Keep it concise and clear.`,

  'grammar-correction': `1) Provide a grammatically corrected version of the text (original language). 2) Translate the corrected text into #[NL]. 3) In #[NL], explain each correction (what changed and why). Output in that order. No extra commentary.`,

  'natural-idiomatic-retouch': `Rewrite the text in #[TL] so that it is grammatically correct, natural, and idiomatic, as if written by an educated native speaker. Preserve the original meaning and tone, but improve word choice, sentence flow, and style. Output only the polished #[TL] version, with #[NL] explanations.`,

  'vocabulary-explanation': `Explain the vocabulary item in both #[TL] and #[NL]. Provide paraphrases in both languages grouped by part of speech (verb, noun, adjective, adverb, etc.). For each part of speech, give 1–3 demo sentences in #[TL] with #[NL] translations. Skip any part of speech that does not apply.`,

  'synonym': `List 5–8 common synonyms in #[TL]. For each, briefly explain the nuance in #[NL] and give one example sentence in #[TL] with a #[NL] translation. Output plain text only—no Markdown or extra commentary.`,

  'antonym': `List 5–8 common antonyms in #[TL]. For each, briefly explain the nuance in #[NL] and give one example sentence in #[TL] with a #[NL] translation. Output plain text only—no Markdown or extra commentary.`,

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

  'vocabulary-association': `List 8-10 common #[TL] words/phrases that express the user prompt's meaning.
For each word, provide in this exact format:

📖 **Word** (Part of Speech) — Register
Definition in one sentence
Translation in #[NL]
✏️ Example sentence in #[TL]
✏️ Translation of example in #[NL]

Separate each entry with a blank line.
Register options: Formal / Neutral / Informal / Technical
Prioritize high-frequency, practical vocabulary.
Do not include language labels like "EN:" or "ZH_CN:" in output.`,

  'phrases-association': `List as many common #[TL] phrases as possible that can express the user prompt's meaning. For each phrase, explain nuances, register, and usage differences in #[NL]. Group by function or context when helpful. Plain text only.`,

  'selection-explanation': `Respond only in #[TL]. Explain the selected phrase "#[S0]" strictly based on the sentence #[S1] in 1–2 concise paragraphs. No headings, labels, English, Markdown, bullet points, or backslashes. Do not restate the full sentence; focus on meaning, nuance, tense/aspect, and function in context.`,

  'vocabulary-character-expansion': `For the input word, generate a complete word-family #[TL] map including:
1) Verbs
2) Nouns
3) Adjectives
4) Adverbs

For each item, use the format:
word (#[NL] Chinese translation; #[NL] nuance or usage explanation)

Structure:
Verbs: v1 (#[NL] translation; #[NL] nuance), v2 (...), v3 (...)
Nouns: n1 (...), n2 (...)
Adjectives: a1 (...), a2 (...)
Adverbs: adv1 (...), adv2 (...)

Rules:
- Include only words that are truly related by root, morphology, or strong semantic relation
- Prioritize the most common 3–6 items in each group
- Nuance must be short, clear, and show how the word differs in use
- Output only English except for the Chinese translations
- Do not add any extra commentary outside the required structure`,

  'ambiguous-association-correction': `Correction:
Provide the corrected form of the input. If the input is misspelled, grammatically incorrect, or ambiguous, correct it or choose the most likely intended meaning. If no clear correction exists, set Correction to Unknown.

Alternatives:
List several closely related, commonly confused, or meaning-adjacent alternatives (alt1, alt2, alt3). All alternatives must be in #[TL].

Rules:
- Detect and correct misspellings, unclear expressions, or ambiguous phrases
- Always output both Correction and Alternatives
- Alternatives must be realistic confusion candidates, not random words
- If Correction is Unknown, still provide Alternatives
- Output in plain text only, no Markdown`,

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

export default {
  GEMINI_PROMPTS,
  LANGUAGE_NAMES,
  buildPromptFromTemplate
}
