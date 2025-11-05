<template>
  <div class="ai-container">
    <h1>{{ getTitle }}</h1>

    <!-- Beautiful Original Text Display -->
    <div class="original-text-container">
      <h3 class="original-text-title" @click="toggleOriginalText">
        <span class="title-text">Original Text(Select text to explain based on the sentences context)</span>
        <i :class="originalTextCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'" class="collapse-icon"></i>
      </h3>
      <div
          v-show="!originalTextCollapsed"
          class="original-text-content"
          @mouseup="handleTextSelectionOriginal"
          @touchend="handleTextSelectionOriginal"
          ref="originalTextRef"
      >
        {{ decodedOriginalText }}
      </div>
    </div>

    <!-- Selection Popup Modal -->
    <el-dialog
        title="Explain Selected Text"
        :visible.sync="selectionDialogVisible"
        width="500px"
        :before-close="handleCloseSelectionDialog"
    >
      <div class="selection-dialog-content">
        <div class="selected-text-preview">
          <strong>Selected Text:</strong>
          <div class="selected-text">{{ selectedText }}</div>
        </div>

        <div class="dialog-actions">
          <p>Would you like to get an explanation for the selected text?</p>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <el-button @click="handleCloseSelectionDialog">Cancel</el-button>
        <el-button
            type="info"
            @click="searchOnDictionary"
            icon="el-icon-search"
        >
          Search on Dictionary
        </el-button>
        <el-button
            type="primary"
            @click="explainSelectedText"
            :loading="selectionApiLoading"
        >
          Explain Selection
        </el-button>
      </span>
    </el-dialog>

    <!-- Multiple Selection Response Displays -->
    <div v-for="item in selectionExplanations" :key="item.id" class="selection-response-container">
      <h3 class="selection-response-title">
        <i class="el-icon-chat-dot-square"></i>
        Explanation for Selected Text
        <span class="selection-title-controls">
          <el-button
              class="fold-selection-button"
              type="text"
              :icon="item.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
              @click="toggleExplanationContent(item)"
              :disabled="item.apiLoading"
              :title="item.collapsed ? 'Expand explanation' : 'Collapse explanation'"
          ></el-button>
          <el-button
              class="close-selection-button"
              type="text"
              icon="el-icon-close"
              @click="closeSingleExplanation(item)"
              :disabled="item.apiLoading"
              title="Close explanation"
          ></el-button>
        </span>
      </h3>
      <div class="selected-text-reference">
        <strong>Selected:</strong> "{{ item.selectedText }}"
      </div>
      <div
          v-show="!item.collapsed"
          class="selection-response-content"
          v-loading="item.apiLoading && !item.isStreaming"
          :ref="'explanationContent_' + item.id"
          @mouseup="handleTextSelectionFromExplanation($event, item)"
          @touchend="handleTextSelectionFromExplanation($event, item)"
      >
        <div v-show="item.isStreaming" class="streaming-indicator">
          <i class="el-icon-loading"></i> Generating explanation...
        </div>
        <div v-html="parseMarkdown(item.responseText)"></div>
      </div>
    </div>

    <!-- Original Response Container -->
    <div class="response-container">
      <div v-show="isStreaming" class="streaming-indicator">
        <i class="el-icon-loading"></i> Streaming response...
      </div>
      <div v-if="lastErrorMessage" class="inline-error">{{ lastErrorMessage }}</div>
      <div
        v-html="parsedResponseText"
        style="text-align: justify; margin-bottom: 40px;"
        v-loading="apiLoading && !isStreaming"
        ref="mainResponseRef"
        @mouseup="handleTextSelectionFromMainResponse"
        @touchend="handleTextSelectionFromMainResponse"
      ></div>
      <el-button
          v-if="!apiLoading && parsedResponseText"
          class="copy-button"
          size="small"
          icon="el-icon-document-copy"
          @click="copyResponseText">
        Copy
      </el-button>
      <el-button
          v-if="!apiLoading && parsedResponseText"
          class="regen-button"
          size="small"
          icon="el-icon-refresh-right"
          :title="'Regenerate response'"
          @click="regenerateResponse">
        Regenerate
      </el-button>
    </div>
  </div>
</template>

<script>
import util from '@/util/util'
import kiwiConsts from "@/const/kiwiConsts";
import MarkdownIt from 'markdown-it';
import {getStore} from '@/util/store'
import msgUtil from "@/util/msg";
import { callAiChatCompletion } from '@/api/ai'
// Import the language utility function
import { getInitialSelectedLanguage } from '@/util/langUtil';

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true
});
let that;

