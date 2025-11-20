<template>
  <div class="ai-selection-popup-wrapper">
    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="600px"
      :before-close="onBeforeClose"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
    >
      <div class="ai-dialog-content">
        <!-- All selections rendered as explanation cards -->
        <div v-for="item in nestedItems" :key="item.id" class="selection-response-container">
          <h3 class="selection-response-title">
            <i class="el-icon-chat-dot-square"></i>
            Explanation for Selected Text
            <span class="selection-title-controls">
              <el-button
                class="fold-selection-button"
                type="text"
                :icon="item.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
                @click.stop="toggleItemCollapsed(item)"
                :disabled="item.loading"
                :title="item.collapsed ? 'Expand explanation' : 'Collapse explanation'"
              />
              <el-button
                class="close-selection-button"
                type="text"
                icon="el-icon-close"
                @click.stop="closeItem(item)"
                :disabled="item.loading"
                title="Close explanation"
              />
            </span>
          </h3>
          <div
            class="selected-text-reference"
            :ref="'selectedRef_' + item.id"
            @mouseup="handleReferenceSelection(item)"
            @touchend.passive="handleReferenceSelection(item)"
          >
            <strong>Selected:</strong> "{{ item.selectedText }}"
            <span v-if="item.contextSelectedText && item.contextSelectedText !== item.selectedText" style="color:#909399;">
              &nbsp;in context of "{{ item.contextSelectedText }}"
            </span>
            <span v-if="item.promptMode && item.promptMode !== 'selection-explanation'" style="color:#b88230;">
              &nbsp;({{ item.promptMode }})
            </span>
          </div>
          <div
            v-show="!item.collapsed"
            class="selection-response-content"
            v-loading="item.loading && !item.isStreaming"
            :ref="'explanationContent_' + item.id"
            @mouseup="handleItemSelection(item)"
            @touchend.passive="handleItemSelection(item)"
            @contextmenu.prevent
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
        <el-button type="primary" :loading="aiSearchLoading" :disabled="reviewMode || !localSelectedText" @click="aiSearchSelectedText">
          <i class="el-icon-search" style="margin-right:6px;"></i>Search
        </el-button>
        <el-button type="success" plain :disabled="reviewMode || !localSelectedText" @click="emitOpenInAiTab">
          <i class="el-icon-s-operation" style="margin-right:6px;"></i>Open in AI Tab
        </el-button>
        <el-button plain @click="closeDialog">Close</el-button>
      </span>
    </el-dialog>

    <!-- Selection options dialog for text selected inside explanation content -->
    <el-dialog
      title="Explain Selected Text"
      :visible.sync="selectionDialogVisible"
      width="500px"
      :before-close="handleCloseSelectionDialog"
    >
      <div class="selection-dialog-content">
        <div class="selected-text-preview" v-if="selectionSelectedText">
          <strong>Selected Text:</strong>
          <div class="selected-text">{{ selectionSelectedText }}</div>
        </div>
      </div>

      <div slot="footer" class="selection-dialog-footer">
        <el-button
          size="small"
          type="info"
          icon="el-icon-search"
          @click="searchOnDictionaryFromDialog"
        >
          Search on Dictionary
        </el-button>
        <el-button
          size="small"
          type="primary"
          @click="explainSelectionFromDialog"
        >
          Explain Selection
        </el-button>
      </div>
    </el-dialog>
  </div>
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
    title: { type: String, default: 'AI Search' },
    fileName: { type: String, default: '' }
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
      // Explanation items (each selection is an item)
      nestedItems: [],
      // Review-only reopen mode
      reviewMode: false,
      aiStarted: false,
      aiConnectAttempts: 0,
      aiMaxConnectAttempts: 2,
      aiRetryTimer: null,
      // Selection dialog state for in-explanation selections
      selectionDialogVisible: false,
      selectionSelectedText: '',
      selectionSourceItemId: ''
    }
  },
  watch: {
    // Every time parent selection changes, add a new explanation item
    selectedText(val) {
      const trimmed = (val || '').trim()
      if (!trimmed) return
      this.localSelectedText = trimmed
      const isFirst = (this.nestedItems || []).length === 0
      if (isFirst) {
        const mode = this.isSingleWord(trimmed) ? kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
        this.addNestedItemWithContext(trimmed, null, mode)
      } else {
        const last = this.nestedItems[this.nestedItems.length - 1]
        const ctx = last ? last.selectedText : null
        this.addNestedItemWithContext(trimmed, ctx, 'selection-explanation')
      }
    }
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) {
        this.$emit('update:visible', v)
        if (v) {
          // On open, if we have an initial selected text and no items yet, add it as an item
          this.$nextTick(() => {
            const t = (this.localSelectedText || '').trim()
            if (!this.reviewMode && t && (!this.nestedItems || this.nestedItems.length === 0)) {
              try {
                const mode = this.isSingleWord(t) ? kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
                this.addNestedItemWithContext(t, null, mode)
              } catch (_) {}
            }
          })
        } else {
          this.clearAllCurrent()
        }
      }
    }
  },
  methods: {
    // Render helper for items
    renderMarkdown(text) { return md.render(this.unescapeContent(text || '')) },

    // Public API-like methods
    closeDialog() { this.reviewMode = false; this.dialogVisible = false },
    onBeforeClose() { this.reviewMode = false; this.dialogVisible = false },

    // Handle selection inside any explanation content -> open selection options dialog
    handleItemSelection(item) {
      if (this.reviewMode) return
      try {
        const container = this.$refs['explanationContent_' + item.id]
        if (!container) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        const containerEl = Array.isArray(container) ? container[0] : container
        if (!containerEl || !containerEl.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        // Open the dialog showing options
        this.selectionSelectedText = text
        this.selectionSourceItemId = item.id
        this.selectionDialogVisible = true
      } catch (_) { /* ignore */ }
    },

    // Reference selection handling
    handleReferenceSelection(item) {
      if (this.reviewMode) return
      try {
        const ref = this.$refs['selectedRef_' + item.id]
        const el = Array.isArray(ref) ? ref[0] : ref
        if (!el) return
        const sel = window.getSelection && window.getSelection()
        if (!sel || sel.rangeCount === 0) return
        const range = sel.getRangeAt(0)
        if (!el.contains(range.commonAncestorContainer)) return
        const text = (sel.toString() || '').trim()
        if (!text) return
        this.selectionSelectedText = text
        this.selectionSourceItemId = item.id
        this.selectionDialogVisible = true
      } catch (_) { /* ignore */ }
    },

    // Selection dialog actions
    handleCloseSelectionDialog() {
      this.selectionDialogVisible = false
      this.selectionSelectedText = ''
      this.selectionSourceItemId = ''
      try { window.getSelection && window.getSelection().removeAllRanges() } catch (_) {}
    },
    searchOnDictionaryFromDialog() {
      const text = (this.selectionSelectedText || '').trim()
      if (!text) { msgUtil.msgError(this, 'No text selected'); return }
      const encodedText = encodeURIComponent(text)
      const nativeLanguage = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG }) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      const queryParams = new URLSearchParams({
        active: 'search',
        selectedMode: 'detail',
        language: nativeLanguage,
        originalText: encodedText,
        now: String(Date.now())
      })
      const dictionaryUrl = `https://kason.app/#/lazy/tools/detail?${queryParams.toString()}`
      try { window.open(dictionaryUrl, '_blank') } catch (_) {}
      this.handleCloseSelectionDialog()
    },
    explainSelectionFromDialog() {
      const text = (this.selectionSelectedText || '').trim()
      if (!text) { msgUtil.msgError(this, 'No text selected'); return }
      const srcId = this.selectionSourceItemId
      const srcItem = (this.nestedItems || []).find(i => i.id === srcId)
      const context = srcItem ? srcItem.selectedText : ((this.nestedItems[this.nestedItems.length - 1] || {}).selectedText || '')
      this.addNestedItemWithContext(text, context || null, 'selection-explanation')
      this.handleCloseSelectionDialog()
      // Smooth scroll into view after render
      this.$nextTick(() => {
        try {
          const newItem = this.nestedItems[this.nestedItems.length - 1]
          const refName = newItem ? ('explanationContent_' + newItem.id) : ''
          const ref = refName ? this.$refs[refName] : null
          const el = Array.isArray(ref) ? ref[0] : ref
          if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        } catch (_) {}
      })
    },

    // Add item with optional context and mode; if context is empty, fall back to the selection itself for explanation mode
    addNestedItemWithContext(selectedText, contextText, promptMode) {
      const selected = (selectedText || '').trim()
      if (!selected) return
      const mode = promptMode || 'selection-explanation'
      const context = mode === 'selection-explanation' ? ((contextText || '').trim() || selected) : ''
      // Prevent duplicates by selected+context+mode triple
      if ((this.nestedItems || []).some(i => i.selectedText === selected && (i.contextSelectedText || '') === context && i.promptMode === mode)) return
      const id = this.generateRequestId()
      const item = {
        id,
        selectedText: selected,
        contextSelectedText: context,
        promptMode: mode,
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

    // Core: start per-item WS using that item's context/mode
    startNestedForItem(item) {
      const promptSelection = item.selectedText
      const context = (item.contextSelectedText || '').trim()
      if (!promptSelection) { item.loading = false; return }

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

      // Build prompt by mode
      let prompt = ''
      let promptMode = item.promptMode || 'selection-explanation'
      if (promptMode === 'selection-explanation') {
        prompt = `${kiwiConsts.AI_MODE_TAG.SELECTION_EXPLANATION}${promptSelection}${kiwiConsts.AI_MODE_TAG.SPLITTER}${context}`
      } else {
        prompt = promptSelection
      }
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
            // Persist history for this file
            this.saveHistoryItem({
              id: item.id,
              selectedText: item.selectedText,
              contextSelectedText: item.contextSelectedText,
              promptMode: item.promptMode,
              responseText: item.responseText,
              timestamp: Date.now()
            })
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

    // Primary search action: if first item, vocabulary/direct; else explanation with last item's selection as context
    aiSearchSelectedText() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      const isFirst = (this.nestedItems || []).length === 0
      if (isFirst) {
        const mode = this.isSingleWord(text) ? kiwiConsts.SEARCH_AI_MODES.VOCABULARY_EXPLANATION.value : kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
        this.addNestedItemWithContext(text, null, mode)
      } else {
        const last = this.nestedItems[this.nestedItems.length - 1]
        const ctx = last ? last.selectedText : null
        this.addNestedItemWithContext(text, ctx, 'selection-explanation')
      }
    },

    emitOpenInAiTab() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }
      const query = buildAiTabQuery({ text, route: this.$route, overrides: { selectedMode: 'directly-translation' } })
      this.clearAllCurrent()
      this.dialogVisible = false
      this.$emit('open-ai-tab', { text, query })
    },

    clearAllCurrent() {
      if (this.aiRetryTimer) { clearTimeout(this.aiRetryTimer); this.aiRetryTimer = null }
      try { this.aiWebsocket && this.aiWebsocket.close() } catch (_) {}
      this.aiWebsocket = null
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      this.aiStarted = false
      this.aiLastError = ''
      const items = Array.isArray(this.nestedItems) ? this.nestedItems : []
      for (const it of items) {
        try { if (it.ws) it.ws.close() } catch (_) {}
        it.ws = null
        it.isStreaming = false
        it.loading = false
      }
      this.nestedItems = []
      this.localSelectedText = ''
    },

    // History helpers (write only)
    getHistoryKey() {
      const name = (this.fileName || '').trim()
      if (!name) return ''
      return `pdf-ai-history:${name}`
    },
    loadHistory() {
      try {
        const key = this.getHistoryKey()
        if (!key) return []
        const raw = localStorage.getItem(key)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
      } catch (_) { return [] }
    },
    saveHistoryItem(entry) {
      try {
        const key = this.getHistoryKey()
        if (!key) return
        const arr = this.loadHistory()
        arr.push({
          id: entry.id || this.generateRequestId(),
          selectedText: entry.selectedText,
          contextSelectedText: entry.contextSelectedText,
          promptMode: entry.promptMode,
          responseText: entry.responseText,
          timestamp: entry.timestamp || Date.now()
        })
        localStorage.setItem(key, JSON.stringify(arr))
      } catch (_) { /* ignore */ }
    },
    formatTime(ts) {
      try { return new Date(ts).toLocaleString() } catch (_) { return '' }
    },
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
        .replace(/\\\"/g, '"')
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
/* Removed primary selection preview and main response; using only explanation cards */

/* Ensure markdown blocks stay left-aligned */
.selection-response-content p,
.selection-response-content ul,
.selection-response-content ol,
.selection-response-content li { text-align: left !important; color: var(--text-primary); }

.inline-error {
  color: var(--color-danger);
  background: var(--bg-container);
  border: 1px solid var(--color-danger);
  border-radius: 6px;
  padding: 10px 12px;
  margin-bottom: 12px;
}

.dialog-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding: 8px 0 4px;
}

