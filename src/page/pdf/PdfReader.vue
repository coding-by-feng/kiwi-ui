<template>
  <div class="pdf-reader" :class="readerClass">
    <div class="pdf-reader__controls">
      <input
        ref="fileInput"
        class="pdf-reader__file-input"
        type="file"
        accept="application/pdf"
        @change="onFileSelected"
      />
      <el-button type="primary" icon="el-icon-upload2" @click="triggerFilePicker">
        {{ pdfLoaded ? $t('pdf.changeButton') : $t('pdf.selectButton') }}
      </el-button>
      <span v-if="pdfName" class="pdf-reader__filename">
        {{ pdfName }}
      </span>
      <!-- Right controls: zoom + history -->
      <div v-if="pdfLoaded" class="pdf-reader__right-controls">
        <div class="pdf-reader__zoom-group">
          <el-button
            type="text"
            icon="el-icon-zoom-out"
            :disabled="!canZoomOut || loading"
            @click="zoomOut"
            :title="tOrFallback('pdf.zoomOut', 'Zoom Out')"
          />
          <span class="pdf-reader__zoom-indicator" :title="tOrFallback('pdf.zoom', 'Zoom')">
            {{ zoomPercent }}
          </span>
          <el-button
            type="text"
            icon="el-icon-zoom-in"
            :disabled="!canZoomIn || loading"
            @click="zoomIn"
            :title="tOrFallback('pdf.zoomIn', 'Zoom In')"
          />
        </div>
        <el-button
          v-if="pdfName"
          class="pdf-history-button"
          type="text"
          icon="el-icon-time"
          @click="showHistoryDialog = true"
          :title="'Open history (' + pdfHistoryCount + ')'"
        />
      </div>
    </div>

    <el-alert
      v-if="errorMessage"
      type="error"
      :title="errorMessage"
      show-icon
      :closable="false"
      class="pdf-reader__alert"
    />

    <div v-if="loading" class="pdf-reader__status">
      <i class="el-icon-loading"></i>
      <span>{{ $t('common.loading') || 'Loading PDF…' }}</span>
    </div>

    <div class="pdf-reader__content">
      <template v-if="!loading && !pdfLoaded">
        <div class="pdf-reader__placeholder">
          <el-empty :description="$t('pdf.selectPrompt')" />
        </div>
      </template>
      <template v-else>
        <div class="pdf-reader__layout">
          <div class="pdf-reader__page-column-wrapper" :style="{ height: viewerHeight + 'px' }">
            <div
              class="pdf-reader__page-column"
              ref="pageColumn"
              :style="{ height: viewerHeight + 'px' }"
              @mouseup="handlePointerSelection"
              @touchend.passive="handleTouchSelection"
              @click="handleViewerClick"
            >
              <div v-if="loading" class="pdf-reader__page-loading">
                <i class="el-icon-loading"></i>
              </div>
              <div ref="viewerContainer" class="pdf-reader__viewer pdfViewer"></div>
            </div>
          </div>
          <!-- Removed Markdown pane completely -->
        </div>
      </template>
    </div>

    <!-- Shared AI selection popup -->
    <ai-selection-popup
      ref="aiPopup"
      :visible.sync="showSelectionPopup"
      :selected-text.sync="selectedText"
      :file-name="pdfName"
      :title="tOrFallback('pdf.explainSelection', 'Explain Selection')"
      @open-ai-tab="onOpenAiTabFromPopup"
    />

    <selection-history
      v-if="pdfName"
      :visible.sync="showHistoryDialog"
      :resource-key="pdfName"
      resource-type="pdf"
      title="PDF Selection History"
      @history-cleared="onHistoryCleared"
      @history-item-deleted="onHistoryItemDeleted"
    />
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import 'pdfjs-dist/web/pdf_viewer.css'
import { EventBus, PDFLinkService, PDFViewer } from 'pdfjs-dist/legacy/web/pdf_viewer'
import kiwiConsts from '@/const/kiwiConsts'
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import SelectionHistory from '@/components/SelectionHistory.vue'
import { buildAiTabQuery } from '@/util/aiNavigation'
import { navigateIfChanged } from '@/util/routerUtil'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const DEFAULT_RENDER_SCALE = 1.2
const MIN_RENDER_SCALE = 0.2 // lowered from 0.5 to allow <50% zoom
const MAX_RENDER_SCALE = 3
const RENDER_STEP = 0.1
const MOBILE_BASE_MAX_WIDTH = 768
// Dynamic small-screen baseline scales (approx 30%, 25%, 22%)
const MOBILE_DEFAULT_RENDER_SCALE = 0.3
const MOBILE_NARROW_RENDER_SCALE = 0.25
const MOBILE_ULTRA_NARROW_RENDER_SCALE = 0.22

