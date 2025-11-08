<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="600px"
    :before-close="onBeforeClose"
  >
    <div class="ai-dialog-content">
      <div class="selected-text-preview"><strong>Selected:</strong> "{{ localSelectedText }}"</div>
      <div v-if="aiLastError" class="inline-error">{{ aiLastError }}</div>
      <div v-show="aiIsStreaming" class="streaming-indicator">
        <i class="el-icon-loading"></i> Streaming response...
      </div>
      <div
        class="ai-response"
        ref="aiResponseRef"
        v-html="aiParsedResponseText"
        @mouseup="handlePopupSelection"
        @touchend="handlePopupSelection"
      ></div>
      <div class="tiny-tip">Tip: select text inside this response to open a context-aware Explanation popup.</div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeDialog">Close</el-button>
      <el-button type="primary" :loading="aiSearchLoading" :disabled="!localSelectedText" @click="aiSearchSelectedText">
        <i class="el-icon-search" style="margin-right:6px;"></i>Search
      </el-button>
      <el-button type="success" plain :disabled="!localSelectedText" @click="emitOpenInAiTab">
        <i class="el-icon-s-operation" style="margin-right:6px;"></i>Open in AI Tab
      </el-button>
    </span>
  </el-dialog>

  <!-- Nested selection dialog: Explain selection within first selection context -->
  <el-dialog
    title="Explain Selection in Context"
    :visible.sync="nestedDialogVisible"
    width="520px"
    :before-close="closeNestedDialog"
  >
    <div class="ai-dialog-content">
      <div class="selected-text-preview"><strong>Context (from first selection):</strong></div>
      <div class="context-preview">{{ localSelectedText }}</div>
      <div style="height:8px"></div>
      <div class="selected-text-preview"><strong>Selected:</strong> "{{ nestedSelectedText }}"</div>
      <div v-if="nestedLastError" class="inline-error">{{ nestedLastError }}</div>
      <div v-show="nestedIsStreaming" class="streaming-indicator">
        <i class="el-icon-loading"></i> Generating explanation...
      </div>
      <div
        class="ai-response"
        ref="nestedResponseRef"
        v-html="nestedParsedResponseText"
        @mouseup="handleNestedPopupSelection"
        @touchend="handleNestedPopupSelection"
      ></div>
      <div class="tiny-tip">Tip: select text again here to refine within the same context.</div>
    </div>
    <span slot="footer" class="dialog-footer">
      <el-button @click="closeNestedDialog">Close</el-button>
    </span>
  </el-dialog>
</template>

<script>
import MarkdownIt from 'markdown-it'
import kiwiConsts from '@/const/kiwiConsts'
import { getStore } from '@/util/store'
import msgUtil from '@/util/msg'

const md = new MarkdownIt({ html: true, breaks: false, linkify: true, typographer: true })

