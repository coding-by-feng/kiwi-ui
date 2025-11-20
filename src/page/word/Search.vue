<template>
  <div>
    <el-row type="flex" justify="center" class="search-main-row">
      <el-col>
        <div class="search-input-wrapper" :class="{ 'mobile-layout': isSmallScreen }" :style="{width: searchInputWidth, margin: '0 auto', position: 'relative'}">
          
          <!-- Mobile Row 1: Mode Selection -->
          <div v-if="isSmallScreen" class="mobile-row mode-row">
             <KiwiDropdown v-if="!lazy" @command="selectedModeChange" class="mode-dropdown mobile-full-width">
               <div class="mode-select-trigger mobile-trigger" :class="{ 'ai-mode-text': isAiModeSelected }">
                 {{ getModeLabel(selectedMode) }} <i class="el-icon-arrow-down"></i>
               </div>
               <template slot="dropdown">
                 <KiwiDropdownItem v-for="item in searchModes" :key="item.value" :command="item.value">
                   {{ $t(`searchModes.${item.labelKey || item.label.toLowerCase().replace(/\s+/g, '')}`) }}
                 </KiwiDropdownItem>
               </template>
             </KiwiDropdown>
             <KiwiButton v-else size="small" icon="el-icon-switch-button" @click="closeLazy" plain class="mobile-full-width">Exit Lazy Mode</KiwiButton>
          </div>

          <!-- Row 2 (Mobile) / Main (Desktop): Input -->
          <div class="input-row">
            <KiwiInput
                id="search-input"
                ref="auto"
                :type="getInputType"
                v-model="originalText"
                :placeholder="$t('searchPlaceholders.dictionary')"
                @keydown.native="handleKeyDown"
                :clearable="true"
                @input="handleInput"
                @focus="handleFocus"
                @blur="handleBlur"
                @append-click="onSubmit"
                @prepend-click="handlePrependClick"
                class="main-search-input"
            >
              <!-- Prepend Slot (Desktop Only) -->
              <template slot="prepend" v-if="!isSmallScreen">
                 <KiwiButton v-if="lazy" size="mini" icon="el-icon-switch-button" @click.stop="closeLazy" plain style="border:none; padding: 0 10px;"></KiwiButton>
                 <KiwiDropdown v-else ref="modeDropdown" @command="selectedModeChange" class="mode-dropdown">
                   <div class="mode-select-trigger" :style="selectWidthStyle" :class="{ 'ai-mode-text': isAiModeSelected }">
                     {{ getModeLabel(selectedMode) }} <i class="el-icon-arrow-down"></i>
                   </div>
                   <template slot="dropdown">
                     <KiwiDropdownItem v-for="item in searchModes" :key="item.value" :command="item.value">
                       {{ $t(`searchModes.${item.labelKey || item.label.toLowerCase().replace(/\s+/g, '')}`) }}
                     </KiwiDropdownItem>
                   </template>
                 </KiwiDropdown>
              </template>
              
              <!-- Append Slot (Desktop Only) -->
              <template slot="append" v-if="!isSmallScreen">
                 <KiwiButton id="search-submit-btn" size="mini" icon="el-icon-search" plain style="border:none; padding: 0 10px; pointer-events: none;"></KiwiButton>
              </template>
            </KiwiInput>
          </div>

          <!-- Mobile Row 3: Language Selection -->
          <div v-if="isSmallScreen && !ifVocabularyMode" class="mobile-row language-row">
             <KiwiDropdown @command="selectedLanguageChange" class="mobile-full-width">
               <div class="mobile-trigger">
                 {{ getLanguageLabel(selectedLanguage) }} <i class="el-icon-arrow-down"></i>
               </div>
               <template slot="dropdown">
                 <KiwiDropdownItem v-for="(code, language) in languageCodes" :key="code" :command="code">
                   {{ $t(`languages.${language.replaceAll('_', ' ')}`) }}
                 </KiwiDropdownItem>
               </template>
             </KiwiDropdown>
          </div>

          <!-- Mobile Row 4: Submit Button -->
          <div v-if="isSmallScreen" class="mobile-row submit-row">
            <KiwiButton type="primary" @click="onSubmit" class="mobile-submit-btn" icon="el-icon-search">
              {{ $t('common.search') }}
            </KiwiButton>
          </div>
          
          <!-- Suggestions Dropdown -->
          <transition name="el-zoom-in-top">
            <div v-if="suggestionsVisible && suggestions.length > 0" class="search-suggestions">
               <div v-for="(item, index) in suggestions" :key="index" class="suggestion-item" @click="querySelect(item)">
                 {{ item.value }}
               </div>
            </div>
          </transition>
        </div>
      </el-col>
    </el-row>

    <el-row class="search-actions-row" v-if="!ifVocabularyMode && !isSmallScreen">


      <KiwiDropdown @command="selectedLanguageChange" class="action-item">
         <KiwiButton size="mini" plain class="language-select-btn">
           {{ getLanguageLabel(selectedLanguage) }} <i class="el-icon-arrow-down"></i>
         </KiwiButton>
         <template slot="dropdown">
           <KiwiDropdownItem v-for="(code, language) in languageCodes" :key="code" :command="code">
             {{ $t(`languages.${language.replaceAll('_', ' ')}`) }}
           </KiwiDropdownItem>
         </template>
      </KiwiDropdown>
    </el-row>
    <el-divider></el-divider>
    <el-row justify="center">
      <keep-alive>
        <router-view :name="getRouterView"></router-view>
      </keep-alive>
    </el-row>

    <!-- Mode Selection Dialog for Clipboard Content -->
    <KiwiDialog
        :title="$t('login.clipboardAccess')"
        :visible.sync="showModeSelectionDialog"
        width="400px"
        center>
      <span>
        {{ $t('ai.useClipboardContent', { text: copiedTextFromClipboard.substring(0, 100) + (copiedTextFromClipboard.length > 100 ? '...' : '') }) }}
      </span>
      <div style="margin-top: 20px;">
        <div style="margin-bottom: 10px; font-size: 14px; color: var(--text-secondary);">{{ $t('searchModes.selectMode') }}</div>
        <KiwiDropdown @command="(val) => tempSelectedModeForClipboard = val" style="width: 100%;">
           <KiwiButton style="width: 100%; justify-content: space-between;">
             {{ getModeLabel(tempSelectedModeForClipboard) }} <i class="el-icon-arrow-down"></i>
           </KiwiButton>
           <template slot="dropdown">
             <KiwiDropdownItem v-for="item in searchModes" :key="item.value" :command="item.value">
               {{ getModeLabel(item) }}
             </KiwiDropdownItem>
           </template>
        </KiwiDropdown>
      </div>
      <span slot="footer" class="dialog-footer">
        <KiwiButton @click="cancelCopiedTextSearch">{{ $t('common.cancel') }}</KiwiButton>
        <KiwiButton type="primary" @click="confirmCopiedTextSearch">{{ $t('common.search') }}</KiwiButton>
      </span>
    </KiwiDialog>

    <!-- Mobile Clipboard Access Info Dialog -->
    <KiwiDialog
        :title="$t('login.clipboardAccess')"
        :visible.sync="showClipboardInfoDialog"
        width="90%"
        center>
      <div style="text-align: center;">
        <i class="el-icon-info" style="font-size: 48px; color: var(--color-primary); margin-bottom: 16px;"></i>
        <p style="margin-bottom: 16px;">{{ $t('login.clipboardInstructions.title') }}</p>
        <ol style="text-align: left; display: inline-block;">
          <li>{{ $t('login.clipboardInstructions.step1') }}</li>
          <li>{{ $t('login.clipboardInstructions.step2') }}</li>
          <li>{{ $t('login.clipboardInstructions.step3') }}</li>
          <li>{{ $t('login.clipboardInstructions.step4') }}</li>
        </ol>
      </div>
      <span slot="footer" class="dialog-footer">
        <KiwiButton type="primary" @click="showClipboardInfoDialog = false">{{ $t('login.gotIt') }}</KiwiButton>
      </span>
    </KiwiDialog>
  </div>
