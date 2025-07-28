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
            :placeholder="$t('searchPlaceholders.dictionary')"
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
                :label="$t(`searchModes.${item.labelKey || item.label.toLowerCase().replace(/\s+/g, '')}`)"
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
            :label="$t(`searchModes.${item.labelKey || item.label.toLowerCase().replace(/\s+/g, '')}`)"
            :value="item.value">
        </el-option>
      </el-select>
      <el-select v-if="!ifVocabularyMode" v-model="selectedLanguage" size="mini"
                 :placeholder="$t('common.language')"
                 class="select-base language-select" @change="selectedLanguageChange">
        <el-option
            v-for="(code, language) in languageCodes"
            :key="code"
            :label="$t(`languages.${language.replaceAll('_', ' ')}`)"
            :value="code">
        </el-option>
      </el-select>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-back" type="info" plain
                 size="mini" @click="onBack()" :title="$t('common.back')"></el-button>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-search" type="info" plain
                 size="mini" @click="onSubmit()" :title="$t('common.search')"></el-button>
      <el-button v-if="!ifVocabularyMode" icon="el-icon-question" type="info" plain
                 size="mini" @click="explainMore()" :title="$t('searchModes.explanation')"></el-button>
      <!-- AI History Button -->
      <el-button v-if="!ifVocabularyMode" icon="el-icon-time" type="warning" plain
                 size="mini" @click="viewAiHistory()"
                 :title="$t('ai.aiCallHistory')">
      </el-button>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <router-view :name="getRouterView"></router-view>
    </el-row>

    <!-- Mode Selection Dialog for Clipboard Content -->
    <el-dialog
        :title="$t('login.clipboardAccess')"
        :visible.sync="showModeSelectionDialog"
        width="30%"
        center>
      <span>
        {{ $t('ai.useClipboardContent', { text: copiedTextFromClipboard.substring(0, 100) + (copiedTextFromClipboard.length > 100 ? '...' : '') }) }}
      </span>
      <el-form label-position="top" style="margin-top: 20px;">
        <el-form-item :label="$t('searchModes.selectMode')">
          <el-select v-model="tempSelectedModeForClipboard" :placeholder="$t('searchModes.selectMode')" style="width: 100%;">
            <el-option
                v-for="item in searchModes"
                :key="item.value"
                :label="$t(`searchModes.${item.labelKey || item.label.toLowerCase().replace(/\s+/g, '')}`)"
                :value="item.value">
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelCopiedTextSearch">{{ $t('common.cancel') }}</el-button>
        <el-button type="info" @click="confirmCopiedTextSearch">{{ $t('common.search') }}</el-button>
      </span>
    </el-dialog>

    <!-- Mobile Clipboard Access Info Dialog -->
    <el-dialog
        :title="$t('login.clipboardAccess')"
        :visible.sync="showClipboardInfoDialog"
        width="90%"
        center>
      <div style="text-align: center;">
        <i class="el-icon-info" style="font-size: 48px; color: #409EFF; margin-bottom: 16px;"></i>
        <p style="margin-bottom: 16px;">{{ $t('login.clipboardInstructions.title') }}</p>
        <ol style="text-align: left; display: inline-block;">
          <li>{{ $t('login.clipboardInstructions.step1') }}</li>
          <li>{{ $t('login.clipboardInstructions.step2') }}</li>
          <li>{{ $t('login.clipboardInstructions.step3') }}</li>
          <li>{{ $t('login.clipboardInstructions.step4') }}</li>
        </ol>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button type="primary" @click="showClipboardInfoDialog = false">{{ $t('login.gotIt') }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import wordSearch from '@/api/wordSearch'
import kiwiConsts from "@/const/kiwiConsts";
import util from '@/util/util'
import {setStore, getStore} from "@/util/store";
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
      searchModes: Object.values(kiwiConsts.SEARCH_MODES_DATA).map(mode => ({
        ...mode,
        labelKey: this.getModeTranslationKey(mode.value)
      })),
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
    isSmallScreen() {
      return window.innerWidth < 768
    },
    selectWidthStyle() {
      const selectedOption = this.searchModes.find(mode => mode.value === this.selectedMode)
      const width = selectedOption ? selectedOption.width : '140px'
      return {width}
    },
    getRouterView() {
      console.log('getRouterView - current route path:', this.$route.path)

      if (this.$route.path === '/index/tools/aiCallHistory') {
        console.log('Returning aiCallHistory router view')
        return kiwiConsts.ROUTER_VIEW_AI_HISTORY_MODE
      }

      if (this.$route.path === '/index/tools/aiResponseDetail') {
        console.log('Returning aiResponseDetail router view')
        return kiwiConsts.ROUTER_VIEW_AI_MODE
      }

      // Original logic for other routes
      let previouslySelectedMode = this.$route?.query?.selectedMode;
      if (util.isEmptyStr(previouslySelectedMode) || previouslySelectedMode === kiwiConsts.SEARCH_DEFAULT_MODE) {
        console.log('Returning default router view')
        return kiwiConsts.ROUTER_VIEW_DEFAULT_MODE
      } else {
        console.log('Returning AI mode router view')
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
    },
    // Check if clipboard detection is enabled from user settings
    isClipboardDetectionEnabled() {
      const clipboardDetectionSetting = getStore({ name: kiwiConsts.CONFIG_KEY.CLIPBOARD_DETECTION });
      return clipboardDetectionSetting === kiwiConsts.CLIPBOARD_DETECTION.ENABLE;
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
      console.log('Route changed in Search component:', this.$route.path)
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

    getModeTranslationKey(value) {
      const modeKeys = {
        'detail': 'dictionary',
        'directly-translation': 'directTranslation',
        'translation-and-explanation': 'explanation',
        'grammar-explanation': 'grammarExplanation',
        'grammar-correction': 'grammarCorrection',
        'vocabulary-explanation': 'vocabularyExplanation',
        'synonym': 'synonym',
        'antonym': 'antonym',
        'vocabulary-association': 'vocabularyAssociation',
        'phrases-association': 'phrasesAssociation'
      };
      return modeKeys[value] || value;
    },

    onLanguageChanged(langCode) {
      console.log('Language changed to:', langCode);
      // You can add additional logic here if needed
    },

    // Save language setting for current mode
    saveLanguageForMode(mode, language) {
      const modeSpecificKey = mode + '-' + kiwiConsts.CONFIG_KEY.SELECTED_LANGUAGE;
      setStore({
        name: modeSpecificKey,
        content: language,
        type: 'local'
      });
    },

    // Updated method to navigate to AI History
    viewAiHistory() {
      console.log('Navigating to AI call history')
      this.$router.push({
        path: '/index/tools/aiCallHistory',
        query: {
          active: 'search',
          selectedMode: this.selectedMode,
          language: this.selectedLanguage,
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          now: new Date().getTime()
        }
      });
    },

    // Device Detection and Setup
    detectMobile() {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    },

    async setupClipboardHandling() {
      // Check if clipboard detection is enabled by user setting
      if (!this.isClipboardDetectionEnabled) {
        console.log('Clipboard detection is disabled by user setting');
        return;
      }

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
      // Check if clipboard detection is enabled before proceeding
      if (!this.isClipboardDetectionEnabled) {
        console.log('Clipboard detection disabled, skipping visibility change handling');
        return;
      }

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
            title: this.$t('messages.clipboardContentDetected'),
            message: this.$t('messages.useClipboardContent', {
              text: this.copiedTextFromClipboard.substring(0, 50) + (this.copiedTextFromClipboard.length > 50 ? '...' : '')
            }),
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
      console.log('updateFromRoute - this.$route:', this.$route);
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
        path: '/index/tools/detail',
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
        path: '/index/tools/aiResponseDetail',
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

      // Check if clipboard detection is enabled before trying to read clipboard
      // If originalText is empty, try to get content from clipboard (especially for mobile)
      if (util.isEmptyStr(real) && this.isClipboardDetectionEnabled) {
        console.log('Original text is empty, attempting to read clipboard...');

        try {
          const clipboardContent = await navigator.clipboard.readText();

          if (clipboardContent && clipboardContent.trim() !== '') {
            real = clipboardContent.trim();
            this.originalText = real;
            console.log('Successfully read clipboard content:', real.substring(0, 50) + '...');

            // Show user feedback
            Message({
              message: this.$t('messages.usingClipboardContent', { text: real.substring(0, 50) + (real.length > 50 ? '...' : '') }),
              type: 'success',
              duration: 2000
            });
          } else {
            // No clipboard content available
            console.log('No clipboard content found');
            Message({
              message: this.$t('messages.enterTextToSearch'),
              type: 'warning',
              duration: 3000
            });
            return;
          }
        } catch (err) {
          console.error('Failed to read clipboard:', err);

          let errorMessage = this.$t('messages.enterTextToSearch') + ' ';

          if (err.name === 'NotAllowedError') {
            errorMessage += this.$t('messages.clipboardAccessDenied');
            if (this.isMobile) {
              this.showClipboardInfoDialog = true;
            }
          } else {
            errorMessage += this.$t('messages.unableToAccessClipboard');
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

      // Preserve all existing URL parameters and supplement with search-specific ones
      const baseQuery = {
        ...this.$route.query, // Preserve all existing parameters
        active: 'search',
        originalText: encodedOriginalText,
        selectedMode: this.selectedMode,
        language: this.selectedLanguage,
        ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      }

      if (AI_MODES.includes(this.selectedMode)) {
        this.$router.push({
          path: '/index/tools/aiResponseDetail',
          query: baseQuery
        })
      } else {
        this.$router.push({
          path: '/index/tools/detail',
          query: baseQuery
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
      this.$router.push({path: '/index/tools/detail', query: query})
    }
  }
}
</script>

<style scoped>
.dialog-footer {
  text-align: center;
}

/* Language switcher positioning */
.language-switcher {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* Base styles for select components */
.select-base {
  margin-right: 10px;
  margin-bottom: 10px;
}

/* Consistent Button Styling - Match AiResponseDetail.vue patterns */
.el-button {
  border-radius: 8px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
  padding: 8px 16px !important;
  min-width: 80px !important;
}

/* Primary button styling */
.el-button--primary {
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%) !important;
  color: white !important;
}

.el-button--primary:hover:not(.is-loading) {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

.el-button--primary:focus {
  background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%) !important;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
  color: white !important;
}

/* Info button styling */
.el-button--info {
  background: linear-gradient(135deg, #17a2b8 0%, #20c997 100%) !important;
  color: white !important;
}

.el-button--info:hover:not(.is-loading) {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

.el-button--info:focus {
  background: linear-gradient(135deg, #138496 0%, #1e7e34 100%) !important;
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.3) !important;
  color: white !important;
}

/* Danger button styling */
.el-button--danger {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;
  color: white !important;
}

.el-button--danger:hover:not(.is-loading) {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4) !important;
  color: white !important;
}

.el-button--danger:focus {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 0 0 2px rgba(245, 101, 101, 0.3) !important;
  color: white !important;
}

/* Warning button styling */
.el-button--warning {
  background: linear-gradient(135deg, #e6a23c 0%, #f7ba2a 100%) !important;
  color: white !important;
}

.el-button--warning:hover:not(.is-loading) {
  background: linear-gradient(135deg, #d9963b 0%, #f0b027 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(230, 162, 60, 0.3) !important;
  color: white !important;
}

.el-button--warning:focus {
  background: linear-gradient(135deg, #d9963b 0%, #f0b027 100%) !important;
  box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.3) !important;
  color: white !important;
}

/* Default button styling */
.el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--danger):not(.el-button--warning) {
  background: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
  color: #6c757d !important;
}

.el-button:not(.el-button--primary):not(.el-button--info):not(.el-button--danger):not(.el-button--warning):hover:not(.is-loading) {
  background: #e9ecef !important;
  border-color: #dee2e6 !important;
  color: #495057 !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

/* Loading state styling */
.el-button.is-loading {
  transform: none !important;
  opacity: 0.8;
}

/* Active state */
.el-button:active {
  transform: translateY(0px) !important;
}

/* History button specific styling - override with danger gradient */
.el-button[title*="History"] {
  background: linear-gradient(135deg, #f56565 0%, #e53e3e 100%) !important;
  color: white !important;
  border: none !important;
  transition: all 0.3s ease !important;
}

.el-button[title*="History"]:hover {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(245, 101, 101, 0.4) !important;
  color: white !important;
}

.el-button[title*="History"]:focus {
  background: linear-gradient(135deg, #e53e3e 0%, #c53030 100%) !important;
  box-shadow: 0 0 0 2px rgba(245, 101, 101, 0.3) !important;
  color: white !important;
}

/* Dialog footer button styling */
.dialog-footer .el-button {
  margin: 0 8px !important;
  padding: 12px 24px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  border-radius: 8px !important;
  min-width: 140px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.dialog-footer .el-button:hover {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.dialog-footer .el-button:active {
  transform: translateY(0px) !important;
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

  .language-switcher {
    margin-right: 5px;
  }
  
  /* Button responsive layout for small screens */
  .el-row:nth-child(2) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }
  
  .el-row:nth-child(2) .el-select {
    flex: 1 1 auto;
    min-width: 120px;
    margin-right: 0;
    margin-bottom: 8px;
  }
  
  .el-row:nth-child(2) .el-button {
    flex: 0 0 auto;
    margin-right: 0;
    margin-bottom: 8px;
    min-width: 80px;
  }

  /* Mobile button adjustments */
  .el-button {
    padding: 10px 16px !important;
    min-width: 120px !important;
  }

  .dialog-footer .el-button {
    margin: 8px 4px !important;
    min-width: 120px !important;
    padding: 10px 16px !important;
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