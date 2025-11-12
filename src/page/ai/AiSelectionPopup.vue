<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="600px"
    :before-close="onBeforeClose"
  >
    <div class="ai-dialog-content">
      <div class="selected-text-preview">
        <strong>Selected:</strong>
        "<span
          ref="primarySelectionContent"
          class="primary-selection-content"
          @mouseup="handlePrimarySelection"
          @touchend="handlePrimarySelection"
        >{{ localSelectedText }}</span>"
      </div>
      <div
        class="sub-tip"
        v-if="localSelectedText && localSelectedText.length > 0"
      >
        Tip: select a sub-phrase in the selected text above or in the response below to open a contextual explanation.
      </div>
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
      <div class="tiny-tip">Tip: select text inside this response to open a context-aware explanation card.</div>

      <div v-if="explanationItems.length" class="explanation-list">
        <div
          v-for="item in explanationItems"
          :key="item.id"
          class="explanation-item"
        >
          <div class="explanation-header">
            <button
              type="button"
              class="explanation-toggle"
              @click="toggleExplanation(item)"
            >
              <i :class="item.expanded ? 'el-icon-arrow-down' : 'el-icon-arrow-right'"></i>
            </button>
            <div class="explanation-title">
              Explanation for <span class="explanation-snippet">"{{ formatSnippet(item.selectedText) }}"</span>
            </div>
            <el-button
              type="text"
              icon="el-icon-close"
              class="explanation-close"
              @click="removeExplanation(item.id)"
            ></el-button>
          </div>
          <transition name="el-fade-in">
            <div v-show="item.expanded" class="explanation-body">
              <div v-if="item.lastError" class="inline-error">{{ item.lastError }}</div>
              <div v-show="item.isStreaming" class="streaming-indicator">
                <i class="el-icon-loading"></i> Generating explanation...
              </div>
              <div
                class="ai-response"
                v-html="renderExplanationResponse(item)"
                @mouseup="handlePopupSelection"
                @touchend="handlePopupSelection"
              ></div>
            </div>
          </transition>
        </div>
      </div>
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
</template>

