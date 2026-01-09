<template>
  <div class="ai-selection-popup-wrapper">
    <!-- Minimized floating bar -->
    <transition name="minimize-fade">
      <div v-if="isMinimized" class="minimized-bar" @click="restoreDialog">
        <div class="minimized-content">
          <i v-if="hasActiveProcessing" class="el-icon-loading spinning"></i>
          <i v-else class="el-icon-chat-dot-square"></i>
          <span class="minimized-text">{{ $t('ai.aiSearch') }}</span>
          <span v-if="hasActiveProcessing" class="minimized-status">{{ $t('ai.streaming') }}</span>
        </div>
        <div class="minimized-actions">
          <KiwiButton type="text" icon="el-icon-full-screen" @click.stop="restoreDialog" :title="$t('ai.restore')" />
          <KiwiButton type="text" icon="el-icon-close" @click.stop="closeFromMinimized" :title="$t('ai.close')" />
        </div>
      </div>
    </transition>

    <KiwiDialog
      :title="title"
      :visible.sync="dialogVisible"
      :width="dialogWidth"
      :before-close="onBeforeClose"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      :custom-header-buttons="headerButtons"
      @header-button-click="onHeaderButtonClick"
    >
      <div class="ai-dialog-content">
        <!-- Always show the current selected text at the top -->
        <div v-if="localSelectedText" class="primary-selected-text">
          <strong>Selected Text:</strong>
          <div class="selected-text-display">"{{ localSelectedText }}"</div>
        </div>

        <!-- All selections rendered as explanation cards -->
        <div v-for="item in nestedItems" :key="item.id" class="selection-response-container">
          <h3 class="selection-response-title">
            <div class="title-left">
              <i class="el-icon-chat-dot-square"></i>
              Explanation for Selected Text
            </div>
            <span class="selection-title-controls">
              <KiwiButton
                class="fold-selection-button"
                type="text"
                :icon="item.collapsed ? 'el-icon-arrow-down' : 'el-icon-arrow-up'"
                @click.stop="toggleItemCollapsed(item)"
                :disabled="item.loading"
                :title="item.collapsed ? 'Expand explanation' : 'Collapse explanation'"
              />
              <KiwiButton
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
            <span v-if="item.contextSelectedText && item.contextSelectedText !== item.selectedText" style="color: var(--text-secondary);">
              &nbsp;in context of "{{ item.contextSelectedText }}"
            </span>
            <span v-if="item.promptMode && item.promptMode !== 'selection-explanation'" style="color: var(--color-warning);">
              &nbsp;({{ item.promptMode }})
            </span>
          </div>
          <div
            v-show="!item.collapsed"
            class="selection-response-content"
            :ref="'explanationContent_' + item.id"
            @mouseup="handleItemSelection(item)"
            @touchend.passive="handleItemSelection(item)"
            @contextmenu.prevent
          >
            <!-- Custom loading indicator replacing v-loading -->
            <div v-if="item.loading && !item.isStreaming" class="loading-overlay">
              <i class="el-icon-loading spinning"></i>
            </div>
            
            <div v-show="item.isStreaming" class="streaming-indicator">
              <i class="el-icon-loading spinning"></i> Generating explanation...
            </div>
            <div v-if="item.error" class="inline-error">{{ item.error }}</div>
            <div v-html="renderMarkdown(item.responseText)"></div>
          </div>
        </div>
      </div>

      <span slot="footer" class="dialog-footer">
        <KiwiDropdown class="ai-mode-selector" @command="onAiModeChange" placement="top-start">
          <KiwiButton size="small" :disabled="reviewMode">
            {{ selectedAiModeLabel }}
            <i class="el-icon-arrow-up"></i>
          </KiwiButton>
          <template #dropdown>
            <KiwiDropdownItem
              v-for="mode in aiModeOptions"
              :key="mode.value"
              :command="mode.value"
              :selected="selectedAiMode === mode.value"
            >
              {{ mode.label }}
            </KiwiDropdownItem>
          </template>
        </KiwiDropdown>
        <KiwiButton type="primary" :loading="aiSearchLoading" :disabled="reviewMode || !localSelectedText" @click="aiSearchSelectedText" icon="el-icon-search">
          Search
        </KiwiButton>
        <KiwiButton type="success" plain :disabled="reviewMode || !localSelectedText" @click="emitOpenInAiTab" icon="el-icon-s-operation">
          Open in AI Tab
        </KiwiButton>
        <KiwiButton type="info" plain :disabled="reviewMode || !localSelectedText" @click="openInDictionary" icon="el-icon-notebook-1">
          Open in Dictionary
        </KiwiButton>
        <KiwiButton plain :disabled="!localSelectedText" @click="copySelectedText" icon="el-icon-document-copy">
          Copy
        </KiwiButton>
        <KiwiButton plain @click="closeDialog">Close</KiwiButton>
      </span>
    </KiwiDialog>

    <!-- Selection options dialog for text selected inside explanation content -->
    <KiwiDialog
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
        <KiwiButton
          size="small"
          type="info"
          icon="el-icon-search"
          @click="searchOnDictionaryFromDialog"
        >
          Search on Dictionary
        </KiwiButton>
        <KiwiButton
          size="small"
          type="primary"
          @click="explainSelectionFromDialog"
        >
          Explain Selection
        </KiwiButton>
      </div>
    </KiwiDialog>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'
