/**
 * SSE (Server-Sent Events) Client Utility
 *
 * Provides reusable functions for SSE streaming:
 * - POST-based SSE streaming using fetch with ReadableStream
 * - GET-based SSE streaming using EventSource
 *
 * Replaces WebSocket connections for AI streaming endpoints.
 */

import { getStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

/**
 * Parse SSE event data from a text chunk
 * @param {string} text - Raw SSE text chunk
 * @returns {Array} Array of parsed events
 */
function parseSSEEvents(text) {
  const events = []
  const lines = text.split('\n')

  let currentEvent = null
  let currentData = ''

  for (const line of lines) {
    if (line.startsWith('event:')) {
      if (currentEvent && currentData) {
        events.push({ event: currentEvent, data: currentData.trim() })
      }
      currentEvent = line.slice(6).trim()
      currentData = ''
    } else if (line.startsWith('data:')) {
      currentData += line.slice(5)
    } else if (line === '' && currentEvent && currentData) {
      events.push({ event: currentEvent, data: currentData.trim() })
      currentEvent = null
      currentData = ''
    } else if (line === '' && currentData && !currentEvent) {
      // Default event type 'message'
      events.push({ event: 'message', data: currentData.trim() })
      currentData = ''
    } else if (line.startsWith('data:') === false && line !== '' && currentData === '') {
      // Data without event prefix (simple SSE format)
      currentData = line
    }
  }

  // Handle remaining data
  if (currentData) {
    events.push({ event: currentEvent || 'message', data: currentData.trim() })
  }

  return events
}

/**
 * Create a POST-based SSE stream for AI requests
 *
 * @param {Object} options - Configuration options
 * @param {string} options.url - SSE endpoint URL (default: /api/ai/sse/stream)
 * @param {Object} options.body - Request body (prompt, promptMode, targetLanguage, nativeLanguage)
 * @param {Object} options.callbacks - Event callbacks
 * @param {Function} options.callbacks.onStarted - Called when streaming starts
 * @param {Function} options.callbacks.onChunk - Called for each chunk
 * @param {Function} options.callbacks.onCompleted - Called when streaming completes
 * @param {Function} options.callbacks.onError - Called on error
 * @returns {Object} { abort: Function } - Abort controller
 */
export function createAIStream(options = {}) {
  const {
    url = `${kiwiConsts.API_BASE.AI_BIZ}/sse/stream`,
    body = {},
    callbacks = {}
  } = options

  const controller = new AbortController()
  const token = getStore({ name: 'access_token' })

  if (!token) {
    if (callbacks.onError) {
      callbacks.onError({ message: 'Authentication token not found. Please login again.', errorCode: 'NO_TOKEN' })
    }
    return { abort: () => {} }
  }

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(body),
    signal: controller.signal
  })

  fetchPromise
    .then(async response => {
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(`HTTP ${response.status}: ${errorText}`)
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Process complete events in buffer - look for double newline (SSE event delimiter)
        // Process ALL complete events, not just the last one
        let eventEndIndex
        while ((eventEndIndex = buffer.indexOf('\n\n')) !== -1) {
          const completeData = buffer.slice(0, eventEndIndex + 2)
          buffer = buffer.slice(eventEndIndex + 2)

          const events = parseSSEEvents(completeData)
          for (const event of events) {
            processSSEEvent(event, callbacks)
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim()) {
        const events = parseSSEEvents(buffer)
        for (const event of events) {
          processSSEEvent(event, callbacks)
        }
      }
    })
    .catch(error => {
      if (error.name === 'AbortError') {
        // Request was aborted, don't treat as error
        return
      }
      if (callbacks.onError) {
        callbacks.onError({ message: error.message || 'Connection error', errorCode: 'CONNECTION_ERROR' })
      }
    })

  return {
    abort: () => controller.abort()
  }
}

/**
 * Process a parsed SSE event and call appropriate callback
 */
function processSSEEvent(event, callbacks) {
  try {
    const data = event.data ? JSON.parse(event.data) : {}

    switch (event.event) {
      case 'started':
        if (callbacks.onStarted) {
          callbacks.onStarted(data)
        }
        break
      case 'chunk':
        if (callbacks.onChunk) {
          callbacks.onChunk(data.chunk || data)
        }
        break
      case 'completed':
        if (callbacks.onCompleted) {
          callbacks.onCompleted(data)
        }
        break
      case 'error':
        if (callbacks.onError) {
          callbacks.onError(data)
        }
        break
      case 'progress':
        if (callbacks.onProgress) {
          callbacks.onProgress(data)
        }
        break
      case 'message':
        // Generic message - try to determine type from data
        if (data.type === 'chunk' && callbacks.onChunk) {
          callbacks.onChunk(data.chunk || data)
        } else if (data.type === 'completed' && callbacks.onCompleted) {
          callbacks.onCompleted(data)
        } else if (data.type === 'started' && callbacks.onStarted) {
          callbacks.onStarted(data)
        } else if (data.type === 'error' && callbacks.onError) {
          callbacks.onError(data)
        }
        break
      default:
        // Unknown event type - check data.type as fallback
        if (data.type && callbacks['on' + data.type.charAt(0).toUpperCase() + data.type.slice(1)]) {
          callbacks['on' + data.type.charAt(0).toUpperCase() + data.type.slice(1)](data)
        }
    }
  } catch (e) {
    console.warn('Failed to parse SSE event data:', event, e)
  }
}

