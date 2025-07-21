<template>
  <div>
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
          @mouseup="handleTextSelection"
          @touchend="handleTextSelection"
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
        <el-button @click="selectionDialogVisible = false">Cancel</el-button>
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

    <!-- Selection Response Display -->
    <div v-if="selectionResponseVisible" class="selection-response-container">
      <h3 class="selection-response-title">
        <i class="el-icon-chat-dot-square"></i>
        Explanation for Selected Text
        <!-- Control buttons in the title bar -->
        <div class="selection-title-controls">
          <el-button
              class="fold-selection-button"
              type="text"
              :icon="selectionContentCollapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
              @click="toggleSelectionContent"
              :disabled="selectionApiLoading"
              :title="selectionContentCollapsed ? 'Expand explanation' : 'Collapse explanation'"
          ></el-button>
          <el-button
              class="close-selection-button"
              type="text"
              icon="el-icon-close"
              @click="closeSelectionResponse"
              :disabled="selectionApiLoading"
              title="Close explanation"
          ></el-button>
        </div>
      </h3>
      <div class="selected-text-reference">
        <strong>Selected:</strong> "{{ lastSelectedText }}"
      </div>
      <div
          v-show="!selectionContentCollapsed"
          class="selection-response-content"
          v-html="parsedSelectionResponse"
          v-loading="selectionApiLoading"
      >
        <div v-if="isSelectionStreaming" class="streaming-indicator">
          <i class="el-icon-loading"></i> Generating explanation...
        </div>
      </div>
    </div>

    <!-- Original Response Container -->
    <div class="response-container">
      <div v-html="parsedResponseText" style="text-align: justify; margin-bottom: 40px;" v-loading="apiLoading">
        <div v-if="isStreaming" class="streaming-indicator">
          <i class="el-icon-loading"></i> Streaming response...
        </div>
      </div>
      <el-button
          v-if="!apiLoading && parsedResponseText"
          class="copy-button"
          size="small"
          icon="el-icon-document-copy"
          @click="copyResponseText">
        Copy
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

      // Original text collapse state
      originalTextCollapsed: false
    }
  },
  beforeCreate() {
    that = this; // Global reference to Vue component instance
  },
  async mounted() {
    console.log('AiResponseDetail component mounted')
    await this.init();
  },
  watch: {
    '$route'() {
      console.log('AiResponseDetail component watch')
      this.closeWebSocket('main');
      this.closeWebSocket('selection');
      // Update preserved query parameters when route changes
      this.preservedQueryParams = { ...this.$route.query };
      this.init()
    }
  },
  beforeDestroy() {
    this.closeWebSocket('main');
    this.closeWebSocket('selection');
  },
  computed: {
    getTitle() {
      const mode = Object.values(kiwiConsts.SEARCH_AI_MODES).find(mode => mode.value === this.selectedMode);
      return mode ? mode.label : this.selectedMode;
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
    parsedSelectionResponse() {
      if (this.selectionResponseText) {
        const unescapedContent = this.unescapeContent(this.selectionResponseText);
        return md.render(unescapedContent);
      }
      return '';
    },
    rawSelectionResponse() {
      return this.unescapeContent(this.selectionResponseText) || '';
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
    }
  },
  methods: {
    ...msgUtil,
    async init() {
      let originalText = this.$route.query.originalText;
      let targetLanguage = this.$route.query.language ? this.$route.query.language : this.defaultTargetLanguage;
      let nativeLanguage = this.defaultNativeLanguage;
      let selectedMode = this.$route.query.selectedMode

      console.log('original text: ' + originalText + ' targetLanguage: ' + targetLanguage + ' nativeLanguage: ' + nativeLanguage + ' selectedMode: ' + selectedMode)

      if (!util.isEmptyStr(originalText) && !util.isEmptyStr(targetLanguage) && !util.isEmptyStr(nativeLanguage) && !util.isEmptyStr(selectedMode)) {
        this.connectMainWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText);
      }
    },

    // Toggle original text visibility
    toggleOriginalText() {
      this.originalTextCollapsed = !this.originalTextCollapsed;
    },

    // Toggle selection explanation content visibility
    toggleSelectionContent() {
      this.selectionContentCollapsed = !this.selectionContentCollapsed;
    },

    // Handle text selection
    handleTextSelection() {
      setTimeout(() => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText.length > 0) {
          // Check if the selection is within our original text container
          const range = selection.getRangeAt(0);
          const container = this.$refs.originalTextRef;

          if (container && container.contains(range.commonAncestorContainer)) {
            this.selectedText = selectedText;
            this.selectionDialogVisible = true;
          }
        }
      }, 100); // Small delay to ensure selection is complete
    },

    handleCloseSelectionDialog() {
      this.selectionDialogVisible = false;
      this.selectedText = '';
      this.selectionResponseText = '';
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;

      // Close any active WebSocket connection
      this.closeWebSocket('selection');

      // Clear text selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    },

    // New method to close the selection response display
    closeSelectionResponse() {
      this.selectionResponseVisible = false;
      this.selectionResponseText = '';
      this.lastSelectedText = '';
      this.selectionApiLoading = false;
      this.isSelectionStreaming = false;
      this.selectionContentCollapsed = false;

      // Close any active WebSocket connection
      this.closeWebSocket('selection');

      // Clear text selection
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    },

    // New method to search on dictionary
    searchOnDictionary() {
      if (!this.selectedText) {
        this.msgError(this, 'No text selected');
        return;
      }

      // URL encode the selected text to handle special characters
      const encodedText = encodeURIComponent(this.selectedText);
      
      // Build query parameters preserving all existing ones
      const queryParams = new URLSearchParams({
        ...this.preservedQueryParams, // Preserve all existing parameters
        originalText: encodedText,
        active: 'search',
        now: new Date().getTime().toString()
      });
      
      const dictionaryUrl = `/#/lazy/vocabulary/detail?${queryParams.toString()}`;

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

      this.selectionDialogVisible = false;
      this.lastSelectedText = this.selectedText;

      // Connect to WebSocket for selection explanation
      this.connectSelectionWebSocket();
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

      // Determine which WebSocket instance and loading states to use
      const isSelection = type === 'selection';
      const websocketKey = isSelection ? 'selectionWebSocket' : 'websocket';
      const loadingKey = isSelection ? 'selectionApiLoading' : 'apiLoading';
      const streamingKey = isSelection ? 'isSelectionStreaming' : 'isStreaming';

      // Auto-collapse original text on new request
      that.originalTextCollapsed = true;

      // Close selection response if this is a main request
      if (!isSelection) {
        that.closeSelectionResponse();
      }

      // Set loading states
      that[loadingKey] = true;
      that[streamingKey] = true;

      // Clear previous response
      if (isSelection) {
        that.selectionResponseText = '';
        that.selectionResponseVisible = true;
      } else {
        that.aiResponseVO.responseText = '';
      }

      // Store request ID
      const requestIdKey = isSelection ? 'selectionCurrentRequestId' : 'currentRequestId';
      that[requestIdKey] = requestId;

      // Get the access token
      const token = getStore({name: 'access_token'});

      if (!token) {
        const errorHandler = isSelection ? that.handleSelectionError : that.handleError;
        errorHandler('Authentication token not found. Please login again.');
        return;
      }

      // Determine WebSocket URL
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const wsUrl = `${protocol}//${host}/ai-biz/ai/ws/stream?access_token=${encodeURIComponent(token)}`;

      console.log(`Connecting to ${type} WebSocket with token`);
      that[websocketKey] = new WebSocket(wsUrl);

      that[websocketKey].onopen = () => {
        console.log(`${type} WebSocket connection established`);

        // Prepare the request payload
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
        that[websocketKey].send(JSON.stringify(request));
      };

      that[websocketKey].onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
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

      that[websocketKey].onerror = (error) => {
        console.error(`${type} WebSocket error:`, error);
        const errorHandler = isSelection ? that.handleSelectionError : that.handleError;
        errorHandler('WebSocket connection error');
      };

      that[websocketKey].onclose = (event) => {
        console.log(`${type} WebSocket connection closed:`, event.code, event.reason);
        that[loadingKey] = false;
        that[streamingKey] = false;
      };
    },

    // Simplified main AI request method
    connectMainWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText) {
      const requestId = that.generateRequestId();

      // Decode the original text (it comes URL-encoded from the route query)
      let decodedText = originalText;
      try {
        // Handle potential double encoding by decoding until no more changes
        while (decodedText !== decodeURIComponent(decodedText)) {
          decodedText = decodeURIComponent(decodedText);
        }
      } catch (error) {
        console.warn('Error decoding originalText:', error);
        // Use original text if decoding fails
        decodedText = originalText;
      }

      console.log('Sending decoded text:', decodedText);

      // Use the generic WebSocket connection method
      this.connectWebSocket({
        type: 'main',
        prompt: decodedText,
        promptMode: selectedMode,
        targetLanguage: targetLanguage,
        nativeLanguage: nativeLanguage,
        requestId: requestId
      });
    },

    // Simplified selection explanation method
    connectSelectionWebSocket() {
      const requestId = that.generateRequestId();

      // Prepare the prompt for selection explanation
      const prompt = kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION +
          that.selectedText +
          kiwiConsts.AI_MODE_TAG.SPLITTER +
          that.decodedOriginalText;

      // Use the generic WebSocket connection method
      this.connectWebSocket({
        type: 'selection',
        prompt: prompt,
        promptMode: 'selection-explanation',
        targetLanguage: that.defaultTargetLanguage,
        nativeLanguage: that.defaultNativeLanguage,
        requestId: requestId
      });
    },

    // Generic WebSocket close method
    closeWebSocket(type = 'main') {
      const websocketKey = type === 'selection' ? 'selectionWebSocket' : 'websocket';

      if (that[websocketKey]) {
        that[websocketKey].close();
        that[websocketKey] = null;
      }
    },

    handleWebSocketMessage(response) {
      console.log('Received WebSocket message:', response);

      switch (response.type) {
        case 'connected':
          console.log('AI Streaming connection established');
          break;

        case 'started':
          console.log('AI streaming started');
          that.isStreaming = true;
          break;

        case 'chunk':
          if (response.chunk) {
            // Just accumulate the raw chunks - unescaping will happen in computed property
            that.aiResponseVO.responseText += response.chunk;
            console.log('Added chunk, total length:', that.aiResponseVO.responseText.length);
          } else {
            console.warn('Received empty chunk:', response);
          }
          break;

        case 'completed':
          console.log('AI streaming completed');
          that.isStreaming = false;
          that.apiLoading = false;

          // Use fullResponse if available (it should be properly formatted)
          if (response.fullResponse) {
            console.log('Using fullResponse instead of accumulated chunks');
            that.aiResponseVO.responseText = response.fullResponse;
          }

          that.closeWebSocket('main');
          break;

        case 'error':
          console.error('AI streaming error:', response.message);
          let errorMessage = response.message || 'AI streaming failed';
          if (response.errorCode) {
            errorMessage += ` (Code: ${response.errorCode})`;
          }
          that.handleError(errorMessage);
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
          break;

        case 'started':
          console.log('Selection AI streaming started');
          that.isSelectionStreaming = true;
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

          if (response.fullResponse) {
            console.log('Using fullResponse for selection instead of accumulated chunks');
            that.selectionResponseText = response.fullResponse;
          }

          that.closeWebSocket('selection');
          break;

        case 'error':
          console.error('Selection AI streaming error:', response.message);
          let errorMessage = response.message || 'Selection AI streaming failed';
          if (response.errorCode) {
            errorMessage += ` (Code: ${response.errorCode})`;
          }
          that.handleSelectionError(errorMessage);
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
      that.msgError(that, errorMessage)
    },

    handleSelectionError(errorMessage) {
      that.selectionApiLoading = false;
      that.isSelectionStreaming = false;
      that.closeWebSocket('selection');
      that.selectionResponseText = '';
      that.msgError(that, errorMessage);
    },

    generateRequestId() {
      return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Add this method to your Vue component methods
    unescapeContent(content) {
      if (!content) return '';

      // Unescape common escaped characters
      return content
          .replace(/\\n/g, '\n')        // Convert \\n to actual newlines
          .replace(/\\t/g, '\t')        // Convert \\t to actual tabs
          .replace(/\\"/g, '"')         // Convert \\" to actual quotes
          .replace(/\\\\/g, '\\');      // Convert \\\\ to single backslash
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

.explanation-section {
  margin-top: 20px;
}

.explanation-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  color: #17a2b8;
  font-weight: 600;
}

.explanation-header i {
  margin-right: 8px;
  font-size: 16px;
}

.explanation-content {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  min-height: 80px;
  max-height: 300px;
  overflow-y: auto;
  line-height: 1.6;
  color: #2c3e50;
}

.waiting-message {
  color: #6c757d;
  font-style: italic;
  text-align: center;
  padding: 20px;
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
  display: flex;
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

.response-text {
  text-align: justify;
  margin-bottom: 40px;
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
</style>