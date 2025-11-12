<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="600px"
    :before-close="onBeforeClose"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
  >
    <div class="ai-dialog-content">
      <div class="selected-text-preview">
        <strong>Selected:</strong>
        "<span ref="primarySelectionContent"
              class="primary-selection-content"
              @mouseup="handlePrimarySelection"
              @touchend="handlePrimarySelection">{{ localSelectedText }}</span>"
      </div>
      <div class="sub-tip" v-if="localSelectedText && localSelectedText.length > 0">Tip: select a sub‑phrase in the original selection above to add a context‑aware Explanation below.</div>
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
      <div class="tiny-tip">Tip: select text inside this response or the original selection to add more context-aware Explanations.</div>

      <!-- Inline contextual explanations (do not replace the first selection) -->
      <div v-for="item in nestedItems" :key="item.id" class="selection-response-container">
        <h3 class="selection-response-title">
          <i class="el-icon-chat-dot-square"></i>
          Explanation for Selected Text
          <span class="selection-title-controls">
            <el-button
              class="fold-selection-button"
              type="text"
              :icon="item.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
              @click="toggleItemCollapsed(item)"
              :disabled="item.loading"
              :title="item.collapsed ? 'Expand explanation' : 'Collapse explanation'"
            />
            <el-button
              class="close-selection-button"
              type="text"
              icon="el-icon-close"
              @click="closeItem(item)"
              :disabled="item.loading"
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
          v-loading="item.loading && !item.isStreaming"
          :ref="'explanationContent_' + item.id"
        >
          <div v-show="item.isStreaming" class="streaming-indicator">
            <i class="el-icon-loading"></i> Generating explanation...
          </div>
          <div v-if="item.error" class="inline-error">{{ item.error }}</div>
          <div v-html="renderMarkdown(item.responseText)"></div>
        </div>
      </div>
    </div>

    <span slot="footer" class="dialog-footer">
      <el-button type="primary" :loading="aiSearchLoading" :disabled="!localSelectedText" @click="aiSearchSelectedText">
        <i class="el-icon-search" style="margin-right:6px;"></i>Search
      </el-button>
      <el-button type="success" plain :disabled="!localSelectedText" @click="emitOpenInAiTab">
        <i class="el-icon-s-operation" style="margin-right:6px;"></i>Open in AI Tab
      </el-button>
      <el-button plain @click="closeDialog">Close</el-button>
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
      localSelectedText: this.selectedText,
      // Inline contextual explanations list
      nestedItems: []
    }
  },
  watch: {
    selectedText(val) {
      // Only set initially; do not override once user starts adding nested items
      const trimmed = (val || '').trim()
      if (!this.localSelectedText) this.localSelectedText = trimmed
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) {
        this.$emit('update:visible', v)
        if (v) {
          // Auto-start translation on open if we have text
          this.$nextTick(() => {
            if (this.localSelectedText && !this.aiIsStreaming && !this.aiSearchLoading) {
              try { this.aiSearchSelectedText() } catch (_) {}
            }
          })
        } else {
          this.stopStream(true)
          this.stopAllNested()
        }
      }
    },
    aiParsedResponseText() {
      const text = this.unescapeContent(this.aiResponseText || '')
      return md.render(text)
    }
  },
  methods: {
    // Render helper for nested items
    renderMarkdown(text) { return md.render(this.unescapeContent(text || '')) },

    // Public API-like methods
    closeDialog() { this.dialogVisible = false },
    onBeforeClose() { this.dialogVisible = false },

    // Handle sub-selection inside the original selected text (append new item)
    handlePrimarySelection() {
      try {
        const container = this.$refs.primarySelectionContent
        if (!container) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        if (!container.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        this.addNestedItem(text)
      } catch (_) { /* ignore */ }
    },

    // Also allow selection inside the main AI response to add contextual items
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
        this.addNestedItem(text)
      } catch (_) { /* ignore */ }
    },

    addNestedItem(text) {
      const selected = (text || '').trim()
      if (!selected || !this.localSelectedText) return
      const id = this.generateRequestId()
      const item = {
        id,
        selectedText: selected,
        responseText: '',
        isStreaming: false,
        loading: true,
        error: '',
        collapsed: false,
        ws: null,
        requestId: id
      }
      this.nestedItems.push(item)
      this.$nextTick(() => this.startNestedForItem(item))
    },

    toggleItemCollapsed(item) { item.collapsed = !item.collapsed },
    closeItem(item) { this.stopItem(item, true); this.nestedItems = this.nestedItems.filter(i => i.id !== item.id) },

    // Core: start per-item WS using first selection as context
    startNestedForItem(item) {
      const promptSelection = item.selectedText
      const context = (this.localSelectedText || '').trim()
      if (!promptSelection || !context) { item.loading = false; return }

      const token = getStore({name: 'access_token'})
      if (!token) {
        item.loading = false
        item.isStreaming = false
        item.error = 'Authentication token not found. Please login again.'
        msgUtil.msgError(this, item.error)
        return
      }
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const host = window.location.host
      const wsUrl = `${protocol}//${host}${kiwiConsts.API_BASE.AI_BIZ}/ws/stream?access_token=${encodeURIComponent(token)}`

      // Build contextual prompt using the same tags as AiResponseDetail
      const prompt = `${kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION}${promptSelection}${kiwiConsts.AI_MODE_TAG.SPLITTER}${context}`
      const promptMode = 'selection-explanation'
      const targetLanguage = getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const nativeLanguage = getStore({name: kiwiConsts.CONFIG_KEY.NATIVE_LANG}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese

      // Ensure any prior ws is closed
      this.stopItem(item, true)
      try { item.ws = new WebSocket(wsUrl) } catch (e) {
        item.loading = false
        item.isStreaming = false
        item.error = 'Failed to open WebSocket'
        msgUtil.msgError(this, item.error)
        return
      }

      item.ws.onopen = () => {
        const request = { prompt, promptMode, targetLanguage, nativeLanguage, aiUrl: wsUrl, timestamp: Date.now(), requestId: item.requestId }
        try { item.ws.send(JSON.stringify(request)) } catch (e) { this.handleItemError(item, 'Failed to send request') }
      }
      item.ws.onmessage = (event) => {
        let response
        try { response = JSON.parse(event.data) } catch (error) { this.handleItemError(item, 'Failed to parse response'); return }
        switch (response.type) {
          case 'connected': break
          case 'started': item.isStreaming = true; break
          case 'chunk': if (response.chunk) item.responseText += response.chunk; break
          case 'completed': {
            item.isStreaming = false
            item.loading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : item.responseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              item.responseText = (typeof extracted === 'string' && extracted.length > 0) ? extracted : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) { if (response.fullResponse) item.responseText = response.fullResponse }
            try { item.ws && item.ws.close() } catch (_) {}
            item.ws = null
            break
          }
          case 'error': this.handleItemError(item, (response.message || 'AI streaming failed') + (response.errorCode ? ` (Code: ${response.errorCode})` : '')); break
          default: break
        }
      }
      item.ws.onerror = () => this.handleItemError(item, 'WebSocket connection error')
      item.ws.onclose = () => { item.loading = false; item.isStreaming = false }
    },

    handleItemError(item, message) {
      item.loading = false
      item.isStreaming = false
      item.error = message || 'AI streaming error'
      try { item.ws && item.ws.close() } catch (_) {}
      item.ws = null
      msgUtil.msgError(this, item.error)
    },

    stopItem(item, silent) {
      try { if (item && item.ws) { item.ws.close() } } catch (_) {}
      if (item) {
        item.ws = null
        item.loading = false
        item.isStreaming = false
        if (!silent) item.error = ''
      }
    },
    stopAllNested() { (this.nestedItems || []).forEach(i => this.stopItem(i, true)) },

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

    emitOpenInAiTab() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      const query = buildAiTabQuery({ text, route: this.$route, overrides: { selectedMode: 'directly-translation' } })
      this.stopStream(true)
      this.stopAllNested()
      this.dialogVisible = false
      this.$emit('open-ai-tab', { text, query })
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

    handleAiStreamError(message) {
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      this.aiLastError = message || 'AI streaming error'
      try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
      this.aiWebsocket = null
      msgUtil.msgError(this, this.aiLastError)
    },

    stopStream(silent) {
      try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
      this.aiWebsocket = null
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      if (!silent) this.aiLastError = ''
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

/* Contextual explanations styling (inspired by AiResponseDetail) */
.selection-response-container { margin-top: 16px; border: 1px solid #ebeef5; border-radius: 10px; background: #fff; }
.selection-response-title { display: flex; align-items: center; justify-content: space-between; padding: 8px 10px; margin: 0; font-size: 14px; background: #f5f7fa; border-bottom: 1px solid #ebeef5; border-top-left-radius: 10px; border-top-right-radius: 10px; }
.selection-title-controls { display: inline-flex; gap: 4px; }
.selected-text-reference { padding: 8px 10px; color: #606266; }
.selection-response-content { padding: 10px; text-align: justify; }
</style>
