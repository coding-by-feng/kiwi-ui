/**
 * Gemini API Client
 *
 * Direct Gemini API integration for frontend AI calls.
 * Uses streaming for real-time response display.
 */

import { getStore, setStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'
import { GEMINI_PROMPTS, buildPromptFromTemplate } from '@/const/geminiPromptTemplates'

// Simple encryption/decryption for API key storage
// Note: This is basic obfuscation, not secure encryption
const OBFUSCATION_KEY = 'kiwi-gemini-2024'

function obfuscateKey(key) {
  if (!key) return ''
  try {
    // Simple XOR obfuscation with base64 encoding
    let result = ''
    for (let i = 0; i < key.length; i++) {
      result += String.fromCharCode(key.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
    }
    return btoa(result)
  } catch (e) {
    console.warn('Failed to obfuscate key:', e)
    return ''
  }
}

function deobfuscateKey(obfuscated) {
  if (!obfuscated) return ''
  try {
    const decoded = atob(obfuscated)
    let result = ''
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ OBFUSCATION_KEY.charCodeAt(i % OBFUSCATION_KEY.length))
    }
    return result
  } catch (e) {
    console.warn('Failed to deobfuscate key:', e)
    return ''
  }
}

/**
 * Get the stored Gemini API key
 * @returns {string} The API key or empty string
 */
export function getGeminiApiKey() {
  const obfuscated = getStore({ name: kiwiConsts.CONFIG_KEY.GEMINI_API_KEY })
  return deobfuscateKey(obfuscated)
}

/**
 * Store the Gemini API key (obfuscated)
 * @param {string} apiKey - The API key to store
 */
export function setGeminiApiKey(apiKey) {
  const obfuscated = obfuscateKey(apiKey)
  setStore({
    name: kiwiConsts.CONFIG_KEY.GEMINI_API_KEY,
    content: obfuscated,
    type: 'local'
  })
}

/**
 * Check if direct Gemini mode is enabled
 * @returns {boolean}
 */
export function isGeminiEnabled() {
  const provider = getStore({ name: kiwiConsts.CONFIG_KEY.AI_PROVIDER })
  return provider === kiwiConsts.AI_PROVIDER.DIRECT_GEMINI
}

/**
 * Get the current AI provider setting
 * @returns {string} 'backend' or 'gemini'
 */
export function getAiProvider() {
  // Default to Direct Gemini API for new users
  return getStore({ name: kiwiConsts.CONFIG_KEY.AI_PROVIDER }) || kiwiConsts.AI_PROVIDER.DIRECT_GEMINI
}

/**
 * Set the AI provider
 * @param {string} provider - 'backend' or 'gemini'
 */
export function setAiProvider(provider) {
  setStore({
    name: kiwiConsts.CONFIG_KEY.AI_PROVIDER,
    content: provider,
    type: 'local'
  })
}

/**
 * Build the full prompt for Gemini API based on the mode
 * @param {string} promptMode - The AI mode (e.g., 'directly-translation')
 * @param {string} userPrompt - The user's input text
 * @param {string} targetLanguage - Target language code
 * @param {string} nativeLanguage - Native language code
 * @returns {string} The full prompt to send to Gemini
 */
