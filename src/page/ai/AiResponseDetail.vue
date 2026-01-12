<template>
  <div class="ai-container">
    <!-- Beautiful Original Text Display -->
    <div v-if="showOriginalTextContainer" class="original-text-container">
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
    <!-- Selection Popup Modal -->
    <AiSelectionPopup
      :visible.sync="selectionDialogVisible"
      :selectedText="selectedText"
      title="Explain Selected Text"
      :auto-request="false"
    />

    <!-- Multiple Selection Response Displays -->
    <div v-for="item in selectionExplanations" :key="item.id" class="selection-response-container">
      <h3 class="selection-response-title">
        <i class="el-icon-chat-dot-square"></i>
        Explanation for Selected Text
        <span class="selection-title-controls">
          <KiwiButton
              class="fold-selection-button"
              type="text"
              :icon="item.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
              @click="toggleExplanationContent(item)"
              :disabled="item.apiLoading"
              :title="item.collapsed ? 'Expand explanation' : 'Collapse explanation'"
          />
          <KiwiButton
              class="close-selection-button"
              type="text"
              icon="el-icon-close"
              @click="closeSingleExplanation(item)"
              :disabled="item.apiLoading"
              title="Close explanation"
          />
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
        <div v-show="item.isStreaming" class="streaming-indicator-wrapper" style="position: relative; min-height: 60px;">
          <StatusOverlay
            :visible="true"
            status="loading"
            title="Generating explanation..."
            :backdrop="false"
            style="position: absolute;"
          />
        </div>
        <div v-html="parseMarkdown(item.responseText)"></div>
      </div>
    </div>

    <!-- Original Response Container -->
    <div class="response-container">
      <div v-show="isStreaming" class="streaming-indicator-wrapper" style="position: relative; min-height: 60px;">
        <StatusOverlay
          :visible="true"
          status="loading"
          title="Streaming response..."
          :backdrop="false"
          style="position: absolute;"
        />
      </div>
      <div v-if="lastErrorMessage" class="inline-error">{{ lastErrorMessage }}</div>
      <div
        class="main-response-content"
        v-html="parsedResponseText"
        v-loading="apiLoading && !isStreaming"
        ref="mainResponseRef"
        @mouseup="handleTextSelectionFromMainResponse"
        @touchend="handleTextSelectionFromMainResponse"
      ></div>
      <KiwiButton
          v-if="!apiLoading && parsedResponseText"
          class="copy-button"
          size="small"
          icon="el-icon-document-copy"
          @click="copyResponseText">
        Copy
      </KiwiButton>
      <KiwiButton
          v-if="!apiLoading && parsedResponseText"
          class="regen-button"
          size="small"
          icon="el-icon-refresh-right"
          :title="'Regenerate response'"
          @click="regenerateResponse">
        Regenerate
      </KiwiButton>
    </div>
  </div>
</template>

<script>
import StatusOverlay from '@/components/common/StatusOverlay.vue'
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import util from '@/util/util'
import kiwiConsts from '@/const/kiwiConsts'
import MarkdownIt from 'markdown-it';
import {getStore} from '@/util/store'
// Import the language utility function
import { getInitialSelectedLanguage } from '@/util/langUtil';
import msgUtil from '@/util/msg';
import { mapMutations } from 'vuex';
import { createAIStream } from '@/util/sseClient';

const md = new MarkdownIt({
  html: true,
  breaks: false,
  linkify: true,
  typographer: true
});
let that;

