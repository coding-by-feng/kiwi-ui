<template>
  <div class="user-center-container">
    <!-- User Profile Header -->
    <div class="user-profile-header">
      <div class="avatar-section">
        <div class="user-basic-info">
          <h3>{{ userInfo.userName }}</h3>
          <el-tag v-if="userInfo.registerSource" :type="getSourceTagType(userInfo.registerSource)" size="mini">
            {{ getSourceText(userInfo.registerSource) }}
          </el-tag>
        </div>
      </div>
      <div class="user-actions">
        <el-button
            type="warning"
            size="small"
            @click="handleClearWebsiteData"
            :loading="clearingWebsiteData"
            class="action-button clear-data-button">
          {{ $t('audio.cleanAllCache') }}
        </el-button>
        <el-button type="info" size="small" @click="handleLoginOut" class="action-button logout-button">
          <i class="el-icon-switch-button"></i> {{ $t('user.loginOut') }}
        </el-button>
      </div>
    </div>

    <el-divider class="custom-divider"></el-divider>

    <!-- Statistics Section -->
    <div class="statistics-section">
      <h4 class="section-title">
        <i class="el-icon-data-analysis"></i> {{ $t('user.learningStats') }}
      </h4>
      <div class="stats-cards">
        <div class="stat-card remember-card">
          <div class="stat-icon remember">
            <i class="el-icon-success"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.rememberCount }}</h5>
            <p>{{ $t('user.todayRemembered') }}</p>
          </div>
        </div>
        <div class="stat-card review-card">
          <div class="stat-icon review">
            <i class="el-icon-refresh"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.reviewCount }}</h5>
            <p>{{ $t('user.todayReviewed') }}</p>
          </div>
        </div>
        <div class="stat-card master-card">
          <div class="stat-icon master">
            <i class="el-icon-star-on"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.keepInMindCount }}</h5>
            <p>{{ $t('user.todayMastered') }}</p>
          </div>
        </div>
      </div>
    </div>

    <el-divider class="custom-divider"></el-divider>

    <!-- Settings Section -->
    <div class="settings-section">
      <h4 class="section-title">
        <i class="el-icon-setting"></i> {{ $t('user.learningSettings') }}
      </h4>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.pronunciationSource') }}</span>
          </div>
          <el-dropdown @command="pronunciationSourceChange" trigger="click" class="custom-dropdown">
            <el-button size="small" type="text" class="dropdown-button">
              {{ user.pronunciationSource || $t('common.default') }} <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.nativeLanguage') }}</span>
          </div>
          <el-dropdown @command="nativeLangChange" trigger="click" class="custom-dropdown">
            <el-button size="small" type="text" class="dropdown-button">
              {{ tranNativeLang(user.nativeLang) }} <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                  v-for="(code, language) in languageCodes"
                  :key="code"
                  :command="code">
                {{ language.replaceAll('_', ' ') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <!-- NEW: Clipboard Detection Setting -->
        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.clipboardDetection') }}</span>
            <el-tooltip
                :content="$t('user.clipboardDetectionTooltip')"
                placement="top"
                effect="dark">
              <i class="el-icon-question help-icon"></i>
            </el-tooltip>
          </div>
          <el-switch
              v-model="clipboardDetectionEnabled"
              @change="clipboardDetectionChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.backgroundMusic') }}</span>
          </div>
          <el-switch
              v-model="bgmEnabled"
              @change="bgmChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.letterSpelling') }}</span>
          </div>
          <el-switch
              v-model="spellEnabled"
              @change="spellTypeChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.englishDefinition') }}</span>
          </div>
          <el-switch
              v-model="enParaEnabled"
              @change="enParaTypeChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.messageHints') }}</span>
          </div>
          <el-switch
              v-model="msgHintEnabled"
              @change="enableMsgHintChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.playExamples') }}</span>
          </div>
          <el-switch
              v-model="playExampleEnabled"
              @change="isPlayExampleChange"
              class="custom-switch">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.englishToEnglish') }}</span>
          </div>
          <el-switch
              v-model="enToEnEnabled"
              @change="isEnToEnChange"
              class="custom-switch">
          </el-switch>
        </div>

        <!-- NEW: Search Mode Hotkeys -->
        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.searchModeHotkeys') || 'Search Mode Hotkeys' }}</span>
            <el-tooltip
                :content="$t('user.searchModeHotkeysTip') || 'Use Ctrl/Cmd + Shift + Number to switch modes'"
                placement="top"
                effect="dark">
              <i class="el-icon-question help-icon"></i>
            </el-tooltip>
          </div>
          <el-tooltip :content="$t('common.configure') || 'Configure'" placement="top" effect="dark">
            <el-button
              size="mini"
              type="text"
              class="hotkeys-icon-btn"
              @click="openHotkeysDialog"
              :aria-label="$t('common.configure') || 'Configure'"
              :title="$t('common.configure') || 'Configure'">
              <i class="el-icon-setting"></i>
            </el-button>
          </el-tooltip>
        </div>

        <!-- NEW: Feature Tabs Visibility -->
        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.featureTabs') || 'Feature Tabs' }}</span>
            <el-tooltip :content="$t('user.featureTabsTip') || 'Show or hide tabs in the toolbar'" placement="top" effect="dark">
              <i class="el-icon-question help-icon"></i>
            </el-tooltip>
          </div>
          <div class="feature-toggles feature-toggles--stacked">
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.todo') || 'Todo' }}</span>
              <el-switch v-model="enabledTabsLocal.todo" class="custom-switch" @change="onFeatureToggle('todo', $event)" :aria-label="$t('tabs.todo') || 'Todo'"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.youtube') || 'YouTube' }}</span>
              <el-switch v-model="enabledTabsLocal.youtube" class="custom-switch" @change="onFeatureToggle('youtube', $event)" :aria-label="$t('tabs.youtube') || 'YouTube'"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.pdfReader') || 'PDF Reader' }}</span>
              <el-switch
                v-model="enabledTabsLocal.pdfReader"
                class="custom-switch"
                @change="onFeatureToggle('pdfReader', $event)"
                :aria-label="$t('tabs.pdfReader') || 'PDF Reader'"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.about') || 'About' }}</span>
              <el-switch v-model="enabledTabsLocal.about" class="custom-switch" @change="onFeatureToggle('about', $event)" :aria-label="$t('tabs.about') || 'About'"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.vocabularyReview') || 'Vocabulary Review' }}</span>
              <el-switch v-model="enabledTabsLocal.starList" class="custom-switch" @change="onFeatureToggle('starList', $event)" :aria-label="$t('tabs.vocabularyReview') || 'Vocabulary Review'"></el-switch>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- NEW: Audio (BGM) Section embedded into User Center -->
    <div class="settings-section">
      <h4 class="section-title">
        <i class="el-icon-headset"></i> {{ $t('audio.title') }}
      </h4>
      <Bgm />
    </div>

    <!-- Hotkeys Config Dialog -->
    <el-dialog
        :title="$t('user.searchModeHotkeys') || 'Search Mode Hotkeys'"
        :visible.sync="hotkeysDialogVisible"
        width="560px"
        center>
      <div class="hotkeys-tip">
        {{ $t('user.searchModeHotkeysTip') || 'Press a combination (e.g., Ctrl+Shift+K or Cmd+Shift+2) to bind a mode' }}
      </div>
      <div class="hotkeys-actions">
        <el-button size="mini" type="primary" @click="addHotkeyRow">
          <i class="el-icon-plus"></i> {{ $t('common.add') || 'Add' }}
        </el-button>
      </div>
      <el-form label-position="left" label-width="140px">
        <div class="hotkeys-grid">
          <div v-for="(row, idx) in hotkeyRows" :key="row.id" class="hotkey-row">
            <div class="hotkey-label">{{ $t('user.hotkey') || 'Hotkey' }}</div>
            <el-input
              class="combo-input"
              :value="row.combo"
              :placeholder="$t('user.pressKeys') || 'Press keys...'"
              size="small"
              readonly
              @keydown.native.stop.prevent="onComboKeydown(idx, $event)"
              @focus.native="onComboFocus(idx)"
              @blur.native="onComboBlur(idx)"
            ></el-input>
            <el-select v-model="row.mode" size="small" class="hotkey-select" :placeholder="$t('searchModes.selectMode')">
              <el-option
                  v-for="opt in searchModeOptions"
                  :key="opt.value"
                  :label="$t(`searchModes.${opt.labelKey}`)"
                  :value="opt.value"/>
            </el-select>
            <el-button type="text" size="mini" @click="removeHotkeyRow(idx)" :title="$t('common.delete') || 'Delete'">
              <i class="el-icon-delete"></i>
            </el-button>
          </div>
        </div>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="resetHotkeysToDefaults">{{ $t('user.resetToDefaults') || 'Reset to defaults' }}</el-button>
        <el-button @click="hotkeysDialogVisible = false">{{ $t('common.cancel') }}</el-button>
        <el-button type="primary" @click="saveHotkeys">{{ $t('common.save') || 'Save' }}</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import util from '@/util/util'
import msgUtil from '@/util/msg'
import { clearWebsiteData as clearWebsiteDataUtil } from '@/util/clearWebsiteData'
import Bgm from '@/page/bgm/Index'
import { setLanguage as setUiLanguage } from '@/i18n'

const USER_NAME = 'user_name'

export default {
  name: 'UserCenter',
  components: { Bgm },
  data() {
    return {
      userInfo: {
        userName: getStore({ name: USER_NAME }),
        avatar: '',
        registerSource: ''
      },

      user: {
        pronunciationSource: getStore({ name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE }),
        reviewType: getStore({ name: kiwiConst.CONFIG_KEY.REVIEW_TYPE }),
        spellType: getStore({ name: kiwiConst.CONFIG_KEY.SPELL_TYPE }),
        enParaType: getStore({ name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE }),
        enableMsgHint: getStore({ name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT }),
        isPlayExample: getStore({ name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE }),
        isEnToEn: getStore({ name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN }),
        bgm: getStore({ name: kiwiConst.CONFIG_KEY.BGM }),
        nativeLang: getStore({ name: kiwiConst.CONFIG_KEY.NATIVE_LANG }),
        clipboardDetection: getStore({ name: kiwiConst.CONFIG_KEY.CLIPBOARD_DETECTION }),
        keepInMindCount: 0,
        rememberCount: 0,
        reviewCount: 0
      },

      languageCodes: kiwiConst.TRANSLATION_LANGUAGE_CODE,

      // NEW: hotkeys dialog state
      hotkeysDialogVisible: false,
      // Work in rows to make editing easier
      hotkeyRows: [],

      // NEW: Feature tabs toggle local state
      enabledTabsLocal: { ...kiwiConst.DEFAULT_ENABLED_TABS },
      clearingWebsiteData: false
    }
  },

  computed: {
    bgmEnabled: {
      get() { return this.user.bgm === kiwiConst.ENABLE_BGM.ENABLE },
      set(val) { this.user.bgm = val ? kiwiConst.ENABLE_BGM.ENABLE : kiwiConst.ENABLE_BGM.DISABLE }
    },
    spellEnabled: {
      get() { return this.user.spellType === kiwiConst.SPELL_TYPE.ENABLE },
      set(val) { this.user.spellType = val ? kiwiConst.SPELL_TYPE.ENABLE : kiwiConst.SPELL_TYPE.DISABLE }
    },
    enParaEnabled: {
      get() { return this.user.enParaType === kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE },
      set(val) { this.user.enParaType = val ? kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE : kiwiConst.ENGLISH_PARAPHRASE_TYPE.DISABLE }
    },
    msgHintEnabled: {
      get() { return this.user.enableMsgHint === kiwiConst.ENABLE_MSG_HINT.ENABLE },
      set(val) { this.user.enableMsgHint = val ? kiwiConst.ENABLE_MSG_HINT.ENABLE : kiwiConst.ENABLE_MSG_HINT.DISABLE }
    },
    playExampleEnabled: {
      get() { return this.user.isPlayExample === kiwiConst.IS_PLAY_EXAMPLE.ENABLE },
      set(val) { this.user.isPlayExample = val ? kiwiConst.IS_PLAY_EXAMPLE.ENABLE : kiwiConst.IS_PLAY_EXAMPLE.DISABLE }
    },
    enToEnEnabled: {
      get() { return this.user.isEnToEn === kiwiConst.IS_EN_TO_EN.ENABLE },
      set(val) { this.user.isEnToEn = val ? kiwiConst.IS_EN_TO_EN.ENABLE : kiwiConst.IS_EN_TO_EN.DISABLE }
    },
    clipboardDetectionEnabled: {
      get() { return this.user.clipboardDetection === kiwiConst.CLIPBOARD_DETECTION.ENABLE },
      set(val) { this.user.clipboardDetection = val ? kiwiConst.CLIPBOARD_DETECTION.ENABLE : kiwiConst.CLIPBOARD_DETECTION.DISABLE }
    },
    isMac() {
      try { return navigator.platform.toUpperCase().includes('MAC') } catch (e) { return false }
    },
    searchModeOptions() {
      // Build selectable options from SEARCH_MODES_DATA with translation keys aligned to Search.vue
      const data = kiwiConst.SEARCH_MODES_DATA
      const toKey = (value) => {
        const map = {
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
          // New modes
          'vocabulary-character-expansion': 'vocabularyCharacterExpansion',
          'ambiguous-association-correction': 'ambiguousAssociationCorrection'
        }
        return map[value] || value
      }
      return Object.values(data).map(m => ({ value: m.value, labelKey: toKey(m.value) }))
    }
  },

  mounted() {
    this.initializeSettings()
  },

  watch: {
    $route: function () {
      let active = this.$route.query.active
      if (active === 'userCenter') {
        this.refresh()
      }
    }
  },

  methods: {
    initializeSettings() {
      // migrate/remove Local pronunciation source, keep only Cambridge
      if (
        util.isEmptyStr(this.user.pronunciationSource) ||
        this.user.pronunciationSource === (kiwiConst.PRONUNCIATION_SOURCE && kiwiConst.PRONUNCIATION_SOURCE.LOCAL) ||
        this.user.pronunciationSource === 'Local'
      ) {
        setStore({
          name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
          content: 'Cambridge',
          type: 'local'
        })
        this.user.pronunciationSource = 'Cambridge'
      }
      if (util.isEmptyStr(this.user.bgm)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.BGM,
          content: kiwiConst.ENABLE_BGM.ENABLE,
          type: 'local'
        })
        this.user.bgm = kiwiConst.ENABLE_BGM.ENABLE
      }
      if (util.isEmptyStr(this.user.reviewType)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.REVIEW_TYPE,
          content: kiwiConst.REVIEW_TYPE.ONLY_ENGLISH,
          type: 'local'
        })
      }
      if (util.isEmptyStr(this.user.spellType)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.SPELL_TYPE,
          content: kiwiConst.SPELL_TYPE.ENABLE,
          type: 'local'
        })
      }
      if (util.isEmptyStr(this.user.isPlayExample)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
          content: kiwiConst.IS_PLAY_EXAMPLE.ENABLE,
          type: 'local'
        })
      }
      if (util.isEmptyStr(this.user.isEnToEn)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
          content: kiwiConst.IS_EN_TO_EN.ENABLE,
          type: 'local'
        })
      }
      if (util.isEmptyStr(this.user.nativeLang)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.NATIVE_LANG,
          content: kiwiConst.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese,
          type: 'local'
        })
        this.user.nativeLang = kiwiConst.TRANSLATION_LANGUAGE_CODE.Simplified_Chinese
      }
      // Change default clipboard detection to DISABLE by default
      if (util.isEmptyStr(this.user.clipboardDetection)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.CLIPBOARD_DETECTION,
          content: kiwiConst.CLIPBOARD_DETECTION.DISABLE,
          type: 'local'
        })
        this.user.clipboardDetection = kiwiConst.CLIPBOARD_DETECTION.DISABLE
      }

      // Initialize feature tabs visibility
      try {
        const stored = getStore({ name: kiwiConst.CONFIG_KEY.ENABLED_TABS })
        if (!stored || typeof stored !== 'object') {
          setStore({ name: kiwiConst.CONFIG_KEY.ENABLED_TABS, content: kiwiConst.DEFAULT_ENABLED_TABS, type: 'local' })
          this.enabledTabsLocal = { ...kiwiConst.DEFAULT_ENABLED_TABS }
        } else {
          this.enabledTabsLocal = { ...kiwiConst.DEFAULT_ENABLED_TABS, ...stored }
        }
      } catch (e) {
        this.enabledTabsLocal = { ...kiwiConst.DEFAULT_ENABLED_TABS }
      }
    },

    // Utility methods
    getSourceTagType(source) {
      const types = {
        'local': 'info',
        'google': 'success',
        'wechat': 'success',
        'qq': 'warning'
      }
      return types[source] || 'info'
    },

    getSourceText(source) {
      // Use translation keys for register source
      const sourceKey = `user.registerSource.${source}`
      if (this.$te(sourceKey)) {
        return this.$t(sourceKey)
      }
      return this.$t('user.registerSource.unknown')
    },

    // Settings methods
    async handleClearWebsiteData() {
      this.clearingWebsiteData = true
      try {
        await clearWebsiteDataUtil()
        msgUtil.msgSuccess(this, this.$t('audio.cacheCleanedSuccess'))
      } catch (error) {
        console.error('Failed to clear website data:', error)
        msgUtil.msgError(this, this.$t('messages.systemError'))
      } finally {
        this.clearingWebsiteData = false
      }
    },

    handleLoginOut() {
      this.$store.dispatch('LogOut').then(() => {
        this.$router.push({ path: website.noAuthPath.detail, query: { active: 'search' } })
        window.location.reload()
      }).catch(e => {
        console.error(e)
      })
    },

    pronunciationSourceChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
        content: command,
        type: 'local'
      })
      this.user.pronunciationSource = command
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    nativeLangChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.NATIVE_LANG,
        content: command,
        type: 'local'
      })
      this.user.nativeLang = command
      // Map native language to UI language and switch immediately
      try {
        const map = kiwiConst.UI_LANGUAGE_MAPPING || {}
        const ui = map[command]
        if (ui) {
          setUiLanguage(ui)
        }
      } catch (e) { /* ignore */ }
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    clipboardDetectionChange(enabled) {
      const value = enabled ? kiwiConst.CLIPBOARD_DETECTION.ENABLE : kiwiConst.CLIPBOARD_DETECTION.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.CLIPBOARD_DETECTION,
        content: value,
        type: 'local'
      })
      this.user.clipboardDetection = value
      this.$message.success(this.$t('messages.operationSuccess'))

      // Emit event to notify other components about the change
      this.$emit('clipboard-detection-changed', enabled)

      // You might want to inform the user that the change will take effect immediately
      if (enabled) {
        this.$message.info(this.$t('messages.clipboardDetectionEnabled'))
      } else {
        this.$message.info(this.$t('messages.clipboardDetectionDisabled'))
      }
    },

    bgmChange(enabled) {
      const value = enabled ? kiwiConst.ENABLE_BGM.ENABLE : kiwiConst.ENABLE_BGM.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.BGM,
        content: value,
        type: 'local'
      })
      this.user.bgm = value
      this.$message.success(this.$t('messages.operationSuccess'))
      window.location.reload()
    },

    spellTypeChange(enabled) {
      const value = enabled ? kiwiConst.SPELL_TYPE.ENABLE : kiwiConst.SPELL_TYPE.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.SPELL_TYPE,
        content: value,
        type: 'local'
      })
      this.user.spellType = value
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    enParaTypeChange(enabled) {
      const value = enabled ? kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE : kiwiConst.ENGLISH_PARAPHRASE_TYPE.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE,
        content: value,
        type: 'local'
      })
      this.user.enParaType = value
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    enableMsgHintChange(enabled) {
      const value = enabled ? kiwiConst.ENABLE_MSG_HINT.ENABLE : kiwiConst.ENABLE_MSG_HINT.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT,
        content: value,
        type: 'local'
      })
      this.user.enableMsgHint = value
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    isPlayExampleChange(enabled) {
      const value = enabled ? kiwiConst.IS_PLAY_EXAMPLE.ENABLE : kiwiConst.IS_PLAY_EXAMPLE.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
        content: value,
        type: 'local'
      })
      this.user.isPlayExample = value
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    isEnToEnChange(enabled) {
      const value = enabled ? kiwiConst.IS_EN_TO_EN.ENABLE : kiwiConst.IS_EN_TO_EN.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
        content: value,
        type: 'local'
      })
      this.user.isEnToEn = value
      this.$message.success(this.$t('messages.operationSuccess'))
    },

    // NEW: feature toggle handler
    onFeatureToggle(key, enabled) {
      try {
        const updated = { ...this.enabledTabsLocal, [key]: !!enabled }
        this.enabledTabsLocal = updated
        setStore({ name: kiwiConst.CONFIG_KEY.ENABLED_TABS, content: updated, type: 'local' })
        this.$message.success(this.$t('messages.operationSuccess') || 'Saved')
        try { window.dispatchEvent(new Event('enabled-tabs-updated')) } catch (_) {}
      } catch (e) {
        console.error('Failed to save feature tabs setting', e)
        this.$message.error(this.$t('messages.saveFailed') || 'Save failed')
      }
    },

    tranNativeLang(val) {
      if (util.isEmptyStr(val)) {
        return this.$t('user.defaultLanguage')
      }
      for (const [language, code] of Object.entries(this.languageCodes)) {
        if (code === val) {
          return language.replaceAll('_', ' ')
        }
      }
      return this.$t('user.unknownLanguage')
    },

    refresh() {
      // Get today's review statistics with error handling
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
          .then(response => {
            if (response.data.data) {
              this.user.keepInMindCount = response.data.data.reviewCount
            }
          })
          .catch(error => {
            console.error('Error loading review count:', error)
          })
    },

    // NEW: Hotkeys config methods
    openHotkeysDialog() {
      try {
        const stored = getStore({ name: kiwiConst.CONFIG_KEY.SEARCH_MODE_HOTKEYS })

        let comboMap = {}
        if (stored && typeof stored === 'object') {
          const keys = Object.keys(stored)
          const isCombo = keys.some(k => k.includes('+'))
          if (isCombo) {
            comboMap = { ...stored }
          } else {
            // Migrate legacy digits to a reasonable default combo (Ctrl+Shift+digit)
            comboMap = Object.keys(stored).reduce((acc, d) => {
              const mode = stored[d]
              if (mode) acc[`Ctrl+Shift+${d}`] = mode
              return acc
            }, {})
          }
        } else {
          comboMap = {}
        }

        this.hotkeyRows = Object.entries(comboMap).map(([combo, mode], i) => ({
          id: `${combo}-${i}-${Date.now()}`,
          combo,
          mode
        }))
        // Ensure at least one row exists for UX
        if (this.hotkeyRows.length === 0) {
          this.hotkeyRows.push({ id: 'new-0', combo: '', mode: Object.values(kiwiConst.SEARCH_MODES_DATA)[0].value })
        }
        this.hotkeysDialogVisible = true
      } catch (e) {
        const firstMode = (Object.values(kiwiConst.SEARCH_MODES_DATA)[0] || {}).value || 'detail'
        this.hotkeyRows = [{ id: `error-${Date.now()}`, combo: '', mode: firstMode }]
        this.hotkeysDialogVisible = true
      }
    },

    addHotkeyRow() {
      const firstMode = (Object.values(kiwiConst.SEARCH_MODES_DATA)[0] || {}).value || 'detail'
      this.hotkeyRows.push({ id: `new-${Date.now()}`, combo: '', mode: firstMode })
    },

    removeHotkeyRow(index) {
      this.hotkeyRows.splice(index, 1)
    },

    // Normalize KeyboardEvent to combo string, e.g., "Ctrl+Shift+1", "Meta+K", "Alt+S"
    normalizeEventToCombo(e) {
      const key = (e.key || '').toString()
      const isModifierKey = ['Shift', 'Control', 'Alt', 'Meta'].includes(key)
      if (isModifierKey) return null

      const parts = []
      if (e.metaKey) parts.push('Meta')
      if (e.ctrlKey) parts.push('Ctrl')
      if (e.altKey) parts.push('Alt')
      if (e.shiftKey) parts.push('Shift')
      if (parts.length === 0) return null // require at least one modifier

      let keyLabel = ''
      if (key.length === 1) {
        keyLabel = key.toUpperCase()
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
        }
        if (map[key]) keyLabel = map[key]
        else if (/^F\d{1,2}$/.test(key)) keyLabel = key
        else if (/^[0-9]$/.test(key)) keyLabel = key
        else keyLabel = key.charAt(0).toUpperCase() + key.slice(1)
      }
      return [...parts, keyLabel].join('+')
    },

    onComboFocus(index) {
      // Could show hint or visual state, reserved for future
    },
    onComboBlur(index) {
      // Reserved for future
    },

    onComboKeydown(index, event) {
      const combo = this.normalizeEventToCombo(event)
      if (!combo) return

      // Prevent duplicates by warning and replacing existing if necessary
      const duplicateIndex = this.hotkeyRows.findIndex((r, i) => r.combo === combo && i !== index)
      if (duplicateIndex !== -1) {
        this.$message.warning(this.$t('messages.duplicateHotkey') || 'This hotkey is already in use')
        // Still allow user to override by assigning here and clearing the other
        this.hotkeyRows[duplicateIndex].combo = ''
      }

      this.$set(this.hotkeyRows[index], 'combo', combo)
    },

    resetHotkeysToDefaults() {
      const firstMode = (Object.values(kiwiConst.SEARCH_MODES_DATA)[0] || {}).value || 'detail'
      this.hotkeyRows = [{ id: `reset-${Date.now()}`, combo: '', mode: firstMode }]
    },

    async saveHotkeys() {
      try {
        // Build map and validate
        const map = {}
        const allowed = new Set(Object.values(kiwiConst.SEARCH_MODES_DATA).map(m => m.value))

        for (const row of this.hotkeyRows) {
          const combo = (row.combo || '').trim()
          const mode = row.mode
          if (!combo) continue // allow empty rows
          if (!combo.includes('+')) {
            this.$message.error(this.$t('messages.invalidHotkey') || 'Hotkey must include at least one modifier')
            return
          }
          if (!allowed.has(mode)) {
            this.$message.error(this.$t('messages.invalidConfig') || 'Invalid mode selection')
            return
          }
          if (map[combo]) {
            this.$message.error(this.$t('messages.duplicateHotkey') || 'Duplicate hotkey found')
            return
          }
          map[combo] = mode
        }

        if (Object.keys(map).length === 0) {
          this.$message.warning(this.$t('messages.noHotkeysConfigured') || 'No hotkeys configured')
        }

        setStore({ name: kiwiConst.CONFIG_KEY.SEARCH_MODE_HOTKEYS, content: map, type: 'local' })
        const hasHotkeys = Object.keys(map).length > 0
        let registrationResult = null
        try {
          if (window.electronAPI) {
            if (hasHotkeys && typeof window.electronAPI.registerGlobalHotkeys === 'function') {
              registrationResult = await window.electronAPI.registerGlobalHotkeys({ modes: map })
            } else if (!hasHotkeys && typeof window.electronAPI.unregisterGlobalHotkeys === 'function') {
              registrationResult = await window.electronAPI.unregisterGlobalHotkeys()
            }
          }
        } catch (ipcError) {
          console.warn('Failed to sync global hotkeys with Electron:', ipcError)
        }

        const failedCombos = []
        if (registrationResult && registrationResult.failed) {
          failedCombos.push(...(registrationResult.failed.tabs || []))
          failedCombos.push(...(registrationResult.failed.modes || []))
        }
        if (failedCombos.length > 0) {
          this.$message.warning(
              (this.$t && this.$t('messages.hotkeyRegistrationFailed'))
                  || `Unable to register some shortcuts: ${failedCombos.join(', ')}`
          )
        }

        this.$message.success(this.$t('messages.operationSuccess') || 'Saved')
        this.hotkeysDialogVisible = false
        try { window.dispatchEvent(new Event('hotkeys-updated')) } catch (_) {}
      } catch (e) {
        console.error('Failed to save hotkeys:', e)
        this.$message.error(this.$t('messages.saveFailed') || 'Save failed')
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.user-center-container {
  max-width: 100%;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  overflow: hidden;
  animation: fadeInUp 0.6s ease;
}

.user-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-avatar {
      border: 3px solid #409eff;
    }

    .user-basic-info {
      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #2c3e50;
        background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .user-email {
        margin: 0 0 8px 0;
        color: #666;
        font-size: 14px;
      }
    }
  }

  .user-actions {
    display: flex;
    gap: 12px;
    align-items: center;
  }
}

