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

      // Hotkey mapping for search modes (digit -> mode value)
      modeHotkeys: {},
      // New: fully customizable hotkey bindings (combo string -> mode value)
      hotkeyBindings: {}
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

    // Initialize and attach global hotkeys for switching modes
    this.initModeHotkeys();
    document.addEventListener('keydown', this.handleGlobalHotkeys);
    // React to hotkey mapping changes coming from UserCenter
    window.addEventListener('hotkeys-updated', this.refreshModeHotkeys);
  },
  beforeDestroy() {
    this.cleanupClipboardHandling();
    // Remove global hotkey listener
    document.removeEventListener('keydown', this.handleGlobalHotkeys);
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

    // Re-read mapping from storage after changes in User Center
    refreshModeHotkeys() {
      try {
        this.initModeHotkeys();
        Message({ message: this.$t ? this.$t('messages.operationSuccess') : 'Hotkeys updated', type: 'success', duration: 1000 });
      } catch (_) {}
    },

    // Initialize mode hotkeys from storage or sensible defaults
    initModeHotkeys() {
      try {
        const stored = getStore({ name: kiwiConsts.CONFIG_KEY.SEARCH_MODE_HOTKEYS });
        const legacyDefaults = kiwiConsts.DEFAULT_SEARCH_MODE_HOTKEYS || {};
        const comboDefaults = kiwiConsts.DEFAULT_SEARCH_HOTKEY_BINDINGS || {};

        // Legacy mapping (digit -> mode)
        let legacyMap = {};
        // New combo mapping ("Ctrl+Alt+K" -> mode)
        let comboMap = {};

        if (stored && typeof stored === 'object') {
          const keys = Object.keys(stored);
          const isCombo = keys.some(k => k.includes('+'));
          if (isCombo) {
            comboMap = { ...stored };
          } else {
            // Legacy digits map was saved; keep for backward compatibility
            legacyMap = { ...stored };
          }
        }

        // Fill in defaults without overwriting existing
        legacyMap = { ...legacyDefaults, ...legacyMap };
        comboMap = { ...comboDefaults, ...comboMap };

        this.modeHotkeys = legacyMap;
        this.hotkeyBindings = comboMap;

        // Persist back the union of user overrides and defaults of the same kind
        // Keep the same shape as the stored one to avoid unexpected migration automatically
        setStore({ name: kiwiConsts.CONFIG_KEY.SEARCH_MODE_HOTKEYS, content: stored || comboMap || legacyMap, type: 'local' });

        console.log('[Hotkeys] Initialized legacy map:', legacyMap);
        console.log('[Hotkeys] Initialized combo map:', comboMap);
      } catch (e) {
        console.warn('[Hotkeys] Failed to initialize mapping, using defaults only');
        this.modeHotkeys = { ...(kiwiConsts.DEFAULT_SEARCH_MODE_HOTKEYS || {}) };
        this.hotkeyBindings = { ...(kiwiConsts.DEFAULT_SEARCH_HOTKEY_BINDINGS || {}) };
      }
    },

    // Normalize KeyboardEvent to combo string, e.g., "Ctrl+Shift+1", "Meta+K", "Alt+S"
    normalizeEventToCombo(e) {
      // Ignore if no non-modifier key was pressed
      const key = (e.key || '').toString();
      const isModifierKey = ['Shift', 'Control', 'Alt', 'Meta'].includes(key);
      if (isModifierKey) return null;

      const parts = [];
      if (e.metaKey) parts.push('Meta');
      if (e.ctrlKey) parts.push('Ctrl');
      if (e.altKey) parts.push('Alt');
      if (e.shiftKey) parts.push('Shift');

      // Require at least one modifier to avoid capturing regular typing
      if (parts.length === 0) return null;

      // Map key presentation
      let keyLabel = '';
      if (key.length === 1) {
        keyLabel = key.toUpperCase();
      } else {
        const map = {
          'Escape': 'Esc',
          ' ': 'Space',
          'Spacebar': 'Space',
          'ArrowUp': 'ArrowUp',
          'ArrowDown': 'ArrowDown',
          'ArrowLeft': 'ArrowLeft',
          'ArrowRight': 'ArrowRight',
          'Enter': 'Enter',
          'Tab': 'Tab',
          'Backspace': 'Backspace',
          'Delete': 'Delete',
          'Home': 'Home',
          'End': 'End',
          'PageUp': 'PageUp',
          'PageDown': 'PageDown'
        };
        if (map[key]) keyLabel = map[key];
        else if (/^F\d{1,2}$/.test(key)) keyLabel = key; // function keys
        else if (/^[0-9]$/.test(key)) keyLabel = key; // digits (when key is digit)
        else keyLabel = key.charAt(0).toUpperCase() + key.slice(1);
      }

      // Normalize Numpad digits e.code like Numpad1: when pressing number on numpad, e.key is '1' usually
      // So keyLabel above already handles it as '1'.

      parts.push(keyLabel);
      return parts.join('+');
    },

    // Global hotkeys handler: support fully customizable combos first, then legacy Ctrl/Cmd+Shift+Digit
    handleGlobalHotkeys(e) {
      try {
        // Ignore IME composition
        if (e.isComposing) return;

        // Avoid interfering in inputs/textareas/contentEditable unless strong modifiers are used
        const target = e.target || document.activeElement;
        const tag = (target && target.tagName) ? target.tagName.toLowerCase() : '';
        const isEditable = tag === 'input' || tag === 'textarea' || (target && target.isContentEditable);

        // Build normalized combo and check mapping
        const combo = this.normalizeEventToCombo(e);
        if (combo && this.hotkeyBindings && this.hotkeyBindings[combo]) {
          const mode = this.hotkeyBindings[combo];
          const allowedModes = Object.values(kiwiConsts.SEARCH_MODES_DATA).map(m => m.value);
          if (!allowedModes.includes(mode)) return;

          // If in an editable and only one modifier (Alt) maybe still OK; we already require at least one modifier.
          // Prevent default to avoid side effects
          e.preventDefault();
          e.stopPropagation();

          if (this.selectedMode !== mode) {
            this.selectedModeChange(mode);
            Message({ message: this.$t ? this.$t('messages.switchedModeHotkey', { key: combo }) : `Switched mode: ${mode}`, type: 'success', duration: 1200 });
          }
          return;
        }

        // Legacy behavior: Ctrl/Cmd + Shift + Digit
        if (!e.shiftKey || (!e.ctrlKey && !e.metaKey)) return;

        let digit = null;
        if (/^Digit[0-9]$/.test(e.code)) {
          digit = e.code.slice(5);
        } else if (/^[0-9]$/.test(e.key)) {
          digit = e.key;
        }
        if (digit == null) return;

        const map = this.modeHotkeys || {};
        const mode = map[digit];
        if (!mode) return;

        const allowedModes = Object.values(kiwiConsts.SEARCH_MODES_DATA).map(m => m.value);
        if (!allowedModes.includes(mode)) return;

        e.preventDefault();
        e.stopPropagation();

        if (this.selectedMode !== mode) {
          this.selectedModeChange(mode);
          Message({
            message: this.$t('messages.switchedModeHotkey', { key: `${e.metaKey ? 'Cmd' : 'Ctrl'}+Shift+${digit}` }),
            type: 'success',
            duration: 1200
          });
        }
      } catch (err) {
        console.warn('[Hotkeys] error:', err && err.message);
      }
    },

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
        'phrases-association': 'phrasesAssociation',
        // New modes mapping
        'vocabulary-character-expansion': 'vocabularyCharacterExpansion',
        'ambiguous-association-correction': 'ambiguousAssociationCorrection'
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

      const encodedOriginalText = encodeURIComponent(this.originalText || '');

      // Build common query preserving existing params
      const baseQuery = {
        ...this.$route.query,
        active: 'search',
        selectedMode: item,
        language: newLanguage,
        originalText: encodedOriginalText,
        ytbMode: this.$route.query.ytbMode ? this.$route.query.ytbMode : kiwiConsts.YTB_MODE.CHANNEL,
        now: new Date().getTime()
      };

      // Decide target path based on whether the mode is an AI mode
      if (AI_MODES.includes(item)) {
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