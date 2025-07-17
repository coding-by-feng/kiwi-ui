<!--suppress CssInvalidMediaFeature -->
<template>
  <div class="document-reader">
    <div class="header-container">
      <h1 class="main-title">
        <i class="el-icon-document"></i>
        Universal Document Reader
      </h1>
    </div>

    <div class="input-container">
      <div class="file-input-group">
        <label for="file-upload" class="file-upload-button">
          <i class="el-icon-folder-opened"></i>
          {{ selectedFile ? 'Change File' : 'Browse File' }}
          <input id="file-upload" type="file" @change="handleFileChange" accept=".pdf,.doc,.docx,.txt" style="display: none;"/>
        </label>
        <span v-if="selectedFile" class="file-name">{{ selectedFile.name }}</span>
        <el-button v-if="selectedFile" type="info" icon="el-icon-delete" size="small" circle @click="clearFile" class="action-btn"></el-button>
      </div>
    </div>

    <!-- PDF Controls -->
    <div v-if="fileType === 'pdf' && !isLoading && hasFileContent" class="pdf-controls">
      <div class="zoom-controls">
        <el-button icon="el-icon-zoom-out" size="small" @click="zoomOut" :disabled="currentScale <= 0.5"></el-button>
        <span class="zoom-display">{{ Math.round(currentScale * 100) }}%</span>
        <el-button icon="el-icon-zoom-in" size="small" @click="zoomIn" :disabled="currentScale >= 3.0"></el-button>
        <el-button size="small" @click="resetZoom">Reset</el-button>
      </div>

      <div class="page-controls" v-if="pdfPageCount > 1">
        <el-button icon="el-icon-arrow-left" size="small" @click="goToPage(currentPage - 1)" :disabled="currentPage <= 1"></el-button>
        <span class="page-info">
          Page
          <input
              type="number"
              v-model.number="pageInput"
              @keyup.enter="jumpToPage"
              @blur="jumpToPage"
              min="1"
              :max="pdfPageCount"
              class="page-input"
          />
          of {{ pdfPageCount }}
        </span>
        <el-button icon="el-icon-arrow-right" size="small" @click="goToPage(currentPage + 1)" :disabled="currentPage >= pdfPageCount"></el-button>
      </div>
    </div>

    <div class="status-container" v-show="isLoading">
      <div v-if="isLoading" class="loading-container">
        <div class="loading-animation">
          <div class="loading-spinner">
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
            <div class="spinner-ring"></div>
          </div>
          <div class="loading-text">
            <span class="loading-message">{{ statusMessage || 'Loading document...' }}</span>
            <div class="loading-dots">
              <span class="dot dot-1">.</span>
              <span class="dot dot-2">.</span>
              <span class="dot dot-3">.</span>
            </div>
          </div>
        </div>
        <div class="loading-progress">
          <div class="progress-bar">
            <div class="progress-fill"></div>
          </div>
          <div class="progress-text">Preparing document view...</div>
        </div>
      </div>
    </div>

    <div class="content-container" v-if="hasFileContent && !isLoading">
      <div class="document-view-panel">
        <div v-if="fileType === 'pdf'" class="pdf-viewer">
          <div id="pdf-viewer-container" class="pdf-viewer-container" @mouseup="handleTextSelection" @touchend="handleTextSelection"></div>
        </div>

        <div v-else-if="fileType === 'txt'" class="txt-viewer" @mouseup="handleTextSelection" @touchend="handleTextSelection">
          <pre>{{ fileContent }}</pre>
        </div>

        <div v-else-if="fileType === 'doc' || fileType === 'docx'" class="word-viewer-placeholder">
          <i class="el-icon-warning-outline"></i>
          <p>Word document viewing is limited to basic text or requires server-side conversion/dedicated viewer for full formatting. Displaying raw text if available:</p>
          <pre v-if="fileContent" @mouseup="handleTextSelection" @touchend="handleTextSelection">{{ fileContent }}</pre>
          <p v-else>Please consider converting this document to PDF for a richer in-browser experience, or use an external viewer.</p>
        </div>

        <div v-else class="no-file-selected">
          <i class="el-icon-document-add"></i>
          <p>Select a document to start reading (PDF, Word, TXT supported).</p>
        </div>
      </div>
    </div>

    <div
        v-if="showSelectionPopup"
        ref="vocabularyPopup"
        class="vocabulary-popup"
        @click="navigateToVocabulary"
    >
      <i class="el-icon-search"></i>
      <span>"{{ selectedText }}"</span>
    </div>
  </div>