import kiwiConsts from '@/const/kiwiConsts'
import { getStore } from '@/util/store'
import msgUtil from '@/util/msg'
import { buildAiTabQuery } from '@/util/aiNavigation'
import KiwiDialog from '@/components/ui/KiwiDialog.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'

const md = new MarkdownIt({ html: true, breaks: false, linkify: true, typographer: true })

export default {
  name: 'AiSelectionPopup',
  components: { KiwiDialog, KiwiButton, KiwiDropdown, KiwiDropdownItem },
  props: {
    visible: { type: Boolean, default: false },
    selectedText: { type: String, default: '' },
    title: { type: String, default: 'AI Search' },
    fileName: { type: String, default: '' },
    autoRequest: { type: Boolean, default: true }
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
      selectionSourceItemId: '',
      isSmallScreen: false,
      selectedAiMode: '',
      // Minimize state
      isMinimized: false
    }
  },
  watch: {
    // Every time parent selection changes, update localSelectedText
    selectedText(val) {
      const trimmed = (val || '').trim()
      if (!trimmed) return
      this.localSelectedText = trimmed
      // Don't auto-add items here - let the dialog open handler or user action do it
    },
  },
  computed: {
    dialogVisible: {
      get() { return this.visible },
      set(v) {
        this.$emit('update:visible', v)
        if (v) {
          // Clear browser text selection to avoid messy appearance on mobile
          try {
            if (window.getSelection) {
              window.getSelection().removeAllRanges()
            }
          } catch (_) {}
          // On open, sync localSelectedText from prop and add item if needed
          this.$nextTick(() => {
            // Always sync from prop when dialog opens
            const propText = (this.selectedText || '').trim()
            if (propText) {
              this.localSelectedText = propText
            }
            const t = (this.localSelectedText || '').trim()
            if (!this.reviewMode && t && (!this.nestedItems || this.nestedItems.length === 0)) {
              try {
                // Always add item, but only auto-start if autoRequest is true
                // Use the user-selected AI mode
                const mode = this.selectedAiMode || kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
                this.addNestedItemWithContext(t, null, mode, this.autoRequest)
              } catch (_) {}
            }
          })
        } else {
          this.clearAllCurrent()
        }
      }
    },
    dialogWidth() {
      return this.isSmallScreen ? '95%' : '600px'
    },
    aiModeOptions() {
      const modes = kiwiConsts.SEARCH_AI_MODES
      return [
        modes.DIRECTLY_TRANSLATION,
        modes.TRANSLATION_AND_EXPLANATION,
        modes.VOCABULARY_EXPLANATION,
        modes.GRAMMAR_EXPLANATION,
        modes.GRAMMAR_CORRECTION,
        modes.SYNONYM,
        modes.ANTONYM,
        modes.VOCABULARY_ASSOCIATION,
        modes.PHRASES_ASSOCIATION,
        modes.NATURAL_IDIOMATIC_RETOUCH
      ]
    },
    selectedAiModeLabel() {
      const mode = this.aiModeOptions.find(m => m.value === this.selectedAiMode)
      return mode ? mode.label : 'Select Mode'
    },
    hasActiveProcessing() {
      return (this.nestedItems || []).some(item => item.loading || item.isStreaming)
    },
    headerButtons() {
      return [
        { key: 'minimize', icon: 'el-icon-minus', title: this.$t('ai.minimize') }
      ]
    }
  },
  methods: {
    // Render helper for items
    renderMarkdown(text) { return md.render(this.unescapeContent(text || '')) },

    // AI mode selection
    onAiModeChange(mode) {
      this.selectedAiMode = mode
      localStorage.setItem('ai-selection-popup-mode', mode)
    },
    loadSavedAiMode() {
      const saved = localStorage.getItem('ai-selection-popup-mode')
      if (saved && this.aiModeOptions.some(m => m.value === saved)) {
        this.selectedAiMode = saved
      } else {
        this.selectedAiMode = kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
      }
    },

    // Public API-like methods
    closeDialog() { this.reviewMode = false; this.isMinimized = false; this.dialogVisible = false },
    onBeforeClose() { this.reviewMode = false; this.isMinimized = false; this.dialogVisible = false },

    // Minimize/Restore methods
    minimizeDialog() {
      this.isMinimized = true
      this.$emit('update:visible', false)
    },
    restoreDialog() {
      this.isMinimized = false
      this.$emit('update:visible', true)
    },
    closeFromMinimized() {
      this.isMinimized = false
      this.clearAllCurrent()
      this.$emit('update:visible', false)
    },
    onHeaderButtonClick(key) {
      if (key === 'minimize') {
        this.minimizeDialog()
      }
    },

    copySelectedText() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        msgUtil.msgWarning(this, 'No text to copy')
        return
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          msgUtil.msgSuccess(this, 'Copied to clipboard')
        }).catch(err => {
          console.error('Failed to copy text: ', err)
          msgUtil.msgError(this, 'Failed to copy text')
        })
      } else {
        // Fallback
        try {
          const textArea = document.createElement('textarea')
          textArea.value = text
          document.body.appendChild(textArea)
          textArea.select()
          document.execCommand('copy')
          document.body.removeChild(textArea)
          msgUtil.msgSuccess(this, 'Copied to clipboard')
        } catch (err) {
          console.error('Fallback copy failed: ', err)
          msgUtil.msgError(this, 'Failed to copy text')
        }
      }
    },

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
      const routeData = this.$router.resolve({
        path: kiwiConsts.ROUTES.DETAIL,
        query: {
          active: 'search',
          selectedMode: 'detail',
          originalText: text
        }
      })
      window.open(routeData.href, '_blank')
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
    addNestedItemWithContext(selectedText, contextText, promptMode, autoStart = true) {
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
        loading: autoStart, // Only show loading if we are about to start
        error: '',
        collapsed: false,
        ws: null,
        requestId: id
      }
      this.nestedItems.push(item)
      if (autoStart) {
        this.$nextTick(() => this.startNestedForItem(item))
      }
    },

    toggleItemCollapsed(item) {
      item.collapsed = !item.collapsed
    },
    closeItem(item) {
      this.stopItem(item, true)
      this.nestedItems = this.nestedItems.filter(i => i.id !== item.id)
    },

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
      try {
        if (item.ws) item.ws.close()
      } catch (_) {}
      item.ws = null
      msgUtil.msgError(this, item.error)
    },

    stopItem(item, silent) {
      try {
        if (item && item.ws) {
          item.ws.close()
        }
      } catch (_) {}
      if (item) {
        item.ws = null
        item.loading = false
        item.isStreaming = false
        if (!silent) item.error = ''
      }
    },

    // Primary search action: uses the user-selected AI mode
    aiSearchSelectedText() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        this.aiLastError = 'No text selected'
        return
      }

      // Check if there is already a pending item for this text (added but not started)
      const pendingItem = (this.nestedItems || []).find(i => i.selectedText === text && !i.loading && !i.responseText && !i.error)
      if (pendingItem) {
        pendingItem.loading = true
        this.startNestedForItem(pendingItem)
        return
      }

      // Use the user-selected AI mode
      const mode = this.selectedAiMode || kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
      this.addNestedItemWithContext(text, null, mode, true)
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

    openInDictionary() {
      const text = (this.localSelectedText || '').trim()
      if (!text) {
        msgUtil.msgWarning(this, 'No text selected')
        return
      }
      const routeData = this.$router.resolve({
        path: kiwiConsts.ROUTES.DETAIL,
        query: {
          active: 'search',
          selectedMode: 'detail',
          originalText: text
        }
      })
      window.open(routeData.href, '_blank')
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
    },
    checkScreenSize() {
      this.isSmallScreen = window.innerWidth < 768
    }
  },
  mounted() {
    this.checkScreenSize()
    this.loadSavedAiMode()
    window.addEventListener('resize', this.checkScreenSize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.checkScreenSize)
  }
}
</script>