export default {
  name: 'AiSelectionPopup',
  props: {
    visible: { type: Boolean, default: false },
    selectedText: { type: String, default: '' },
    title: { type: String, default: 'AI Search' }
  },
  data() {
    return {
      aiWebsocket: null,
      aiSearchLoading: false,
      aiIsStreaming: false,
      aiRequestId: '',
      aiResponseText: '',
      aiLastError: '',
      localSelectedText: this.selectedText,
      // Nested (second selection) states
      nestedDialogVisible: false,
      nestedSelectedText: '',
      nestedAiWebsocket: null,
      nestedLoading: false,
      nestedIsStreaming: false,
      nestedRequestId: '',
      nestedResponseText: '',
      nestedLastError: ''
    }
  },
  watch: {
    selectedText(val) {
      this.localSelectedText = (val || '').trim()
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) {
        this.$emit('update:visible', v)
        if (!v) this.stopStream(true)
      }
    },
    aiParsedResponseText() {
      const text = this.unescapeContent(this.aiResponseText || '')
      return md.render(text)
    },
    nestedParsedResponseText() {
      const text = this.unescapeContent(this.nestedResponseText || '')
      return md.render(text)
    }
  },
  methods: {
    // Public API-like methods
    closeDialog() { this.dialogVisible = false },
    onBeforeClose() { this.dialogVisible = false },

    // Search primary action (auto mode by content length)
    aiSearchSelectedText() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      const isSingle = this.isSingleWord(text)
      const promptMode = isSingle
        ? kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value
        : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
      const targetLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const nativeLanguage = getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      this.startAiStreaming({ prompt: text, promptMode, targetLanguage, nativeLanguage })
    },

    // Primary popup: selecting inside response opens a nested dialog and runs context-aware Explanation
    handlePopupSelection() {
      try {
        const container = this.$refs.aiResponseRef
        if (!container) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        this.openNestedDialogWith(text)
      } catch (_) { /* ignore */ }
    },

    openNestedDialogWith(text) {
      this.nestedSelectedText = (text || '').trim()
      if (!this.nestedSelectedText) return
      this.nestedResponseText = ''
      this.nestedLastError = ''
      this.nestedDialogVisible = true
      this.$nextTick(() => this.startNestedStreaming())
    },

    // Nested selection => Explanation mode with first selection as context
    startNestedStreaming() {
      const promptSelection = this.nestedSelectedText
      const context = (this.localSelectedText || '').trim()
      if (!promptSelection) return
      // Build contextual prompt using the same tags as AiResponseDetail
      const prompt = `${kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION}${promptSelection}${kiwiConsts.AI_MODE_TAG.SPLITTER}${context}`
      const promptMode = 'selection-explanation'
      const targetLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const nativeLanguage = getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      this.startNestedWs({ prompt, promptMode, targetLanguage, nativeLanguage })
    },

    handleNestedPopupSelection() {
      try {
        const container = this.$refs.nestedResponseRef
        if (!container) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        // Update nested selection and restart streaming within the same first-context
        this.nestedSelectedText = text
        this.nestedResponseText = ''
        this.nestedLastError = ''
        this.startNestedStreaming()
      } catch (_) { /* ignore */ }
    },

    emitOpenInAiTab() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      this.stopStream(true)
      // Close immediately to avoid any duplicate triggers on route changes
      this.dialogVisible = false
      this.$emit('open-ai-tab', { text })
    },

    // WS streaming core (primary)
    startAiStreaming({ prompt, promptMode, targetLanguage, nativeLanguage }) {
      this.aiLastError = ''
      this.aiResponseText = ''
      this.aiSearchLoading = true
      this.aiIsStreaming = true
      this.aiRequestId = this.generateRequestId()

      const token = getStore({name: 'access_token'})
      if (!token) {
        this.aiSearchLoading = false
        this.aiIsStreaming = false
        this.aiLastError = 'Authentication token not found. Please login again.'
        msgUtil.msgError(this, this.aiLastError)
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}${kiwiConsts.API_BASE.AI_BIZ}/ws/stream?access_token=${encodeURIComponent(token)}`

      try { this.stopStream(true) } catch (_) {}
      try { this.aiWebsocket = new WebSocket(wsUrl) } catch (e) {
        this.aiSearchLoading = false
        this.aiIsStreaming = false
        this.aiLastError = 'Failed to open WebSocket'
        msgUtil.msgError(this, this.aiLastError)
        return
      }

      this.aiWebsocket.onopen = () => {
        const request = {
          prompt, promptMode, targetLanguage, nativeLanguage, aiUrl: wsUrl,
          timestamp: Date.now(), requestId: this.aiRequestId
        }
        try { this.aiWebsocket.send(JSON.stringify(request)) } catch (e) {
          this.handleAiStreamError('Failed to send request')
        }
      }

      this.aiWebsocket.onmessage = (event) => {
        let response
        try { response = JSON.parse(event.data) } catch (error) { this.handleAiStreamError('Failed to parse response'); return }
        switch (response.type) {
          case 'connected': break
          case 'started': this.aiIsStreaming = true; break
          case 'chunk': if (response.chunk) this.aiResponseText += response.chunk; break
          case 'completed': {
            this.aiIsStreaming = false
            this.aiSearchLoading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : this.aiResponseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              this.aiResponseText = (typeof extracted === 'string' && extracted.length > 0) ? extracted : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) { if (response.fullResponse) this.aiResponseText = response.fullResponse }
            try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
            this.aiWebsocket = null
            break
          }
          case 'error': this.handleAiStreamError((response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : '')); break
          default: break
        }
      }

      this.aiWebsocket.onerror = () => this.handleAiStreamError('WebSocket connection error')
      this.aiWebsocket.onclose = () => { this.aiSearchLoading = false; this.aiIsStreaming = false }
    },

    // WS streaming core (nested)
    startNestedWs({ prompt, promptMode, targetLanguage, nativeLanguage }) {
      this.nestedLastError = ''
      this.nestedResponseText = ''
      this.nestedLoading = true
      this.nestedIsStreaming = true
      this.nestedRequestId = this.generateRequestId()

      const token = getStore({name: 'access_token'})
      if (!token) {
        this.nestedLoading = false
        this.nestedIsStreaming = false
        this.nestedLastError = 'Authentication token not found. Please login again.'
        msgUtil.msgError(this, this.nestedLastError)
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}${kiwiConsts.API_BASE.AI_BIZ}/ws/stream?access_token=${encodeURIComponent(token)}`

      try { this.stopNestedStream(true) } catch (_) {}
      try { this.nestedAiWebsocket = new WebSocket(wsUrl) } catch (e) {
        this.nestedLoading = false
        this.nestedIsStreaming = false
        this.nestedLastError = 'Failed to open WebSocket'
        msgUtil.msgError(this, this.nestedLastError)
        return
      }

      this.nestedAiWebsocket.onopen = () => {
        const request = { prompt, promptMode, targetLanguage, nativeLanguage, aiUrl: wsUrl, timestamp: Date.now(), requestId: this.nestedRequestId }
        try { this.nestedAiWebsocket.send(JSON.stringify(request)) } catch (e) { this.handleNestedStreamError('Failed to send request') }
      }

      this.nestedAiWebsocket.onmessage = (event) => {
        let response
        try { response = JSON.parse(event.data) } catch (error) { this.handleNestedStreamError('Failed to parse response'); return }
        switch (response.type) {
          case 'connected': break
          case 'started': this.nestedIsStreaming = true; break
          case 'chunk': if (response.chunk) this.nestedResponseText += response.chunk; break
          case 'completed': {
            this.nestedIsStreaming = false
            this.nestedLoading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : this.nestedResponseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              this.nestedResponseText = (typeof extracted === 'string' && extracted.length > 0) ? extracted : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) { if (response.fullResponse) this.nestedResponseText = response.fullResponse }
            try { this.nestedAiWebsocket && this.nestedAiWebsocket.close() } catch (_) {}
            this.nestedAiWebsocket = null
            break
          }
          case 'error': this.handleNestedStreamError((response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : '')); break
          default: break
        }
      }

      this.nestedAiWebsocket.onerror = () => this.handleNestedStreamError('WebSocket connection error')
      this.nestedAiWebsocket.onclose = () => { this.nestedLoading = false; this.nestedIsStreaming = false }
    },

    handleAiStreamError(message) {
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      this.aiLastError = message || 'AI streaming error'
      try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
      this.aiWebsocket = null
      msgUtil.msgError(this, this.aiLastError)
    },
    handleNestedStreamError(message) {
      this.nestedLoading = false
      this.nestedIsStreaming = false
      this.nestedLastError = message || 'AI streaming error'
      try { this.nestedAiWebsocket && this.nestedAiWebsocket.close() } catch (_) {}
      this.nestedAiWebsocket = null
      msgUtil.msgError(this, this.nestedLastError)
    },
    stopStream(silent) {
      try { if (this.aiWebsocket) { this.aiWebsocket.close() } } catch (_) {}
      this.aiWebsocket = null
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      if (!silent) this.aiLastError = ''
    },
    stopNestedStream(silent) {
      try { if (this.nestedAiWebsocket) { this.nestedAiWebsocket.close() } } catch (_) {}
      this.nestedAiWebsocket = null
      this.nestedLoading = false
      this.nestedIsStreaming = false
      if (!silent) this.nestedLastError = ''
    },
    closeNestedDialog() {
      this.stopNestedStream(true)
      this.nestedDialogVisible = false
    },

    // Utils
    generateRequestId() { return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) },
    sanitizePotentialJsonString(str) {
      if (typeof str !== 'string') return ''
      let s = (str || '').trim()
      s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')
      s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      if (!s.startsWith('{')) {
        const firstBrace = s.indexOf('{'); const lastBrace = s.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          s = s.substring(firstBrace, lastBrace + 1).trim()
        }
      }
      return s
    },
    tryParseJsonLoose(str) {
      if (typeof str !== 'string') return null
      const cleaned = this.sanitizePotentialJsonString(str)
      try { return JSON.parse(cleaned) } catch (_) { return null }
    },
    extractResponseTextFromPayload(payload) {
      try {
        if (payload && typeof payload === 'object') {
          if (typeof payload.responseText === 'string') return payload.responseText
          if (payload.data && typeof payload.data.responseText === 'string') return payload.data.responseText
          return null
        }
        if (typeof payload === 'string') {
          const obj = this.tryParseJsonLoose(payload)
          if (obj) {
            if (typeof obj.responseText === 'string') return obj.responseText
            if (obj.data && typeof obj.data.responseText === 'string') return obj.data.responseText
          }
          const normalized = payload.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
          const match = normalized.match(/"responseText"\s*:\s*"([\s\S]*?)"/)
          if (match) return match[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\t/g, '\t').replace(/\\r/g, '\r')
        }
        return null
      } catch (_) { return null }
    },
    unescapeContent(content) {
      if (!content) return ''
      return content
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    },
    isSingleWord(text) {
      if (!text) return false
      const s = String(text).trim()
      const tokens = s.match(/[A-Za-zÀ-ÖØ-öø-ÿ0-9'’-]+/g)
      return Array.isArray(tokens) && tokens.length === 1
    }
  }
}
</script>

<style scoped>
.ai-dialog-content { padding: 10px 0; }
.selected-text-preview { margin-bottom: 10px; color: #606266; }
.ai-response { max-height: 45vh; overflow-y: auto; padding: 10px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
.inline-error { color: #f56c6c; background: #fdecea; border: 1px solid #f5c2c0; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
.dialog-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.tiny-tip { margin-top: 6px; color: #909399; font-size: 12px; }
.context-preview { white-space: pre-wrap; background: #f8f9fa; border: 1px solid #ebeef5; border-radius: 6px; padding: 8px; color: #606266; max-height: 100px; overflow: auto; }
</style>
