<template>
  <div>
    <el-row type="flex" justify="center">
      <el-col>
        <el-autocomplete
            ref="auto"
            :type="getInputType"
            v-model="originalText"
            :style="{width: searchInputWidth}"
            :fetch-suggestions="querySearch"
            placeholder="input anything"
            size="mini"
            :trigger-on-focus="false"
            @keydown.native="handleKeyDown"
            :clearable="true"
            :autosize="true"
            @select="querySelect">
          <el-button slot="prepend"
                     size="mini"
                     v-if="lazy"
                     icon="el-icon-switch-button"
                     @click="closeLazy"></el-button>
          <el-select v-if="!lazy" v-model="selectedMode" slot="prepend"
                     size="mini"
                     :style="selectWidthStyle"
                     @change="selectedModeChange">
            <el-option
                v-for="item in searchModes"
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
          </el-select>
          <el-button slot="append" size="mini" icon="el-icon-search"
                     @click="onSubmit()"></el-button>
        </el-autocomplete>
      </el-col>
    </el-row>



    <el-row>
      <el-select v-if="!ifVocabularyMode" v-model="selectedMode"
                 size="mini"
                 class="select-base mode-select"
                 @change="selectedModeChange">
        <el-option
            v-for="item in searchModes"
            :key="item.value"
            :label="item.label"
            :value="item.value">
        </el-option>
      </el-select>
      <el-select v-if="!ifVocabularyMode" v-model="selectedLanguage" size="mini" placeholder="Select Language"
                 class="select-base language-select" @change="selectedLanguageChange">
        <el-option
            v-for="(code, language) in languageCodes"
            :key="code"
            :label="language.replaceAll('_', ' ')"
            :value="code">
        </el-option>
      </el-select>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-back" type="info" plain
                 size="mini" @click="onBack()"></el-button>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-search" type="info" plain
                 size="mini" @click="onSubmit()"></el-button>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-question" type="info" plain
                 size="mini" @click="explainMore()"></el-button>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <router-view :name="getRouterView"></router-view>
    </el-row>

    <!-- Mode Selection Dialog for Clipboard Content -->
    <el-dialog
        title="Use Copied Text?"
        :visible.sync="showModeSelectionDialog"
        width="30%"
        center>
      <span>
        Do you want to search for: <br>
        <strong>"{{ copiedTextFromClipboard.substring(0, 100) }}{{ copiedTextFromClipboard.length > 100 ? '...' : '' }}"</strong>?
      </span>
      <el-form label-position="top" style="margin-top: 20px;">
        <el-form-item label="Select Search Mode:">
          <el-select v-model="tempSelectedModeForClipboard" placeholder="Select a mode" style="width: 100%;">
            <el-option
                v-for="item in searchModes"
                :key="item.value"
                :label="item.label"
                :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelCopiedTextSearch">Cancel</el-button>
        <el-button type="info" @click="confirmCopiedTextSearch">Search</el-button>
      </span>
    </el-dialog>

    <!-- Mobile Clipboard Access Info Dialog -->
    <el-dialog
        title="Clipboard Access"
        :visible.sync="showClipboardInfoDialog"
        width="90%"
        center>
      <div style="text-align: center;">
        <i class="el-icon-info" style="font-size: 48px; color: #409EFF; margin-bottom: 16px;"></i>
        <p style="margin-bottom: 16px;">To use clipboard content on mobile devices:</p>
        <ol style="text-align: left; display: inline-block;">
          <li>Copy the text you want to search</li>
          <li>Return to this app</li>
          <li>Tap the "Paste from Clipboard" button</li>
          <li>Or manually paste into the search box</li>
        </ol>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showClipboardInfoDialog = false">Got it</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import wordSearch from '@/api/wordSearch'
import kiwiConsts from "@/const/kiwiConsts";
import util from '@/util/util'
import {setStore} from "@/util/store";
import { Notification, Message } from 'element-ui';
import { getLanguageForMode, getInitialSelectedLanguage } from '@/util/langUtil';

const AI_MODES = Object.values(kiwiConsts.SEARCH_AI_MODES).map(mode => mode.value)

