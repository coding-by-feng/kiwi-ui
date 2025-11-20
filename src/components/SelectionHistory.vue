<template>
  <div class="selection-history-wrapper">
    <el-dialog
      :title="title"
      :visible.sync="localVisible"
      width="600px"
      :close-on-click-modal="true"
      :close-on-press-escape="true"
      @open="onOpen"
      @close="emitClose"
    >
      <div class="history-dialog-content">
        <div v-if="loading" class="history-loading"><i class="el-icon-loading"></i> Loading history...</div>
        <div v-else-if="items.length === 0" class="history-empty">No history entries.</div>
        <div v-else class="history-items">
          <div v-for="h in items" :key="h.id" class="history-item">
            <div class="history-item-header">
              <strong class="history-selected">"{{ h.selectedText }}"</strong>
              <span v-if="h.contextSelectedText && h.contextSelectedText !== h.selectedText" class="history-context">in context: "{{ h.contextSelectedText }}"</span>
              <span v-if="h.promptMode && h.promptMode !== 'selection-explanation'" class="history-mode">{{ h.promptMode }}</span>
              <span class="history-time">{{ formatTime(h.timestamp) }}</span>
              <el-button
                class="history-delete-btn"
                type="text"
                icon="el-icon-delete"
                @click="deleteItem(h)"
                :title="'Delete this entry'"
              />
            </div>
            <div class="history-item-body" v-html="renderMarkdown(h.responseText)"></div>
          </div>
        </div>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="danger" plain :disabled="items.length===0" @click="clearHistory" title="Clear all history">Clear</el-button>
        <el-button plain @click="localVisible=false">Close</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import MarkdownIt from 'markdown-it'
const md = new MarkdownIt({ html: true, linkify: true, typographer: true, breaks: false })

export default {
  name: 'SelectionHistory',
  props: {
    visible: { type: Boolean, default: false },
    resourceKey: { type: String, default: '' }, // pdf file name or video id/title
    resourceType: { type: String, default: 'pdf' }, // 'pdf' | 'video'
    title: { type: String, default: 'Selection History' }
  },
  data() {
    return { localVisible: this.visible, items: [], loading: false }
  },
  watch: {
    visible(v) { this.localVisible = v },
    localVisible(v) { this.$emit('update:visible', v); if (!v) this.items = [] }
  },
  methods: {
    historyStorageKey() {
      const key = (this.resourceKey || '').trim()
      if (!key) return ''
      const prefix = this.resourceType === 'video' ? 'video-ai-history:' : 'pdf-ai-history:'
      return prefix + key
    },
    loadHistory() {
      try {
        const k = this.historyStorageKey()
        if (!k) return []
        const raw = localStorage.getItem(k)
        if (!raw) return []
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr : []
      } catch (_) { return [] }
    },
    onOpen() {
      this.loading = true
      setTimeout(() => { // slight defer for UX
        this.items = this.loadHistory()
        this.loading = false
      }, 10)
    },
    clearHistory() {
      const k = this.historyStorageKey()
      if (!k) return
      try { localStorage.removeItem(k) } catch (_) {}
      this.items = []
      this.$emit('history-cleared', { key: k })
    },
    deleteItem(entry) {
      const k = this.historyStorageKey()
      if (!k) return
      try {
        const current = this.loadHistory().filter(it => it.id !== entry.id)
        localStorage.setItem(k, JSON.stringify(current))
        this.items = current
        this.$emit('history-item-deleted', { key: k, id: entry.id })
      } catch (_) { /* ignore */ }
    },
    formatTime(ts) { try { return new Date(ts).toLocaleString() } catch (_) { return '' } },
    sanitize(text) {
      if (!text) return ''
      // Basic neutralization of potentially unsafe tags (keep simple to avoid dependency)
      return String(text)
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/on[a-z]+="[^"]*"/gi, '')
    },
    unescapeContent(content) {
      if (!content) return ''
      return content
        .replace(/\\n/g, '\n')
        .replace(/\\t/g, '\t')
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\')
    },
    renderMarkdown(text) {
      const unescaped = this.unescapeContent(text || '')
      const safe = this.sanitize(unescaped)
      return md.render(safe)
    },
    emitClose() { this.$emit('closed') }
  }
}
</script>

<style scoped lang="scss">
.history-dialog-content { max-height: 60vh; overflow-y: auto; padding: 4px 0; }
.history-loading { color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
.history-empty { color: var(--text-secondary); font-size: 13px; padding: 12px; }
.history-items { display: flex; flex-direction: column; gap: 14px; }
.history-item {
  border: 1px solid var(--border-color-light);
  border-radius: var(--card-border-radius);
  background: var(--bg-card);
  padding: 10px 12px;
  box-shadow: var(--shadow-card);
  transition: all 0.3s ease;
  
  &:hover {
    box-shadow: var(--shadow-hover);
  }
}
.history-item-header { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 13px; margin-bottom: 6px; }
.history-selected { color: var(--text-primary); }
.history-context { color: var(--text-secondary); font-style: italic; }
.history-mode { color: var(--color-warning); font-weight: 500; }
.history-time { margin-left: auto; color: var(--text-regular); font-size: 12px; }
.history-item-body { font-size: 13px; line-height: 1.5; color: var(--text-primary); }
.history-item-body :deep(p),
.history-item-body :deep(ul),
.history-item-body :deep(ol),
.history-item-body :deep(li) { text-align: left; }
.history-item-body :deep(code) { background: rgba(0,0,0,0.05); padding: 2px 4px; border-radius: 4px; font-size: 12px; color: var(--color-primary); }
.history-item-body :deep(pre code) { display: block; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 6px; overflow-x: auto; }
.dialog-footer { display: flex; align-items: center; justify-content: flex-end; gap: 12px; }
.history-delete-btn { margin-left: 4px; color: var(--color-danger); }
</style>