export default {
  data() {
    return {
      aiResponseVO: {
        responseText: ''
      },
      selectedMode: this.$route.query.selectedMode,
      // Store all route query parameters to preserve them during navigation
      preservedQueryParams: { ...this.$route.query },
      apiLoading: false,
      isStreaming: false,
      copySuccess: false,
      websocket: null,
      currentRequestId: null,

      // New data properties for text selection
      selectionDialogVisible: false,
      selectedText: '',
      selectionApiLoading: false,
      isSelectionStreaming: false,
      selectionWebSocket: null,
      selectionCurrentRequestId: null,
      selectionResponseText: '',
      selectionResponseVisible: false,
      lastSelectedText: '',
      selectionContentCollapsed: false,

      // New: support multiple stacked explanations
      selectionExplanations: [], // array of {id, selectedText, contextText, responseText, apiLoading, isStreaming, collapsed, websocket, requestId}
      lastSelectionContextText: '', // context text captured from the container where selection happened
      selectionSourceType: '', // 'original' | 'explanation'
      selectionSourceExplanationId: '',

      // Original text collapse state
      originalTextCollapsed: false,

      // Cache bookkeeping
      lastCacheKey: '',

      // New: inline error message
      lastErrorMessage: '',

      // Mount/WS guards and bookkeeping
      _initializedOnce: false,
      _mainWsAttempts: 0,
      _mainWsMaxAttempts: 2,
      _mainWsHadData: false,
      _mainFallbackInFlight: false,
      _lastMainRequest: null
    }
  },
  beforeCreate() {
    that = this; // Global reference to Vue component instance
  },
  async mounted() {
    console.log('AiResponseDetail component mounted')
    // Guard against duplicate mounts
    if (this._initializedOnce) {
      console.log('Duplicate mount detected; skipping init')
      return
    }
    this._initializedOnce = true

    // Try restore from cache first
    const restored = this.tryRestoreFromCache()
    if (!restored) {
      await this.init();
    }
  },
  watch: {
    '$route'() {
      console.log('AiResponseDetail component watch')
      const oldKey = this.lastCacheKey || this.computeCacheKeyFromQuery(this.preservedQueryParams, { remember: false })
      const newKey = this.computeCacheKeyFromQuery(this.$route.query)
      const keyChanged = oldKey !== newKey

      // Detect force refresh via 'now' param change
      const oldNow = this.preservedQueryParams && this.preservedQueryParams.now
      const newNow = this.$route.query && this.$route.query.now
      const forceRefresh = oldNow !== newNow && typeof newNow !== 'undefined'

      const hasCacheForNewKey = this.hasMeaningfulCacheForQuery(this.$route.query)

      // Always update preserved query params snapshot
      this.preservedQueryParams = { ...this.$route.query };

      if (oldKey === newKey && !forceRefresh) {
        if (!hasCacheForNewKey) {
          console.log('No cache found for current key; triggering fresh AI fetch')
          this.closeWebSocket('main');
          this.closeSelectionResponse();
          this.init();
        } else {
          console.log('Route change without core input change; using existing cache')
        }
        return
      }

      // Inputs changed or forced refresh: persist current state under old key
      this.saveStateToCache(oldKey)

      // Close sockets from previous session
      this.closeWebSocket('main');
      this.closeSelectionResponse();

      if (forceRefresh) {
        console.log('Force refresh detected (now param changed)')
        // If wsOnly flag is set, always initiate a fresh WS call immediately
        if (this.isWsOnly) {
          this.init()
          return
        }
        // Try to restore from cache for the new key first to avoid UI blanking
        const restored = this.tryRestoreFromCache()
        if (!restored) {
          if (keyChanged) {
            console.log('Cache miss for new inputs; initializing fresh fetch')
            this.init()
          } else if (!hasCacheForNewKey) {
            console.log('Force refresh without cache; initializing fresh fetch')
            this.init()
          } else {
            // If no cache available and no current content, perform a fresh init
            const hasContent = ((this.aiResponseVO.responseText || '').toString().trim().length > 0)
            if (!hasContent) {
              console.log('No cache or existing content; re-initializing fetch')
              this.init()
            } else {
              console.log('Keeping existing content; skip immediate re-fetch')
            }
          }
        } else if (keyChanged) {
          // IMPORTANT: Do not re-fetch when cache exists for the new key
          console.log('Restored cache for new inputs; cache hit => skip re-fetch')
        } else {
          console.log('Restored content from cache; skip immediate re-fetch')
        }
        return
      }

      // Try restore for the new key; if not found or empty, fetch
      const restored = this.tryRestoreFromCache()
      if (!restored) {
        console.log('No cache available for new key; initializing fresh fetch')
        this.init()
      }
    }
  },
  beforeDestroy() {
    // Persist current state to cache so we can restore when user comes back
    const key = this.computeCacheKeyFromQuery(this.$route.query)
    this.saveStateToCache(key)

    this.closeWebSocket('main');
    // Close all selection websockets
    this.closeSelectionResponse();
  },
  computed: {
    // Ensure only valid AI modes are used; fallback to a safe default
    validSelectedMode() {
      const aiModes = Object.values(kiwiConsts.SEARCH_AI_MODES).map(m => m.value);
      const mode = this.$route?.query?.selectedMode || this.selectedMode;
      return aiModes.includes(mode) ? mode : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value;
    },
    getTitle() {
      const mode = Object.values(kiwiConsts.SEARCH_AI_MODES).find(mode => mode.value === this.validSelectedMode);
      return mode ? mode.label : this.validSelectedMode;
    },
    parsedResponseText() {
      if (this.aiResponseVO.responseText) {
        // Unescape the content before parsing as Markdown
        const unescapedContent = this.unescapeContent(this.aiResponseVO.responseText);
        return md.render(unescapedContent);
      }
      return '';
    },
    rawResponseText() {
      // Also unescape for copy functionality
      return this.unescapeContent(this.aiResponseVO.responseText) || '';
    },
    decodedOriginalText() {
      let originalText = this.$route.query.originalText;
      if (!originalText) return '';

      try {
        let decodedText = originalText;
        // Handle potential double encoding by decoding until no more changes
        while (decodedText !== decodeURIComponent(decodedText)) {
          decodedText = decodeURIComponent(decodedText);
        }
        return decodedText;
      } catch (error) {
        console.warn('Error decoding originalText:', error);
        return originalText;
      }
    },
    defaultTargetLanguage() {
      // Use the extracted utility function to get the language for the current mode
      if (this.$route.query.language) {
        return this.$route.query.language;
      }

      // Get the language based on the current mode using the utility function
      return getInitialSelectedLanguage(this.$route);
    },
    defaultNativeLanguage() {
      return getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) ? getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
    },
    isWsOnly() {
      try {
        const q = this.$route && this.$route.query ? this.$route.query : this.preservedQueryParams || {}
        return q.wsOnly === '1' || q.wsOnly === 1 || q.wsOnly === true
      } catch (_) { return false }
    }
  },
  methods: {
    ...msgUtil,
    // Safely close websocket(s) by type
    closeWebSocket(type) {
      try {
        const closeSafely = (wsRefName) => {
          try {
            const ws = this[wsRefName];
            if (ws) {
              try { ws.close && ws.close(); } catch (_) {}
            }
            this[wsRefName] = null;
          } catch (_) {}
        };

        if (!type || type === 'all') {
          closeSafely('websocket');
          closeSafely('selectionWebSocket');
          return;
        }
        if (type === 'main') {
          closeSafely('websocket');
          return;
        }
        if (type === 'selection') {
          closeSafely('selectionWebSocket');
          return;
        }
        // Fallback: try to close both if unknown type
        closeSafely('websocket');
        closeSafely('selectionWebSocket');
      } catch (_) { /* ignore */ }
    },

    async init() {
      // Clear previous inline errors before a new session
      this.lastErrorMessage = ''
      this._mainWsAttempts = 0
      this._mainWsHadData = false
      this._mainFallbackInFlight = false

      let originalText = this.$route.query.originalText;
      let targetLanguage = this.$route.query.language ? this.$route.query.language : this.defaultTargetLanguage;
      let nativeLanguage = this.defaultNativeLanguage;
      // Validate selected mode to avoid INVALID_PROMPT_MODE
      let selectedMode = this.validSelectedMode;

      console.log('original text: ' + originalText + ' targetLanguage: ' + targetLanguage + ' nativeLanguage: ' + nativeLanguage + ' selectedMode: ' + selectedMode)

      if (!util.isEmptyStr(originalText) && !util.isEmptyStr(targetLanguage) && !util.isEmptyStr(nativeLanguage) && !util.isEmptyStr(selectedMode)) {
        this.connectMainWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText);
      }
    },

    // Toggle original text visibility
    toggleOriginalText() {
      this.originalTextCollapsed = !this.originalTextCollapsed;
      this.persistNow()
    },

    // Toggle content visibility for a single explanation item
    toggleExplanationContent(item) {
      item.collapsed = !item.collapsed;
      this.persistNow()
    },

    // Handle text selection in original text
    handleTextSelectionOriginal() {
      this.handleTextSelectionGeneric(this.$refs.originalTextRef, this.decodedOriginalText, { source: 'original' });
    },

    // Handle text selection inside one explanation block
    handleTextSelectionFromExplanation(event, item) {
      const refName = 'explanationContent_' + item.id;
      const container = this.$refs[refName];
      // Some Vue versions return an array for refs inside v-for; normalize
      const containerEl = Array.isArray(container) ? container[0] : container;
      if (!containerEl) return;
      const contextText = containerEl.innerText || '';
      this.handleTextSelectionGeneric(containerEl, contextText, { source: 'explanation', explanationId: item.id });
    },

    // New: handle text selection from the main AI response content
    handleTextSelectionFromMainResponse() {
      const containerEl = this.$refs.mainResponseRef
      if (!containerEl) return
      const contextText = containerEl.innerText || ''
      this.handleTextSelectionGeneric(containerEl, contextText, { source: 'response' })
    },

    // Generic selection handler given a container and its plain-text context
    handleTextSelectionGeneric(containerEl, contextText, sourceMeta = {}) {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection) return;
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0) {
          // Check if the selection is within the provided container
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            if (containerEl && containerEl.contains(range.commonAncestorContainer)) {
              this.selectedText = selectedText;
              this.lastSelectionContextText = contextText || '';
              this.selectionSourceType = sourceMeta.source || '';
              this.selectionSourceExplanationId = sourceMeta.explanationId || '';
              this.selectionDialogVisible = true;
            }
          }
        }
      }, 100);
    },

    handleCloseSelectionDialog() {
      this.selectionDialogVisible = false;
      this.selectedText = '';
      this.selectionResponseText = '';
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;
      this.lastSelectionContextText = '';
      this.selectionSourceType = '';
      this.selectionSourceExplanationId = '';

      // Do not close existing explanation websockets here; only dialog state reset

      // Clear text selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    },

    // Close and clear all selection responses
    closeSelectionResponse() {
      // Close any active WebSocket connections for items
      if (Array.isArray(this.selectionExplanations)) {
        this.selectionExplanations.forEach(it => {
          try { if (it.websocket) { it.websocket.close(); } } catch (e) { /* ignore */ }
          it.websocket = null;
        });
      }
      this.selectionExplanations = [];

      // Reset selection-related transient state
      this.selectionResponseText = '';
      this.lastSelectedText = '';
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;
      this.selectionContentCollapsed = false;

      // Clear text selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }

      this.persistNow()
    },

    // Remove a single explanation item
    closeSingleExplanation(item) {
      if (!item) return;
      try { if (item.websocket) { item.websocket.close(); } } catch (e) { /* ignore */ }
      item.websocket = null;
      this.selectionExplanations = this.selectionExplanations.filter(it => it.id !== item.id);

      this.persistNow()
    },

    // New method to search on dictionary
    searchOnDictionary() {
      if (!this.selectedText) {
        this.msgError(this, 'No text selected');
        return;
      }

      // URL encode the selected text to handle special characters
      const encodedText = encodeURIComponent(this.selectedText);
      
      // Build query parameters with correct values
      const queryParams = new URLSearchParams({
        active: 'search',
        selectedMode: 'detail',
        language: this.defaultNativeLanguage, // Use native language instead of target language
        originalText: encodedText,
        now: new Date().getTime().toString()
        // Remove ytbMode parameter
      });
      
      const dictionaryUrl = `https://kason.app/#/lazy/tools/detail?${queryParams.toString()}`;

      // Open in new tab
      window.open(dictionaryUrl, '_blank');

      // Close the dialog after opening dictionary
      this.selectionDialogVisible = false;
    },

    explainSelectedText() {
      if (!this.selectedText) {
        this.msgError(this, 'No text selected');
        return;
      }

      // Create a new explanation item and start streaming
      const newItem = {
        id: this.generateRequestId(),
        selectedText: this.selectedText,
        contextText: this.lastSelectionContextText || this.decodedOriginalText,
        responseText: '',
        apiLoading: false,
        isStreaming: false,
        collapsed: false,
        websocket: null,
        requestId: ''
      };
      this.selectionExplanations.push(newItem);

      // Clear dialog
      this.selectionDialogVisible = false;
      this.lastSelectedText = this.selectedText;

      // Start WebSocket for this item
      this.connectSelectionWebSocketForItem(newItem);

      // Smoothly scroll the newly added explanation into view
      this.$nextTick(() => {
        const refName = 'explanationContent_' + newItem.id;
        const ref = this.$refs[refName];
        const el = Array.isArray(ref) ? ref[0] : ref;
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });

      this.persistNow()
    },

    /**
     * Start a WebSocket streaming session for a single explanation item
     */
    connectSelectionWebSocketForItem(item) {
      if (!item || !item.selectedText) return;

      // Prepare the prompt for selection explanation using the context of where the selection happened
      const prompt = kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION +
          item.selectedText +
          kiwiConsts.AI_MODE_TAG.SPLITTER +
          (item.contextText || this.decodedOriginalText || '');

      // Token
      const token = getStore({name: 'access_token'});
      if (!token) {
        this.handleSelectionItemError(item, 'Authentication token not found. Please login again.');
        return;
      }

      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ai-biz/ai/ws/stream?access_token=${encodeURIComponent(token)}`;

      // Init states
      item.apiLoading = true;
      item.isStreaming = true;
      item.responseText = '';
      item.requestId = this.generateRequestId();

      // Open socket
      try {
        item.websocket = new WebSocket(wsUrl);
      } catch (e) {
        this.handleSelectionItemError(item, 'Failed to open WebSocket');
        return;
      }

      item.websocket.onopen = () => {
        const request = {
          prompt: prompt,
          promptMode: 'selection-explanation',
          targetLanguage: this.defaultTargetLanguage,
          nativeLanguage: this.defaultNativeLanguage,
          aiUrl: wsUrl,
          timestamp: Date.now(),
          requestId: item.requestId
        };
        try {
          item.websocket.send(JSON.stringify(request));
        } catch (e) {
          this.handleSelectionItemError(item, 'Failed to send request');
        }
      };

      item.websocket.onmessage = (event) => {
        let response;
        try {
          response = JSON.parse(event.data);
        } catch (error) {
          this.handleSelectionItemError(item, 'Failed to parse response');
          return;
        }

        switch (response.type) {
          case 'connected':
            // no-op
            break;
          case 'started':
            item.isStreaming = true;
            break;
          case 'chunk':
            if (response.chunk) {
              item.responseText += response.chunk;
            }
            break;
          case 'completed':
            item.isStreaming = false;
            item.apiLoading = false;
            // Prefer fullResponse if available; then post-validate to extract only responseText
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0)
                ? response.fullResponse
                : item.responseText;
              const extracted = this.extractResponseTextFromPayload(finalPayload);
              item.responseText = (typeof extracted === 'string' && extracted.length > 0)
                ? extracted
                : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload));
            } catch (_) {
              // best-effort fallback keeps whatever accumulated
            }
            try { item.websocket && item.websocket.close(); } catch (e) { /* ignore */ }
            item.websocket = null;
            break;
          case 'error':
            this.handleSelectionItemError(item, (response.message || 'Selection AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : ''));
            break;
          default:
            // ignore
            break;
        }
      };

      item.websocket.onerror = () => {
        this.handleSelectionItemError(item, 'WebSocket connection error');
      };

      item.websocket.onclose = () => {
        item.apiLoading = false;
        item.isStreaming = false;
      };
    },

    handleSelectionItemError(item, errorMessage) {
      if (item) {
        item.apiLoading = false;
        item.isStreaming = false;
        try { if (item.websocket) { item.websocket.close(); } } catch (e) { /* ignore */ }
        item.websocket = null;
      }
      this.msgError(this, errorMessage);
    },

    /**
     * Generic WebSocket connection method
     * @param {Object} config - Configuration object
     * @param {string} config.type - 'main' or 'selection'
     * @param {string} config.prompt - The prompt to send
     * @param {string} config.promptMode - AI prompt mode
     * @param {string} config.targetLanguage - Target language
     * @param {string} config.nativeLanguage - Native language
     * @param {string} config.requestId - Unique request ID
     */
    connectWebSocket(config) {
      const { type, prompt, promptMode, targetLanguage, nativeLanguage, requestId } = config;
      const isSelection = type === 'selection';
      const websocketKey = isSelection ? 'selectionWebSocket' : 'websocket';
      const loadingKey = isSelection ? 'selectionApiLoading' : 'apiLoading';
      const streamingKey = isSelection ? 'isSelectionStreaming' : 'isStreaming';

      if (!isSelection) {
        that.closeSelectionResponse();
        // Track the last main request payload for retry/fallback
        that._lastMainRequest = {
          selectedMode: promptMode,
          targetLanguage,
          nativeLanguage,
          decodedText: prompt
        }
        that._mainWsAttempts += 1
        that._mainWsHadData = false
        that._mainFallbackInFlight = false
      }

      that[loadingKey] = true;
      that[streamingKey] = true;

      if (isSelection) {
        that.selectionResponseText = '';
        that.selectionResponseVisible = true;
      } else {
        that.aiResponseVO.responseText = '';
      }

      const requestIdKey = isSelection ? 'selectionCurrentRequestId' : 'currentRequestId';
      that[requestIdKey] = requestId;

      const token = getStore({name: 'access_token'});

      if (!token) {
        const errorHandler = isSelection ? that.handleSelectionError : that.handleError;
        errorHandler('Authentication token not found. Please login again.');
        return;
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ai-biz/ai/ws/stream?access_token=${encodeURIComponent(token)}`;

      console.log(`Connecting to ${type} WebSocket with token`);
      that[websocketKey] = new WebSocket(wsUrl);

      that[websocketKey].onopen = () => {
        console.log(`${type} WebSocket connection established`);
        const request = {
          prompt: prompt,
          promptMode: promptMode,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
          aiUrl: wsUrl,
          timestamp: Date.now(),
          requestId: requestId
        };
        console.log(`Sending ${type} request:`, request);
        try { that[websocketKey].send(JSON.stringify(request)); } catch (e) {
          console.error('Failed to send WS request:', e)
        }
      };

      that[websocketKey].onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          if (!isSelection) {
            if (response.type === 'started' || response.type === 'chunk' || response.type === 'completed') {
              that._mainWsHadData = true
            }
          }
          if (isSelection) {
            that.handleSelectionWebSocketMessage(response);
          } else {
            that.handleWebSocketMessage(response);
          }
        } catch (error) {
          console.error(`Error parsing ${type} WebSocket message:`, error);
          const errorHandler = isSelection ? that.handleSelectionError : that.handleError;
          errorHandler('Failed to parse response');
        }
      };

      const maybeRetryOrFallback = () => {
        // Only for main, only if no data yet
        if (isSelection) return
        if (that._mainWsHadData) return
        const wsOnly = that.isWsOnly === true
        // Retry up to max attempts
        if (that._mainWsAttempts < that._mainWsMaxAttempts) {
          const backoff = 200 * Math.pow(2, that._mainWsAttempts - 1) // 200ms, 400ms
          console.log(`WS retry ${that._mainWsAttempts} scheduled in ${backoff}ms`)
          setTimeout(() => {
            if (that._lastMainRequest) {
              const reqId = that.generateRequestId()
              that.connectWebSocket({
                type: 'main',
                prompt: that._lastMainRequest.decodedText,
                promptMode: that._lastMainRequest.selectedMode,
                targetLanguage: that._lastMainRequest.targetLanguage,
                nativeLanguage: that._lastMainRequest.nativeLanguage,
                requestId: reqId
              })
            }
          }, backoff)
        } else if (!that._mainFallbackInFlight) {
          that._mainFallbackInFlight = true
          if (wsOnly) {
            console.log('WS-only mode: skipping HTTP fallback and surfacing error')
            that.handleError('Realtime connection failed. Please try again or check your network.');
          } else {
            console.log('WS failed to start streaming; falling back to HTTP API')
            that.fetchViaHttpFallback()
          }
        }
      }

      that[websocketKey].onerror = (error) => {
        console.error(`${type} WebSocket error:`, error);
        if (!isSelection) maybeRetryOrFallback()
        else {
          const errorHandler = isSelection ? that.handleSelectionError : that.handleError;
          errorHandler('WebSocket connection error');
        }
      };

      that[websocketKey].onclose = (event) => {
        console.log(`${type} WebSocket connection closed:`, event.code, event.reason);
        that[loadingKey] = false;
        that[streamingKey] = false;
        if (!isSelection) maybeRetryOrFallback()
      };
    },

    // HTTP fallback when WS cannot be established
    async fetchViaHttpFallback() {
      try {
        const info = this._lastMainRequest
        if (!info) throw new Error('No request context for fallback')
        const res = await callAiChatCompletion(info.selectedMode, info.targetLanguage, info.nativeLanguage, info.decodedText)
        const data = (res && res.data && res.data.data) || ''
        // Post-validate fallback payload to ensure only responseText is used
        const extracted = this.extractResponseTextFromPayload(data)
        const finalText = (typeof extracted === 'string' && extracted.length > 0)
          ? extracted
          : (typeof data === 'string' ? data : JSON.stringify(data))
        this.aiResponseVO.responseText = finalText
        this.apiLoading = false
        this.isStreaming = false
        this.lastErrorMessage = ''
        this.persistNow()
      } catch (e) {
        console.error('HTTP fallback failed:', e && (e.message || e))
        this.handleError('AI request failed (WS and HTTP). Please try again later.')
      }
    },

    // Simplified main AI request method
    connectMainWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText) {
      const requestId = that.generateRequestId();
      let decodedText = originalText;
      try {
        while (decodedText !== decodeURIComponent(decodedText)) {
          decodedText = decodeURIComponent(decodedText);
        }
      } catch (error) {
        console.warn('Error decoding originalText:', error);
        decodedText = originalText;
      }
      console.log('Sending decoded text:', decodedText);
      this.connectWebSocket({
        type: 'main',
        prompt: decodedText,
        promptMode: selectedMode,
        targetLanguage: targetLanguage,
        nativeLanguage: nativeLanguage,
        requestId: requestId
      });
    },

    handleWebSocketMessage(response) {
      console.log('Received WebSocket message:', response);

      switch (response.type) {
        case 'connected':
          console.log('AI Streaming connection established');
          this.lastErrorMessage = ''
          break;

        case 'started':
          console.log('AI streaming started');
          that.isStreaming = true;
          this.lastErrorMessage = ''
          break;

        case 'chunk':
          if (response.chunk) {
            // Just accumulate the raw chunks - unescaping will happen in computed property
            that.aiResponseVO.responseText += response.chunk;
            console.log('Added chunk, total length:', that.aiResponseVO.responseText.length);
            that.persistNow()
          } else {
            console.warn('Received empty chunk:', response);
          }
          break;

        case 'completed':
          console.log('AI streaming completed');
          that.isStreaming = false;
          that.apiLoading = false;

          // Use fullResponse if available (it should be properly formatted)
          // Then post-validate to extract only responseText as the final result
          try {
            const finalPayload = (response.fullResponse && response.fullResponse.length > 0)
              ? response.fullResponse
              : that.aiResponseVO.responseText;
            const extracted = this.extractResponseTextFromPayload(finalPayload);
            that.aiResponseVO.responseText = (typeof extracted === 'string' && extracted.length > 0)
              ? extracted
              : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload));
          } catch (_) {
            // keep previous content if parsing fails unexpectedly
            if (response.fullResponse) {
              that.aiResponseVO.responseText = response.fullResponse;
            }
          }

          that.closeWebSocket('main');
          that.persistNow()
          break;

        case 'error':
          console.error('AI streaming error:', response.message);
          let errorMessage = response.message || 'AI streaming failed';
          if (response.errorCode) {
            errorMessage += ` (Code: ${response.errorCode})`;
          }
          that.handleError(errorMessage);
          that.persistNow()
          break;

        default:
          console.warn('Unknown WebSocket message type:', response.type);
          break;
      }
    },

    handleSelectionWebSocketMessage(response) {
      console.log('Received Selection WebSocket message:', response);

      switch (response.type) {
        case 'connected':
          console.log('Selection AI Streaming connection established');
          this.lastErrorMessage = ''
          break;
        case 'started':
          console.log('Selection AI streaming started');
          that.isSelectionStreaming = true;
          this.lastErrorMessage = ''
          break;
        case 'chunk':
          if (response.chunk) {
            that.selectionResponseText += response.chunk;
            console.log('Added selection chunk, total length:', that.selectionResponseText.length);
          } else {
            console.warn('Received empty selection chunk:', response);
          }
          break;

        case 'completed':
          console.log('Selection AI streaming completed');
          that.isSelectionStreaming = false;
          that.selectionApiLoading = false;

          // Prefer fullResponse if available; then post-validate to extract only responseText
          try {
            const finalPayload = (response.fullResponse && response.fullResponse.length > 0)
              ? response.fullResponse
              : that.selectionResponseText;
            const extracted = this.extractResponseTextFromPayload(finalPayload);
            that.selectionResponseText = (typeof extracted === 'string' && extracted.length > 0)
              ? extracted
              : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload));
          } catch (_) {
            if (response.fullResponse) {
              that.selectionResponseText = response.fullResponse;
            }
          }

          that.closeWebSocket('selection');
          that.persistNow()
          break;

        case 'error':
          console.error('Selection AI streaming error:', response.message);
          let errorMessage = response.message || 'Selection AI streaming failed';
          if (response.errorCode) {
            errorMessage += ` (Code: ${response.errorCode})`;
          }
          that.handleSelectionError(errorMessage);
          that.persistNow()
          break;

        default:
          console.warn('Unknown Selection WebSocket message type:', response.type);
          break;
      }
    },

    handleError(errorMessage) {
      // Stop all loading states immediately
      that.apiLoading = false;
      that.isStreaming = false;

      // Close WebSocket connection
      that.closeWebSocket('main');

      // Clear any partial response
      that.aiResponseVO.responseText = '';

      // Show error message prominently in the UI
      that.lastErrorMessage = errorMessage;
      that.msgError(that, errorMessage)
    },

    handleSelectionError(errorMessage) {
      that.selectionApiLoading = false;
      that.isSelectionStreaming = false;
      that.closeWebSocket('selection');
      that.selectionResponseText = '';
      that.lastErrorMessage = errorMessage;
      that.msgError(that, errorMessage);
    },

    generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Add post-validation helpers to extract only responseText from a final payload
    sanitizePotentialJsonString(str) {
      if (typeof str !== 'string') return '';
      let s = (str || '').trim();
      // Remove fenced code blocks markers like ```json and ```
      s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
      // Replace curly quotes with straight quotes
      s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
      // Trim again
      if (!s.startsWith('{')) {
        const firstBrace = s.indexOf('{');
        const lastBrace = s.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          s = s.substring(firstBrace, lastBrace + 1).trim();
        }
      }
      return s;
    },

    tryParseJsonLoose(str) {
      if (typeof str !== 'string') return null;
      const cleaned = this.sanitizePotentialJsonString(str);
      try {
        return JSON.parse(cleaned);
      } catch (_) {
        return null;
      }
    },

    extractResponseTextFromPayload(payload) {
      try {
        if (payload && typeof payload === 'object') {
          if (typeof payload.responseText === 'string') return payload.responseText;
          if (payload.data && typeof payload.data.responseText === 'string') return payload.data.responseText;
          return null;
        }
        if (typeof payload === 'string') {
          const obj = this.tryParseJsonLoose(payload);
          if (obj) {
            if (typeof obj.responseText === 'string') return obj.responseText;
            if (obj.data && typeof obj.data.responseText === 'string') return obj.data.responseText;
          }
          // Attempt direct regex extraction after normalizing quotes
          const normalized = payload.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'");
          const match = normalized.match(/"responseText"\s*:\s*"([\s\S]*?)"/);
          if (match) {
            // Unescape common sequences inside the captured string
            return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t').replace(/\\r/g, '\r');
          }
        }
        return null;
      } catch (_) {
        return null;
      }
    },

    // Add this method to your Vue component methods
    unescapeContent(content) {
      if (!content) return '';

      // Unescape common escaped characters
      return content
          .replace(/\\n/g, '\n')        // Convert \\\n to actual newlines
          .replace(/\\t/g, '\t')        // Convert \\\t to actual tabs
          .replace(/\\\"/g, '"')         // Convert \\\\\" to actual quotes
          .replace(/\\\\/g, '\\');      // Convert \\\\\\\\ to single backslash
    },

    parseMarkdown(content) {
      const unescapedContent = this.unescapeContent(content || '');
      return md.render(unescapedContent);
    },

    copyResponseText() {
      const textToCopy = this.rawResponseText;

      navigator.clipboard.writeText(textToCopy)
          .then(() => {
            this.$message({
              message: 'Text copied to clipboard!',
              type: 'success',
              duration: 2000
            });
          })
          .catch(err => {
            this.$message({
              message: 'Failed to copy text: ' + err,
              type: 'error',
              duration: 2000
            });
          });
    },

    // New: regenerate response by recalling WS AI and replacing cache
    regenerateResponse() {
      if (this.apiLoading || this.isStreaming) return;
      try {
        const key = this.computeCacheKeyFromQuery(this.$route.query);
        localStorage.removeItem(key);
      } catch (e) { /* ignore */ }

      // Reset main response state and errors
      this.lastErrorMessage = '';
      this.aiResponseVO.responseText = '';
      this.closeWebSocket('main');
      this.persistNow(); // persist cleared state

      // Re-initiate the AI call with current inputs
      this.init();
    },

    // Compute a stable cache key based on core inputs
    computeCacheKeyFromQuery(query, options = {}) {
      const { remember = true } = options
      // Prefer passed query strictly; only fallback to current route if not provided
      const q = query || this.$route.query || {}
      const originalText = q.originalText
      // Validate selected mode to keep compatibility with computed validSelectedMode
      const selectedMode = q.selectedMode || this.validSelectedMode
      const language = q.language || this.defaultTargetLanguage

      // Decode entire content (whole content)
      const decoded = (() => {
        if (!originalText) return ''
        try {
          let t = originalText
          while (t !== decodeURIComponent(t)) t = decodeURIComponent(t)
          return t
        } catch (e) { return originalText }
      })()

      // New cache key format: mode-targetLang-searchingContent (whole content)
      // Use a recognizable namespace prefix; URI-encode the content to keep key safe
      const key = `aiResponseCache:${selectedMode}-${language}-${encodeURIComponent(decoded)}`
      if (remember) {
        this.lastCacheKey = key
      }
      return key
    },

    // Keep legacy hash-based key computation for backward compatibility restore
    computeLegacyCacheKeyFromQuery(query) {
      const q = query || this.$route.query || {}
      const originalText = q.originalText
      const selectedMode = q.selectedMode || this.validSelectedMode
      const language = q.language || this.defaultTargetLanguage
      const native = this.defaultNativeLanguage
      const decoded = (() => {
        if (!originalText) return ''
        try {
          let t = originalText
          while (t !== decodeURIComponent(t)) t = decodeURIComponent(t)
          return t
        } catch (e) { return originalText }
      })()
      const payload = `${selectedMode}::${language}::${native}::${decoded}`
      const hash = this.simpleHash(payload)
      const key = `aiResponseCache:${hash}`
      return key
    },

    hasMeaningfulCacheInRaw(raw) {
      if (!raw) return false
      try {
        const obj = JSON.parse(raw)
        const cachedText = (obj.aiResponseText || '').toString().trim()
        if (cachedText.length > 0) return true
        const cachedExps = Array.isArray(obj.selectionExplanations) ? obj.selectionExplanations : []
        return cachedExps.some(it => ((it.responseText || '').toString().trim().length > 0))
      } catch (_) {
        return false
      }
    },

    hasMeaningfulCacheForQuery(query) {
      try {
        if (typeof localStorage === 'undefined') return false
        const primaryKey = this.computeCacheKeyFromQuery(query, { remember: false })
        if (primaryKey && this.hasMeaningfulCacheInRaw(localStorage.getItem(primaryKey))) {
          return true
        }
        const legacyKey = this.computeLegacyCacheKeyFromQuery(query)
        if (legacyKey && this.hasMeaningfulCacheInRaw(localStorage.getItem(legacyKey))) {
          return true
        }
      } catch (e) {
        console.warn('Cache inspection failed:', e)
      }
      return false
    },

    simpleHash(str) {
      // djb2 hashing
      let hash = 5381
      for (let i = 0; i < (str || '').length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i)
        hash = hash & hash
      }
      return (hash >>> 0).toString(36)
    },

    saveStateToCache(key) {
      try {
        if (!key) key = this.computeCacheKeyFromQuery(this.$route.query)
        const data = {
          aiResponseText: this.aiResponseVO.responseText || '',
          selectionExplanations: (this.selectionExplanations || []).map(it => ({
            id: it.id,
            selectedText: it.selectedText,
            contextText: it.contextText,
            responseText: it.responseText,
            collapsed: !!it.collapsed
          })),
          originalTextCollapsed: !!this.originalTextCollapsed,
          timestamp: Date.now()
        }
        // Persist to localStorage for longer-lived cache
        localStorage.setItem(key, JSON.stringify(data))
        // Keep a pointer to last used key for quick restore
        localStorage.setItem('aiResponseCache:lastKey', key)
        this.lastCacheKey = key
      } catch (e) {
        console.warn('Failed to save AI state cache:', e)
      }
    },

    tryRestoreFromCache() {
      try {
        // When wsOnly flag is present, bypass cache restoration to force a live WS call
        if (this.isWsOnly) {
          return false
        }
        const newKey = this.computeCacheKeyFromQuery(this.$route.query)
        let raw = localStorage.getItem(newKey)

        // If no new-format cache exists, try legacy key for backward compatibility
        if (!raw) {
          const legacyKey = this.computeLegacyCacheKeyFromQuery(this.$route.query)
          const legacyRaw = legacyKey ? localStorage.getItem(legacyKey) : null
          if (legacyRaw) {
            // Migrate to new key format for future lookups
            try { localStorage.setItem(newKey, legacyRaw) } catch (_) {}
            raw = legacyRaw
          }
        }

        if (!raw) return false
        const obj = JSON.parse(raw)

        const cachedText = (obj.aiResponseText || '').toString()
        const cachedExps = Array.isArray(obj.selectionExplanations) ? obj.selectionExplanations : []
        const hasMeaningfulCache = (cachedText && cachedText.trim().length > 0) ||
                                   cachedExps.some(it => (it.responseText || '').toString().trim().length > 0)
        if (!hasMeaningfulCache) {
          console.log('Cache exists but empty; skip restore and allow fetch')
          return false
        }

        // If current UI already has non-empty content, prefer keeping it rather than overwriting with cache
        if ((this.aiResponseVO.responseText || '').toString().trim().length > 0) {
          console.log('Current content is non-empty; skip overwriting from cache')
          return true
        }

        // Restore main response
        this.aiResponseVO.responseText = cachedText
        // Restore stacked explanations (no sockets, no loading)
        this.selectionExplanations = cachedExps.map(it => ({
          id: it.id || this.generateRequestId(),
          selectedText: it.selectedText || '',
          contextText: it.contextText || '',
          responseText: it.responseText || '',
          apiLoading: false,
          isStreaming: false,
          collapsed: !!it.collapsed,
          websocket: null,
          requestId: ''
        }))
        this.originalTextCollapsed = !!obj.originalTextCollapsed
        console.log('Restored AI state from cache:', newKey)
        this.lastCacheKey = newKey
        return true
      } catch (e) {
        console.warn('Failed to restore AI state cache:', e)
        return false
      }
    },

    // Persist on meaningful changes
    persistNow() {
      const key = this.computeCacheKeyFromQuery(this.$route.query)
      this.saveStateToCache(key)
    }
  }
}
</script>