export default {
  name: 'AiResponseDetail',
  components: { StatusOverlay, AiSelectionPopup, KiwiButton },
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
      streamAbortFn: null, // SSE abort function
      currentRequestId: null,

      // New data properties for text selection
      selectionDialogVisible: false,
      selectedText: '',
      selectionApiLoading: false,
      isSelectionStreaming: false,
      selectionAbortFn: null, // SSE abort function
      selectionCurrentRequestId: null,
      selectionResponseText: '',
      selectionResponseVisible: false,
      lastSelectedText: '',
      selectionContentCollapsed: false,

      // New: support multiple stacked explanations
      selectionExplanations: [], // array of {id, selectedText, contextText, responseText, apiLoading, isStreaming, collapsed, abortFn, requestId}
      lastSelectionContextText: '', // context text captured from the container where selection happened
      selectionSourceType: '', // 'original' | 'explanation'
      selectionSourceExplanationId: '',

      // Original text collapse state
      originalTextCollapsed: false,

      // New: inline error message
      lastErrorMessage: '',

      // Mount/SSE guards and bookkeeping
      _initializedOnce: false,
      _mainStreamAttempts: 0,
      _mainStreamMaxAttempts: 2,
      _mainStreamHadData: false,
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

    await this.init();
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
    // Modes that don't need the original text container (vocabulary-focused modes)
    showOriginalTextContainer() {
      return !kiwiConsts.AI_MODES_WITHOUT_ORIGINAL_TEXT.includes(this.validSelectedMode);
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
      // Always use SSE streaming only, no HTTP fallback
      return true
    },
    coreQueryKey() {
      const q = this.$route && this.$route.query ? this.$route.query : {}
      const selectedMode = (q.selectedMode || '').toString()
      const language = (q.language || '').toString()
      const originalText = (q.originalText || '').toString()
      const nativeLanguage = (q.nativeLanguage || '').toString()
      return `${selectedMode}|${language}|${nativeLanguage}|${originalText}`
    }
  },
  watch: {
    // Clear selectedText when dialog closes so re-selecting same text triggers the watcher
    selectionDialogVisible(val) {
      if (!val) {
        this.selectedText = '';
      }
    },
    '$route.query': {
      deep: true,
      handler(newQ, oldQ) {
        try {
          // If user switched away from search tab, don't re-initialize - keep content
          if (newQ.active && newQ.active !== 'search') {
            return
          }

          // Build comparison keys - include 'now' to allow explicit retry requests
          const newKey = [
            String(newQ.selectedMode || ''),
            String(newQ.language || ''),
            String(newQ.nativeLanguage || ''),
            String(newQ.originalText || ''),
            String(newQ.now || '')
          ].join('|')
          const oldKey = [
            String(oldQ && oldQ.selectedMode || ''),
            String(oldQ && oldQ.language || ''),
            String(oldQ && oldQ.nativeLanguage || ''),
            String(oldQ && oldQ.originalText || ''),
            String(oldQ && oldQ.now || '')
          ].join('|')
          // Ignore route churn if core inputs haven't changed
          if (newKey === oldKey) return
          // Otherwise, re-initialize once with new core inputs
          this.initializeFromRoute()
        } catch (e) {
          this.initializeFromRoute()
        }
      }
    }
  },
  beforeDestroy() {
    // Only clean up when component is actually destroyed (not just deactivated by keep-alive)
    // This ensures SSE streams continue when switching tabs
    // Clean up active SSE streams when leaving the page permanently
    this.abortAllStreams('all');
    // Close all selection streams
    this.closeSelectionResponse();
    // Clear Vuex store loading state
    this.setApiLoading({ loading: false, cancelCallback: null });
  },
  // Note: We intentionally do NOT abort SSE streams in deactivated() hook
  // to allow API calls to continue when user switches tabs
  methods: {
    ...msgUtil,
    ...mapMutations(['setApiLoading']),

    // Cancel all active SSE streams (called from Vuex store when user clicks stop button)
    cancelAllRequests() {
      this.abortAllStreams();
      this.apiLoading = false;
      this.isStreaming = false;
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;
      // Abort all selection explanation streams
      if (Array.isArray(this.selectionExplanations)) {
        this.selectionExplanations.forEach(it => {
          try { if (it.abortFn) { it.abortFn(); } } catch (e) { /* ignore */ }
          it.abortFn = null;
          it.apiLoading = false;
          it.isStreaming = false;
        });
      }
      // Clear Vuex store loading state
      this.setApiLoading({ loading: false, cancelCallback: null });
    },

    // Safely abort SSE stream(s) by type
    abortAllStreams(type) {
      try {
        const abortSafely = (abortRefName) => {
          try {
            const abortFn = this[abortRefName];
            if (abortFn) {
              try { abortFn(); } catch (_) {}
            }
            this[abortRefName] = null;
          } catch (_) {}
        };

        if (!type || type === 'all') {
          abortSafely('streamAbortFn');
          abortSafely('selectionAbortFn');
          return;
        }
        if (type === 'main') {
          abortSafely('streamAbortFn');
          return;
        }
        if (type === 'selection') {
          abortSafely('selectionAbortFn');
          return;
        }
        // Fallback: try to abort both if unknown type
        abortSafely('streamAbortFn');
        abortSafely('selectionAbortFn');
      } catch (_) { /* ignore */ }
    },

    async initializeFromRoute() {
      // Preserve the latest route params for future navigations
      try {
        this.preservedQueryParams = { ...this.$route.query };
      } catch (e) {
        this.preservedQueryParams = {};
      }

      // Ensure any active streams are aborted and stacked explanations cleared
      this.abortAllStreams('all');
      this.closeSelectionResponse();

      // Clear Vuex store loading state since we're starting fresh
      this.setApiLoading({ loading: false, cancelCallback: null });

      // Reset per-request state
      this.apiLoading = false;
      this.isStreaming = false;
      this.currentRequestId = null;
      this.selectionDialogVisible = false;
      this.selectionResponseVisible = false;
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;
      this.selectionCurrentRequestId = null;
      this.selectedText = '';
      this.selectionResponseText = '';
      this.lastSelectedText = '';
      this.selectionSourceType = '';
      this.selectionSourceExplanationId = '';
      this.lastErrorMessage = '';
      this.aiResponseVO.responseText = '';
      this._mainStreamAttempts = 0;
      this._mainStreamHadData = false;
      this._mainFallbackInFlight = false;
      this._lastMainRequest = null;

      // Sync the selected mode from the current route
      this.selectedMode = this.$route?.query?.selectedMode;

      await this.init();
    },

    async init() {
      // Clear previous inline errors before a new session
      this.lastErrorMessage = ''
      this._mainStreamAttempts = 0
      this._mainStreamHadData = false
      this._mainFallbackInFlight = false

      let originalText = this.$route.query.originalText;
      let targetLanguage = this.$route.query.language ? this.$route.query.language : this.defaultTargetLanguage;
      const routeNativeLanguage = this.$route?.query?.nativeLanguage
      let nativeLanguage = !util.isEmptyStr(routeNativeLanguage)
        ? routeNativeLanguage
        : this.defaultNativeLanguage;
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

      // Do not abort existing explanation SSE streams here; only dialog state reset

      // Clear text selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    },

    copySelectedText() {
      const text = this.selectedText && this.selectedText.trim();
      if (!text) return;

      const onSuccess = () => this.msgSuccess(this, this.$t('common.copy') || 'Copied to clipboard');
      const onError = () => this.msgError(this, this.$t('common.error') || 'Copy failed');

      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text).then(onSuccess).catch(onError);
      } else {
        try {
          const textarea = document.createElement('textarea');
          textarea.value = text;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
          onSuccess();
        } catch (_) {
          onError();
        }
      }
    },
    closeSelectionResponse() {
      // Abort any active SSE streams for items
      if (Array.isArray(this.selectionExplanations)) {
        this.selectionExplanations.forEach(it => {
          try { if (it.abortFn) { it.abortFn(); } } catch (e) { /* ignore */ }
          it.abortFn = null;
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
      try { if (item.abortFn) { item.abortFn(); } } catch (e) { /* ignore */ }
      item.abortFn = null;
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
        abortFn: null, // SSE abort function
        requestId: ''
      };
      this.selectionExplanations.push(newItem);

      // Clear dialog
      this.selectionDialogVisible = false;
      this.lastSelectedText = this.selectedText;

      // Start SSE stream for this item
      this.connectSelectionSSEForItem(newItem);

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
     * Start a SSE streaming session for a single explanation item
     */
    connectSelectionSSEForItem(item) {
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

      // Init states
      item.apiLoading = true;
      item.isStreaming = true;
      item.responseText = '';
      item.requestId = this.generateRequestId();

      // Create SSE stream
      const { abort } = createAIStream({
        body: {
          prompt: prompt,
          promptMode: 'selection-explanation',
          targetLanguage: this.defaultTargetLanguage,
          nativeLanguage: this.defaultNativeLanguage,
          timestamp: Date.now(),
          requestId: item.requestId
        },
        callbacks: {
          onStarted: () => {
            item.isStreaming = true;
          },
          onChunk: (chunk) => {
            if (chunk) {
              item.responseText += chunk;
            }
          },
          onCompleted: (response) => {
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
            item.abortFn = null;
          },
          onError: (error) => {
            this.handleSelectionItemError(item, (error.message || 'Selection AI streaming failed') + (error.errorCode ? ` (Code: ${error.errorCode})` : ''));
          }
        }
      });

      item.abortFn = abort;
    },

    handleSelectionItemError(item, errorMessage) {
      if (item) {
        item.apiLoading = false;
        item.isStreaming = false;
        try { if (item.abortFn) { item.abortFn(); } } catch (e) { /* ignore */ }
        item.abortFn = null;
      }
      this.msgError(this, errorMessage);
    },

    /**
     * Main AI SSE stream connection method
     * @param {string} selectedMode - AI prompt mode
     * @param {string} targetLanguage - Target language
     * @param {string} nativeLanguage - Native language
     * @param {string} originalText - The original text/prompt
     */
    connectMainSSEStream(selectedMode, targetLanguage, nativeLanguage, originalText) {
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

      // Close any existing streams
      that.closeSelectionResponse();
      that.abortAllStreams('main');

      // Track the last main request payload for retry/fallback
      that._lastMainRequest = {
        selectedMode,
        targetLanguage,
        nativeLanguage,
        decodedText
      }
      that._mainStreamAttempts += 1
      that._mainStreamHadData = false
      that._mainFallbackInFlight = false

      // Register loading state with Vuex store for Search.vue to display stop button
      that.setApiLoading({
        loading: true,
        cancelCallback: () => that.cancelAllRequests()
      });

      that.apiLoading = true;
      that.isStreaming = true;
      that.aiResponseVO.responseText = '';
      that.currentRequestId = requestId;
      that.lastErrorMessage = '';

      console.log('Starting SSE stream for:', decodedText);

      // Create SSE stream
      const { abort } = createAIStream({
        body: {
          prompt: decodedText,
          promptMode: selectedMode,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
          timestamp: Date.now(),
          requestId: requestId
        },
        callbacks: {
          onStarted: () => {
            console.log('AI streaming started');
            that.isStreaming = true;
            that._mainStreamHadData = true;
            that.lastErrorMessage = '';
          },
          onChunk: (chunk) => {
            if (chunk) {
              that._mainStreamHadData = true;
              that.aiResponseVO.responseText += chunk;
              console.log('Added chunk, total length:', that.aiResponseVO.responseText.length);
              that.persistNow();
            }
          },
          onCompleted: (response) => {
            console.log('AI streaming completed');
            that.isStreaming = false;
            that.apiLoading = false;
            that._mainStreamHadData = true;

            // Clear Vuex store loading state
            that.setApiLoading({ loading: false, cancelCallback: null });

            // Use fullResponse if available
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0)
                ? response.fullResponse
                : that.aiResponseVO.responseText;
              const extracted = that.extractResponseTextFromPayload(finalPayload);
              that.aiResponseVO.responseText = (typeof extracted === 'string' && extracted.length > 0)
                ? extracted
                : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload));
            } catch (_) {
              if (response.fullResponse) {
                that.aiResponseVO.responseText = response.fullResponse;
              }
            }

            that.streamAbortFn = null;
            that.persistNow();
          },
          onError: (error) => {
            console.error('AI streaming error:', error);

            // Check if we should retry
            if (!that._mainStreamHadData && that._mainStreamAttempts < that._mainStreamMaxAttempts && !that._mainFallbackInFlight) {
              const backoff = 200 * Math.pow(2, that._mainStreamAttempts - 1);
              console.log(`SSE retry ${that._mainStreamAttempts} scheduled in ${backoff}ms`);
              setTimeout(() => {
                if (that._lastMainRequest) {
                  that.connectMainSSEStream(
                    that._lastMainRequest.selectedMode,
                    that._lastMainRequest.targetLanguage,
                    that._lastMainRequest.nativeLanguage,
                    that._lastMainRequest.decodedText
                  );
                }
              }, backoff);
            } else {
              that._mainFallbackInFlight = true;
              const errorMessage = (error.message || 'AI streaming failed') + (error.errorCode ? ` (Code: ${error.errorCode})` : '');
              that.handleError(errorMessage);
            }
          }
        }
      });

      that.streamAbortFn = abort;
    },

    // Alias for backward compatibility
    connectMainWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText) {
      this.connectMainSSEStream(selectedMode, targetLanguage, nativeLanguage, originalText);
    },

    handleError(errorMessage) {
      // Stop all loading states immediately
      that.apiLoading = false;
      that.isStreaming = false;

      // Clear Vuex store loading state
      that.setApiLoading({ loading: false, cancelCallback: null });

      // Abort SSE stream
      that.abortAllStreams('main');

      // Clear any partial response
      that.aiResponseVO.responseText = '';

      // Show error message prominently in the UI
      that.lastErrorMessage = errorMessage;
      that.msgError(that, errorMessage)
    },

    handleSelectionError(errorMessage) {
      that.selectionApiLoading = false;
      that.isSelectionStreaming = false;
      that.abortAllStreams('selection');
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

    // Regenerate response by recalling WS AI
    regenerateResponse() {
      if (this.apiLoading || this.isStreaming) return;
      // Reset main response state and errors
      this.lastErrorMessage = '';
      this.aiResponseVO.responseText = '';
      this.abortAllStreams('main');

      // Re-initiate the AI call with current inputs
      this.init();
    },

    // Persist on meaningful changes (no-op after cache removal)
    persistNow() {
      // Caching removed; method retained to avoid refactoring callers.
    }
  }
}
</script>