function buildFullPrompt(promptMode, userPrompt, targetLanguage, nativeLanguage) {
  // Handle selection-explanation mode specially
  if (promptMode === 'selection-explanation') {
    // Parse the special format: #[SM]selectedText#[SPLITTER]contextText
    const splitter = kiwiConsts.AI_MODE_TAG.SPLITTER
    const selectionTag = kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION

    let selectedText = userPrompt
    let contextText = ''

    if (userPrompt.startsWith(selectionTag)) {
      const withoutTag = userPrompt.substring(selectionTag.length)
      const parts = withoutTag.split(splitter)
      selectedText = parts[0] || ''
      contextText = parts[1] || ''
    } else if (userPrompt.includes(splitter)) {
      const parts = userPrompt.split(splitter)
      selectedText = parts[0] || ''
      contextText = parts[1] || ''
    }

    const template = GEMINI_PROMPTS['selection-explanation']
    const systemPrompt = buildPromptFromTemplate(template, {
      targetLanguage,
      nativeLanguage,
      selectedText,
      contextText
    })

    return systemPrompt
  }

  // Get the template for the mode
  const template = GEMINI_PROMPTS[promptMode]
  if (!template) {
    // Fallback to direct translation if mode not found
    console.warn(`Prompt template not found for mode: ${promptMode}, using directly-translation`)
    const fallbackTemplate = GEMINI_PROMPTS['directly-translation']
    const systemPrompt = buildPromptFromTemplate(fallbackTemplate, { targetLanguage, nativeLanguage })
    return `${systemPrompt}\n\nUser prompt: ${userPrompt}`
  }

  // Build the system prompt with language replacements
  const systemPrompt = buildPromptFromTemplate(template, { targetLanguage, nativeLanguage })

  // Combine system prompt with user input
  return `${systemPrompt}\n\nUser prompt: ${userPrompt}`
}

/**
 * Parse Gemini streaming response chunk
 * The response can be:
 * 1. A JSON array containing candidate objects
 * 2. Individual JSON objects separated by newlines/commas
 * @param {string} chunk - Raw chunk from stream
 * @returns {Object} Parsed result with text property
 */
function parseGeminiChunk(chunk) {
  const result = { text: '', done: false }

  if (!chunk) return result

  try {
    const trimmed = chunk.trim()

    // First, try to parse as a complete JSON array
    if (trimmed.startsWith('[')) {
      try {
        const dataArray = JSON.parse(trimmed)
        if (Array.isArray(dataArray)) {
          for (const data of dataArray) {
            extractTextFromCandidate(data, result)
          }
          return result
        }
      } catch (e) {
        // Not a complete JSON array yet, try other methods
      }
    }

    // Try to parse as a single JSON object
    if (trimmed.startsWith('{')) {
      try {
        const data = JSON.parse(trimmed)
        extractTextFromCandidate(data, result)
        return result
      } catch (e) {
        // Not a complete JSON object
      }
    }

    // Handle streaming chunks with multiple JSON objects separated by newlines
    const lines = chunk.split('\n').filter(line => line.trim())

    for (const line of lines) {
      try {
        // Handle array wrapper that Gemini sometimes uses
        let jsonStr = line.trim()

        // Skip empty lines or array markers
        if (!jsonStr || jsonStr === '[' || jsonStr === ']' || jsonStr === ',') continue

        // Remove leading/trailing array brackets and commas
        if (jsonStr.startsWith('[')) {
          jsonStr = jsonStr.substring(1).trim()
        }
        if (jsonStr.endsWith(']')) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 1).trim()
        }
        if (jsonStr.startsWith(',')) {
          jsonStr = jsonStr.substring(1).trim()
        }
        if (jsonStr.endsWith(',')) {
          jsonStr = jsonStr.substring(0, jsonStr.length - 1).trim()
        }

        if (!jsonStr || !jsonStr.startsWith('{')) continue

        const data = JSON.parse(jsonStr)
        extractTextFromCandidate(data, result)
      } catch (parseError) {
        // Individual line parse error, continue to next
        continue
      }
    }
  } catch (e) {
    console.warn('Failed to parse Gemini chunk:', e)
  }

  return result
}

/**
 * Extract text content from a Gemini candidate object
 * @param {Object} data - Parsed JSON object from Gemini response
 * @param {Object} result - Result object to append text to
 */
function extractTextFromCandidate(data, result) {
  if (!data || !data.candidates || !data.candidates[0]) return

  const candidate = data.candidates[0]
  if (candidate.content && candidate.content.parts) {
    for (const part of candidate.content.parts) {
      if (part.text) {
        result.text += part.text
      }
    }
  }
  // Check if finished
  if (candidate.finishReason) {
    result.done = true
  }
}