.action-button {
  border: none !important;
  color: white !important;
  padding: 12px 20px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;

  &:hover {
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  &:active {
    transform: translateY(0px) !important;
  }
}

/* Logout Button Styling */
.logout-button {
  @extend .action-button;
  background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;

  &:hover {
    background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
    color: white !important;
  }

  &:focus {
    background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
    color: white !important;
    box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.3) !important;
  }
}

.clear-data-button {
  @extend .action-button;
  background: linear-gradient(135deg, #e6a23c 0%, #f7ba2a 100%) !important;

  &:hover {
    background: linear-gradient(135deg, #d1941a 0%, #e6a621 100%) !important;
    color: white !important;
  }

  &:focus {
    background: linear-gradient(135deg, #d1941a 0%, #e6a621 100%) !important;
    color: white !important;
    box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.3) !important;
  }
}

/* Custom Divider */
.custom-divider {
  border-top: 1px solid rgba(64, 158, 255, 0.2);
  margin: 24px 0;
}

.statistics-section,
.settings-section {
  margin-bottom: 32px;
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(64, 158, 255, 0.1);
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-size: 18px;
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;

  .stat-card {
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    &.remember-card {
      background: linear-gradient(135deg, #67c23a 0%, #85ce61 100%);
    }

    &.review-card {
      background: linear-gradient(135deg, #409eff 0%, #66b1ff 100%);
    }

    &.master-card {
      background: linear-gradient(135deg, #e6a23c 0%, #f7ba2a 100%);
    }

    &::before {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 60px;
      height: 60px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(30%, -30%);
    }

    .stat-icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 12px;
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.2);

      i {
        font-size: 20px;
      }
    }

    .stat-content {
      position: relative;
      z-index: 1;

      h5 {
        font-size: 24px;
        font-weight: 700;
        margin: 0 0 4px 0;
      }

      p {
        font-size: 14px;
        margin: 0;
        opacity: 0.9;
      }
    }
  }
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;

  .setting-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border: 1px solid rgba(64, 158, 255, 0.2);
    border-radius: 12px;
    transition: all 0.3s ease;
    background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);

    &:hover {
      border-color: rgba(64, 158, 255, 0.4);
      box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
      transform: translateY(-1px);
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #2c3e50;

      .help-icon {
        color: #909399;
        font-size: 14px;
        margin-left: 4px;
        cursor: help;

        &:hover {
          color: #409eff;
        }
      }
    }
  }
}

/* Custom Dropdown Styling */
.custom-dropdown {
  .dropdown-button {
    border: none !important;
    padding: 8px 12px !important;
    color: #409eff !important;
    font-weight: 500 !important;
    background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%) !important;
    border-radius: 8px !important;
    transition: all 0.3s ease !important;

    &:hover {
      color: #3a8ee6 !important;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(103, 194, 58, 0.2) 100%) !important;
      transform: translateY(-1px) !important;
    }

    &:focus {
      color: #3a8ee6 !important;
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.2) 0%, rgba(103, 194, 58, 0.2) 100%) !important;
      box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.3) !important;
    }
  }
}

