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
              <span class="loading-text">{{ $t('ai.connecting') || 'Connecting to AI...' }}</span>
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
      :width="selectionDialogWidth"
      :before-close="handleCloseSelectionDialog"
      custom-class="selection-options-dialog"
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

    <!-- Gemini API Key Configuration Hint -->
    <GeminiApiKeyHint
      :visible.sync="showGeminiApiKeyHint"
      @switched-to-backend="onSwitchedToBackend"
    />
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'
import kiwiConsts from '@/const/kiwiConsts'
import { getStore } from '@/util/store'
import msgUtil from '@/util/msg'
import { buildAiTabQuery } from '@/util/aiNavigation'
import { createAIStream } from '@/util/sseClient'
import KiwiDialog from '@/components/ui/KiwiDialog.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'
import GeminiApiKeyHint from '@/components/common/GeminiApiKeyHint.vue'

const md = new MarkdownIt({ html: true, breaks: false, linkify: true, typographer: true })

export default {
  name: 'AiSelectionPopup',
  components: { KiwiDialog, KiwiButton, KiwiDropdown, KiwiDropdownItem, GeminiApiKeyHint },
  props: {
    visible: { type: Boolean, default: false },
    selectedText: { type: String, default: '' },
    contextText: { type: String, default: '' },
    title: { type: String, default: 'AI Search' },
    fileName: { type: String, default: '' },
    autoRequest: { type: Boolean, default: true }
  },
  data() {
    return {
      aiStreamAbort: null, // SSE abort function
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
      isMinimized: false,
      // Gemini API key configuration hint
      showGeminiApiKeyHint: false
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
                // Use the user-selected AI mode and pass the context from parent
                const mode = this.selectedAiMode || kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value
                this.addNestedItemWithContext(t, this.contextText || null, mode, this.autoRequest)
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
    selectionDialogWidth() {
      return this.isSmallScreen ? '90%' : '500px'
    },
    aiModeOptions() {
      const modes = kiwiConsts.SEARCH_AI_MODES
      // For top-start placement: last items appear at bottom (closest to trigger)
      // Menu auto-scrolls to bottom on open, so most common options are visible first
      return [
        modes.AMBIGUOUS_ASSOCIATION_CORRECTION,
        modes.VOCABULARY_CHARACTER_EXPANSION,
        modes.NATURAL_IDIOMATIC_RETOUCH,
        modes.PHRASES_ASSOCIATION,
        modes.VOCABULARY_ASSOCIATION,
        modes.ANTONYM,
        modes.SYNONYM,
        modes.GRAMMAR_CORRECTION,
        modes.GRAMMAR_EXPLANATION,
        modes.VOCABULARY_EXPLANATION,
        modes.TRANSLATION_AND_EXPLANATION,
        modes.DIRECTLY_TRANSLATION
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
        abortFn: null, // SSE abort function
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

    // Core: start per-item SSE stream using that item's context/mode
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

      // Ensure any prior stream is aborted
      this.stopItem(item, true)

      // Create SSE stream
      const { abort } = createAIStream({
        body: {
          prompt,
          promptMode,
          targetLanguage,
          nativeLanguage,
          timestamp: Date.now(),
          requestId: item.requestId
        },
        callbacks: {
          onStarted: () => {
            item.isStreaming = true
          },
          onChunk: (chunk) => {
            if (chunk) item.responseText += chunk
          },
          onCompleted: (response) => {
            item.isStreaming = false
            item.loading = false
            try {
              const finalPayload = (response.fullResponse && response.fullResponse.length > 0) ? response.fullResponse : item.responseText
              const extracted = this.extractResponseTextFromPayload(finalPayload)
              item.responseText = (typeof extracted === 'string' && extracted.length > 0) ? extracted : (typeof finalPayload === 'string' ? finalPayload : JSON.stringify(finalPayload))
            } catch (_) { if (response.fullResponse) item.responseText = response.fullResponse }
            item.abortFn = null
            // Persist history for this file
            this.saveHistoryItem({
              id: item.id,
              selectedText: item.selectedText,
              contextSelectedText: item.contextSelectedText,
              promptMode: item.promptMode,
              responseText: item.responseText,
              timestamp: Date.now()
            })
          },
          onError: (error) => {
            this.handleItemError(item, (error.message || 'AI streaming failed') + (error.errorCode ? ` (Code: ${error.errorCode})` : ''), error.errorCode)
          }
        }
      })

      item.abortFn = abort
    },

    handleItemError(item, message, errorCode) {
      item.loading = false
      item.isStreaming = false
      try {
        if (item.abortFn) item.abortFn()
      } catch (_) {}
      item.abortFn = null

      // Check if this is a Gemini API key configuration error
      if (errorCode === 'NO_API_KEY') {
        this.showGeminiApiKeyHint = true
        return
      }

      item.error = message || 'AI streaming error'
      msgUtil.msgError(this, item.error)
    },

    // Called when user switches to backend API from the GeminiApiKeyHint dialog
    onSwitchedToBackend() {
      // Re-trigger the pending item if there is one
      const pendingItem = (this.nestedItems || []).find(i => !i.loading && !i.responseText && !i.error)
      if (pendingItem) {
        pendingItem.loading = true
        this.startNestedForItem(pendingItem)
      }
    },

    stopItem(item, silent) {
      try {
        if (item && item.abortFn) {
          item.abortFn()
        }
      } catch (_) {}
      if (item) {
        item.abortFn = null
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
      try { this.aiStreamAbort && this.aiStreamAbort() } catch (_) {}
      this.aiStreamAbort = null
      this.aiSearchLoading = false
      this.aiIsStreaming = false
      this.aiStarted = false
      this.aiLastError = ''
      const items = Array.isArray(this.nestedItems) ? this.nestedItems : []
      for (const it of items) {
        try { if (it.abortFn) it.abortFn() } catch (_) {}
        it.abortFn = null
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
  flex-shrink: 0;
}

/* Ensure dropdown menu can show all AI mode items */
.ai-mode-selector :deep(.kiwi-dropdown-menu) {
  min-width: 240px;
}

/* Make AI selection popup dialog transparent and ensure sufficient height for dropdown */
.ai-selection-popup-wrapper :deep(.kiwi-dialog__wrapper) {
  background-color: rgba(0, 0, 0, 0.3);
}

.ai-selection-popup-wrapper :deep(.kiwi-dialog) {
  background: rgba(var(--bg-card-rgb, 255, 255, 255), 0.95);
  backdrop-filter: blur(12px);
  min-height: 500px;
  display: flex;
  flex-direction: column;
}

.ai-selection-popup-wrapper :deep(.kiwi-dialog__body) {
  flex: 1;
  min-height: 200px;
}

.ai-selection-popup-wrapper :deep(.kiwi-dialog__footer) {
  position: relative;
  overflow: visible;
  padding-top: 24px;
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
  text-align: left;
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
.selection-dialog-footer .el-button,
.selection-dialog-footer .kiwi-button { flex: 1 1 0; min-width: 0; white-space: normal; word-break: break-word; }

/* Selection options dialog responsive */
.ai-selection-popup-wrapper :deep(.selection-options-dialog) {
  max-width: 90vw;
}

.ai-selection-popup-wrapper :deep(.selection-options-dialog .kiwi-dialog__body) {
  padding: 16px 20px;
}

.ai-selection-popup-wrapper :deep(.selection-options-dialog .kiwi-dialog__footer) {
  padding: 12px 20px 16px;
}
@media (max-width: 768px) {
  .ai-dialog-content {
    padding: 8px 0;
  }

  .primary-selected-text {
    padding: 10px 12px;
    margin-bottom: 12px;
  }

  .primary-selected-text strong {
    font-size: 0.8rem;
    margin-bottom: 5px;
  }

  .selected-text-display {
    font-size: 14px;
    max-height: 100px;
  }

  .selection-response-container {
    margin-top: 12px;
  }

  .selection-response-title {
    padding: 6px 8px;
    font-size: 13px;
  }

  .title-left {
    gap: 6px;
  }

  .title-left i {
    font-size: 14px;
  }

  .selected-text-reference {
    padding: 6px 8px;
    font-size: 13px;
  }

  .selection-response-content {
    padding: 8px;
    font-size: 14px;
  }

  .dialog-footer {
    padding: 6px 0;
    gap: 8px;
  }
}

@media (max-width: 640px) {
  .ai-dialog-content {
    padding: 6px 0;
  }

  .primary-selected-text {
    padding: 8px 10px;
    border-radius: 6px;
    margin-bottom: 10px;
    border-left-width: 3px;
  }

  .selected-text-display {
    font-size: 13px;
    max-height: 80px;
  }

  .selection-response-container {
    border-radius: 8px;
  }

  .selection-response-title {
    padding: 6px 8px;
    font-size: 12px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  .selection-title-controls {
    gap: 2px;
  }

  .fold-selection-button,
  .close-selection-button {
    padding: 2px 4px;
    font-size: 14px;
  }

  .selected-text-reference {
    padding: 6px 8px;
    font-size: 12px;
  }

  .selection-response-content {
    padding: 8px;
    font-size: 13px;
  }

  .streaming-indicator {
    font-size: 13px;
    margin-bottom: 8px;
  }

  .inline-error {
    padding: 8px 10px;
    font-size: 13px;
  }

  .dialog-footer,
  .selection-dialog-footer {
    justify-content: center !important;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 4px 0;
  }

  .dialog-footer .el-button,
  .dialog-footer .kiwi-button,
  .selection-dialog-footer .el-button,
  .selection-dialog-footer .kiwi-button {
    width: 100%;
    margin-left: 0 !important;
    padding: 10px 12px;
    font-size: 13px;
  }

  .ai-mode-selector {
    width: 100%;
  }

  .ai-mode-selector :deep(.kiwi-dropdown-menu) {
    left: 0;
    right: 0;
    min-width: auto;
    max-width: calc(100vw - 40px);
  }

  /* Selection options dialog */
  .selection-dialog-content {
    padding: 8px 0;
  }

  .selected-text-preview {
    padding: 12px;
    margin-bottom: 14px;
  }

  .selected-text-preview strong {
    font-size: 0.8rem;
    margin-bottom: 6px;
  }

  .selected-text {
    font-size: 13px;
    max-height: 100px;
  }

  /* Selection options dialog responsive footer */
  .selection-dialog-footer {
    flex-direction: column;
    gap: 8px;
  }

  .selection-dialog-footer .el-button,
  .selection-dialog-footer .kiwi-button {
    width: 100%;
    flex: none;
    padding: 12px 16px;
    font-size: 14px;
  }

  /* Loading indicator mobile */
  .loading-overlay {
    padding: 20px 16px;
  }

  .loading-overlay i {
    font-size: 24px;
  }

  .loading-text {
    font-size: 13px;
  }

  /* Selection options dialog mobile */
  .ai-selection-popup-wrapper :deep(.selection-options-dialog) {
    margin: 10px;
    max-width: calc(100vw - 20px);
  }

  .ai-selection-popup-wrapper :deep(.selection-options-dialog .kiwi-dialog__body) {
    padding: 12px 16px;
  }

  .ai-selection-popup-wrapper :deep(.selection-options-dialog .kiwi-dialog__footer) {
    padding: 10px 16px 14px;
  }
}

@media (max-width: 480px) {
  .primary-selected-text {
    padding: 6px 8px;
    margin-bottom: 8px;
  }

  .primary-selected-text strong {
    font-size: 0.75rem;
  }

  .selected-text-display {
    font-size: 12px;
    max-height: 70px;
  }

  .selection-response-title {
    font-size: 11px;
    padding: 5px 6px;
  }

  .title-left i {
    font-size: 12px;
  }

  .selected-text-reference {
    font-size: 11px;
    padding: 5px 6px;
  }

  .selection-response-content {
    padding: 6px;
    font-size: 12px;
  }

  .loading-overlay {
    padding: 16px 12px;
    gap: 10px;
  }

  .loading-overlay i {
    font-size: 20px;
  }

  .loading-text {
    font-size: 12px;
  }

  .dialog-footer .el-button,
  .dialog-footer .kiwi-button,
  .selection-dialog-footer .el-button,
  .selection-dialog-footer .kiwi-button {
    padding: 10px 12px;
    font-size: 12px;
  }

  /* Selection dialog content for small screens */
  .selection-dialog-content {
    padding: 6px 0;
  }

  .selected-text-preview {
    padding: 10px;
    margin-bottom: 12px;
  }

  .selected-text-preview strong {
    font-size: 0.75rem;
    margin-bottom: 5px;
  }

  .selected-text {
    font-size: 12px;
    max-height: 80px;
  }
}

/* Loading indicator styles */
.loading-overlay {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 24px 20px;
  color: var(--color-primary);
  gap: 12px;
}

.loading-overlay i {
  font-size: 28px;
}

.loading-text {
  font-size: 14px;
  color: var(--text-secondary);
  text-align: center;
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