/* Contextual explanations styling */
.selection-response-container {
  margin-top: 16px;
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  background: var(--bg-card);
  box-shadow: var(--shadow-card);
}

.selection-response-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  margin: 0;
  font-size: 14px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color-light);
  border-top-left-radius: 10px;
  border-top-right-radius: 10px;
  color: var(--text-primary);
}

.selection-title-controls { display: inline-flex; gap: 4px; }

.selected-text-reference {
  padding: 8px 10px;
  color: var(--text-secondary);
}

.selection-response-content {
  padding: 10px;
  text-align: left;
  color: var(--text-primary);
}

/* Disable native mobile select/callout while keeping selection */
.selection-response-content { -webkit-touch-callout: none; user-select: text; -webkit-user-select: text; }

/* Selection dialog styles (minimal) */
.selection-dialog-content { padding: 10px 0; }
.selected-text-preview { margin-bottom: 12px; }

.selected-text {
  background: var(--bg-container);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  padding: 10px;
  margin-top: 6px;
  font-style: italic;
  color: var(--text-regular);
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
}

.selection-dialog-footer { display: flex; align-items: stretch; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%; padding: 6px 0; }
.selection-dialog-footer .el-button { flex: 1 1 0; min-width: 0; white-space: normal; word-break: break-word; }
@media (max-width: 640px) { .selection-dialog-footer { flex-direction: column; align-items: stretch; gap: 8px; } .selection-dialog-footer .el-button { width: 100%; } }
</style>
