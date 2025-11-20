<template>
  <div>
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
        <!-- Theme Selection -->
        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.theme') || 'Theme' }}</span>
          </div>
          <el-dropdown @command="handleThemeChange" trigger="click" class="custom-dropdown">
            <el-button size="small" type="text" class="dropdown-button">
              {{ currentThemeName }} <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="cyberpunk">CyberPunk</el-dropdown-item>
              <el-dropdown-item command="glassmorphism">Glassmorphism</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

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

        <!-- NEW: Feature Tabs Visibility -->
        <div class="setting-item setting-item--feature-tabs">
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
        reviewCount: 0,
        theme: getStore({ name: 'theme' }) || 'CyberPunk'
      },

      // Ensure this object exists before the first render to avoid runtime errors in v-model bindings
      enabledTabsLocal: { ...kiwiConst.DEFAULT_ENABLED_TABS },

      languageCodes: kiwiConst.TRANSLATION_LANGUAGE_CODE,

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
    currentThemeName() {
      const names = {
        'cyberpunk': 'CyberPunk',
        'glassmorphism': 'Glassmorphism'
      }
      return names[this.user.theme] || 'CyberPunk'
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

      if (util.isEmptyStr(this.user.theme)) {
        setStore({ name: 'theme', content: 'cyberpunk', type: 'local' })
        this.user.theme = 'cyberpunk'
      } else {
        this.user.theme = typeof this.user.theme === 'string' ? this.user.theme.toLowerCase() : 'cyberpunk'
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

      // Apply theme
      this.applyTheme(this.user.theme)
    },

    // Utility methods
    getSourceTagType(source) {
      const types = {
        'local': 'info',
        'google': 'success',
        'wechat': 'success',
        'qq': 'warning'
      }
      return types[source] ? types[source] : 'info'
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
    handleThemeChange(theme) {
      const normalized = (theme || 'cyberpunk').toLowerCase()
      this.user.theme = normalized
      setStore({
        name: 'theme',
        content: normalized,
        type: 'local'
      })
      this.applyTheme(normalized)
      this.$message.success(`Theme switched to ${normalized}`)
    },
    applyTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme)
    }
  }
}
</script>

<style lang="scss" scoped>
.user-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  background: var(--bg-header);
  padding: 20px;
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
  backdrop-filter: var(--backdrop-filter);
  transition: all 0.3s ease;

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-avatar {
      border: 3px solid var(--color-primary);
    }

    .user-basic-info {
      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: var(--text-primary);
        background: var(--gradient-text);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .user-email {
        margin: 0 0 8px 0;
        color: var(--text-regular);
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
    box-shadow: var(--shadow-hover) !important;
  }

  &:active {
    transform: translateY(0px) !important;
  }
}

/* Logout Button Styling */
.logout-button {
  @extend .action-button;
  background: var(--gradient-info) !important;

  &:hover {
    filter: brightness(0.9);
    color: white !important;
  }

  &:focus {
    filter: brightness(0.9);
    color: white !important;
    box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.3) !important;
  }
}

.clear-data-button {
  @extend .action-button;
  background: var(--gradient-danger) !important;

  &:hover {
    filter: brightness(0.9);
    color: white !important;
  }

  &:focus {
    filter: brightness(0.9);
    color: white !important;
    box-shadow: 0 0 0 2px rgba(230, 162, 60, 0.3) !important;
  }
}

/* Custom Divider */
.custom-divider {
  border-top: 1px solid var(--divider-color);
  margin: 24px 0;
}

.statistics-section,
.settings-section {
  margin-bottom: 32px;
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  padding: 24px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
  backdrop-filter: var(--backdrop-filter);
  transition: all 0.3s ease;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 20px 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--gradient-text);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;

  i {
    background: var(--gradient-text);
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
    border-radius: var(--card-border-radius);
    text-align: center;
    position: relative;
    overflow: hidden;
    box-shadow: var(--shadow-card);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-hover);
    }

    &.remember-card {
      background: var(--gradient-success);
    }

    &.review-card {
      background: var(--gradient-primary);
    }

    &.master-card {
      background: var(--gradient-danger);
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
    border: 1px solid var(--border-color-light);
    border-radius: 12px;
    transition: all 0.3s ease;
    background: var(--bg-container);

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-hover);
      transform: translateY(-1px);
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: var(--text-primary);

      .help-icon {
        color: var(--text-secondary);
        font-size: 14px;
        margin-left: 4px;
        cursor: help;

        &:hover {
          color: var(--color-primary);
        }
      }
    }
  }

  /* Feature Tabs: left-aligned, responsive layout */
  .setting-item--feature-tabs {
    flex-direction: column;
    align-items: flex-start;
    justify-content: flex-start;
    grid-column: 1 / -1; /* span full width of the grid */

    .setting-label {
      margin-bottom: 10px;
    }

    .feature-toggles {
      width: 100%;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      gap: 12px 16px;
      justify-items: start; /* left align items */

      &.feature-toggles--stacked {
        /* keep same responsive grid but allow easy override if needed */
        grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
      }
    }

    .feature-toggle {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 10px;
      padding: 4px 0;

      .feature-label {
        min-width: 120px;
        color: var(--text-primary);
        font-weight: 500;
      }
    }
  }
}