<style scoped>
.ai-dialog-content { padding: 10px 0; }

/* Primary selected text display at the top */
.primary-selected-text {
  background: var(--bg-container);
  padding: 12px 15px;
  border-radius: 8px;
  margin-bottom: 16px;
  border-left: 4px solid var(--color-primary);
  box-shadow: var(--shadow-card);
}

.primary-selected-text strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text-secondary);
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.selected-text-display {
  font-style: italic;
  color: var(--text-primary);
  line-height: 1.6;
  max-height: 120px;
  overflow-y: auto;
  word-break: break-word;
}

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

.ai-mode-selector {
  width: 180px;
  flex-shrink: 0;
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

.title-left {
  display: flex;
  align-items: center;
  gap: 8px;
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
  position: relative;
}

/* Disable native mobile select/callout while keeping selection */
.selection-response-content { user-select: text; -webkit-user-select: text; }

/* Selection dialog styles (minimal) */
.selection-dialog-content { padding: 10px 0; }
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

.selection-dialog-footer { display: flex; align-items: stretch; justify-content: center; gap: 10px; flex-wrap: wrap; width: 100%; padding: 6px 0; }
.selection-dialog-footer .el-button { flex: 1 1 0; min-width: 0; white-space: normal; word-break: break-word; }
@media (max-width: 640px) {
  .dialog-footer,
  .selection-dialog-footer {
    justify-content: center !important;
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }
  .dialog-footer .el-button,
  .selection-dialog-footer .el-button {
    width: 100%;
    margin-left: 0 !important;
  }
  .ai-mode-selector {
    width: 100%;
  }
}

/* Loading indicator styles */
.loading-overlay {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: var(--color-primary);
  font-size: 24px;
}

.streaming-indicator {
  color: var(--color-primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.spinning {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Minimized floating bar */
.minimized-bar {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  box-shadow: var(--shadow-lg);
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  z-index: 2001;
  min-width: 200px;
  transition: all 0.2s ease;
}

.minimized-bar:hover {
  box-shadow: var(--shadow-lg), 0 0 20px rgba(var(--color-primary-rgb), 0.15);
  border-color: var(--color-primary);
}

.minimized-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  color: var(--text-primary);
}

.minimized-content > i {
  font-size: 18px;
  color: var(--color-primary);
}

.minimized-text {
  font-weight: 500;
  font-size: 14px;
}

.minimized-status {
  font-size: 12px;
  color: var(--color-primary);
  background: rgba(var(--color-primary-rgb), 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.minimized-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.minimized-actions .kiwi-button {
  padding: 8px;
  font-size: 18px;
  min-width: 36px;
  min-height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Minimize transition */
.minimize-fade-enter-active,
.minimize-fade-leave-active {
  transition: all 0.3s ease;
}

.minimize-fade-enter,
.minimize-fade-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

@media (max-width: 640px) {
  .minimized-bar {
    left: 10px;
    right: 10px;
    bottom: 10px;
    min-width: auto;
    padding: 12px 16px;
  }

  .minimized-actions {
    gap: 8px;
  }

  .minimized-actions .kiwi-button {
    min-width: 44px;
    min-height: 44px;
    font-size: 20px;
  }
}

</style>