<script>
import MarkdownIt from 'markdown-it'
import kiwiConsts from '@/const/kiwiConsts'
import { getStore } from '@/util/store'
import msgUtil from '@/util/msg'
import { buildAiTabQuery } from '@/util/aiNavigation'

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
      localSelectedText: (this.selectedText || '').trim(),
      explanationItems: []
    }
  },
  watch: {
    selectedText(val) {
      const trimmed = (val || '').trim()
      if (trimmed !== this.localSelectedText) {
        this.resetForNewSelection(trimmed)
      }
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) {
        this.$emit('update:visible', v)
        if (v) {
          this.resetExplanationItems()
          this.aiLastError = ''
          this.aiResponseText = ''
          const incoming = (this.selectedText || '').trim()
          if (incoming !== this.localSelectedText) {
            this.localSelectedText = incoming
          }
          this.$nextTick(() => {
            if (this.localSelectedText && !this.aiIsStreaming && !this.aiSearchLoading) {
              try { this.aiSearchSelectedText() } catch (_) {}
            }
          })
        } else {
          this.stopAllStreams()
        }
      }
    },
    aiParsedResponseText() {
      const text = this.unescapeContent(this.aiResponseText || '')
      return text ? md.render(text) : ''
    }
  },
  methods: {
    closeDialog() { this.dialogVisible = false },
    onBeforeClose() {
      this.stopAllStreams()
      this.dialogVisible = false
    },
    resetForNewSelection(text) {
      this.stopAllStreams()
      this.localSelectedText = text
      this.aiResponseText = ''
      this.aiLastError = ''
      this.resetExplanationItems()
      if (this.visible && text) {
        this.$nextTick(() => {
          try { this.aiSearchSelectedText() } catch (_) {}
        })
      }
    },
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
      const targetLanguage = getStore({ name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE }) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const nativeLanguage = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG }) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      this.startAiStreaming({ prompt: text, promptMode, targetLanguage, nativeLanguage })
    },
    handlePrimarySelection(event) {
      this.captureSelectionFrom(event, this.$refs.primarySelectionContent)
    },
    handlePopupSelection(event) {
      this.captureSelectionFrom(event, this.$refs.aiResponseRef)
    },
    captureSelectionFrom(event, fallback) {
      try {
        const container = (event && event.currentTarget) || fallback
        if (!container) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        this.queueExplanation(text)
        if (sel.removeAllRanges) sel.removeAllRanges()
      } catch (_) {
        // ignore selection errors
      }
    },
    queueExplanation(text) {
      const selection = (text || '').trim()
      const context = (this.localSelectedText || '').trim()
      if (!selection || !context) return
      const item = {
        id: this.generateRequestId(),
        selectedText: selection,
        responseText: '',
        isStreaming: false,
        isLoading: false,
        lastError: '',
        expanded: true,
        websocket: null,
        requestId: ''
      }
      this.explanationItems.push(item)
      this.$nextTick(() => this.startExplanationStream(item))
    },
    toggleExplanation(item) {
      if (item) item.expanded = !item.expanded
    },
    removeExplanation(id) {
      const index = this.explanationItems.findIndex(item => item.id === id)
      if (index === -1) return
      const [item] = this.explanationItems.splice(index, 1)
      if (item) {
        this.stopExplanationStream(item, { silent: true })
      }
    },
    renderExplanationResponse(item) {
      if (!item || !item.responseText) return ''
      const text = this.unescapeContent(item.responseText)
      return text ? md.render(text) : ''
    },
    formatSnippet(text) {
      if (!text) return ''
      const cleaned = String(text).replace(/\s+/g, ' ').trim()
      return cleaned.length > 48 ? `${cleaned.slice(0, 45)}…` : cleaned
    },
    startAiStreaming({ prompt, promptMode, targetLanguage, nativeLanguage }) {
      this.stopStream(true)
      this.aiLastError = ''
      this.aiResponseText = ''
      this.aiSearchLoading = true
      this.aiIsStreaming = true
      this.aiRequestId = this.generateRequestId()

      const token = getStore({ name: 'access_token' })
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
      try { this.aiWebsocket = new WebSocket(wsUrl) } catch (e) {
        this.aiSearchLoading = false
        this.aiIsStreaming = false
        this.aiLastError = 'Failed to open WebSocket'
        msgUtil.msgError(this, this.aiLastError)
        return
      }

      this.aiWebsocket.onopen = () => {
        const request = {
          prompt,
          promptMode,
          targetLanguage,
          nativeLanguage,
          aiUrl: wsUrl,
          timestamp: Date.now(),
          requestId: this.aiRequestId
        }
        try { this.aiWebsocket.send(JSON.stringify(request)) } catch (e) {
          this.handleAiStreamError('Failed to send request')
        }
      }

      this.aiWebsocket.onmessage = (event) => {
        let response
        try { response = JSON.parse(event.data) } catch (error) {
          this.handleAiStreamError('Failed to parse response')
          return
        }
        switch (response.type) {
          case 'connected':
            break
          case 'started':
            this.aiIsStreaming = true
            break
          case 'chunk':
            if (response.chunk) this.aiResponseText += response.chunk
            break
          case 'completed': {
            this.aiIsStreaming = false
            this.aiSearchLoading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : this.aiResponseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              this.aiResponseText = (typeof extracted === 'string' && extracted.length > 0)
                ? extracted
                : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) {
              if (response.fullResponse) this.aiResponseText = response.fullResponse
            }
            try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
            this.aiWebsocket = null
            break
          }
          case 'error':
            this.handleAiStreamError((response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : ''))
            break
          default:
            break
        }
      }

      this.aiWebsocket.onerror = () => this.handleAiStreamError('WebSocket connection error')
      this.aiWebsocket.onclose = () => {
        this.aiSearchLoading = false
        this.aiIsStreaming = false
      }
    },
    startExplanationStream(item) {
      if (!item) return
      const context = (this.localSelectedText || '').trim()
      if (!context) {
        item.lastError = 'Context unavailable for explanation.'
        return
      }

      this.stopExplanationStream(item, { silent: true })
      item.lastError = ''
      item.responseText = ''
      item.isLoading = true
      item.isStreaming = true
      item.requestId = this.generateRequestId()

      const token = getStore({ name: 'access_token' })
      if (!token) {
        item.isLoading = false
        item.isStreaming = false
        item.lastError = 'Authentication token not found. Please login again.'
        msgUtil.msgError(this, item.lastError)
        return
      }

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}${kiwiConsts.API_BASE.AI_BIZ}/ws/stream?access_token=${encodeURIComponent(token)}`

      try {
        item.websocket = new WebSocket(wsUrl)
      } catch (e) {
        item.isLoading = false
        item.isStreaming = false
        item.lastError = 'Failed to open WebSocket'
        msgUtil.msgError(this, item.lastError)
        return
      }

      const prompt = `${kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION}${item.selectedText}${kiwiConsts.AI_MODE_TAG.SPLITTER}${context}`
      const promptMode = 'selection-explanation'
      const targetLanguage = getStore({ name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE }) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const nativeLanguage = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG }) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese

      item.websocket.onopen = () => {
        const request = {
          prompt,
          promptMode,
          targetLanguage,
          nativeLanguage,
          aiUrl: wsUrl,
          timestamp: Date.now(),
          requestId: item.requestId
        }
        try {
          item.websocket.send(JSON.stringify(request))
        } catch (e) {
          this.handleExplanationError(item, 'Failed to send request')
        }
      }

      item.websocket.onmessage = (event) => {
        let response
        try { response = JSON.parse(event.data) } catch (error) {
          this.handleExplanationError(item, 'Failed to parse response')
          return
        }

        switch (response.type) {
          case 'connected':
            break
          case 'started':
            item.isStreaming = true
            break
          case 'chunk':
            if (response.chunk) item.responseText += response.chunk
            break
          case 'completed': {
            item.isStreaming = false
            item.isLoading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : item.responseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              item.responseText = (typeof extracted === 'string' && extracted.length > 0)
                ? extracted
                : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) {
              if (response.fullResponse) item.responseText = response.fullResponse
            }
            try { item.websocket && item.websocket.close() } catch (_) {}
            item.websocket = null
            break
          }
          case 'error':
            this.handleExplanationError(item, (response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : ''))
            break
          default:
            break
        }
      }

      item.websocket.onerror = () => this.handleExplanationError(item, 'WebSocket connection error')
      item.websocket.onclose = () => {
        item.isLoading = false
        item.isStreaming = false
      }
    },
    handleAiStreamError(message) {
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      this.aiLastError = message || 'AI streaming error'
      try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
      this.aiWebsocket = null
      msgUtil.msgError(this, this.aiLastError)
    },
    handleExplanationError(item, message) {
      if (!item) return
      item.isLoading = false
      item.isStreaming = false
      item.lastError = message || 'AI streaming error'
      try { if (item.websocket) { item.websocket.close() } } catch (_) {}
      item.websocket = null
      msgUtil.msgError(this, item.lastError)
    },
    stopStream(silent) {
      try { if (this.aiWebsocket) { this.aiWebsocket.close() } } catch (_) {}
      this.aiWebsocket = null
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      if (!silent) this.aiLastError = ''
    },
    stopExplanationStream(item, { silent = false } = {}) {
      if (!item) return
      try { if (item.websocket) { item.websocket.close() } } catch (_) {}
      item.websocket = null
      item.isLoading = false
      item.isStreaming = false
      if (!silent) item.lastError = ''
    },
    stopAllStreams() {
      this.stopStream(true)
      this.explanationItems.forEach(item => this.stopExplanationStream(item, { silent: true }))
    },
    resetExplanationItems() {
      this.explanationItems.forEach(item => this.stopExplanationStream(item, { silent: true }))
      this.explanationItems = []
    },
    emitOpenInAiTab() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      const query = buildAiTabQuery({ text, route: this.$route, overrides: { selectedMode: 'directly-translation' } })
      this.stopAllStreams()
      this.dialogVisible = false
      this.$emit('open-ai-tab', { text, query })
    },
    generateRequestId() { return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9) },
    sanitizePotentialJsonString(str) {
      if (typeof str !== 'string') return ''
      let s = (str || '').trim()
      s = s.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '')
      s = s.replace(/[\u201C\u201D]/g, '"').replace(/[\u2018\u2019]/g, "'")
      if (!s.startsWith('{')) {
        const firstBrace = s.indexOf('{')
        const lastBrace = s.lastIndexOf('}')
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
  },
  beforeDestroy() {
    this.stopAllStreams()
  }
}
</script>

<style scoped>
.ai-dialog-content { padding: 10px 0; }
.selected-text-preview { margin-bottom: 10px; color: #606266; }
.ai-response { max-height: 45vh; overflow-y: auto; padding: 10px; background: #fff; border: 1px solid #ebeef5; border-radius: 8px; }
.inline-error { color: #f56c6c; background: #fdecea; border: 1px solid #f5c2c0; border-radius: 6px; padding: 10px 12px; margin-bottom: 12px; }
.streaming-indicator { display: flex; align-items: center; gap: 6px; color: #409EFF; font-size: 13px; margin-bottom: 8px; }
.streaming-indicator .el-icon-loading { font-size: 16px; }
.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0 4px;
}
.tiny-tip { margin-top: 6px; color: #909399; font-size: 12px; }
.primary-selection-content { cursor: text; user-select: text; -webkit-user-select: text; }
.sub-tip { margin-top: -4px; margin-bottom: 8px; font-size: 12px; color: #909399; }
.explanation-list { margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
.explanation-item { border: 1px solid #ebeef5; border-radius: 8px; background: #fff; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04); }
.explanation-header { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #f5f7fa; border-bottom: 1px solid #ebeef5; }
.explanation-toggle { border: none; background: transparent; cursor: pointer; color: #606266; display: flex; align-items: center; padding: 0; }
.explanation-toggle:focus { outline: none; }
.explanation-title { flex: 1; font-weight: 500; color: #303133; }
.explanation-snippet { font-style: italic; color: #606266; }
.explanation-close { color: #909399; }
.explanation-close:hover { color: #f56c6c; }
.explanation-body { padding: 12px; }
.explanation-body .ai-response { margin-top: 8px; max-height: 35vh; }
</style>