<style scoped>
.ai-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  color: var(--text-primary);
}

h1 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 30px;
  font-size: 2.5rem;
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}

/* Original Text Styling */
.original-text-container {
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  margin-bottom: 30px;
  overflow: hidden;
  border: 1px solid var(--border-color-light);
  transition: all 0.3s ease;
  backdrop-filter: var(--backdrop-filter);
}

.original-text-container:hover {
  box-shadow: var(--shadow-hover);
}

.original-text-title {
  background: var(--bg-header);
  padding: 15px 20px;
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-primary);
  border-bottom: 1px solid var(--border-color-light);
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.original-text-title:hover {
  background: var(--bg-container);
}

.title-text {
  font-weight: 600;
  color: var(--text-secondary);
}

.collapse-icon {
  color: var(--icon-color);
  transition: transform 0.3s;
}

.original-text-content {
  padding: 20px;
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-primary);
  white-space: pre-wrap;
}

/* Selection Popup Styling */
.selection-dialog-content {
  padding: 10px 0;
}

.selected-text-preview {
  background: var(--bg-container);
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-card);
}

.selected-text-preview strong {
  display: block;
  margin-bottom: 8px;
  color: var(--text-secondary);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-text {
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.6;
  max-height: 150px;
  overflow-y: auto;
}

.dialog-actions {
  text-align: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
  margin-bottom: 10px;
}

/* Multiple Selection Response Styling */
.selection-response-container {
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  margin-bottom: 25px;
  padding: 25px;
  border: 1px solid var(--border-color-light);
  position: relative;
  animation: slideIn 0.4s ease-out;
  backdrop-filter: var(--backdrop-filter);
}

@keyframes slideIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.selection-response-title {
  color: var(--color-primary);
  margin-top: 0;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--divider-color);
  display: flex;
  align-items: center;
  font-size: 1.3rem;
}