</template>

<script>
import wordSearch from '@/api/wordSearch'
import kiwiConsts from "@/const/kiwiConsts";
import util from '@/util/util'
import {setStore, getStore} from "@/util/store";
import messageCenter from '@/util/msg';
import { getLanguageForMode, getInitialSelectedLanguage } from '@/util/langUtil';
import KiwiInput from '@/components/ui/KiwiInput';
import KiwiButton from '@/components/ui/KiwiButton';
import KiwiDropdown from '@/components/ui/KiwiDropdown';
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem';
import KiwiDialog from '@/components/ui/KiwiDialog';

const AI_MODES = Object.values(kiwiConsts.SEARCH_AI_MODES).map(mode => mode.value)

export default {
  components: {
    KiwiInput,
    KiwiButton,
    KiwiDropdown,
    KiwiDropdownItem,
    KiwiDialog
  },
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
      
      // Custom Autocomplete
      suggestions: [],
      suggestionsVisible: false,
      debounceTimer: null,
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
      if (this.isSmallScreen) {
        return { width: 'auto', minWidth: '80px', maxWidth: '110px' }
      }
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
    // Auto-focus the search input once mounted
    this.focusSearchInput();
    // Always listen for tab visibility changes to re-focus input (independent of clipboard detection)
    document.addEventListener('visibilitychange', this.handleVisibilityFocus);
    // Added: window focus & pageshow for browsers where visibility doesn't fire (Safari / dialogs)
    window.addEventListener('focus', this.handleWindowFocus);
    window.addEventListener('pageshow', this.handleWindowFocus);
  },
  beforeDestroy() {
    this.cleanupClipboardHandling();
    document.removeEventListener('visibilitychange', this.handleVisibilityFocus);
    window.removeEventListener('focus', this.handleWindowFocus);
    window.removeEventListener('pageshow', this.handleWindowFocus);
  },
  activated() {
    // Re-focus when component is reactivated (keep-alive)
    setTimeout(() => {
      this.focusSearchInput();
    }, 200);
  },
  watch: {
    $route: function () {
      console.log('Route changed in Search component:', this.$route.path)
      this.updateFromRoute()
      // Re-focus input after route-driven updates so users can paste/type immediately
      this.focusSearchInput();
    },
    selectedMode: function(newMode, oldMode) {
      // Update selected language when mode changes
      if (newMode !== oldMode) {
        this.selectedLanguage = getLanguageForMode(newMode);
        this.focusSearchInput();
      }
    }
  },
  methods: {
    ...wordSearch,
    // Added: focus helper to reliably target inner input of el-autocomplete
    focusSearchInput() {
      this.$nextTick(() => {
        const auto = this.$refs.auto
        if (auto) {
          // Try using the component's exposed focus method first
          if (typeof auto.focus === 'function') {
            auto.focus()
          } else {
            // Fallback: query the native input/textarea inside the component root
            const root = auto.$el || auto
            const inputEl = root && root.querySelector ? root.querySelector('input, textarea') : document.querySelector('#search-input input, #search-input textarea')
            if (inputEl && typeof inputEl.focus === 'function') {
              inputEl.focus()
            }
          }
        }
      })
    },

    // New: simple visibility focus handler (separated from clipboard logic)
    handleVisibilityFocus() {
      if (document.visibilityState === 'visible' && !this.isMobile) {
        setTimeout(() => {
          this.focusSearchInput();
        }, 50);
      }
    },
    // New: window focus/pageshow handler (covers cases where visibilitychange does not fire)
    handleWindowFocus() {
      // Guard: avoid stealing focus if user is currently typing elsewhere (e.g., modal input)
      const active = document.activeElement;
      const searchWrapper = this.$refs.auto && (this.$refs.auto.$el || this.$refs.auto);
      if (active && searchWrapper && searchWrapper.contains(active)) {
        return; // Already focused inside search component
      }
      // Short delay allows any route activation / transitions to finish
      setTimeout(() => {
        this.focusSearchInput();
      }, 100);
    },

    // Added getModeLabel method
    getModeLabel(item) {
      // If item is a string, try to resolve it to an object from searchModes
      if (typeof item === 'string') {
        const found = this.searchModes.find(m => m.value === item)
        if (found) item = found
      }

      // Accept either a mode object or a raw mode value string
      try {
        const isObj = item && typeof item === 'object'
        const value = isObj ? item.value : item
        const labelRaw = isObj ? item.label : null
        const key = isObj && item.labelKey
          ? item.labelKey
          : (labelRaw ? labelRaw.toLowerCase().replace(/\s+/g, '') : (value || ''))
        let translated = (this.$t && key) ? this.$t(`searchModes.${key}`) : ''
        
        // If translation is missing or returns the key, fallback to formatted value
        if (!translated || translated === `searchModes.${key}`) {
          const text = labelRaw || value || key || ''
          // Replace hyphens/underscores with spaces and capitalize words
          return text.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        }
        return translated
      } catch (e) {
        return String(item || '')
      }
    },

    getLanguageLabel(code) {
      const entry = Object.entries(this.languageCodes).find(([key, value]) => value === code);
      if (entry) {
        const key = entry[0];
        // Use the same logic as the dropdown items
        return this.$t(`languages.${key.replaceAll('_', ' ')}`);
      }
      return code;
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
      // Always attempt focus when tab becomes visible (desktop)
      if (document.visibilityState === 'visible' && !this.isMobile) {
        this.focusSearchInput();
      }
      // Clipboard detection gating logic preserved
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

    handleInput(value) {
      this.originalText = value;
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.fetchSuggestions(value);
      }, 300);
    },

    handleFocus() {
      if (this.originalText) {
        this.fetchSuggestions(this.originalText);
      }
    },

    handleBlur() {
      setTimeout(() => {
        this.suggestionsVisible = false;
      }, 200);
    },

    fetchSuggestions(queryString) {
      if (!util.isEmptyStr(this.$route.query.selectedMode) && this.$route.query.selectedMode !== kiwiConsts.SEARCH_DEFAULT_MODE) {
        this.suggestions = [];
        this.suggestionsVisible = false;
        return;
      }
      let real = queryString ? queryString.trimLeft() : '';
      if (real === '' || /.*[\u4e00-\u9fa5]+.*$/.test(real)) {
        this.suggestions = [];
        this.suggestionsVisible = false;
        return;
      }
      this.fuzzyQueryWord(real.toLowerCase(), 1, 50).then(response => {
        this.suggestions = response.data.data;
        this.suggestionsVisible = this.suggestions.length > 0;
      }).catch(e => {
        console.error(e);
        this.suggestions = [];
        this.suggestionsVisible = false;
      });
    },

    querySelect(item) {
      let real = item.value.trimLeft()
      if (real === '') {
        return
      }
      this.originalText = real;
      this.suggestionsVisible = false;
      
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
      
      // Re-focus after mode change (dropdown click can steal focus)
      // Try multiple times to catch various render/navigation states
      this.$nextTick(() => {
        this.focusSearchInput()
        setTimeout(() => this.focusSearchInput(), 100)
        setTimeout(() => this.focusSearchInput(), 300)
      })
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

    handlePrependClick() {
      if (this.lazy) {
        this.closeLazy()
      } else {
        const dropdown = this.$refs.modeDropdown
        if (dropdown && typeof dropdown.toggle === 'function') {
          dropdown.toggle()
        }
      }
    },

    explainMore() {
      let real = this.originalText.trim()
      if (util.isEmptyStr(real)) return
      this.suggestionsVisible = false;
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

      this.suggestionsVisible = false;

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
      this.navigateIfChanged(target, { ignoreKeys: [] })
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
/* --- existing styles start --- */
/* --- existing styles start --- */
.dialog-footer {
  text-align: center;
}

.search-input-wrapper {
  position: relative;
  margin: 0 auto;
  transition: all 0.3s ease;
}

.search-input-wrapper.mobile-layout {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 95% !important; /* Override inline style on mobile */
  max-width: 400px;
}

.mobile-row {
  width: 100%;
}

.mobile-full-width {
  width: 100%;
  display: block;
}

.mobile-trigger {
  width: 100%;
  padding: 10px 15px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  display: flex;
  justify-content: flex-start; /* Left align */
  gap: 8px; /* Space between text and icon */
  align-items: center;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  box-sizing: border-box;
}

.mobile-submit-btn {
  width: 100%;
  display: flex;
  justify-content: flex-start; /* Left align */
  align-items: center;
  padding-left: 15px; /* Match input padding */
  height: 40px;
  font-size: 16px;
  border-radius: 8px;
}

/* Force dropdown to be full width on mobile */
.mobile-layout ::v-deep .kiwi-dropdown {
  width: 100%;
  display: block;
}

.mobile-layout ::v-deep .kiwi-dropdown-trigger {
  width: 100%;
  display: block;
}

.mobile-layout ::v-deep .kiwi-dropdown-menu {
  width: 100%;
  min-width: 100%;
}

/* Adjust input on mobile to look good without slots */
.mobile-layout ::v-deep .el-input__inner {
  border-radius: 8px !important;
  height: 44px;
}

.search-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  box-shadow: var(--shadow-lg);
  z-index: 2000;
  max-height: 300px;
  overflow-y: auto;
  margin-top: 8px;
}

.suggestion-item {
  padding: 10px 16px;
  cursor: pointer;
  color: var(--text-primary);
  font-size: 14px;
  border-bottom: 1px solid var(--border-color-lighter);
  transition: background 0.2s;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover {
  background: var(--bg-hover);
}

.search-actions-row {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.action-item {
  margin: 0 5px;
  display: inline-block;
}

.mode-select-trigger {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-regular);
  cursor: pointer;
}

.mode-select-trigger:hover {
  color: var(--color-primary);
}

.ai-mode-text {
  color: var(--color-primary);
  font-weight: 600;
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

/* Remove forced white font color to avoid blank current item when background matches */
/* .ai-mode-text ::v-deep(.el-input__inner) {
  color: #ffffff !important;
} */

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
  background-color: var(--color-danger);
  border-color: var(--color-danger);
  color: white;
}

/* Make the append slot clickable */
.search-input-wrapper ::v-deep .kiwi-input__append {
  cursor: pointer;
  transition: background-color 0.3s;
}

.search-input-wrapper ::v-deep .kiwi-input__append:hover {
  background-color: var(--bg-sidebar-active);
}
/* --- existing styles end --- */
</style>
