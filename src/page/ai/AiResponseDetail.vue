<template>
  <div>
    <h1>{{ getTitle }}</h1>
    <div class="response-container">
      <div v-html="parsedResponseText" style="text-align: justify; margin-bottom: 40px;" v-loading="apiLoading">
        <!-- Show streaming indicator when receiving chunks -->
        <div v-if="isStreaming" class="streaming-indicator">
          <i class="el-icon-loading"></i> Streaming response...
        </div>
      </div>
      <el-button
          v-if="!apiLoading && parsedResponseText"
          class="copy-button"
          type="info"
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

const md = new MarkdownIt();
let that;


export default {
  data() {
    return {
      aiResponseVO: {
        responseText: ''
      },
      selectedMode: this.$route.query.selectedMode,
      apiLoading: false,
      isStreaming: false,
      copySuccess: false,
      websocket: null,
      currentRequestId: null
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
      this.closeWebSocket();
      this.init()
    }
  },
  beforeDestroy() {
    this.closeWebSocket();
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
    defaultTargetLanguage() {
      if (this.$route.query.language) {
        return this.$route.query.language
      }
      return getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) ? getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) : kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
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
        this.connectWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText);
      }
    },

    connectWebSocket(selectedMode, targetLanguage, nativeLanguage, originalText) {
      that.apiLoading = true;
      that.isStreaming = true;
      that.aiResponseVO.responseText = '';
      that.currentRequestId = that.generateRequestId();

      // Get the access token (same way as your axios interceptor)
      const token = getStore({name: 'access_token'});

      if (!token) {
        that.handleError('Authentication token not found. Please login again.');
        return;
      }

      // Determine WebSocket URL (adjust based on your environment)
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;

      // Add Bearer token to WebSocket URL as query parameter
      // Since WebSocket doesn't support custom headers in browser, we pass token as query param
      const wsUrl = `${protocol}//${host}/ai-biz/ai/ws/stream?access_token=${encodeURIComponent(token)}`;

      console.log('Connecting to WebSocket with token');
      that.websocket = new WebSocket(wsUrl);

      that.websocket.onopen = () => {
        console.log('WebSocket connection established');

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

        // Prepare the request payload
        const request = {
          prompt: decodedText,
          promptMode: selectedMode,
          targetLanguage: targetLanguage,
          nativeLanguage: nativeLanguage,
          timestamp: Date.now(),
          requestId: that.currentRequestId
        };

        // Send the request
        that.websocket.send(JSON.stringify(request));
      };

      that.websocket.onmessage = (event) => {
        try {
          const response = JSON.parse(event.data);
          that.handleWebSocketMessage(response);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          that.handleError('Failed to parse response');
        }
      };

      that.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        that.handleError('WebSocket connection error');
        that.apiLoading = false;
        that.isStreaming = false;
      };

      that.websocket.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason);
        that.apiLoading = false;
        that.isStreaming = false;
      };
    },

    // Update your chunk handling to accumulate properly
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

          that.closeWebSocket();
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

    handleError(errorMessage) {
      // Stop all loading states immediately
      that.apiLoading = false;
      that.isStreaming = false;

      // Close WebSocket connection
      that.closeWebSocket();

      // Clear any partial response
      that.aiResponseVO.responseText = '';

      // Show error message prominently in the UI
      that.msgError(that, errorMessage)
    },

    closeWebSocket() {
      if (that.websocket) {
        that.websocket.close();
        that.websocket = null;
      }
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
}

.streaming-indicator {
  color: #409EFF;
  font-style: italic;
  margin-bottom: 10px;
}

.streaming-indicator i {
  margin-right: 5px;
}
</style>