// Simplified cache state (removed right/left layout and markdown fields)
const cachedPdfState = {
  data: null,
  name: '',
  renderScale: DEFAULT_RENDER_SCALE,
  totalPages: 0
}

export default {
  name: 'PdfReader',
  components: { AiSelectionPopup, SelectionHistory },
  data() {
    const winW = window.innerWidth
    const isSmallScreen = winW <= MOBILE_BASE_MAX_WIDTH
    // Pick a baseline scale for phones based on width tiers
    let mobileScale = MOBILE_DEFAULT_RENDER_SCALE
    if (winW <= 380) mobileScale = MOBILE_ULTRA_NARROW_RENDER_SCALE
    else if (winW <= 430) mobileScale = MOBILE_NARROW_RENDER_SCALE
    return {
      loading: false,
      pdfLoaded: false,
      pdfName: '',
      errorMessage: '',
      selectedText: '',
      showSelectionPopup: false,
      renderScale: isSmallScreen ? mobileScale : DEFAULT_RENDER_SCALE,
      currentPdfData: null,
      totalPages: 0,
      isSmallScreen,
      pdfViewer: null,
      pdfEventBus: null,
      pdfLinkService: null,
      viewerHeight: 0,
      showHistoryDialog: false,
      historyVersion: 0,
    }
  },
  computed: {
    readerClass() {
      return {
        'pdf-reader--compact': this.isSmallScreen,
        'pdf-reader--no-select': this.useClickToSearch
      }
    },
    // Zoom helpers
    zoomPercent() {
      return `${Math.round(this.renderScale * 100)}%`
    },
    canZoomIn() {
      return this.renderScale < MAX_RENDER_SCALE - 1e-6
    },
    canZoomOut() {
      return this.renderScale > MIN_RENDER_SCALE + 1e-6
    },
    pdfHistoryCount() {
      // Depend on historyVersion to force recompute after deletions
      void this.historyVersion
      try {
        const key = this.pdfName ? `pdf-ai-history:${this.pdfName}` : ''
        if (!key) return 0
        const raw = localStorage.getItem(key)
        if (!raw) return 0
        const arr = JSON.parse(raw)
        return Array.isArray(arr) ? arr.length : 0
      } catch (_) { return 0 }
    },
    // Detect if device is mobile/tablet; prefer UA + touch capabilities to include iPadOS
    isMobileDevice() {
      try {
        const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase()
        const isIpadOS13Plus = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1
        const isMobileUA = /(iphone|ipod|ipad|android|bb10|blackberry|mini|windows phone|silk|kindle|mobile)/i.test(ua)
        return isIpadOS13Plus || isMobileUA
      } catch (_) { return false }
    },
    // On mobile devices, disable selection and use click-to-search
    useClickToSearch() {
      return this.isMobileDevice
    }
  },
  async mounted() {
    await this.$nextTick()
    this.initPdfViewer()
    this.updateViewerHeight()
    this.autoFitForSmallScreens()
    document.addEventListener('click', this.handleDocumentClick)
    window.addEventListener('resize', this.handleResize)
    window.addEventListener('resize', this.updateViewerHeight)
    window.addEventListener('resize', this.autoFitForSmallScreens)
    await this.restoreCachedPdfIfNeeded()
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
    window.removeEventListener('resize', this.handleResize)
    window.removeEventListener('resize', this.updateViewerHeight)
    window.removeEventListener('resize', this.autoFitForSmallScreens)
  },
  methods: {
    initPdfViewer() {
      if (this.pdfViewer) return
      const container = this.$refs.pageColumn
      const viewer = this.$refs.viewerContainer
      if (!container || !viewer) return

      this.pdfEventBus = new EventBus()
      this.pdfLinkService = new PDFLinkService({ eventBus: this.pdfEventBus })
      this.pdfViewer = new PDFViewer({
        container,
        viewer,
        eventBus: this.pdfEventBus,
        linkService: this.pdfLinkService,
        textLayerMode: 2,
        useOnlyCssZoom: true
      })
      this.pdfLinkService.setViewer(this.pdfViewer)
      this.pdfEventBus.on('pagesinit', () => {
        if (this.pdfViewer) {
          this.pdfViewer.currentScale = this.renderScale
        }
      })
    },
    handleDocumentClick(e) {
      if (!this.showSelectionPopup) return
      const target = e.target
      // Ignore clicks inside Element UI dialogs or dropdowns or the floating history button
      const inDialog = target.closest && (target.closest('.el-dialog') || target.closest('.el-dialog__wrapper'))
      const inDropdown = target.closest && (target.closest('.el-select-dropdown') || target.closest('.el-autocomplete-suggestion'))
      const inAiPopupWrapper = target.closest && target.closest('.ai-selection-popup-wrapper')
      const inAiHistoryFloating = target.closest && target.closest('.ai-history-floating')
      if (inDialog || inDropdown || inAiPopupWrapper || inAiHistoryFloating) {
        return
      }
      const inViewer = this.isNodeWithinElements(target, this.getPageWrappers())
      if (!inViewer) {
        this.closePopup()
      }
    },
    triggerFilePicker() {
      if (this.$refs.fileInput) {
        this.$refs.fileInput.click()
      }
    },
    onFileSelected(event) {
      const file = event.target.files && event.target.files[0]
      if (!file) return

      this.resetError()

      if (file.type !== 'application/pdf') {
        this.errorMessage = this.$t('pdf.invalidType') || 'Please choose a valid PDF file.'
        event.target.value = ''
        return
      }

      this.loadPdfFromFile(file)
      event.target.value = ''
    },
    async loadPdfFromFile(file) {
      this.loading = true
      this.pdfLoaded = false
      this.pdfName = file.name
      this.closePopup()

      try {
        const arrayBuffer = await file.arrayBuffer()
        const typedArray = new Uint8Array(arrayBuffer)
        this.currentPdfData = typedArray
        this.totalPages = 0

        await this.renderPdf(typedArray)

        this.pdfLoaded = true
        this.cacheCurrentPdfState(typedArray)
      } catch (error) {
        console.error('[PdfReader] Failed to load PDF:', error)
        this.errorMessage = this.$t('pdf.loadFailed') || 'Failed to load the PDF file.'
        this.pdfLoaded = false
        this.clearViewer()
        this.resetCachedPdfState()
      } finally {
        this.loading = false
      }
    },
    async renderPdf(source) {
      this.initPdfViewer()
      const typedArray = source instanceof Uint8Array ? source : new Uint8Array(source)
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const pdf = await loadingTask.promise

      this.clearViewer()
      this.totalPages = pdf.numPages
      if (this.pdfViewer && this.pdfLinkService) {
        this.pdfLinkService.setDocument(pdf, null)
        this.pdfViewer.setDocument(pdf)
        // Ensure scale is appropriate for the current screen size
        this.autoFitForSmallScreens()
      }
    },
    getPageWrappers() {
      const viewer = this.$refs.viewerContainer
      if (!viewer) return []
      return Array.from(viewer.querySelectorAll('.page'))
    },
    isNodeWithinElements(node, elements) {
      if (!node || !elements?.length) return false
      return elements.some(el => el && el.contains(node))
    },
    cacheCurrentPdfState(data) {
      if (!data) return
      cachedPdfState.data = data
      cachedPdfState.name = this.pdfName
      cachedPdfState.renderScale = this.renderScale
      cachedPdfState.totalPages = this.totalPages
    },
    resetCachedPdfState() {
      cachedPdfState.data = null
      cachedPdfState.name = ''
      cachedPdfState.renderScale = DEFAULT_RENDER_SCALE
      cachedPdfState.totalPages = 0
      this.currentPdfData = null
    },
    async restoreCachedPdfIfNeeded() {
      if (!cachedPdfState.data) return
      this.loading = true
      this.resetError()
      this.pdfName = cachedPdfState.name
      this.renderScale = cachedPdfState.renderScale || DEFAULT_RENDER_SCALE
      this.totalPages = cachedPdfState.totalPages || 0
      this.currentPdfData = cachedPdfState.data

      try {
        await this.renderPdf(this.currentPdfData)
      } catch (error) {
        console.error('[PdfReader] Failed to restore cached PDF:', error)
        this.errorMessage = this.$t('pdf.loadFailed') || 'Failed to load the PDF file.'
        this.resetCachedPdfState()
        this.pdfLoaded = false
        this.clearViewer()
      } finally {
        this.loading = false
        this.pdfLoaded = true
      }
    },
    tOrFallback(path, fallback, values = {}) {
      if (typeof this.$te === 'function' && this.$te(path)) {
        return this.$t(path, values)
      }
      if (typeof this.$t === 'function') {
        const translation = this.$t(path, values)
        if (translation && translation !== path) {
          return translation
        }
      }
      return fallback
    },
    handlePointerSelection(event) {
      // On mobile/tablet we disable selection and use click-to-search instead
      if (this.useClickToSearch) return
      this.$nextTick(() => this.processSelection(event))
    },
    handleTouchSelection() {
      // On mobile/tablet we disable selection and use click-to-search instead
      if (this.useClickToSearch) return
      setTimeout(() => this.processSelection(), 60)
    },
    // New: click/tap to pick the sentence under finger on mobile devices
    handleViewerClick(event) {
      if (!this.useClickToSearch) return
      if (!this.pdfLoaded) return
      const sentence = this.detectSentenceAtPoint(event)
      if (sentence) {
        this.selectedText = sentence
        this.showSelectionPopup = true
        // AiSelectionPopup will auto-run search on open with the provided selectedText
      }
    },
    processSelection() {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) { this.closePopup(); return }
      const selectedText = selection.toString().trim()
      if (!selectedText) { this.closePopup(); return }
      if (selection.rangeCount === 0) { this.closePopup(); return }

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const inViewer = this.isNodeWithinElements(container, this.getPageWrappers())
      if (!inViewer) { this.closePopup(); return }

      const normalized = selectedText.replace(/\s+/g, ' ').trim()
      if (!normalized) { this.closePopup(); return }

      this.selectedText = normalized
      this.showSelectionPopup = true
      // Removed manual popup.aiSearchSelectedText() to prevent duplicate auto calls; AiSelectionPopup handles auto search on open
    },
    onOpenAiTabFromPopup(payload) {
      const text = (payload && payload.text) ? String(payload.text).trim() : (this.selectedText || '').trim()
      if (!text) return
      const overrides = {
        ...(payload?.query || {}),
        active: 'search',
        selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value,
        source: 'pdf'
      }
      const query = buildAiTabQuery({ text, route: this.$route, overrides, preserveKeys: ['source'] })
      const target = { path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query }
      navigateIfChanged(this.$router, this.$route, target).finally(() => { this.showSelectionPopup = false })
    },
    closePopup() {
      this.showSelectionPopup = false
      this.selectedText = ''
      const selection = window.getSelection()
      if (selection && typeof selection.removeAllRanges === 'function') { try { selection.removeAllRanges() } catch (_) {} }
    },
    clearViewer() {
      if (this.pdfViewer && typeof this.pdfViewer.setDocument === 'function') {
        try {
          this.pdfViewer.setDocument(null)
        } catch (error) {
          console.warn('[PdfReader] Unable to detach PDF document:', error)
        }
      }
      if (this.pdfLinkService && typeof this.pdfLinkService.setDocument === 'function') {
        try {
          this.pdfLinkService.setDocument(null)
        } catch (error) {
          console.warn('[PdfReader] Unable to reset PDF link service:', error)
        }
      }
      const viewer = this.$refs.viewerContainer
      if (viewer) {
        viewer.innerHTML = ''
      }
    },
    updateViewerHeight() {
      try {
        const controlsEl = this.$el.querySelector('.pdf-reader__controls')
        const controlsHeight = controlsEl ? controlsEl.getBoundingClientRect().height : 0
        const alertEl = this.$el.querySelector('.pdf-reader__alert')
        const alertHeight = alertEl ? alertEl.getBoundingClientRect().height : 0
        const statusEl = this.$el.querySelector('.pdf-reader__status')
        const statusHeight = statusEl ? statusEl.getBoundingClientRect().height : 0
        const verticalPadding = 32 // total padding/margins
        const viewportH = window.innerHeight
        const maxUsable = viewportH - controlsHeight - alertHeight - statusHeight - verticalPadding
        const minH = this.isSmallScreen ? 320 : 420
        this.viewerHeight = Math.max(minH, Math.round(maxUsable))
      } catch (e) {
        this.viewerHeight = this.isSmallScreen ? 360 : 720
      }
    },
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 768
      this.updateViewerHeight()
      this.autoFitForSmallScreens()
      this.closePopup()
    },
    autoFitForSmallScreens() {
      try {
        if (!this.pdfViewer) return
        if (this.isSmallScreen) {
          // Do not force page-width; keep user scale, but ensure it is clamped and if still at desktop default, switch to mobile baseline.
          if (this.renderScale > 0.6 || this.renderScale === DEFAULT_RENDER_SCALE) {
            // If user hasn't adjusted yet, adopt mobile baseline for current width tier
            this.renderScale = this.getMobileBaseScale()
          }
          const desired = this.clampScale(this.renderScale || this.getMobileBaseScale())
          if (Math.abs(desired - this.pdfViewer.currentScale) > 1e-6) {
            this.pdfViewer.currentScale = desired
          }
          // Sync back (PDF.js may normalize slightly)
          const actual = this.clampScale(this.pdfViewer.currentScale)
          if (Math.abs(actual - this.renderScale) > 1e-6) {
            this.renderScale = actual
            cachedPdfState.renderScale = actual
          }
        } else {
          // Larger screens: honor stored scale but clamp
            const clamped = this.clampScale(this.renderScale)
            if (Math.abs(clamped - this.pdfViewer.currentScale) > 1e-6) {
              this.pdfViewer.currentScale = clamped
            }
            const actual = this.clampScale(this.pdfViewer.currentScale)
            if (Math.abs(actual - this.renderScale) > 1e-6) {
              this.renderScale = actual
              cachedPdfState.renderScale = actual
            }
        }
      } catch (_) {
        // Ignore lifecycle timing issues
      }
    },
    getMobileBaseScale() {
      const w = window.innerWidth
      if (w <= 380) return MOBILE_ULTRA_NARROW_RENDER_SCALE
      if (w <= 430) return MOBILE_NARROW_RENDER_SCALE
      return MOBILE_DEFAULT_RENDER_SCALE
    },
    resetError() {
      this.errorMessage = ''
    },
    // Zoom helpers
    clampScale(scale) {
      return Math.min(MAX_RENDER_SCALE, Math.max(MIN_RENDER_SCALE, Number(scale) || DEFAULT_RENDER_SCALE))
    },
    async setZoom(scale) {
      if (!this.pdfLoaded || !this.pdfViewer) return
      const newScale = this.clampScale(scale)
      if (Math.abs(newScale - this.renderScale) < 1e-6) return
      this.renderScale = newScale
      cachedPdfState.renderScale = newScale
      try {
        this.pdfViewer.currentScale = newScale
      } catch (_) {}
    },
    async zoomIn() { await this.setZoom(this.renderScale + RENDER_STEP) },
    async zoomOut() { await this.setZoom(this.renderScale - RENDER_STEP) },
    onHistoryCleared() { this.showHistoryDialog = false; this.historyVersion++ },
    onHistoryItemDeleted() { this.historyVersion++ },

    // ========== Click-to-sentence detection (mobile) ==========
    detectSentenceAtPoint(event) {
      try {
        const x = event.clientX
        const y = event.clientY
        const el = document.elementFromPoint(x, y)
        if (!el) return null
        // Ensure click is within PDF page
        const pageEls = this.getPageWrappers()
        if (!this.isNodeWithinElements(el, pageEls)) return null

        // Find the page element and its text layer (canvas sibling)
        const pageEl = el.closest && el.closest('.page')
        if (!pageEl) return null
        const textLayer = pageEl.querySelector('.textLayer') || pageEl.querySelector('.pdf-text-layer')
        if (!textLayer) return null

        // Get a caret range at the point if possible
        let range = this.getCaretRangeAtClientPoint(x, y)
        if (!range || !textLayer.contains(range.startContainer)) {
          // Fallback: find the span under the point
          const spans = Array.from(textLayer.querySelectorAll('span'))
          let hitSpan = null
          for (const s of spans) {
            const r = s.getBoundingClientRect()
            if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) { hitSpan = s; break }
          }
          if (!hitSpan) return null
          if (!hitSpan.firstChild || hitSpan.firstChild.nodeType !== Node.TEXT_NODE) return null
          const r2 = document.createRange()
          r2.setStart(hitSpan.firstChild, 0)
          r2.collapse(true)
          range = r2
        }
        return this.extractSentenceAroundRange(range, textLayer)
      } catch (_) {
        return null
      }
    },
    getCaretRangeAtClientPoint(x, y) {
      const doc = document
      if (doc.caretRangeFromPoint) {
        return doc.caretRangeFromPoint(x, y)
      }
      if (doc.caretPositionFromPoint) {
        const pos = doc.caretPositionFromPoint(x, y)
        if (pos && pos.offsetNode) {
          const r = doc.createRange()
          r.setStart(pos.offsetNode, pos.offset || 0)
          r.collapse(true)
          return r
        }
      }
      return null
    },
    isBoundaryChar(ch) {
      if (!ch) return false
      return /[.!?。！？]/.test(ch)
    },
    prevTextNode(node, root) {
      // Walk to previous text node within root
      let n = node
      while (n && n !== root) {
        if (n.previousSibling) {
          n = n.previousSibling
          while (n && n.lastChild) n = n.lastChild
        } else {
          n = n.parentNode
        }
        if (!n) break
        if (n.nodeType === Node.TEXT_NODE && n.data && n.data.length) return n
      }
      return null
    },
    nextTextNode(node, root) {
      // Walk to next text node within root
      let n = node
      while (n && n !== root) {
        if (n.nextSibling) {
          n = n.nextSibling
          while (n && n.firstChild) n = n.firstChild
        } else {
          n = n.parentNode
        }
        if (!n) break
        if (n.nodeType === Node.TEXT_NODE && n.data && n.data.length) return n
      }
      return null
    },
    extractSentenceAroundRange(range, root) {
      try {
        // Ensure we start from a text node
        let startNode = range.startContainer
        let startOffset = range.startOffset || 0
        if (startNode.nodeType !== Node.TEXT_NODE) {
          // Try to find a nearby text node
          const candidate = (startNode.childNodes && startNode.childNodes.length)
            ? startNode.childNodes[Math.min(0, startNode.childNodes.length - 1)]
            : this.nextTextNode(startNode, root) || this.prevTextNode(startNode, root)
          if (!candidate || candidate.nodeType !== Node.TEXT_NODE) return null
          startNode = candidate
          startOffset = 0
        }
        if (!root.contains(startNode)) return null

        // Scan left to boundary
        let leftNode = startNode
        let leftIndex = Math.max(0, Math.min(startOffset, leftNode.data.length))
        let foundLeft = false
        let scanned = 0
        const SCAN_LIMIT = 600
        while (leftNode && scanned < SCAN_LIMIT) {
          for (let i = leftIndex - 1; i >= 0; i--) {
            scanned++
            const ch = leftNode.data.charAt(i)
            if (this.isBoundaryChar(ch)) {
              leftIndex = i + 1
              foundLeft = true
              break
            }
          }
          if (foundLeft) break
          const prev = this.prevTextNode(leftNode, root)
          if (!prev) break
          leftNode = prev
          leftIndex = leftNode.data.length
        }

        // Scan right to boundary
        let rightNode = startNode
        let rightIndex = Math.max(0, Math.min(startOffset, rightNode.data.length))
        let foundRight = false
        scanned = 0
        while (rightNode && scanned < SCAN_LIMIT) {
          for (let i = rightIndex; i < rightNode.data.length; i++) {
            scanned++
            const ch = rightNode.data.charAt(i)
            if (this.isBoundaryChar(ch)) {
              rightIndex = i + 1
              foundRight = true
              break
            }
          }
          if (foundRight) break
          const next = this.nextTextNode(rightNode, root)
          if (!next) break
          rightNode = next
          rightIndex = 0
        }

        // Collect text between [leftNode:leftIndex, rightNode:rightIndex)
        const parts = []
        let n = leftNode
        while (n) {
          if (n === leftNode && n === rightNode) {
            parts.push(n.data.slice(leftIndex, rightIndex))
            break
          }
          if (n === leftNode) {
            parts.push(n.data.slice(leftIndex))
          } else if (n === rightNode) {
            parts.push(n.data.slice(0, rightIndex))
            break
          } else {
            parts.push(n.data)
          }
          n = this.nextTextNode(n, root)
        }

        let text = parts.join(' ')
        text = this.sanitizeSentence(text)
        if (!text) return null
        return text
      } catch (e) {
        return null
      }
    },
    sanitizeSentence(text) {
      if (!text) return ''
      let t = String(text)
      // Collapse whitespace and trim
      t = t.replace(/\s+/g, ' ').trim()
      // Remove dangling quotes/brackets at edges
      t = t.replace(/^[\s"'“‘（【\[]+/, '').replace(/[\s"'”’）】\]]+$/, '')
      // Avoid overly long selections; keep within 20..300 chars typical sentence
      if (t.length > 360) {
        // Cut at next boundary after 300 if possible
        const m = t.slice(0, 340).match(/[.!?。！？](?=[^.!?。！？]*$)/)
        t = m ? t.slice(0, m.index + 1) : t.slice(0, 340)
      }
      return t
    }
  }
}
</script>