</template>

<script>
import { defineComponent } from 'vue';
import msgUtil from '@/util/msg'; // Assuming you have this utility
import kiwiConsts from "@/const/kiwiConsts"; // Assuming you have this for constants
import { getStore } from "@/util/store"; // Assuming you have this for local storage

// Dynamically import pdf.js for client-side PDF rendering
let pdfjsLib;
if (typeof window !== 'undefined') {
  pdfjsLib = require('pdfjs-dist/build/pdf');
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

// For DOCX parsing (basic text extraction only)
let mammoth;
if (typeof window !== 'undefined') {
  mammoth = require('mammoth');
}

export default defineComponent({
  name: 'DocumentReader',
  data() {
    return {
      selectedFile: null,
      fileContent: null,
      fileType: null, // 'pdf', 'doc', 'docx', 'txt', 'unsupported'
      isLoading: false,
      statusMessage: '',
      selectedText: '',
      showSelectionPopup: false,
      // For PDF.js
      pdfDoc: null,
      pdfPageCount: 0,
      currentPage: 1,
      pageInput: 1,
      currentScale: 1.5,
      renderedPages: {}, // To keep track of rendered PDF pages

      // Debounce for resize events
      resizeTimeout: null,
    };
  },
  computed: {
    hasFileContent() {
      return this.fileContent !== null || this.fileType === 'pdf'; // PDF content is rendered directly, not stored in fileContent
    },
  },
  mounted() {
    this.setupEventListeners();
    this.applyTouchPreventions(); // Apply on mount
  },
  beforeUnmount() {
    this.cleanup();
  },
  methods: {
    // Initialization and Cleanup
    setupEventListeners() {
      document.addEventListener('click', this.handleClickOutside);
      window.addEventListener('resize', this.debounce(this.handleResize, 250));
    },

    cleanup() {
      document.removeEventListener('click', this.handleClickOutside);
      window.removeEventListener('resize', this.handleResize);
      this.clearTimeouts();
      this.clearPdfViewer();
    },

    clearTimeouts() {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
        this.resizeTimeout = null;
      }
    },

    clearPdfViewer() {
      if (this.pdfDoc) {
        this.pdfDoc.destroy();
        this.pdfDoc = null;
      }
      this.pdfPageCount = 0;
      this.currentPage = 1;
      this.pageInput = 1;
      this.renderedPages = {};
      const container = document.getElementById('pdf-viewer-container');
      if (container) {
        container.innerHTML = ''; // Clear existing PDF pages
      }
    },

    // File Handling
    handleFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.selectedFile = file;
        this.loadFile(file);
      }
    },

    clearFile() {
      this.selectedFile = null;
      this.fileContent = null;
      this.fileType = null;
      this.isLoading = false;
      this.statusMessage = '';
      this.closePopup();
      this.clearPdfViewer(); // Clear PDF viewer specifically
      // Reset the file input value to allow selecting the same file again
      const fileInput = document.getElementById('file-upload');
      if (fileInput) {
        fileInput.value = '';
      }
      msgUtil.msgSuccess(this, 'File cleared.', 1500);
    },

    async loadFile(file) {
      this.isLoading = true;
      this.statusMessage = 'Loading document...';
      this.fileContent = null;
      this.fileType = null;
      this.clearPdfViewer(); // Clear any previous PDF rendering

      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.pdf')) {
        this.fileType = 'pdf';
        await this.loadPdf(file);
      } else if (fileName.endsWith('.txt')) {
        this.fileType = 'txt';
        await this.loadTxt(file);
      } else if (fileName.endsWith('.doc') || fileName.endsWith('.docx')) {
        this.fileType = fileName.endsWith('.doc') ? 'doc' : 'docx';
        await this.loadWord(file); // Note: This will be a limited implementation
      } else {
        this.fileType = 'unsupported';
        this.statusMessage = 'Unsupported file type. Please select PDF, Word, or TXT.';
        this.isLoading = false;
        msgUtil.msgError(this, this.statusMessage);
      }

      this.applyTouchPreventions(); // Re-apply after content loads
    },

    async loadPdf(file) {
      try {
        const fileReader = new FileReader();
        fileReader.onload = async () => {
          const typedArray = new Uint8Array(fileReader.result);
          this.statusMessage = 'Parsing PDF...';
          const loadingTask = pdfjsLib.getDocument(typedArray);
          this.pdfDoc = await loadingTask.promise;
          this.pdfPageCount = this.pdfDoc.numPages;
          this.currentPage = 1;
          this.pageInput = 1;

          this.statusMessage = 'Rendering PDF...';
          await this.renderCurrentPage();

          this.statusMessage = '';
          this.isLoading = false;
          msgUtil.msgSuccess(this, 'PDF loaded successfully!', 2000);
          this.$nextTick(this.applyTouchPreventions);
        };
        fileReader.readAsArrayBuffer(file);
      } catch (error) {
        console.error('Error loading PDF:', error);
        this.statusMessage = 'Failed to load PDF: ' + error.message;
        this.isLoading = false;
        msgUtil.msgError(this, this.statusMessage, 3000);
      }
    },

    async renderCurrentPage() {
      if (!this.pdfDoc) return;

      const container = document.getElementById('pdf-viewer-container');
      if (!container) {
        console.error('PDF viewer container not found.');
        return;
      }
      container.innerHTML = ''; // Clear previous content

      const page = await this.pdfDoc.getPage(this.currentPage);
      const viewport = page.getViewport({ scale: this.currentScale });

      const pageDiv = document.createElement('div');
      pageDiv.className = 'pdf-page';
      pageDiv.style.width = Math.floor(viewport.width) + 'px';
      pageDiv.style.height = Math.floor(viewport.height) + 'px';
      pageDiv.style.margin = '10px auto';
      pageDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      pageDiv.style.border = '1px solid #e4e7ed';
      pageDiv.style.position = 'relative'; // For text layer positioning

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      pageDiv.appendChild(canvas);
      container.appendChild(pageDiv);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      await page.render(renderContext).promise;

      // Add text layer for selection (crucial for lookup)
      const textContent = await page.getTextContent();
      const textLayerDiv = document.createElement('div');
      textLayerDiv.className = 'text-layer';
      pageDiv.appendChild(textLayerDiv);
      pdfjsLib.renderTextLayer({
        textContentSource: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: [],
      });

      this.renderedPages[this.currentPage] = { page, viewport, canvas, textLayerDiv };
    },

    async loadTxt(file) {
      try {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          this.fileContent = fileReader.result;
          this.statusMessage = '';
          this.isLoading = false;
          msgUtil.msgSuccess(this, 'Text file loaded successfully!', 2000);
          this.$nextTick(this.applyTouchPreventions);
        };
        fileReader.readAsText(file);
      } catch (error) {
        console.error('Error loading TXT:', error);
        this.statusMessage = 'Failed to load TXT: ' + error.message;
        this.isLoading = false;
        msgUtil.msgError(this, this.statusMessage, 3000);
      }
    },

    async loadWord(file) {
      try {
        if (!mammoth) {
          this.statusMessage = 'Mammoth.js not loaded. Cannot extract text from Word document directly.';
          this.isLoading = false;
          msgUtil.msgError(this, this.statusMessage, 3000);
          return;
        }

        const arrayBuffer = await file.arrayBuffer();
        this.statusMessage = 'Extracting text from Word document...';
        // mammoth.extractRawText is simple. For more formatting, use convertToHtml
        const result = await mammoth.extractRawText({ arrayBuffer: arrayBuffer });
        this.fileContent = result.value; // The raw text
        if (result.messages.length) {
          console.warn('Mammoth.js messages:', result.messages);
          msgUtil.msgWarning(this, 'Word document processed with warnings (e.g., formatting loss).', 3000);
        } else {
          msgUtil.msgSuccess(this, 'Word document text extracted successfully!', 2000);
        }
        this.statusMessage = '';
        this.isLoading = false;
        this.$nextTick(this.applyTouchPreventions);
      } catch (error) {
        console.error('Error loading Word document:', error);
        this.statusMessage = 'Failed to load Word document: ' + error.message + '. Full formatting requires server-side conversion.';
        this.isLoading = false;
        msgUtil.msgError(this, this.statusMessage, 5000);
      }
    },

    // PDF Navigation and Zoom Controls
    zoomIn() {
      if (this.currentScale < 3.0) {
        this.currentScale += 0.25;
        this.renderCurrentPage();
      }
    },

    zoomOut() {
      if (this.currentScale > 0.5) {
        this.currentScale -= 0.25;
        this.renderCurrentPage();
      }
    },

    resetZoom() {
      this.currentScale = 1.5;
      this.renderCurrentPage();
    },

    goToPage(pageNumber) {
      if (pageNumber >= 1 && pageNumber <= this.pdfPageCount) {
        this.currentPage = pageNumber;
        this.pageInput = pageNumber;
        this.renderCurrentPage();
      }
    },

    jumpToPage() {
      if (this.pageInput >= 1 && this.pageInput <= this.pdfPageCount) {
        this.currentPage = this.pageInput;
        this.renderCurrentPage();
      } else {
        this.pageInput = this.currentPage; // Reset to current page if invalid
      }
    },

    // Text Selection and Popup
    handleTextSelection(event) {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();

      if (selectedText) {
        this.selectedText = selectedText;
        this.positionPopup(selection, event);
      } else {
        this.closePopup();
      }
    },

    positionPopup(selection, event) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (this.isMobileDevice()) {
        setTimeout(() => selection.removeAllRanges(), 10);
        event.preventDefault(); // Prevent default mobile selection behavior
      }

      this.showSelectionPopup = true;

      this.$nextTick(() => {
        const popup = this.$refs.vocabularyPopup;
        if (popup) {
          const viewportWidth = window.innerWidth;
          const popupWidth = popup.offsetWidth;
          let left = rect.left + (rect.width / 2);

          // Ensure popup stays within viewport horizontally
          left = Math.max(10 + (popupWidth / 2), Math.min(left, viewportWidth - 10 - (popupWidth / 2)));

          popup.style.left = `${left}px`;
          // Position below the selected text, add padding
          popup.style.top = `${rect.bottom + 10}px`;
          popup.style.transform = 'translateX(-50%)'; // Center horizontally
        }
      });

      event.preventDefault(); // Prevent default browser context menu on selection
    },

    navigateToVocabulary() {
      // This method would navigate to your AI lookup page, similar to YoutubePlayer
      const cleanedText = this.selectedText.replace(/\n/g, ' ').trim();
      const encodedText = encodeURIComponent(cleanedText);

      msgUtil.msgSuccess(this, `Searching for "${cleanedText}"...`, 2000);

      // Example navigation (adjust to your actual router path and query params)
      this.$router.push({
        path: '/index/vocabulary/aiResponseDetail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value, // Example constant
          language: getStore({name: kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE}) || kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
          originalText: encodedText,
          docMode: 'reader', // Custom parameter for your vocabulary page
          now: Date.now()
        }
      }).catch(err => {
        if (err.name !== 'NavigationDuplicated') {
          console.error("Router navigation error:", err);
          msgUtil.msgError(this, 'Failed to navigate to lookup.', 2000);
        }
      });

      this.closePopup();
    },

    closePopup() {
      this.showSelectionPopup = false;
      this.selectedText = '';
    },

    handleClickOutside(event) {
      const popup = this.$refs.vocabularyPopup;
      const documentView = document.querySelector('.document-view-panel'); // Target the view area

      // If the popup exists and the click is outside the popup and outside the document view panel
      if (popup && !popup.contains(event.target) && documentView && !documentView.contains(event.target)) {
        this.closePopup();
      }
    },

    // Utilities
    isMobileDevice() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
          (navigator.maxTouchPoints && navigator.maxTouchPoints > 2);
    },

    applyTouchPreventions() {
      this.$nextTick(() => {
        const elements = document.querySelectorAll(
            '.txt-viewer pre, .pdf-viewer-container .text-layer' // Target text-containing elements
        );

        elements.forEach(el => {
          if (el) {
            Object.assign(el.style, {
              webkitTouchCallout: 'none',
              webkitUserSelect: 'text',
              userSelect: 'text'
            });

            el.addEventListener('contextmenu', (e) => {
              if (this.isMobileDevice()) e.preventDefault();
            });
          }
        });
      });
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },

    handleResize() {
      // Re-render current PDF page on resize
      if (this.fileType === 'pdf' && this.pdfDoc) {
        this.renderCurrentPage();
      }
    }
  }
});
</script>