.selection-response-title i {
  margin-right: 10px;
  font-size: 1.4rem;
}

.selection-title-controls {
  margin-left: auto;
  display: flex;
  gap: 5px;
}

.fold-selection-button,
.close-selection-button {
  padding: 4px 8px;
  font-size: 1.2rem;
  color: var(--text-secondary);
}

.fold-selection-button:hover,
.close-selection-button:hover {
  color: var(--color-primary);
  background-color: var(--bg-container);
  border-radius: 4px;
}

.selected-text-reference {
  background: var(--bg-container);
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 20px;
  color: var(--text-secondary);
  font-size: 0.95rem;
  border-left: 3px solid var(--color-info);
}

.selection-response-content {
  line-height: 1.8;
  color: var(--text-primary);
  font-size: 1.05rem;
}

/* Main Response Styling */
.response-container {
  position: relative;
  padding-top: 40px;
}

.copy-button {
  position: absolute;
  top: 0;
  right: 0;
  background: var(--gradient-primary);
  border: none;
  color: white;
  transition: var(--transition-normal);
  border-radius: var(--radius-md);

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }

  &:focus {
    opacity: 0.9;
    box-shadow: 0 0 0 2px var(--color-primary-light-9);
  }

  &:active {
    transform: translateY(0);
  }
}

