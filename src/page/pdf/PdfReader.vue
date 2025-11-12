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
      <!-- Removed Clear button -->
      <!-- Zoom controls -->
      <div v-if="pdfLoaded" class="pdf-reader__zoom-group">
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
              @touchend="handleTouchSelection"
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
      :title="tOrFallback('pdf.explainSelection', 'Explain Selection')"
      @open-ai-tab="onOpenAiTabFromPopup"
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
import { buildAiTabQuery } from '@/util/aiNavigation'
import { navigateIfChanged } from '@/util/routerUtil'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const DEFAULT_RENDER_SCALE = 1.2
const MIN_RENDER_SCALE = 0.5
const MAX_RENDER_SCALE = 3
const RENDER_STEP = 0.1

// Simplified cache state (removed right/left layout and markdown fields)
const cachedPdfState = {
  data: null,
  name: '',
  renderScale: DEFAULT_RENDER_SCALE,
  totalPages: 0
}

export default {
  name: 'PdfReader',
  components: { AiSelectionPopup },
  data() {
    return {
      loading: false,
      pdfLoaded: false,
      pdfName: '',
      errorMessage: '',
      selectedText: '',
      showSelectionPopup: false,
      renderScale: DEFAULT_RENDER_SCALE,
      currentPdfData: null,
      totalPages: 0,
      // Removed markdown-related and layout toggle fields
      isSmallScreen: window.innerWidth <= 768,
      pdfViewer: null,
      pdfEventBus: null,
      pdfLinkService: null,
      viewerHeight: 0,
    }
  },
  computed: {
    readerClass() {
      return {
        'pdf-reader--compact': this.isSmallScreen
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
      // Ignore clicks inside Element UI dialogs or dropdowns
      const target = e.target
      const inDialog = target.closest && (target.closest('.el-dialog') || target.closest('.el-dialog__wrapper'))
      const inDropdown = target.closest && (target.closest('.el-select-dropdown') || target.closest('.el-autocomplete-suggestion'))
      if (inDialog || inDropdown) {
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
      this.$nextTick(() => this.processSelection(event))
    },
    handleTouchSelection(event) {
      setTimeout(() => this.processSelection(), 60)
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
      this.$nextTick(() => {
        const popup = this.$refs.aiPopup
        if (popup && typeof popup.aiSearchSelectedText === 'function') {
          try { popup.aiSearchSelectedText() } catch (_) {}
        }
      })
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
    async zoomOut() { await this.setZoom(this.renderScale - RENDER_STEP) }
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
  &__clear { margin-left: auto; }
  &__zoom-group { display: inline-flex; align-items: center; gap: 8px; margin-left: auto; }
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
  .pdf-reader__controls .el-button { width: 100%; justify-content: center; }
  .pdf-reader__filename { width: 100%; text-align: center; }
  .pdf-reader__layout { flex-direction: column; gap: 14px; }
  .pdf-reader__page-column { width: 100%; padding: 12px; }
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