<style scoped>
/* Base styles - Enhanced with better space utilization */
.document-reader {
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* Header - Reduced padding for more space */
.header-container {
  margin: 5px 0;
  padding: 0 15px;
}

.main-title {
  margin: 0;
  padding: 8px 16px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  text-align: center;
  transition: all 0.3s ease;
}

.main-title:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 16px rgba(64, 158, 255, 0.3);
}

.main-title i {
  margin-right: 6px;
  font-size: 14px;
}

/* Input Container - Reduced padding */
.input-container {
  padding: 0 15px 8px;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.file-input-group {
  display: flex;
  align-items: center;
  width: 100%;
  max-width: 1000px;
  gap: 10px;
  background: white;
  padding: 6px 12px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
}

.file-upload-button {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.2);
  flex-shrink: 0;
}

.file-upload-button:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.3);
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 0 5px;
}

.action-btn {
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
}

/* PDF Controls */
.pdf-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 15px;
  background: white;
  border-radius: 8px;
  margin: 0 15px 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e4e7ed;
  gap: 20px;
  flex-wrap: wrap;
}

.zoom-controls, .page-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-display {
  font-size: 13px;
  font-weight: 500;
  color: #606266;
  min-width: 45px;
  text-align: center;
}

.page-info {
  font-size: 13px;
  color: #606266;
  display: flex;
  align-items: center;
  gap: 5px;
  white-space: nowrap;
}