.regen-button {
  position: absolute;
  top: 0;
  right: 100px;
  background: var(--gradient-danger);
  border: none;
  color: white;
  transition: var(--transition-normal);
  border-radius: var(--radius-md);

  &:hover {
    opacity: 0.9;
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
  }

  &:focus {
    opacity: 0.9;
    color: white;
  }

  &:active {
    transform: translateY(0);
  }
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
  box-shadow: var(--shadow-card);
}

.dialog-footer .el-button:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-hover);
}

.dialog-footer .el-button:active {
  transform: translateY(0px);
}

/* Dictionary button specific styling */
.dialog-footer .el-button--info {
  background: var(--gradient-info);
  border: none;
  color: white;

  &:hover,
  &:focus {
    opacity: 0.9;
    color: white;
  }
}

/* Primary button (Explain Selection) specific styling */
.dialog-footer .el-button--primary {
  background: var(--gradient-primary);
  border: none;
  color: white;

  &:hover,
  &:focus {
    opacity: 0.9;
    color: white;
  }
}

/* Align footer buttons in Explain Selected Text dialog */
.selection-dialog-footer {
  display: flex;
  align-items: stretch;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  width: 100%;
  padding: 6px 0;
}
.selection-dialog-footer .el-button {
  flex: 1 1 0;
  min-width: 0;
  white-space: normal;
  word-break: break-word;
}