/**
 * Create a GET-based EventSource for YouTube subtitle streaming
 *
 * @param {Object} options - Configuration options
 * @param {string} options.videoUrl - YouTube video URL
 * @param {string} options.language - Target language code
 * @param {string} options.requestType - Request type (e.g., 'translated')
 * @param {Object} options.callbacks - Event callbacks
 * @returns {Object} { eventSource: EventSource, close: Function }
 */
export function createYouTubeSubtitleStream(options = {}) {
  const {
    videoUrl,
    language,
    requestType = 'translated',
    callbacks = {}
  } = options

  const token = getStore({ name: 'access_token' })

  if (!token) {
    if (callbacks.onError) {
      callbacks.onError({ message: 'Authentication token not found. Please login again.', errorCode: 'NO_TOKEN' })
    }
    return { eventSource: null, close: () => {} }
  }

  const params = new URLSearchParams({
    videoUrl: videoUrl,
    requestType: requestType,
    language: language,
    access_token: token
  })

  const url = `${kiwiConsts.API_BASE.AI_BIZ}/sse/ytb/subtitle?${params.toString()}`
  const eventSource = new EventSource(url)

  eventSource.addEventListener('started', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (callbacks.onStarted) callbacks.onStarted(data)
    } catch (err) {
      console.warn('Failed to parse started event:', err)
    }
  })

  eventSource.addEventListener('progress', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (callbacks.onProgress) callbacks.onProgress(data)
    } catch (err) {
      console.warn('Failed to parse progress event:', err)
    }
  })

  eventSource.addEventListener('chunk', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (callbacks.onChunk) callbacks.onChunk(data.chunk || data)
    } catch (err) {
      console.warn('Failed to parse chunk event:', err)
    }
  })

  eventSource.addEventListener('completed', (e) => {
    try {
      const data = JSON.parse(e.data)
      if (callbacks.onCompleted) callbacks.onCompleted(data)
      eventSource.close()
    } catch (err) {
      console.warn('Failed to parse completed event:', err)
    }
  })

  eventSource.addEventListener('error', (e) => {
    try {
      // EventSource error event may not have data
      if (e.data) {
        const data = JSON.parse(e.data)
        if (callbacks.onError) callbacks.onError(data)
      } else if (eventSource.readyState === EventSource.CLOSED) {
        if (callbacks.onError) callbacks.onError({ message: 'Connection closed', errorCode: 'CONNECTION_CLOSED' })
      }
    } catch (err) {
      if (callbacks.onError) callbacks.onError({ message: 'Connection error', errorCode: 'CONNECTION_ERROR' })
    }
    eventSource.close()
  })

  eventSource.onerror = (e) => {
    // Handle connection errors
    if (eventSource.readyState === EventSource.CLOSED) {
      if (callbacks.onConnectionError) {
        callbacks.onConnectionError('Connection was closed')
      }
    } else {
      if (callbacks.onConnectionError) {
        callbacks.onConnectionError('Connection error, will auto-retry')
      }
    }
  }

  return {
    eventSource,
    close: () => {
      eventSource.close()
    }
  }
}

/**
 * Create a POST-based SSE stream for YouTube subtitle translation
 * Use this for requests with more parameters
 *
 * @param {Object} options - Configuration options
 * @param {string} options.videoUrl - YouTube video URL
 * @param {string} options.language - Target language code
 * @param {string} options.requestType - Request type
 * @param {string} options.sessionId - Session ID for resumption
 * @param {Object} options.callbacks - Event callbacks
 * @returns {Object} { abort: Function }
 */
export function createYouTubeSubtitleStreamPost(options = {}) {
  const {
    videoUrl,
    language,
    requestType = 'translated',
    sessionId,
    callbacks = {}
  } = options

  return createAIStream({
    url: `${kiwiConsts.API_BASE.AI_BIZ}/sse/ytb/subtitle`,
    body: {
      videoUrl,
      language,
      requestType,
      sessionId,
      timestamp: Date.now()
    },
    callbacks
  })
}

export default {
  createAIStream,
  createYouTubeSubtitleStream,
  createYouTubeSubtitleStreamPost,
  parseSSEEvents
}