/* Custom Switch Styling - Applied to ALL switches */
.custom-switch {
  ::v-deep .el-switch__core {
    background: linear-gradient(135deg, #f5f7fa 0%, #e8eaed 100%) !important;
    border: 2px solid #dcdfe6 !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }

  ::v-deep .el-switch.is-checked .el-switch__core {
    background: linear-gradient(135deg, #1890ff 0%, #40a9ff 50%, #69c0ff 100%) !important;
    border-color: #1890ff !important;
    box-shadow:
        0 0 0 2px rgba(24, 144, 255, 0.2),
        0 2px 8px rgba(24, 144, 255, 0.3),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  ::v-deep .el-switch__action {
    background: linear-gradient(135deg, #ffffff 0%, #fafafa 100%) !important;
    border: 1px solid rgba(0, 0, 0, 0.1) !important;
    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  ::v-deep .el-switch.is-checked .el-switch__action {
    background: linear-gradient(135deg, #ffffff 0%, #f0f8ff 100%) !important;
    border-color: rgba(24, 144, 255, 0.3) !important;
    box-shadow:
        0 3px 6px rgba(24, 144, 255, 0.25),
        0 1px 3px rgba(24, 144, 255, 0.15),
        inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  }

  &:hover ::v-deep .el-switch__core {
    background: linear-gradient(135deg, #e8eaed 0%, #d3d4d6 100%) !important;
    border-color: #c0c4cc !important;
    transform: scale(1.02) !important;
    box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.15) !important;
  }

  &:hover ::v-deep .el-switch.is-checked .el-switch__core {
    background: linear-gradient(135deg, #0050b3 0%, #1890ff 50%, #40a9ff 100%) !important;
    border-color: #0050b3 !important;
    box-shadow:
        0 0 0 3px rgba(24, 144, 255, 0.25),
        0 4px 12px rgba(24, 144, 255, 0.4),
        inset 0 1px 0 rgba(255, 255, 255, 0.3) !important;
    transform: scale(1.02) !important;
  }

  &:hover ::v-deep .el-switch__action {
    transform: scale(1.05) !important;
    box-shadow:
        0 4px 8px rgba(0, 0, 0, 0.2),
        0 2px 4px rgba(0, 0, 0, 0.15) !important;
  }

  &:hover ::v-deep .el-switch.is-checked .el-switch__action {
    box-shadow:
        0 4px 8px rgba(24, 144, 255, 0.3),
        0 2px 4px rgba(24, 144, 255, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.9) !important;
  }
}

/* Add a subtle glow effect for ALL enabled switches */
.custom-switch ::v-deep .el-switch.is-checked {
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -2px;
    left: -2px;
    right: -2px;
    bottom: -2px;
    background: linear-gradient(135deg, rgba(24, 144, 255, 0.2) 0%, rgba(64, 169, 255, 0.1) 100%);
    border-radius: 14px;
    z-index: -1;
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover::before {
    opacity: 1;
  }
}

/* Custom Tag Styling */
::v-deep .el-tag {
  background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%) !important;
  border: 1px solid rgba(64, 158, 255, 0.3) !important;
  color: #409eff !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;

  &.el-tag--success {
    background: linear-gradient(135deg, rgba(103, 194, 58, 0.1) 0%, rgba(133, 206, 97, 0.1) 100%) !important;
    border-color: rgba(103, 194, 58, 0.3) !important;
    color: #67c23a !important;
  }

  &.el-tag--warning {
    background: linear-gradient(135deg, rgba(230, 162, 60, 0.1) 0%, rgba(247, 186, 42, 0.1) 100%) !important;
    border-color: rgba(230, 162, 60, 0.3) !important;
    color: #e6a23c !important;
  }

  &.el-tag--info {
    background: linear-gradient(135deg, rgba(144, 147, 153, 0.1) 0%, rgba(96, 98, 102, 0.1) 100%) !important;
    border-color: rgba(144, 147, 153, 0.3) !important;
    color: #909399 !important;
  }
}

/* Dropdown Menu Styling */
::v-deep .el-dropdown-menu {
  border: 1px solid rgba(64, 158, 255, 0.2) !important;
  border-radius: 8px !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
  padding: 8px 0 !important;
  background: white !important;

  .el-dropdown-menu__item {
    padding: 10px 16px !important;
    color: #2c3e50 !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%) !important;
      color: #409eff !important;
    }

    &:focus {
      background: linear-gradient(135deg, rgba(64, 158, 255, 0.1) 0%, rgba(103, 194, 58, 0.1) 100%) !important;
      color: #409eff !important;
    }
  }
}

/* Responsive design */
@media (max-width: 768px) {
  .user-center-container {
    padding: 2px;
    margin: 2px;
  }

  .user-profile-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
    padding: 16px;
  }

  .statistics-section,
  .settings-section {
    padding: 16px;
    margin-bottom: 20px;
  }

  .stats-cards,
  .settings-grid {
    grid-template-columns: 1fr;
  }

  .stats-cards {
    gap: 12px;

    .stat-card {
      padding: 16px;

      .stat-icon {
        width: 35px;
        height: 35px;
        margin-bottom: 10px;

        i {
          font-size: 18px;
        }
      }

      .stat-content h5 {
        font-size: 20px;
      }

      .stat-content p {
        font-size: 13px;
      }
    }
  }

  .setting-item {
    padding: 12px;
    flex-direction: column;
    gap: 12px;
    text-align: center;

    .setting-label {
      justify-content: center;
    }
  }

  .logout-button {
    padding: 10px 16px !important;
    font-size: 14px !important;
  }

  .section-title {
    font-size: 14px;
    justify-content: center;
    text-align: center;
  }

  /* Hotkeys button fix: consistent height/spacing and no wrap */
  .hotkeys-btn {
    width: 100%;
    height: 40px;
    line-height: 38px;
    border-radius: 8px;
    white-space: nowrap;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 16px;
  }
}

/* Animation for better user experience */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.statistics-section {
  animation: fadeInUp 0.6s ease 0.1s both;
}

.settings-section {
  animation: fadeInUp 0.6s ease 0.2s both;
}

/* Loading states for better UX */
.setting-item {
  position: relative;

  &.loading {
    opacity: 0.7;
    pointer-events: none;

    &::after {
      content: '';
      position: absolute;
      top: 50%;
      right: 20px;
      width: 16px;
      height: 16px;
      border: 2px solid #409eff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Smooth transitions for all interactive elements */
* {
  transition: all 0.3s ease;
}

/* Custom scrollbar for dropdown menus */
::v-deep .el-dropdown-menu {
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(64, 158, 255, 0.1);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: linear-gradient(135deg, #409eff 0%, #67c23a 100%);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(135deg, #3a8ee6 0%, #5daf34 100%);
  }
}

/* Hotkeys dialog styles */
.hotkeys-tip {
  margin-bottom: 12px;
  color: #606266;
}
.hotkeys-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
.hotkey-row {
  display: grid;
  grid-template-columns: 140px 1fr 1fr auto;
  align-items: center;
  gap: 8px;
}
.combo-input {
  user-select: none;
}

/* Icon-only hotkeys configure button */
.hotkeys-icon-btn {
  color: #909399 !important; /* grey */
  padding: 4px 6px !important;
  line-height: 1 !important;
  min-width: auto !important;
}
.hotkeys-icon-btn:hover {
  color: #606266 !important;
}
.hotkeys-icon-btn i {
  font-size: 16px;
}

/* Feature Toggles Styling */
.feature-toggles {
  width: 100%;
}
.feature-toggles--stacked {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.feature-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between; /* label left, switch right */
  width: 100%;
  padding: 6px 10px;
  border-radius: 10px;
  background: linear-gradient(135deg, rgba(64,158,255,0.06) 0%, rgba(103,194,58,0.06) 100%);
}
.feature-label {
  font-size: 13px;
  color: #2c3e50;
  font-weight: 500;
}
.feature-toggle .custom-switch {
  margin-left: 12px;
}
@media (max-width: 768px) {
  .feature-toggles--stacked { gap: 6px; }
  .feature-toggle { padding: 5px 8px; }
  .feature-label { font-size: 12px; }
}
</style>