.page-input {
  width: 50px;
  padding: 2px 4px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  text-align: center;
  font-size: 12px;
}

.page-input:focus {
  outline: none;
  border-color: #409eff;
}

/* Status Container - Only shows when loading */
.status-container {
  padding: 15px;
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80px;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  padding: 25px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  max-width: 350px;
  width: 100%;
}

.loading-animation {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.loading-spinner {
  position: relative;
  width: 50px;
  height: 50px;
}

.spinner-ring {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 3px solid transparent;
  border-radius: 50%;
  animation: spin 2s linear infinite;
}

.spinner-ring:nth-child(1) {
  border-top-color: #409eff;
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  border-right-color: #67c23a;
  animation-delay: 0.3s;
  animation-duration: 1.5s;
}

.spinner-ring:nth-child(3) {
  border-bottom-color: #e6a23c;
  animation-delay: 0.6s;
  animation-duration: 1.8s;
}

.loading-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.loading-message {
  font-size: 14px;
  color: #409eff;
  font-weight: 600;
  text-align: center;
}

.loading-dots {
  display: flex;
  gap: 3px;
}

.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #409eff;
  animation: bounce 1.4s infinite ease-in-out;
}

.dot-2 { animation-delay: 0.2s; }
.dot-3 { animation-delay: 0.4s; }

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