<style lang="scss" scoped>
.pdf-reader {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 16px;
  box-sizing: border-box;

  &__controls { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; }
  &__file-input { display: none; }
  &__filename { font-size: 14px; color: #606266; max-width: 260px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__right-controls { margin-left: auto; display: flex; align-items: center; gap: 12px; }
  &__zoom-group { display: inline-flex; align-items: center; gap: 8px; }
  &__zoom-indicator { min-width: 46px; text-align: center; font-size: 13px; color: #606266; padding: 2px 8px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 8px; line-height: 20px; }
  &__alert { margin-bottom: 12px; }
  &__status { display: flex; align-items: center; gap: 8px; color: #606266; margin-bottom: 12px; }
  &__content { flex: 1; min-height: 360px; }
  &__placeholder, &__no-text { display: flex; align-items: center; justify-content: center; min-height: 360px; background: #f5f7fa; border: 1px dashed #dcdfe6; border-radius: 12px; }

  &__layout {
    display: flex;
    gap: 20px;
    width: 100%;
    height: 100%;
    flex: 1 1 auto;       /* fill remaining space */
    min-height: 0;        /* allow children to size */
  }
  &__page-column-wrapper {
    flex: 1 1 auto;
    position: relative;
    min-width: 0;
    display: block;
    transition: height 0.25s ease;
  }
  &__page-column {
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    overflow: auto; padding: 16px; background: #f5f7fa; border: 1px solid #e4e7ed; border-radius: 12px;
    transition: height 0.25s ease;
  }
  &__page-loading { position: sticky; top: 0; z-index: 2; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 12px 0; color: #606266; background: linear-gradient(180deg, rgba(245, 247, 250, 1) 0%, rgba(245, 247, 250, 0.85) 100%); }
  &__viewer { position: relative; display: flex; flex-direction: column; gap: 20px; width: 100%; min-height: 360px; align-items: center; user-select: text; -webkit-user-select: text; }
}

.pdf-reader--compact {
  .pdf-reader__controls { flex-direction: column; align-items: stretch; gap: 8px; }
  .pdf-reader__right-controls { width: 100%; justify-content: center; order: 4; margin-left: 0; }
  .pdf-reader__zoom-group { justify-content: center; }
  .pdf-reader__filename { width: 100%; text-align: center; }
  .pdf-reader__layout { flex-direction: column; gap: 14px; }
  .pdf-reader__page-column { width: 100%; padding: 12px; }
}

/* Disable native text selection on mobile click-to-search mode, but keep textLayer clickable */
.pdf-reader--no-select {
  ::v-deep(.textLayer) {
    user-select: none !important;
    -webkit-user-select: none !important;
    -moz-user-select: none !important;
    -webkit-touch-callout: none !important;
    pointer-events: auto;
  }
}

::v-deep(.pdf-reader__viewer .page) { position: relative; margin: 0 auto; width: 100%; max-width: 100%; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08); border-radius: 6px; overflow: hidden; background: #fff; }
::v-deep(.pdf-reader__viewer .page:last-child) { margin-bottom: 0; }
::v-deep(.pdf-reader__viewer .page .canvasWrapper) { background: #fff; }

/* Remove old pdf-selection-popup bubble (unused now) */
.pdf-selection-popup { display: none; }

.pdf-reader-fade-enter-active, .pdf-reader-fade-leave-active { transition: opacity 0.15s ease; }
.pdf-reader-fade-enter, .pdf-reader-fade-leave-to { opacity: 0; }

::v-deep(.textLayer) { position: absolute; top: 0; left: 0; right: 0; bottom: 0; color: transparent; pointer-events: auto; user-select: text; -webkit-user-select: text; }
::v-deep(.textLayer > span) { position: absolute; left: 0; top: 0; transform-origin: 0 0; white-space: pre; color: transparent; padding: 0; margin: 0; line-height: 1; cursor: text; }
::v-deep(.textLayer > span::selection), ::v-deep(.textLayer > span::-moz-selection) { background: rgba(64, 158, 255, 0.35); color: #1f2d3d; }

@media (max-width: 768px) { .pdf-selection-popup { font-size: 13px; padding: 8px 12px; } }
</style>