/**
 * Test if a Gemini API key is valid
 * @param {string} apiKey - The API key to test
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function testGeminiApiKey(apiKey) {
  if (!apiKey) {
    return { success: false, error: 'API key is required' }
  }

  const config = kiwiConsts.GEMINI_CONFIG
  const url = `${config.ENDPOINT}/${config.MODEL}:generateContent?key=${apiKey}`

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Say "OK" to confirm the API is working.' }] }],
        generationConfig: {
          maxOutputTokens: 10
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      let errorMessage = `API Error: ${response.status}`
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        // Use default error message
      }
      return { success: false, error: errorMessage }
    }

    const data = await response.json()
    if (data.candidates && data.candidates.length > 0) {
      return { success: true }
    }

    return { success: false, error: 'Unexpected response format' }
  } catch (e) {
    return { success: false, error: e.message || 'Connection failed' }
  }
}

/**
 * Create a Gemini streaming request
 * This function mirrors the interface of createAIStream from sseClient.js
 *
 * @param {Object} options - Configuration options
 * @param {Object} options.body - Request body
 * @param {string} options.body.prompt - The user's prompt
 * @param {string} options.body.promptMode - AI mode (e.g., 'directly-translation')
 * @param {string} options.body.targetLanguage - Target language code
 * @param {string} options.body.nativeLanguage - Native language code
 * @param {Object} options.callbacks - Event callbacks
 * @param {Function} options.callbacks.onStarted - Called when streaming starts
 * @param {Function} options.callbacks.onChunk - Called for each text chunk
 * @param {Function} options.callbacks.onCompleted - Called when streaming completes
 * @param {Function} options.callbacks.onError - Called on error
 * @returns {Object} { abort: Function }
 */
export function createGeminiStream(options = {}) {
  const {
    body = {},
    callbacks = {}
  } = options

  const controller = new AbortController()

  // Get API key
  const apiKey = getGeminiApiKey()
  if (!apiKey) {
    if (callbacks.onError) {
      callbacks.onError({
        message: 'Gemini API key not configured. Please add your API key in Settings.',
        errorCode: 'NO_API_KEY'
      })
    }
    return { abort: () => {} }
  }

  // Build the full prompt
  const fullPrompt = buildFullPrompt(
    body.promptMode,
    body.prompt,
    body.targetLanguage,
    body.nativeLanguage
  )

  // Gemini streaming endpoint
  const config = kiwiConsts.GEMINI_CONFIG
  const url = `${config.ENDPOINT}/${config.MODEL}:streamGenerateContent?key=${apiKey}`

  // Start the streaming request
  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: {
        temperature: config.TEMPERATURE,
        maxOutputTokens: config.MAX_OUTPUT_TOKENS
      }
    }),
    signal: controller.signal
  })

  fetchPromise
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        let errorMessage = `Gemini API Error: ${response.status}`
        try {
          const errorData = JSON.parse(errorText)
          if (errorData.error && errorData.error.message) {
            errorMessage = errorData.error.message
          }
        } catch (e) {
          // Use default error message
        }
        throw new Error(errorMessage)
      }

      // Signal that streaming has started
      if (callbacks.onStarted) {
        callbacks.onStarted({})
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullResponse = ''
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process the buffer - Gemini returns JSON array format
        const parsed = parseGeminiChunk(buffer)
        if (parsed.text) {
          fullResponse += parsed.text
          if (callbacks.onChunk) {
            callbacks.onChunk(parsed.text)
          }
          // Clear buffer after successful parse
          buffer = ''
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const parsed = parseGeminiChunk(buffer)
        if (parsed.text) {
          fullResponse += parsed.text
          if (callbacks.onChunk) {
            callbacks.onChunk(parsed.text)
          }
        }
      }

      // Signal completion
      if (callbacks.onCompleted) {
        callbacks.onCompleted({ fullResponse })
      }
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        // Request was aborted, don't treat as error
        return
      }
      if (callbacks.onError) {
        callbacks.onError({
          message: error.message || 'Gemini API connection error',
          errorCode: 'GEMINI_ERROR'
        })
      }
    })

  return {
    abort: () => controller.abort()
  }
}

export default {
  getGeminiApiKey,
  setGeminiApiKey,
  isGeminiEnabled,
  getAiProvider,
  setAiProvider,
  testGeminiApiKey,
  createGeminiStream
}