.loading-progress {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #f0f2f5;
  border-radius: 2px;
  overflow: hidden;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #409eff, #67c23a, #e6a23c, #409eff);
  background-size: 200% 100%;
  border-radius: 2px;
  animation: progress-flow 2s linear infinite;
  width: 100%;
}

@keyframes progress-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.progress-text {
  font-size: 11px;
  color: #909399;
  text-align: center;
  font-style: italic;
}

/* Content Container - Enhanced for better space utilization */
.content-container {
  margin: 0;
  display: flex;
  flex-direction: column;
  width: 100%;
  height: calc(100vh - 120px); /* Optimized height calculation */
  overflow: hidden;
  padding: 0 15px 15px;
  gap: 0;
  animation: slideIn 0.5s ease-out;
}

.document-view-panel {
  flex: 1;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  width: 95%; /* Use 95% of available width */
  max-width: none; /* Remove max-width restrictions */
  align-self: center; /* Center the panel */
}

/* PDF Viewer - Enhanced for better space usage */
.pdf-viewer {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
}

.pdf-viewer-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 5px;
}

.pdf-page {
  position: relative;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  border: 1px solid #e4e7ed;
  margin: 8px auto;
  background-color: #fff;
  overflow: hidden;
  border-radius: 4px;
  max-width: 100%; /* Ensure it doesn't exceed container */
}

.pdf-page canvas {
  width: 100%;
  height: 100%;
  display: block;
}

/* PDF.js text layer styles - Enhanced for better text selection */
.text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  opacity: 0; /* Hide for production, set to 0.2 for debugging */
  line-height: 1.0;
  font-size: 1px;
  color: transparent; /* Make text invisible but selectable */
  cursor: text;
  -webkit-user-select: text;
  -moz-user-select: text;
  -ms-user-select: text;
  user-select: text;
}

.text-layer > span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  transform-origin: 0% 0%;
}

/* Text Viewer - Enhanced for better space usage */
.txt-viewer {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.txt-viewer pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: 'Courier New', Consolas, monospace;
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  padding: 15px;
  margin: 0;
  width: 100%;
  box-sizing: border-box;
  user-select: text;
  -webkit-user-select: text;
  background: transparent;
}