export default {
  data() {
    return {
      originalText: this.$route.query.originalText ? decodeURIComponent(this.$route.query.originalText.trim()) : '',
      searchInputWidth: document.body.clientWidth / 1.3 + 'px',
      lazy: this.$route.path.indexOf('lazy') > -1,
      selectedMode: this.$route.query.selectedMode ? decodeURIComponent(this.$route.query.selectedMode) : kiwiConsts.SEARCH_DEFAULT_MODE,
      searchModes: Object.values(kiwiConsts.SEARCH_MODES_DATA),
      selectedLanguage: getInitialSelectedLanguage(this.$route),
      languageCodes: kiwiConsts.TRANSLATION_LANGUAGE_CODE,

      // Clipboard functionality data
      showModeSelectionDialog: false,
      copiedTextFromClipboard: '',
      tempSelectedModeForClipboard: kiwiConsts.SEARCH_DEFAULT_MODE,

      // Mobile-specific data
      isMobile: false,
      pasteButtonLoading: false,
      showClipboardInfoDialog: false,

      // Desktop clipboard notification
      clipboardNotification: null,
    }
  },
  computed: {
    getWindowWidth() {
      return window.innerWidth
    },
    selectWidthStyle() {
      const selectedOption = this.searchModes.find(mode => mode.value === this.selectedMode)
      const width = selectedOption ? selectedOption.width : '140px'
      return {width}
    },
    getRouterView() {
      console.log('getRouterView', this.$route.query.selectedMode)
      let previouslySelectedMode = this.$route?.query?.selectedMode;
      if (util.isEmptyStr(previouslySelectedMode) || previouslySelectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        return kiwiConsts.ROUTER_VIEW_DEFAULT_MODE
      } else {
        return kiwiConsts.ROUTER_VIEW_AI_MODE
      }
    },
    ifVocabularyMode() {
      return util.isEmptyStr(this.$route.query.selectedMode) || this.$route.query.selectedMode === kiwiConsts.SEARCH_DEFAULT_MODE
    },
    getInputType() {
      if (util.isEmptyStr(this.$route.query.selectedMode) || this.$route.query.selectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        return kiwiConsts.INPUT_TYPE.TEXT
      } else {
        console.log('the value of this.$route.query.selectedMode', this.$route.query.selectedMode)
        return kiwiConsts.INPUT_TYPE.TEXTAREA
      }
    },
    disableSuggestions() {
      return !this.ifVocabularyMode;
    }
  },
  mounted() {
    console.log('Search component mounted')
    this.setupClipboardHandling();
  },
  beforeDestroy() {
    this.cleanupClipboardHandling();
  },
  watch: {
    $route: function () {
      this.updateFromRoute()
    },
    selectedMode: function(newMode, oldMode) {
      // Update selected language when mode changes
      if (newMode !== oldMode) {
        this.selectedLanguage = getLanguageForMode(newMode);
      }
    }
  },
  methods: {
    ...wordSearch,

    // Save language setting for current mode
    saveLanguageForMode(mode, language) {
      const modeSpecificKey = mode + '-' + kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE;
      setStore({
        name: modeSpecificKey,
        content: language,
        type: 'local'
      });
    },

    // Device Detection and Setup
    detectMobile() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    },

    async setupClipboardHandling() {
      this.isMobile = this.detectMobile();
      console.log('Device type:', this.isMobile ? 'Mobile' : 'Desktop');

      // Check if Clipboard API is supported
      const hasClipboardAPI = navigator.clipboard && navigator.clipboard.readText;

      if (!hasClipboardAPI) {
        console.warn('Clipboard API not supported');
        return;
      }

      if (this.isMobile) {
        // Mobile: Setup for clipboard access on empty search
        console.log('Mobile device detected - will attempt clipboard access on empty search');
      } else {
        // Desktop: Use automatic detection
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        console.log('Desktop device detected - using automatic clipboard detection');

        // Initial check in case the tab is already visible when mounted
        setTimeout(() => {
          this.handleVisibilityChange();
        }, 1000);
      }
    },

    cleanupClipboardHandling() {
      if (!this.isMobile) {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      }

      // Close any existing notification
      if (this.clipboardNotification) {
        this.clipboardNotification.close();
      }
    },

    // Desktop Clipboard Detection
    async readClipboard() {
      try {
        if (!document.hasFocus()) {
          console.log('Document not focused, attempting to focus...');
          window.focus();
          await new Promise(resolve => setTimeout(resolve, 100));

          if (!document.hasFocus()) {
            console.warn('Document could not be focused for clipboard access');
            return null;
          }
        }

        const text = await navigator.clipboard.readText();
        console.log('Clipboard content read successfully');
        return text;
      } catch (err) {
        console.warn('Failed to read clipboard contents:', err.name, err.message);

        // Handle specific error types
        if (err.name === 'NotAllowedError') {
          console.warn('Clipboard access not allowed - may require user interaction');
        } else if (err.name === 'NotFoundError') {
          console.warn('No clipboard content found');
        }

        return null;
      }
    },

    async handleVisibilityChange() {
      if (document.visibilityState === 'visible' && !this.isMobile) {
        console.log('Tab became visible. Checking clipboard...');

        // Add a small delay to ensure proper focus on tab switch
        await new Promise(resolve => setTimeout(resolve, 200));

        const clipboardContent = await this.readClipboard();

        if (clipboardContent &&
            clipboardContent.trim() !== '' &&
            clipboardContent.trim() !== this.originalText &&
            clipboardContent.length > 0) {

          this.copiedTextFromClipboard = clipboardContent.trim();
          this.tempSelectedModeForClipboard = this.selectedMode;

          // Close any existing notification
          if (this.clipboardNotification) {
            this.clipboardNotification.close();
          }

          this.clipboardNotification = Notification({
            title: 'Clipboard Content Detected',
            message: `Do you want to search for "${this.copiedTextFromClipboard.substring(0, 50)}${this.copiedTextFromClipboard.length > 50 ? '...' : ''}"? Click to proceed.`,
            position: 'top-right',
            duration: 8000,
            showClose: true,
            type: 'info',
            onClick: () => {
              this.showModeSelectionDialog = true;
              this.clipboardNotification.close();
            },
            onClose: () => {
              this.copiedTextFromClipboard = '';
              this.clipboardNotification = null;
            }
          });
        }
      }
    },

    // Dialog Actions
    confirmCopiedTextSearch() {
      this.originalText = this.copiedTextFromClipboard;
      this.selectedMode = this.tempSelectedModeForClipboard;
      // Update selected language for the new mode
      this.selectedLanguage = getLanguageForMode(this.tempSelectedModeForClipboard);
      this.showModeSelectionDialog = false;
      this.copiedTextFromClipboard = '';

      // Close notification if it exists
      if (this.clipboardNotification) {
        this.clipboardNotification.close();
      }

      this.onSubmit();
    },

    cancelCopiedTextSearch() {
      this.showModeSelectionDialog = false;
      this.copiedTextFromClipboard = '';

      // Close notification if it exists
      if (this.clipboardNotification) {
        this.clipboardNotification.close();
      }
    },

    // Existing Methods (keeping all original functionality)
    updateFromRoute() {
      console.log('this.$route', this.$route);
      this.originalText = this.$route.query.originalText ? decodeURIComponent(this.$route.query.originalText) : this.originalText;
      this.lazy = this.$route.path.indexOf('lazy') > -1;
      const newMode = this.$route.query.selectedMode || this.selectedMode;
      if (newMode !== this.selectedMode) {
        this.selectedMode = newMode;
        // selectedLanguage will be updated by the watcher
      }
      // Update language from route if provided, otherwise use mode-specific stored language
      this.selectedLanguage = this.$route.query.language || getLanguageForMode(this.selectedMode);
    },

    querySearch(queryString, callback) {
      if (!util.isEmptyStr(this.$route.query.selectedMode) && this.$route.query.selectedMode !== kiwiConsts.SEARCH_DEFAULT_MODE) {
        console.log('Not default mode')
        callback([])
        return
      }
      let real = queryString.trimLeft();
      if (real === '' || /.*[\u4e00-\u9fa5]+.*$/.test(real)) {
        callback([])
        return
      }
      this.fuzzyQueryWord(real.toLowerCase(), 1, 50).then(response => {
        callback(response.data.data)
      }).catch(e => {
        console.error(e)
      })
    },

    querySelect(item) {
      let real = item.value.trimLeft()
      if (real === '') {
        return
      }
      this.$router.push({
        path: this.$route.path,
        query: {
          active: 'search',
          originalText: encodeURIComponent(real.toLowerCase()),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      })
    },

    selectedModeChange(item) {
      console.log('selectedModeChange', item)
      // Update language for the new mode
      const newLanguage = getLanguageForMode(item);
      console.log('newLanguage', newLanguage)
      this.$router.push({
        path: this.$route.path,
        query: {
          active: 'search',
          selectedMode: item,
          language: newLanguage,
          originalText: encodeURIComponent(this.originalText),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      })
    },

    selectedLanguageChange(item) {
      console.log('selectedLanguageChange', item)
      // Save language setting for current mode
      this.saveLanguageForMode(this.selectedMode, item);

      this.$router.push({
        path: this.$route.path,
        query: {
          active: 'search',
          selectedMode: this.selectedMode,
          language: item,
          originalText: encodeURIComponent(this.originalText),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      })
    },

    onBack() {
      this.selectedMode = kiwiConsts.SEARCH_DEFAULT_MODE
      this.$router.push({
        path: '/index/vocabulary/detail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_DEFAULT_MODE,
          originalText: '',
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      })
    },

    explainMore() {
      let real = this.originalText.trim()
      if (util.isEmptyStr(real)) {
        return
      }
      this.$refs.auto.close()

      const encodedOriginalText = encodeURIComponent(real.toLowerCase())
      this.$router.push({
        path: '/index/vocabulary/aiResponseDetail',
        query: {
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value,
          language: this.selectedLanguage,
          originalText: encodedOriginalText,
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      })
    },

    handleKeyDown(event) {
      if (event.key === 'Enter' && (event.ctrlKey || event.metaKey || event.shiftKey)) {
        if (this.getInputType === kiwiConsts.INPUT_TYPE.TEXTAREA) {
          event.preventDefault();
          const cursorPos = event.target.selectionStart;
          const textBefore = this.originalText.substring(0, cursorPos);
          const textAfter = this.originalText.substring(cursorPos);
          this.originalText = textBefore + '\n' + textAfter;
          this.$nextTick(() => {
            event.target.selectionStart = event.target.selectionEnd = cursorPos + 1;
          });
        }
      }
      else if (event.key === 'Enter' && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        this.onSubmit();
      }
    },

    async onSubmit() {
      let real = this.originalText.trim()

      // If originalText is empty, try to get content from clipboard (especially for mobile)
      if (util.isEmptyStr(real)) {
        console.log('Original text is empty, attempting to read clipboard...');

        try {
          const clipboardContent = await navigator.clipboard.readText();

          if (clipboardContent && clipboardContent.trim() !== '') {
            real = clipboardContent.trim();
            this.originalText = real;
            console.log('Successfully read clipboard content:', real.substring(0, 50) + '...');

            // Show user feedback
            Message({
              message: `Using clipboard content: "${real.substring(0, 50)}${real.length > 50 ? '...' : ''}"`,
              type: 'success',
              duration: 2000
            });
          } else {
            // No clipboard content available
            console.log('No clipboard content found');
            Message({
              message: 'Please enter some text to search or copy text to clipboard first.',
              type: 'warning',
              duration: 3000
            });
            return;
          }
        } catch (err) {
          console.error('Failed to read clipboard:', err);

          let errorMessage = 'Please enter some text to search. ';

          if (err.name === 'NotAllowedError') {
            errorMessage += 'Clipboard access requires permission - please manually enter or paste your text.';
            if (this.isMobile) {
              this.showClipboardInfoDialog = true;
            }
          } else {
            errorMessage += 'Unable to access clipboard content.';
          }

          Message({
            message: errorMessage,
            type: 'warning',
            duration: 4000
          });
          return;
        }
      }

      // At this point, real should have content either from originalText or clipboard
      if (util.isEmptyStr(real)) {
        return;
      }

      this.$refs.auto.close();

      const encodedOriginalText = encodeURIComponent(real.toLowerCase())
      console.log('encodedOriginalText', encodedOriginalText)

      if (AI_MODES.includes(this.selectedMode)) {
        this.$router.push({
          path: '/index/vocabulary/aiResponseDetail',
          query: {
            active: 'search',
            selectedMode: this.selectedMode,
            language: this.selectedLanguage,
            originalText: encodedOriginalText,
            ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
            now: new Date().getTime()
          }
        })
      } else {
        this.$router.push({
          path: '/index/vocabulary/detail',
          query: {
            active: 'search',
            originalText: encodedOriginalText,
            ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
            now: new Date().getTime()
          }
        })
      }
    },

    closeLazy() {
      let queryTmp = {}
      if (this.originalText) {
        queryTmp = {originalText: this.originalText}
      }
      let query = {
        active: 'search',
        ...queryTmp
      }
      this.$router.push({path: '/index/vocabulary/detail', query: query})
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}

/* Base styles for select components */
.select-base {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* Mobile-specific styles */
@media (max-width: 768px) {
  .el-row {
    margin-bottom: 8px;
  }

  .el-dialog {
    width: 95% !important;
  }

  /* Responsive select widths - only applied on mobile screens */
  .mode-select {
    width: 50% !important;
  }

  .language-select {
    width: 40% !important;
  }
}

/* Clipboard info dialog styles */
.el-dialog ol {
  padding-left: 20px;
}

.el-dialog ol li {
  margin-bottom: 8px;
  line-height: 1.5;
}
</style>