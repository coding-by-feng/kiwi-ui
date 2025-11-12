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
      <el-button
        v-if="pdfLoaded"
        type="text"
        icon="el-icon-delete"
        class="pdf-reader__clear"
        @click="clearPdf"
      >
        {{ $t('common.clear') || 'Clear' }}
      </el-button>
      <el-button
        v-if="pdfLoaded"
        type="text"
        :icon="rightCollapsed ? 'el-icon-s-unfold' : 'el-icon-s-fold'"
        @click="toggleRightPanel"
      >
        {{ rightCollapsed
          ? tOrFallback('pdf.showTextPanel', 'Show Text Panel')
          : tOrFallback('pdf.hideTextPanel', 'Hide Text Panel') }}
      </el-button>
      <el-button
        v-if="pdfLoaded"
        type="text"
        :icon="leftFullscreen ? 'el-icon-news' : 'el-icon-full-screen'"
        @click="toggleLeftFullscreen"
      >
        {{ leftFullscreen
          ? tOrFallback('pdf.exitFullscreen', 'Exit Full View')
          : tOrFallback('pdf.fullscreenLeft', 'Full View Left') }}
      </el-button>

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
          <div class="pdf-reader__page-column-wrapper">
            <div
              class="pdf-reader__page-column"
              ref="pageColumn"
              @mouseup="handlePointerSelection"
              @touchend="handleTouchSelection"
            >
              <div
                v-if="loading"
                class="pdf-reader__page-loading"
              >
                <i class="el-icon-loading"></i>
              </div>
              <div
                ref="viewerContainer"
                class="pdf-reader__viewer pdfViewer"
              ></div>
            </div>
          </div>
          <div
            v-if="!rightCollapsed"
            ref="markdownPane"
            class="pdf-reader__markdown-pane"
            @mouseup="handlePointerSelection"
            @touchend="handleTouchSelection"
          >
            <div
              v-if="convertedMarkdownHtml"
              class="pdf-reader__markdown"
              v-html="convertedMarkdownHtml"
            ></div>
            <div v-else-if="markdownConversionError" class="pdf-reader__text-empty">
              {{ markdownConversionError }}
            </div>
            <div v-else class="pdf-reader__text-empty">
              {{ tOrFallback('pdf.noExtractedText', 'No extracted text available for this document.') }}
            </div>
          </div>
        </div>
      </template>
    </div>

    <!-- Shared AI selection popup -->
    <ai-selection-popup
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
import { getStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'
import MarkdownIt from 'markdown-it'
import pdf2md from '@opendocsg/pdf2md'
import AiSelectionPopup from '@/page/ai/AiSelectionPopup.vue'
import { buildAiTabQuery } from '@/util/aiNavigation'
import { navigateIfChanged } from '@/util/routerUtil'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

const DEFAULT_RENDER_SCALE = 1.2
const MIN_RENDER_SCALE = 0.5
const MAX_RENDER_SCALE = 3
const RENDER_STEP = 0.1

const cachedPdfState = {
  data: null,
  name: '',
  renderScale: DEFAULT_RENDER_SCALE,
  rightCollapsed: false,
  leftFullscreen: false,
  totalPages: 0,
  convertedMarkdown: '',
  convertedMarkdownHtml: '',
  markdownConversionError: '',
  userAdjustedLayout: false
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
      convertedMarkdown: '',
      convertedMarkdownHtml: '',
      markdownConversionError: '',
      rightCollapsed: false,
      leftFullscreen: false,
      isSmallScreen: window.innerWidth <= 768,
      userAdjustedLayout: false,
      markdownRenderer: null,
      pdfViewer: null,
      pdfEventBus: null,
      pdfLinkService: null
    }
  },
  computed: {
    readerClass() {
      return {
        'pdf-reader--right-collapsed': this.rightCollapsed,
        'pdf-reader--left-fullscreen': this.leftFullscreen,
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
    document.addEventListener('click', this.handleDocumentClick)
    window.addEventListener('resize', this.handleResize)
    await this.restoreCachedPdfIfNeeded()
    this.applyResponsiveDefaults()
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
    window.removeEventListener('resize', this.handleResize)
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
      const inTextPanel = this.isNodeWithinElements(e.target, this.getMarkdownElements())
      const inViewer = this.isNodeWithinElements(e.target, this.getPageWrappers())
      if (!inTextPanel && !inViewer) {
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
      if (!file) {
        return
      }

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
        this.convertedMarkdown = ''
        this.convertedMarkdownHtml = ''
        this.markdownConversionError = ''

        await this.renderPdf(typedArray)
        await this.generateMarkdown(typedArray)

        this.pdfLoaded = true
        this.cacheCurrentPdfState(typedArray)
        this.applyResponsiveDefaults()
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
        this.pdfViewer.currentScale = this.renderScale
      }
    },
    async generateMarkdown(source) {
      const buffer = source instanceof Uint8Array ? source : new Uint8Array(source)
      try {
        this.markdownConversionError = ''
        const markdown = await pdf2md(buffer)
        if (typeof markdown === 'string' && markdown.trim()) {
          this.convertedMarkdown = markdown
          this.convertedMarkdownHtml = this.getMarkdownRenderer().render(markdown)
          return
        }
      } catch (error) {
        console.error('[PdfReader] Markdown conversion failed (pdf2md):', error)
      }

      // Fallback: extract plain text via pdf.js and wrap into simple Markdown
      try {
        const fallbackMd = await this.extractTextToMarkdown(buffer)
        if (fallbackMd) {
          this.convertedMarkdown = fallbackMd
          this.convertedMarkdownHtml = this.getMarkdownRenderer().render(fallbackMd)
          this.markdownConversionError = this.tOrFallback('pdf.markdownFallbackUsed', 'Used simple text extraction because advanced conversion failed.')
          return
        }
      } catch (e) {
        console.error('[PdfReader] Fallback markdown extraction failed:', e)
      }

      // If both methods fail
      this.convertedMarkdown = ''
      this.convertedMarkdownHtml = ''
      this.markdownConversionError = this.tOrFallback('pdf.markdownFailed', 'Failed to convert PDF to Markdown.')
    },

    async extractTextToMarkdown(source) {
      const typedArray = source instanceof Uint8Array ? source : new Uint8Array(source)
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const pdf = await loadingTask.promise

      const paragraphs = []
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber)
        const content = await page.getTextContent()
        // Merge items into lines, then lines into paragraphs
        const lines = []
        let currentLine = []
        let lastY = null
        for (const item of content.items) {
          const y = Math.round(item.transform?.[5] || 0)
          if (lastY !== null && Math.abs(y - lastY) > 2) {
            if (currentLine.length) {
              lines.push(currentLine.join(' '))
              currentLine = []
            }
          }
          currentLine.push((item.str || '').trim())
          lastY = y
        }
        if (currentLine.length) lines.push(currentLine.join(' '))

        const text = lines
          .map(l => l.replace(/\s+/g, ' ').trim())
          .filter(Boolean)
          .join('\n')

        if (text) {
          paragraphs.push(`### Page ${pageNumber}\n\n${text}`)
        }

        try { if (typeof page.cleanup === 'function') page.cleanup(true) } catch (_) {}
      }

      return paragraphs.join('\n\n---\n\n')
    },
    getMarkdownRenderer() {
      if (!this.markdownRenderer) {
        this.markdownRenderer = new MarkdownIt({ breaks: true, linkify: true })
      }
      return this.markdownRenderer
    },
    handlePointerSelection(event) {
      this.$nextTick(() => this.processSelection(event))
    },
    handleTouchSelection(event) {
      setTimeout(() => this.processSelection(event), 60)
    },
    toggleRightPanel() {
      this.rightCollapsed = !this.rightCollapsed
      if (!this.rightCollapsed && this.leftFullscreen) {
        this.leftFullscreen = false
      }
      this.userAdjustedLayout = true
      this.updateCachedLayoutState()
    },
    toggleLeftFullscreen() {
      if (!this.leftFullscreen) {
        if (!this.rightCollapsed) {
          this.rightCollapsed = true
        }
        this.leftFullscreen = true
      } else {
        this.leftFullscreen = false
      }
      this.userAdjustedLayout = true
      this.updateCachedLayoutState()
    },
    // Zoom controls
    clampScale(scale) {
      return Math.min(MAX_RENDER_SCALE, Math.max(MIN_RENDER_SCALE, Number(scale) || DEFAULT_RENDER_SCALE))
    },
    async setZoom(scale) {
      if (!this.pdfLoaded || !this.currentPdfData) return
      const newScale = this.clampScale(scale)
      if (Math.abs(newScale - this.renderScale) < 1e-6) return
      this.renderScale = newScale
      cachedPdfState.renderScale = newScale
      if (this.pdfViewer) {
        this.pdfViewer.currentScale = newScale
      }
      this.cacheCurrentPdfState(this.currentPdfData)
    },
    async zoomIn() {
      await this.setZoom(this.renderScale + RENDER_STEP)
    },
    async zoomOut() {
      await this.setZoom(this.renderScale - RENDER_STEP)
    },
    updateCachedLayoutState() {
      cachedPdfState.rightCollapsed = this.rightCollapsed
      cachedPdfState.leftFullscreen = this.leftFullscreen
      cachedPdfState.userAdjustedLayout = this.userAdjustedLayout
    },
    handleResize() {
      this.isSmallScreen = window.innerWidth <= 768
      this.closePopup()
      this.applyResponsiveDefaults()
    },
    applyResponsiveDefaults() {
      if (!this.isSmallScreen || this.userAdjustedLayout) return
      let layoutChanged = false
      if (!this.rightCollapsed) {
        this.rightCollapsed = true
        layoutChanged = true
      }
      if (this.leftFullscreen) {
        this.leftFullscreen = false
        layoutChanged = true
      }
      if (layoutChanged) {
        this.updateCachedLayoutState()
      }
    },
    getPageWrappers() {
      const viewer = this.$refs.viewerContainer
      if (!viewer) return []
      return Array.from(viewer.querySelectorAll('.page'))
    },
    getMarkdownElements() {
      const pane = this.$refs.markdownPane
      if (!pane) return []
      return Array.isArray(pane) ? pane : [pane]
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
      cachedPdfState.rightCollapsed = this.rightCollapsed
      cachedPdfState.leftFullscreen = this.leftFullscreen
      cachedPdfState.totalPages = this.totalPages
      cachedPdfState.convertedMarkdown = this.convertedMarkdown
      cachedPdfState.convertedMarkdownHtml = this.convertedMarkdownHtml
      cachedPdfState.markdownConversionError = this.markdownConversionError
      cachedPdfState.userAdjustedLayout = this.userAdjustedLayout
    },
    resetCachedPdfState() {
      cachedPdfState.data = null
      cachedPdfState.name = ''
      cachedPdfState.renderScale = DEFAULT_RENDER_SCALE
      cachedPdfState.rightCollapsed = false
      cachedPdfState.leftFullscreen = false
      cachedPdfState.totalPages = 0
      cachedPdfState.convertedMarkdown = ''
      cachedPdfState.convertedMarkdownHtml = ''
      cachedPdfState.markdownConversionError = ''
      cachedPdfState.userAdjustedLayout = false
      this.currentPdfData = null
      this.userAdjustedLayout = false
    },
    async restoreCachedPdfIfNeeded() {
      if (!cachedPdfState.data) return
      this.loading = true
      this.resetError()
      this.pdfName = cachedPdfState.name
      this.renderScale = cachedPdfState.renderScale || DEFAULT_RENDER_SCALE
      this.totalPages = cachedPdfState.totalPages || 0
      this.convertedMarkdown = cachedPdfState.convertedMarkdown || ''
      this.convertedMarkdownHtml = cachedPdfState.convertedMarkdownHtml || ''
      this.markdownConversionError = cachedPdfState.markdownConversionError || ''
      this.rightCollapsed = !!cachedPdfState.rightCollapsed
      this.leftFullscreen = !!cachedPdfState.leftFullscreen
      this.userAdjustedLayout = !!cachedPdfState.userAdjustedLayout
      this.currentPdfData = cachedPdfState.data

      try {
        await this.renderPdf(this.currentPdfData)
        if (!this.convertedMarkdownHtml) {
          await this.generateMarkdown(this.currentPdfData)
        }
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
    processSelection(event) {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) { this.closePopup(); return }
      const selectedText = selection.toString().trim()
      if (!selectedText) { this.closePopup(); return }
      if (selection.rangeCount === 0) { this.closePopup(); return }

      const range = selection.getRangeAt(0)
      const container = range.commonAncestorContainer
      const inViewer = this.isNodeWithinElements(container, this.getPageWrappers())
      const inTextPanel = this.isNodeWithinElements(container, this.getMarkdownElements())
      if (!inViewer && !inTextPanel) { this.closePopup(); return }

      const normalized = selectedText.replace(/\s+/g, ' ').trim()
      if (!normalized) { this.closePopup(); return }

      this.selectedText = normalized
      this.showSelectionPopup = true

      // No on-screen positioning correction required for the component dialog
    },
    onOpenAiTabFromPopup(payload) {
      const text = (payload && payload.text) ? String(payload.text).trim() : (this.selectedText || '').trim()
      if (!text) return
      const overrides = {
        ...(payload?.query || {}),
        active: 'search',
        selectedMode: kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value,
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
    clearPdf() {
      this.clearViewer()
      this.pdfLoaded = false
      this.pdfName = ''
      this.resetError()
      this.closePopup()
      this.rightCollapsed = false
      this.leftFullscreen = false
      this.userAdjustedLayout = false
      this.totalPages = 0
      this.convertedMarkdown = ''
      this.convertedMarkdownHtml = ''
      this.markdownConversionError = ''
      this.resetCachedPdfState()
      this.applyResponsiveDefaults()
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
    resetError() {
      this.errorMessage = ''
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

  &__controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 16px;
  }

  &__file-input {
    display: none;
  }

  &__filename {
    font-size: 14px;
    color: #606266;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__clear {
    margin-left: auto;
  }

  &__zoom-group {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-left: auto;
  }

  &__zoom-indicator {
    min-width: 46px;
    text-align: center;
    font-size: 13px;
    color: #606266;
    padding: 2px 8px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    line-height: 20px;
  }

  &__alert {
    margin-bottom: 12px;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #606266;
    margin-bottom: 12px;
  }

  &__content {
    flex: 1;
    min-height: 360px;
  }

  &__placeholder,
  &__no-text {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 360px;
    background: #f5f7fa;
    border: 1px dashed #dcdfe6;
    border-radius: 12px;
  }

  &__layout {
    display: flex;
    gap: 20px;
    width: 100%;
    height: 100%;
  }

  &__page-column-wrapper {
    flex: 1 1 60%;
    position: relative;
    min-width: 0;
    display: block;
  }

  &__page-column {
    position: absolute; /* required by pdf.js BaseViewer */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: auto;
    padding: 16px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
  }

  &__page-loading {
    position: sticky;
    top: 0;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px 0;
    color: #606266;
    background: linear-gradient(180deg, rgba(245, 247, 250, 1) 0%, rgba(245, 247, 250, 0.85) 100%);
  }

  &__viewer {
    position: relative; /* ensure container is positioned for PDF.js viewer absolute children */
    display: flex;
    flex-direction: column;
    gap: 20px;
    width: 100%;
    min-height: 360px;
    align-items: center;
    user-select: text;
    -webkit-user-select: text;
  }

  &__markdown-pane {
    flex: 1 1 40%;
    border: 1px solid #e3e9f5;
    border-radius: 12px;
    padding: 18px;
    background: linear-gradient(180deg, #fdfdff 0%, #f4f6fb 100%);
    box-shadow: 0 10px 24px rgba(52, 88, 156, 0.08);
    min-width: 0;
    overflow: auto;
    user-select: text;
    -webkit-user-select: text;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__markdown {
    font-size: 13px;
    line-height: 1.75;
    color: #2a3348;
    word-break: break-word;

    ul {
      padding-left: 20px;
      margin: 0;
      list-style: disc;
    }

    li {
      margin-bottom: 10px;
      background: rgba(64, 158, 255, 0.06);
      border-radius: 10px;
      padding: 10px 14px;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    p {
      margin: 0 0 10px 0;
    }

    a {
      color: #3a6ff7;
    }
  }

  &__text-empty {
    font-size: 13px;
    color: #909399;
  }
}

.pdf-reader--compact {
  .pdf-reader__controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .pdf-reader__controls .el-button {
    width: 100%;
    justify-content: center;
  }

  .pdf-reader__filename {
    width: 100%;
    text-align: center;
  }

  .pdf-reader__layout {
    flex-direction: column;
    gap: 14px;
  }

  .pdf-reader__page-column {
    width: 100%;
    padding: 12px;
  }

  .pdf-reader__markdown-pane {
    width: 100%;
    padding: 14px;
  }

  .pdf-reader__markdown li {
    margin-bottom: 8px;
    padding: 8px 12px;
  }
}

.pdf-reader--right-collapsed {
  .pdf-reader__markdown-pane {
    display: none;
  }

  .pdf-reader__page-column {
    flex: 1 1 100%;
  }
}

.pdf-reader--left-fullscreen {
  .pdf-reader__page-column {
    flex: 1 1 100%;
  }
}

::v-deep(.pdf-reader__viewer .page) {
  position: relative;
  margin: 0 auto;
  width: 100%;
  max-width: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  overflow: hidden;
  background: #fff;
}

::v-deep(.pdf-reader__viewer .page:last-child) {
  margin-bottom: 0;
}

::v-deep(.pdf-reader__viewer .page .canvasWrapper) {
  background: #fff;
}

/* Remove old pdf-selection-popup bubble (unused now) */
.pdf-selection-popup { display: none; }

.pdf-reader-fade-enter-active,
.pdf-reader-fade-leave-active {
  transition: opacity 0.15s ease;
}

.pdf-reader-fade-enter,
.pdf-reader-fade-leave-to {
  opacity: 0;
}

::v-deep(.textLayer) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  color: transparent;
  pointer-events: auto;
  user-select: text;
  -webkit-user-select: text;
}

::v-deep(.textLayer > span) {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
  white-space: pre;
  color: transparent;
  padding: 0;
  margin: 0;
  line-height: 1;
  cursor: text;
}

::v-deep(.textLayer > span::selection),
::v-deep(.textLayer > span::-moz-selection) {
  background: rgba(64, 158, 255, 0.35);
  color: #1f2d3d;
}

@media (max-width: 768px) {
  .pdf-selection-popup {
    font-size: 13px;
    padding: 8px 12px;
  }
}
</style>
