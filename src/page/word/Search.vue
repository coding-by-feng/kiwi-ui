<template>
  <div>
    <el-row type="flex" justify="center">
      <el-col>
        <el-autocomplete
            id="search-input"
            ref="auto"
            :type="getInputType"
            v-model="originalText"
            :fetch-suggestions="querySearch"
            :placeholder="$t('searchPlaceholders.dictionary')"
            size="mini"
            :trigger-on-focus="false"
            @keydown.native="handleKeyDown"
            :clearable="true"
            :autosize="true"
            @select="querySelect">
          <template #prefix>
            <el-button
              v-if="lazy"
              size="mini"
              icon="el-icon-switch-button"
              @click="closeLazy"
              style="border:none;background:transparent"></el-button>
            <el-select v-if="!lazy" id="mode-select-prepend" v-model="selectedMode"
                       size="mini"
                       :style="selectWidthStyle"
                       :class="{ 'ai-mode-text': isAiModeSelected }"
                       @change="selectedModeChange">
              <el-option
                  v-for="item in searchModes"
                  :key="item.value"
                  :label="getModeLabel(item)"
                  :value="item.value">
              </el-option>
            </el-select>
          </template>
          <template #suffix>
            <el-button id="search-submit-btn" size="mini" icon="el-icon-search" @click="onSubmit()"></el-button>
          </template>
        </el-autocomplete>
      </el-col>
    </el-row>

    <el-row>
      <el-select v-if="!ifVocabularyMode" v-model="selectedMode"
                 size="mini"
                 id="mode-select"
                 class="select-base mode-select"
                 :class="{ 'ai-mode-text': isAiModeSelected }"
                 @change="selectedModeChange">
        <el-option
            v-for="item in searchModes"
            :key="item.value"
            :label="getModeLabel(item)"
            :value="item.value">
        </el-option>
      </el-select>
      <el-select v-if="!ifVocabularyMode" v-model="selectedLanguage" size="mini"
                 :placeholder="$t('common.language')"
                 id="language-select"
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
      <el-button v-if="!ifVocabularyMode" id="ai-history-btn" icon="el-icon-time" type="warning" plain
                 size="mini" @click="viewAiHistory()"
                 :title="$t('ai.aiCallHistory')">
      </el-button>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <keep-alive>
        <router-view :name="getRouterView"></router-view>
      </keep-alive>
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
import messageCenter from '@/util/msg';
import { getLanguageForMode, getInitialSelectedLanguage } from '@/util/langUtil';

const AI_MODES = Object.values(kiwiConsts.SEARCH_AI_MODES).map(mode => mode.value)

