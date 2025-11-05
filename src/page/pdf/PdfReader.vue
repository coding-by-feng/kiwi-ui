<template>
  <div class="pdf-reader">
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

    <div
      ref="viewerContainer"
      class="pdf-reader__viewer"
      @mouseup="handlePointerSelection"
      @touchend="handleTouchSelection"
    >
      <div ref="viewer" class="pdf-reader__viewer-inner">
        <div class="pdfViewer"></div>
      </div>
      <el-empty
        v-if="!loading && !pdfLoaded"
        class="pdf-reader__empty"
        :description="$t('pdf.selectPrompt')"
      />
    </div>

    <transition name="pdf-reader-fade">
      <div
        v-if="showSelectionPopup"
        ref="selectionPopup"
        class="pdf-selection-popup"
        :style="popupStyle"
        @click="navigateToDirectTranslation"
      >
        <i class="el-icon-search"></i>
        <span>"{{ selectedText }}"</span>
      </div>
    </transition>
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf'
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry'
import {
  EventBus,
  PDFViewer,
  PDFLinkService,
  PDFFindController
} from 'pdfjs-dist/web/pdf_viewer'
import 'pdfjs-dist/web/pdf_viewer.css'
import { getStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker

export default {
  name: 'PdfReader',
  data() {
    return {
      loading: false,
      pdfLoaded: false,
      pdfName: '',
      errorMessage: '',
      selectedText: '',
      showSelectionPopup: false,
      popupPosition: {
        top: 0,
        left: 0
      },
      pdfViewer: null,
      eventBus: null,
      linkService: null,
      findController: null
    }
  },
  computed: {
    popupStyle() {
      return {
        top: `${this.popupPosition.top}px`,
        left: `${this.popupPosition.left}px`
      }
    }
  },
  mounted() {
    document.addEventListener('click', this.handleDocumentClick)
    window.addEventListener('resize', this.closePopup)
  },
  beforeDestroy() {
    document.removeEventListener('click', this.handleDocumentClick)
    window.removeEventListener('resize', this.closePopup)
    this.disposeViewer()
  },
  methods: {
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
      this.clearViewer()

      try {
        const arrayBuffer = await file.arrayBuffer()
        await this.renderPdf(arrayBuffer)
        this.pdfLoaded = true
      } catch (error) {
        console.error('[PdfReader] Failed to load PDF:', error)
        this.errorMessage = this.$t('pdf.loadFailed') || 'Failed to load the PDF file.'
        this.pdfLoaded = false
      } finally {
        this.loading = false
      }
    },
    ensureViewer() {
      if (this.pdfViewer) {
        return this.pdfViewer
      }

      const viewerContainer = this.$refs.viewerContainer
      const viewer = this.$refs.viewer?.querySelector('.pdfViewer')
      if (!viewerContainer || !viewer) {
        return null
      }

      const eventBus = new EventBus()
      const linkService = new PDFLinkService({ eventBus })
      const findController = new PDFFindController({ eventBus, linkService })

      this.pdfViewer = new PDFViewer({
        container: viewerContainer,
        viewer,
        eventBus,
        linkService,
        findController,
        textLayerMode: 1,
        removePageBorders: true
      })

      linkService.setViewer(this.pdfViewer)

      eventBus.on('pagesinit', () => {
        if (this.pdfViewer) {
          this.pdfViewer.currentScaleValue = 'page-width'
        }
      })

      this.eventBus = eventBus
      this.linkService = linkService
      this.findController = findController

      return this.pdfViewer
    },
    async renderPdf(arrayBuffer) {
      const typedArray = new Uint8Array(arrayBuffer)
      const loadingTask = pdfjsLib.getDocument({ data: typedArray })
      const pdfDocument = await loadingTask.promise

      const viewerInstance = this.ensureViewer()
      if (!viewerInstance || !this.linkService) {
        throw new Error('PDF viewer is not available')
      }

      viewerInstance.setDocument(pdfDocument)
      this.linkService.setDocument(pdfDocument, null)

      this.$nextTick(() => {
        if (!viewerInstance._pages?.length) {
          return
        }
        viewerInstance.update()
      })
    },
    handlePointerSelection(event) {
      this.$nextTick(() => this.processSelection(event))
    },
    handleTouchSelection(event) {
      setTimeout(() => this.processSelection(event), 60)
    },
    processSelection(event) {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        this.closePopup()
        return
      }

      const selectedText = selection.toString().trim()
      if (!selectedText) {
        this.closePopup()
        return
      }

      if (selection.rangeCount === 0) {
        this.closePopup()
        return
      }

      const range = selection.getRangeAt(0)
      const viewer = this.$refs.viewer

      if (!viewer || !viewer.contains(range.commonAncestorContainer)) {
        this.closePopup()
        return
      }

      const normalized = selectedText.replace(/\s+/g, ' ').trim()
      if (!normalized) {
        this.closePopup()
        return
      }

      this.selectedText = normalized
      let rect = range.getBoundingClientRect()

      if (!rect || (rect.top === 0 && rect.bottom === 0 && rect.left === 0 && rect.right === 0)) {
        if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
          rect = {
            left: event.clientX,
            right: event.clientX,
            top: event.clientY,
            bottom: event.clientY,
            width: 0,
            height: 0
          }
        }
      }

      const defaultTop = (rect?.bottom || event?.clientY || 0) + 12
      const defaultLeft = (rect?.left || event?.clientX || 0) + ((rect?.width || 0) / 2)

      this.popupPosition = {
        top: defaultTop,
        left: defaultLeft
      }

      this.showSelectionPopup = true

      this.$nextTick(() => {
        const popup = this.$refs.selectionPopup
        if (!popup) return

        const padding = 12
        const popupWidth = popup.offsetWidth
        const popupHeight = popup.offsetHeight

        let left = this.popupPosition.left
        let top = this.popupPosition.top

        left = Math.min(Math.max(left, padding + popupWidth / 2), window.innerWidth - padding - popupWidth / 2)
        top = Math.min(Math.max(top, padding + popupHeight), window.innerHeight - padding - popupHeight)

        this.popupPosition = { top, left }
      })
    },
    navigateToDirectTranslation() {
      const cleaned = this.selectedText ? this.selectedText.trim() : ''
      if (!cleaned) {
        this.closePopup()
        return
      }

      const encodedText = encodeURIComponent(cleaned)
      const language = getStore({ name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE })
        || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese

      this.$router.push({
        path: '/index/tools/aiResponseDetail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value,
          language,
          originalText: encodedText,
          source: 'pdf',
          now: Date.now()
        }
      })

      this.closePopup()
    },
    handleDocumentClick(event) {
      if (!this.showSelectionPopup) return
      const popup = this.$refs.selectionPopup
      if (popup && popup.contains(event.target)) {
        return
      }

      if (this.$refs.viewer && this.$refs.viewer.contains(event.target)) {
        return
      }

      this.closePopup()
    },
    closePopup() {
      this.showSelectionPopup = false
      this.selectedText = ''
      const selection = window.getSelection()
      if (selection && typeof selection.removeAllRanges === 'function') {
        try { selection.removeAllRanges() } catch (_) {}
      }
    },
    clearPdf() {
      this.clearViewer()
      this.pdfLoaded = false
      this.pdfName = ''
      this.resetError()
      this.closePopup()
    },
    clearViewer() {
      if (this.pdfViewer) {
        this.pdfViewer.setDocument(null)
      }
      const viewer = this.$refs.viewer?.querySelector('.pdfViewer')
      if (viewer) {
        viewer.innerHTML = ''
      }
    },
    resetError() {
      this.errorMessage = ''
    },
    disposeViewer() {
      if (this.pdfViewer?.cleanup) {
        try {
          this.pdfViewer.cleanup()
        } catch (error) {
          console.warn('[PdfReader] Failed to cleanup viewer', error)
        }
      }
      this.pdfViewer = null
      this.eventBus = null
      this.linkService = null
      this.findController = null
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

  &__viewer {
    position: relative;
    flex: 1;
    overflow: auto;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 16px;
    min-height: 360px;
  }
}

.pdf-reader__viewer-inner {
  position: relative;
  width: 100%;
  min-height: 100%;
}

.pdf-reader__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.pdf-selection-popup {
  position: fixed;
  z-index: 9999;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: #409eff;
  color: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 18px rgba(64, 158, 255, 0.35);
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s ease, transform 0.2s ease;

  &:hover {
    background: #66b1ff;
    transform: translateY(-1px);
  }
}

.pdf-reader-fade-enter-active,
.pdf-reader-fade-leave-active {
  transition: opacity 0.15s ease;
}

.pdf-reader-fade-enter,
.pdf-reader-fade-leave-to {
  opacity: 0;
}

::v-deep(.pdfViewer .page) {
  position: relative;
  margin: 0 auto 16px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-radius: 4px;
  overflow: hidden;
}

::v-deep(.pdfViewer .page canvas) {
  display: block;
  width: 100% !important;
  height: auto !important;
}

@media (max-width: 768px) {
  .pdf-reader {
    padding: 12px;

    &__viewer {
      padding: 12px;
      min-height: 280px;
    }
  }

  .pdf-selection-popup {
    font-size: 13px;
    padding: 8px 12px;
  }
}
</style>