<style scoped>
/* Original Text Container Styles */
.original-text-container {
  margin: 20px 0 30px 0;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.original-text-title {
  margin: 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  cursor: pointer;
  user-select: none;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.original-text-title:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
}

.title-text {
  flex: 1;
}

.collapse-icon {
  font-size: 14px;
  transition: transform 0.3s ease;
}

.original-text-content {
  padding: 20px;
  font-size: 15px;
  line-height: 1.8;
  color: #2c3e50;
  background: white;
  cursor: text;
  user-select: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  white-space: pre-wrap;
  word-wrap: break-word;
  transition: all 0.3s ease;
  overflow: hidden;
}

.original-text-content:hover {
  background: #fafbfc;
}

.original-text-content::selection {
  background: rgba(64, 158, 255, 0.2);
  color: #2c3e50;
}

.original-text-content::-moz-selection {
  background: rgba(64, 158, 255, 0.2);
  color: #2c3e50;
}

/* Selection Dialog Styles */
.selection-dialog-content {
  padding: 10px 0;
}

.selected-text-preview {
  margin-bottom: 20px;
}

.selected-text {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
  font-style: italic;
  color: #495057;
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
}

/* Selection Response Container Styles */
.selection-response-container {
  margin: 30px 0;
  border: 1px solid #d4edda;
  border-radius: 12px;
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
  position: relative;
  overflow: hidden;
}

.selection-response-title {
  margin: 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selection-response-title i {
  margin-right: 8px;
}

/* Selection title controls styling */
.selection-title-controls {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.fold-selection-button,
.close-selection-button {
  color: white !important;
  background: transparent !important;
  border: none !important;
  padding: 4px 8px !important;
  font-size: 16px !important;
  transition: all 0.3s ease;
  border-radius: 4px !important;
  min-width: auto !important;
}

.fold-selection-button:hover:not(.is-disabled),
.close-selection-button:hover:not(.is-disabled) {
  background: rgba(255, 255, 255, 0.2) !important;
  color: white !important;
}

.fold-selection-button:focus,
.close-selection-button:focus {
  background: rgba(255, 255, 255, 0.1) !important;
  color: white !important;
}

.fold-selection-button.is-disabled,
.close-selection-button.is-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.selected-text-reference {
  background: rgba(23, 162, 184, 0.1);
  border-bottom: 1px solid rgba(23, 162, 184, 0.2);
  padding: 12px 20px;
  font-size: 13px;
  color: #0c7489;
  font-style: italic;
}

.selection-response-content {
  padding: 20px;
  background: white;
  min-height: 60px;
  line-height: 1.7;
  color: #2c3e50;
}

/* Existing styles */
.response-container > div {
  user-select: text !important;
  -webkit-user-select: text !important;
  -moz-user-select: text !important;
  -ms-user-select: text !important;
}

.response-container {
  position: relative;
  padding-top: 40px;
}


.copy-button {
  position: absolute;
  top: 0;
  right: 0;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
  border-radius: 6px !important;
}

.copy-button:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

.copy-button:focus {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3);
}

.copy-button:active {
  transform: translateY(0px);
}

.regen-button {
  position: absolute;
  top: 0;
  right: 100px;
  background: linear-gradient(135deg, #f56c6c 0%, #d9534f 100%) !important;
  border: none !important;
  color: white !important;
  transition: all 0.3s ease;
  border-radius: 6px !important;
}

.regen-button:hover {
  background: linear-gradient(135deg, #e55b5b 0%, #c9302c 100%) !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(245, 108, 108, 0.3);
}

.regen-button:focus {
  background: linear-gradient(135deg, #e55b5b 0%, #c9302c 100%) !important;
  box-shadow: 0 0 0 2px rgba(245, 108, 108, 0.3);
}

.regen-button:active {
  transform: translateY(0px);
}

.streaming-indicator {
  color: #409EFF;
  font-style: italic;
  margin-bottom: 10px;
}

.streaming-indicator i {
  margin-right: 5px;
}

/* Dialog footer styles */
.dialog-footer {
  text-align: center;
  padding: 20px 24px;
}

.dialog-footer .el-button {
  margin: 0 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 8px;
  min-width: 140px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.dialog-footer .el-button:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.dialog-footer .el-button:active {
  transform: translateY(0px);
}

/* Dictionary button specific styling */
.dialog-footer .el-button--info {
  background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;
  border: none !important;
  color: white !important;
}

.dialog-footer .el-button--info:hover {
  background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
  color: white !important;
}

.dialog-footer .el-button--info:focus {
  background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
  color: white !important;
}

/* Primary button (Explain Selection) specific styling */
.dialog-footer .el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  border: none !important;
  color: white !important;
}

.dialog-footer .el-button--primary:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  color: white !important;
}

.dialog-footer .el-button--primary:focus {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  color: white !important;
}

/* Cancel button styling */
.dialog-footer .el-button:not(.el-button--primary):not(.el-button--info) {
  background: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
  color: #6c757d !important;
}

.dialog-footer .el-button:not(.el-button--primary):not(.el-button--info):hover {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
}

/* Responsive design */
@media (max-width: 768px) {
  .original-text-container,
  .selection-response-container {
    margin: 15px 0;
    border-radius: 8px;
  }

  .original-text-title,
  .selection-response-title {
    padding: 12px 16px;
    font-size: 14px;
  }

  .original-text-content,
  .selection-response-content {
    padding: 16px;
    font-size: 14px;
  }

  .close-selection-button,
  .fold-selection-button {
    padding: 2px 6px !important;
    font-size: 14px !important;
  }

  .dialog-footer .el-button {
    margin: 8px 4px;
    min-width: 120px;
    padding: 10px 16px;
  }

  .dialog-footer {
    padding: 16px;
  }
}

.inline-error {
  color: #f56c6c;
  background: #fdecea;
  border: 1px solid #f5c2c0;
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}
</style>