export default {
  data() {
    return {
      originalText: this.$route.query.originalText ? decodeURIComponent(this.$route.query.originalText.trim()) : '',
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

      // Remove renderer hotkeys state
      userHotkeysEnabled: false
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

      if (this.$route.path === kiwiConsts.ROUTES.AI_CALL_HISTORY) {
        console.log('Returning aiCallHistory router view')
        return kiwiConsts.ROUTER_VIEW_AI_HISTORY_MODE
      }

      if (this.$route.path === kiwiConsts.ROUTES.AI_RESPONSE_DETAIL) {
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
    },
    isAiModeSelected() {
      try {
        const aiValues = Object.values(require('@/const/kiwiConsts').default.SEARCH_AI_MODES).map(m => m.value)
        return aiValues.includes(this.selectedMode)
      } catch (e) {
        return false
      }
    }
  },
  mounted() {
    console.log('Search component mounted')
    this.setupClipboardHandling();

    // Do NOT bind renderer keydown listeners; global hotkeys are handled in Electron main
    window.addEventListener('hotkeys-updated', () => {
      messageCenter.success({
        message: this.$t ? this.$t('messages.operationSuccess') : 'Hotkeys updated',
        duration: 1000
      })
    })
  },
  beforeDestroy() {
    this.cleanupClipboardHandling();
    window.removeEventListener('hotkeys-updated', this.refreshModeHotkeys);
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
    // Added getModeLabel method
    getModeLabel(item) {
      // Accept either a mode object or a raw mode value string
      try {
        const isObj = item && typeof item === 'object'
        const value = isObj ? item.value : item
        const labelRaw = isObj ? item.label : null
        const key = isObj && item.labelKey
          ? item.labelKey
          : (labelRaw ? labelRaw.toLowerCase().replace(/\s+/g, '') : (value || ''))
        let translated = (this.$t && key) ? this.$t(`searchModes.${key}`) : ''
        if (!translated || translated === `searchModes.${key}`) {
          translated = labelRaw || value || key || ''
        }
        return translated
      } catch (e) {
        return (item && item.label) || (item && item.value) || String(item || '')
      }
    },

    getModeTranslationKey(value) {
      // Reuse centralized mapping from kiwiConsts to avoid duplication
      return kiwiConsts.MODE_TRANSLATION_KEYS[value] || value;
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

    getNativeLanguage() {
      const routeNative = this.$route?.query?.nativeLanguage
      if (!util.isEmptyStr(routeNative)) {
        return routeNative
      }
      const stored = getStore({ name: kiwiConsts.CONFIG_KEY.NATIVE_LANG })
      if (!util.isEmptyStr(stored)) {
        return stored
      }
      return kiwiConsts.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
    },

    navigateIfChanged(target, { ignoreKeys = ['now'] } = {}) {
      try {
        const current = { path: this.$route.path, query: { ...this.$route.query } }
        const targetQuery = { ...target.query }
        // Remove ignored transient keys before comparison
        ignoreKeys.forEach(k => { if (current.query[k] !== undefined) delete current.query[k]; if (targetQuery[k] !== undefined) delete targetQuery[k] })
        const samePath = current.path === target.path
        const keys = new Set([...Object.keys(current.query), ...Object.keys(targetQuery)])
        let sameQuery = true
        keys.forEach(k => { if (String(current.query[k] || '') !== String(targetQuery[k] || '')) sameQuery = false })
        if (samePath && sameQuery) return // Idempotent: do nothing
        // Prefer replace to avoid history spam
        this.$router.replace(target)
      } catch (e) {
        console.warn('navigateIfChanged failed, falling back to push', e)
        this.$router.push(target)
      }
    },

    // Updated method to navigate to AI History
    viewAiHistory() {
      console.log('Navigating to AI call history')
      const target = {
        path: kiwiConsts.ROUTES.AI_CALL_HISTORY,
        query: {
          active: 'search',
          selectedMode: this.selectedMode,
          language: this.selectedLanguage,
          nativeLanguage: this.getNativeLanguage(),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
          originalText: this.$route.query.originalText || '',
          now: new Date().getTime()
        }
      }
      this.navigateIfChanged(target)
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

          this.clipboardNotification = messageCenter.popupInfo({
            title: this.$t('messages.clipboardContentDetected'),
            message: this.$t('messages.useClipboardContent', {
              text: this.copiedTextFromClipboard.substring(0, 50) + (this.copiedTextFromClipboard.length > 50 ? '...' : '')
            }),
            duration: 8000,
            onClick: () => {
              this.showModeSelectionDialog = true;
              this.clipboardNotification && this.clipboardNotification.close();
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
      }
      // Normalize mode if not found in searchModes (recent bug: blank label)
      const exists = this.searchModes.some(m => m.value === this.selectedMode);
      if (!exists) {
        // Default to direct translation for AI context, else dictionary
        const direct = require('@/const/kiwiConsts').default.SEARCH_AI_MODES.DIRECTLY_TRANSLATION.value;
        const dictionary = require('@/const/kiwiConsts').default.SEARCH_DEFAULT_MODE;
        this.selectedMode = this.$route.path === require('@/const/kiwiConsts').default.ROUTES.AI_RESPONSE_DETAIL ? direct : dictionary;
      }
      // Update language
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
      // Single-step, idempotent navigation to Search with selected text only
      const target = {
        path: this.$route.path,
        query: {
          ...this.$route.query,
          active: 'search',
          originalText: encodeURIComponent(real),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL
        }
      }
      if (this.$route.path !== target.path || JSON.stringify(this.$route.query) !== JSON.stringify(target.query)) {
        this.$router.replace(target)
      }
    },

    selectedModeChange(item) {
      console.log('selectedModeChange', item)
      const newLanguage = getLanguageForMode(item)
      const encodedOriginalText = encodeURIComponent(this.originalText || '')
      const baseQuery = {
        ...this.$route.query,
        active: 'search',
        selectedMode: item,
        language: newLanguage,
        nativeLanguage: this.getNativeLanguage(),
        originalText: encodedOriginalText,
        ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL
      }
      const isAi = AI_MODES.includes(item)
      const target = isAi
        ? { path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query: baseQuery }
        : { path: kiwiConsts.ROUTES.DETAIL, query: baseQuery }
      this.navigateIfChanged(target)
    },

    selectedLanguageChange(item) {
      console.log('selectedLanguageChange', item)
      this.saveLanguageForMode(this.selectedMode, item)
      const target = {
        path: this.$route.path,
        query: {
          ...this.$route.query,
          active: 'search',
          selectedMode: this.selectedMode,
          language: item,
          nativeLanguage: this.getNativeLanguage(),
          originalText: encodeURIComponent(this.originalText),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL
        }
      }
      this.navigateIfChanged(target)
    },

    onBack() {
      this.selectedMode = kiwiConsts.SEARCH_DEFAULT_MODE
      const target = {
        path: kiwiConsts.ROUTES.DETAIL,
        query: {
          ...this.$route.query,
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_DEFAULT_MODE,
          originalText: '',
          nativeLanguage: this.getNativeLanguage(),
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL
        }
      }
      this.navigateIfChanged(target)
    },

    explainMore() {
      let real = this.originalText.trim()
      if (util.isEmptyStr(real)) return
      this.$refs.auto.close()
      const encodedOriginalText = encodeURIComponent(real)
      const target = {
        path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL,
        query: {
          ...this.$route.query,
          active: 'search',
          selectedMode: kiwiConsts.SEARCH_AI_MODES.TRANSLATION_AND_EXPLANATION.value,
          language: this.selectedLanguage,
          nativeLanguage: this.getNativeLanguage(),
          originalText: encodedOriginalText,
          ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL
        }
      }
      this.navigateIfChanged(target)
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
            messageCenter.success({
              message: this.$t('messages.usingClipboardContent', { text: real.substring(0, 50) + (real.length > 50 ? '...' : '') }),
              duration: 2000
            });
          } else {
            // No clipboard content available
            console.log('No clipboard content found');
            messageCenter.warning({
              message: this.$t('messages.enterTextToSearch'),
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

          messageCenter.warning({
            message: errorMessage,
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

      const encodedOriginalText = encodeURIComponent(real)
      console.log('encodedOriginalText', encodedOriginalText)

      // Preserve all existing URL parameters and supplement with search-specific ones
      const baseQuery = {
        ...this.$route.query, // Preserve all existing parameters
        active: 'search',
        originalText: encodedOriginalText,
        selectedMode: this.selectedMode,
        language: this.selectedLanguage,
        nativeLanguage: this.getNativeLanguage(),
        ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      }

      const isAi = AI_MODES.includes(this.selectedMode)
      const target = isAi
        ? { path: kiwiConsts.ROUTES.AI_RESPONSE_DETAIL, query: baseQuery }
        : { path: kiwiConsts.ROUTES.DETAIL, query: baseQuery }
      this.navigateIfChanged(target, { ignoreKeys: ['now'] })
    },

    closeLazy() {
      let queryTmp = {}
      if (this.originalText) {
        queryTmp = { originalText: this.originalText }
      }
      const target = {
        path: kiwiConsts.ROUTES.DETAIL,
        query: {
          active: 'search',
          nativeLanguage: this.getNativeLanguage(),
          ...queryTmp
        }
      }
      this.navigateIfChanged(target)
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

/* Force white font color when AI mode is selected */
.ai-mode-text ::v-deep(.el-input__inner) {
  color: #ffffff !important;
}

/* Clipboard info dialog styles */
.el-dialog ol {
  padding-left: 20px;
}

.el-dialog ol li {
  margin-bottom: 8px;
  line-height: 1.5;
}

/* History button styling */
.el-button[title*="History"] {
  transition: all 0.3s ease;
}

.el-button[title*="History"]:hover {
  background-color: #f56c6c;
  border-color: #f56c6c;
  color: white;
}
</style>