/* Custom Dropdown Styling */
.custom-dropdown {
  .dropdown-button {
    border: none !important;
    padding: 8px 12px !important;
    color: var(--color-primary) !important;
    font-weight: 500 !important;
    background: var(--bg-container) !important;
    border-radius: 8px !important;
    transition: all 0.3s ease !important;

    &:hover {
      filter: brightness(0.95);
      transform: translateY(-1px) !important;
    }

    &:focus {
      filter: brightness(0.95);
      box-shadow: 0 0 0 2px var(--border-color-light) !important;
    }
  }
}

/* Custom Switch Styling - Applied to ALL switches */
.custom-switch {
  ::v-deep .el-switch__core {
    background: var(--bg-body) !important;
    border: 2px solid var(--border-color) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.1) !important;
  }

  ::v-deep .el-switch.is-checked .el-switch__core {
    background: var(--gradient-primary) !important;
    border-color: var(--color-primary) !important;
    box-shadow:
        0 0 0 2px var(--border-color-light),
        0 2px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2) !important;
  }

  ::v-deep .el-switch__action {
    background: var(--bg-card) !important;
    border: 1px solid var(--border-color) !important;
    box-shadow:
        0 2px 4px rgba(0, 0, 0, 0.15),
        0 1px 2px rgba(0, 0, 0, 0.1) !important;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1) !important;
  }

  ::v-deep .el-switch.is-checked .el-switch__action {
    background: var(--bg-card) !important;
    border-color: var(--border-color-light) !important;
    box-shadow:
        0 3px 6px rgba(0, 0, 0, 0.1),
        0 1px 3px rgba(0, 0, 0, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.8) !important;
  }

  &:hover ::v-deep .el-switch__core {
    background: var(--bg-body) !important;
    border-color: var(--border-color) !important;
    transform: scale(1.02) !important;
    box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.15) !important;
  }

  &:hover ::v-deep .el-switch.is-checked .el-switch__core {
    background: var(--gradient-primary) !important;
    border-color: var(--color-primary) !important;
    box-shadow:
        0 0 0 3px var(--border-color-light),
        0 4px 12px rgba(0, 0, 0, 0.1),
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
        0 4px 8px rgba(0, 0, 0, 0.1),
        0 2px 4px rgba(0, 0, 0, 0.05),
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
    background: var(--border-color-light);
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
  background: var(--bg-container) !important;
  border: 1px solid var(--border-color-light) !important;
  color: var(--color-primary) !important;
  border-radius: 6px !important;
  padding: 4px 8px !important;
  font-size: 12px !important;
  font-weight: 500 !important;

  &.el-tag--success {
    background: var(--bg-container) !important;
    border-color: var(--color-success) !important;
    color: var(--color-success) !important;
  }

  &.el-tag--warning {
    background: var(--bg-container) !important;
    border-color: var(--color-warning) !important;
    color: var(--color-warning) !important;
  }

  &.el-tag--info {
    background: var(--bg-container) !important;
    border-color: var(--color-info) !important;
    color: var(--color-info) !important;
  }
}

/* Dropdown Menu Styling */
::v-deep .el-dropdown-menu {
  border: 1px solid var(--border-color-light) !important;
  border-radius: 8px !important;
  box-shadow: var(--shadow-card) !important;
  padding: 8px 0 !important;
  background: var(--bg-card) !important;

  .el-dropdown-menu__item {
    padding: 10px 16px !important;
    color: var(--text-primary) !important;
    font-weight: 500 !important;
    transition: all 0.3s ease !important;

    &:hover {
      background: var(--bg-container) !important;
      color: var(--color-primary) !important;
    }

    &:focus {
      background: var(--bg-container) !important;
      color: var(--color-primary) !important;
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

  /* Feature tabs: 1 column on small screens */
  .setting-item--feature-tabs {
    align-items: stretch;

    .feature-toggles {
      grid-template-columns: 1fr !important;
      justify-items: start;
    }

    .setting-label {
      justify-content: flex-start !important;
      text-align: left;
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
      border: 2px solid var(--color-primary);
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
    background: var(--bg-body);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: var(--gradient-primary);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: var(--gradient-primary);
    filter: brightness(1.1);
  }
}
</style>