/* Word Viewer - Enhanced */
.word-viewer-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 20px;
  text-align: center;
  color: #606266;
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.word-viewer-placeholder i {
  font-size: 40px;
  color: #e6a23c;
  margin-bottom: 12px;
}

.word-viewer-placeholder p {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 8px;
  max-width: 600px;
}

.word-viewer-placeholder pre {
  background: #f8f9fa;
  border: 1px solid #e4e7ed;
  padding: 15px;
  border-radius: 6px;
  max-height: 70%;
  overflow-y: auto;
  font-size: 13px;
  white-space: pre-wrap;
  word-wrap: break-word;
  user-select: text;
  -webkit-user-select: text;
  width: 100%;
  box-sizing: border-box;
}

/* No File Selected - Enhanced */
.no-file-selected {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  font-size: 16px;
  padding: 20px;
}

.no-file-selected i {
  font-size: 50px;
  margin-bottom: 15px;
  color: #d3dce6;
}

/* Vocabulary Popup - Enhanced */
.vocabulary-popup {
  position: fixed;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  color: white;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  z-index: 1000;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  white-space: nowrap;
  max-width: 300px;
  text-overflow: ellipsis;
  overflow: hidden;
  width: fit-content;
  display: flex;
  align-items: center;
  gap: 6px;
}

.vocabulary-popup::before {
  content: '';
  position: absolute;
  bottom: 100%;
  left: 50%;
  margin-left: -6px;
  border-width: 6px;
  border-style: solid;
  border-color: transparent transparent #409eff transparent;
}

.vocabulary-popup:hover {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
}

.vocabulary-popup i {
  font-size: 14px;
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Responsive Design - Enhanced for better mobile experience */
@media (max-width: 767px) {
  .header-container {
    margin: 2px 0;
    padding: 0 8px;
  }

  .main-title {
    font-size: 14px;
    padding: 6px 10px;
  }

  .input-container {
    padding: 0 8px 6px;
  }

  .file-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 6px;
    padding: 8px;
  }

  .file-upload-button {
    width: 100%;
    justify-content: center;
    padding: 8px 12px;
    font-size: 12px;
  }

  .file-name {
    text-align: center;
    font-size: 12px;
  }

  .action-btn {
    width: 30px;
    height: 30px;
    font-size: 12px;
    align-self: flex-end;
  }

  .pdf-controls {
    flex-direction: column;
    gap: 8px;
    padding: 8px;
    margin: 0 8px 6px;
  }

  .zoom-controls, .page-controls {
    justify-content: center;
    gap: 6px;
  }

  .zoom-display {
    font-size: 12px;
    min-width: 40px;
  }

  .page-info {
    font-size: 12px;
  }

  .page-input {
    width: 40px;
  }

  .content-container {
    padding: 0 8px 8px;
    height: calc(100vh - 140px);
  }

  .document-view-panel {
    padding: 8px;
    width: 98%;
  }

  .pdf-page {
    margin: 5px auto;
  }

  .vocabulary-popup {
    max-width: 85%;
    padding: 8px 12px;
    font-size: 12px;
  }

  .vocabulary-popup i {
    font-size: 12px;
  }
}

/* Large screens - Enhanced for better space utilization */
@media (min-width: 1200px) {
  .content-container {
    padding: 0 25px 25px;
  }

  .document-view-panel {
    width: 92%;
    padding: 20px;
  }

  .pdf-controls {
    margin: 0 25px 10px;
  }
}

/* Focus styles */
.file-upload-button:focus,
.action-btn:focus,
.page-input:focus {
  outline: 2px solid #409eff;
  outline-offset: 2px;
}

/* High contrast support */
@media (prefers-contrast: high) {
  .main-title,
  .file-upload-button,
  .vocabulary-popup {
    background: #000 !important;
    color: #fff !important;
  }

  .document-view-panel,
  .file-input-group,
  .pdf-controls {
    border: 2px solid #000 !important;
  }
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .progress-fill {
    animation: none;
    background: #409eff;
  }

  .loading-spinner .spinner-ring {
    animation: none;
    border: 3px solid #409eff;
  }
}

/* Print styles */
@media print {
  .header-container,
  .input-container,
  .pdf-controls,
  .vocabulary-popup {
    display: none !important;
  }

  .content-container {
    height: auto !important;
    padding: 0 !important;
  }

  .document-view-panel {
    box-shadow: none !important;
    border: none !important;
  }
}
</style>