@media (max-width: 640px) {
  .selection-dialog-footer { flex-direction: column; align-items: stretch; gap: 8px; }
  .selection-dialog-footer .el-button { width: 100%; }
}

.inline-error {
  color: var(--color-danger);
  background: rgba(245, 108, 108, 0.1);
  border: 1px solid rgba(245, 108, 108, 0.2);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.main-response-content { text-align: left; margin-bottom: 40px; color: var(--text-primary); }
</style>
<style lang="scss" scoped>
// Responsive styles for AI Response Detail
@media (max-width: 992px) {
  .ai-container {
    max-width: 100%;
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .ai-container {
    padding: 14px;
    // Allow text selection by default
    user-select: text;
    -webkit-user-select: text;
  }

  h1 {
    font-size: 1.8rem;
    margin-bottom: 20px;
  }

  // Original text container
  .original-text-container {
    margin-bottom: 20px;
    border-radius: 12px;
  }

  .original-text-title {
    padding: 12px 14px;
    font-size: 1rem;
  }

  .title-text {
    font-size: 14px;
  }

  .original-text-content {
    padding: 14px;
    font-size: 1rem;
    line-height: 1.7;
  }

  // Selection response container
  .selection-response-container {
    padding: 16px;
    margin-bottom: 16px;
    border-radius: 12px;
  }

  .selection-response-title {
    font-size: 1.1rem;
    flex-wrap: wrap;
    gap: 8px;
  }

  .selection-response-title i {
    font-size: 1.2rem;
    margin-right: 8px;
  }

  .selection-title-controls {
    margin-left: auto;
  }

  .selected-text-reference {
    padding: 10px 12px;
    font-size: 0.9rem;
    margin-bottom: 14px;
  }

  .selection-response-content {
    font-size: 1rem;
    line-height: 1.7;
  }

  // Main response container
  .response-container {
    padding-top: 50px;
  }

  .copy-button,
  .regen-button {
    position: static;
    display: inline-flex;
    margin-right: 8px;
    margin-bottom: 12px;
  }

  .main-response-content {
    margin-bottom: 20px;
  }

  // Selection dialog footer
  .dialog-footer {
    padding: 14px 16px;
  }

  .dialog-footer .el-button {
    padding: 10px 18px;
    font-size: 13px;
    min-width: 120px;
    margin: 4px;
  }

  // Ensure content areas are selectable
  .original-text-content,
  .selection-response-content,
  .main-response-content,
  .selected-text-reference {
    user-select: text;
    -webkit-user-select: text;
    -webkit-touch-callout: default;
  }

  // Only disable selection on UI elements like titles and buttons
  .original-text-title,
  .selection-response-title,
  .dialog-footer,
  .selection-dialog-footer {
    user-select: none;
    -webkit-user-select: none;
  }

  // Inline error styling
  .inline-error {
    padding: 8px 10px;
    font-size: 14px;
    margin-bottom: 10px;
  }
}

@media (max-width: 640px) {
  .ai-container {
    padding: 12px;
  }

  h1 {
    font-size: 1.5rem;
    margin-bottom: 16px;
  }

  .original-text-title {
    padding: 10px 12px;
    font-size: 0.95rem;
  }

  .original-text-content {
    padding: 12px;
    font-size: 0.95rem;
  }

  .selection-response-container {
    padding: 14px;
  }

  .selection-response-title {
    font-size: 1rem;
  }

  .response-container {
    padding-top: 0;
  }

  .copy-button,
  .regen-button {
    width: 100%;
    margin-right: 0;
    margin-bottom: 8px;
    justify-content: center;
  }

  .dialog-footer .el-button {
    width: 100%;
    margin: 4px 0;
  }

  .selection-dialog-footer {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .selection-dialog-footer .el-button {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .ai-container {
    padding: 10px;
  }

  h1 {
    font-size: 1.3rem;
    margin-bottom: 14px;
  }

  .original-text-container {
    margin-bottom: 14px;
  }

  .original-text-title {
    padding: 8px 10px;
    font-size: 0.9rem;
  }

  .collapse-icon {
    font-size: 14px;
  }

  .original-text-content {
    padding: 10px;
    font-size: 0.9rem;
    line-height: 1.6;
  }

  .selection-response-container {
    padding: 12px;
    margin-bottom: 12px;
  }

  .selection-response-title {
    font-size: 0.95rem;
    margin-bottom: 10px;
    padding-bottom: 8px;
  }

  .fold-selection-button,
  .close-selection-button {
    padding: 3px 6px;
    font-size: 1rem;
  }

  .selected-text-reference {
    padding: 8px 10px;
    font-size: 0.85rem;
    margin-bottom: 12px;
  }

  .selection-response-content {
    font-size: 0.95rem;
    line-height: 1.6;
  }

  .main-response-content {
    font-size: 0.95rem;
  }

  // Selected text preview in dialog
  .selected-text-preview {
    padding: 12px;
    margin-bottom: 14px;
  }

  .selected-text-preview strong {
    font-size: 0.8rem;
    margin-bottom: 6px;
  }

  .selected-text {
    font-size: 0.9rem;
    max-height: 100px;
  }
}
</style>
