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
        <KiwiButton
            type="warning"
            size="small"
            @click="handleClearWebsiteData"
            :loading="clearingWebsiteData"
            icon="el-icon-delete"
            class="action-button clear-data-button">
          {{ $t('audio.cleanAllCache') }}
        </KiwiButton>
        <KiwiButton type="primary" size="small" @click="showPasswordDialog = true" icon="el-icon-lock" class="action-button change-password-btn">
          {{ $t('user.changePassword') }}
        </KiwiButton>
        <KiwiButton type="info" size="small" @click="handleLoginOut" icon="el-icon-switch-button" class="action-button logout-button">
          {{ $t('user.loginOut') }}
        </KiwiButton>
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
            <span>{{ $t('user.theme') }}</span>
          </div>
          <KiwiDropdown @command="handleThemeChange" class="custom-dropdown theme-dropdown">
            <span class="dropdown-trigger">
              {{ currentThemeName }} <i class="el-icon-arrow-down"></i>
            </span>
            <template slot="dropdown">
              <KiwiDropdownItem command="cyberpunk">
                <span class="theme-option"><i class="theme-dot theme-dot--cyberpunk"></i> CyberPunk</span>
              </KiwiDropdownItem>
              <KiwiDropdownItem command="glassmorphism">
                <span class="theme-option"><i class="theme-dot theme-dot--glass"></i> Glassmorphism</span>
              </KiwiDropdownItem>
              <KiwiDropdownItem command="neon-tokyo">
                <span class="theme-option"><i class="theme-dot theme-dot--tokyo"></i> Neon Tokyo</span>
              </KiwiDropdownItem>
              <KiwiDropdownItem command="ocean-depth">
                <span class="theme-option"><i class="theme-dot theme-dot--ocean"></i> Ocean Depth</span>
              </KiwiDropdownItem>
              <KiwiDropdownItem command="aurora">
                <span class="theme-option"><i class="theme-dot theme-dot--aurora"></i> Aurora Borealis</span>
              </KiwiDropdownItem>
            </template>
          </KiwiDropdown>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.pronunciationSource') }}</span>
          </div>
          <KiwiDropdown @command="pronunciationSourceChange" class="custom-dropdown">
            <span class="dropdown-trigger">
              {{ user.pronunciationSource || $t('common.default') }} <i class="el-icon-arrow-down"></i>
            </span>
            <template slot="dropdown">
              <KiwiDropdownItem command="Cambridge">Cambridge</KiwiDropdownItem>
            </template>
          </KiwiDropdown>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <span>{{ $t('user.nativeLanguage') }}</span>
          </div>
          <KiwiDropdown @command="nativeLangChange" class="custom-dropdown">
            <span class="dropdown-trigger">
              {{ tranNativeLang(user.nativeLang) }} <i class="el-icon-arrow-down"></i>
            </span>
            <template slot="dropdown">
              <KiwiDropdownItem
                  v-for="(code, language) in languageCodes"
                  :key="code"
                  :command="code">
                {{ language.replaceAll('_', ' ') }}
              </KiwiDropdownItem>
            </template>
          </KiwiDropdown>
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
            <span>{{ $t('user.featureTabs') }}</span>
            <el-tooltip :content="$t('user.featureTabsTip')" placement="top" effect="dark">
              <i class="el-icon-question help-icon"></i>
            </el-tooltip>
          </div>
          <div class="feature-toggles feature-toggles--stacked">
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.todo') }}</span>
              <el-switch v-model="enabledTabsLocal.todo" class="custom-switch" @change="onFeatureToggle('todo', $event)" :aria-label="$t('tabs.todo')"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.youtube') }}</span>
              <el-switch v-model="enabledTabsLocal.youtube" class="custom-switch" @change="onFeatureToggle('youtube', $event)" :aria-label="$t('tabs.youtube')"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.pdfReader') }}</span>
              <el-switch
                  v-model="enabledTabsLocal.pdfReader"
                  class="custom-switch"
                  @change="onFeatureToggle('pdfReader', $event)"
                  :aria-label="$t('tabs.pdfReader')"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.about') }}</span>
              <el-switch v-model="enabledTabsLocal.about" class="custom-switch" @change="onFeatureToggle('about', $event)" :aria-label="$t('tabs.about')"></el-switch>
            </div>
            <div class="feature-toggle">
              <span class="feature-label">{{ $t('tabs.vocabularyReview') }}</span>
              <el-switch v-model="enabledTabsLocal.starList" class="custom-switch" @change="onFeatureToggle('starList', $event)" :aria-label="$t('tabs.vocabularyReview')"></el-switch>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Audio (BGM) Section - no wrapper, Bgm has its own styling -->
    <Bgm />

    <!-- Password Change Dialog -->
    <el-dialog
      :title="$t('user.changePassword')"
      :visible.sync="showPasswordDialog"
      width="400px"
      :close-on-click-modal="false"
      :close-on-press-escape="!changingPassword"
      :show-close="!changingPassword"
      custom-class="password-dialog"
      @closed="resetPasswordForm"
    >
      <el-form
        ref="passwordForm"
        :model="passwordForm"
        :rules="passwordRules"
        label-position="top"
        class="password-change-form"
        @submit.native.prevent="handleChangePassword"
      >
        <el-form-item :label="$t('user.currentPassword')" prop="oldPassword">
          <KiwiInput
            v-model="passwordForm.oldPassword"
            type="password"
            :placeholder="$t('user.currentPasswordPlaceholder')"
            show-password
            autocomplete="current-password"
          />
        </el-form-item>
        <el-form-item :label="$t('user.newPassword')" prop="newPassword">
          <KiwiInput
            v-model="passwordForm.newPassword"
            type="password"
            :placeholder="$t('user.newPasswordPlaceholder')"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
        <el-form-item :label="$t('user.confirmNewPassword')" prop="confirmPassword">
          <KiwiInput
            v-model="passwordForm.confirmPassword"
            type="password"
            :placeholder="$t('user.confirmNewPasswordPlaceholder')"
            show-password
            autocomplete="new-password"
          />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <KiwiButton @click="showPasswordDialog = false" :disabled="changingPassword">
          {{ $t('common.cancel') }}
        </KiwiButton>
        <KiwiButton
          type="primary"
          :loading="changingPassword"
          :disabled="changingPassword"
          @click="handleChangePassword"
        >
          {{ $t('common.confirm') }}
        </KiwiButton>
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
import KiwiDropdown from '@/components/ui/KiwiDropdown.vue'
import KiwiDropdownItem from '@/components/ui/KiwiDropdownItem.vue'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiInput from '@/components/ui/KiwiInput.vue'

const USER_NAME = 'user_name'

export default {
  name: 'UserCenter',
  components: { Bgm, KiwiDropdown, KiwiDropdownItem, KiwiButton, KiwiInput },
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

      clearingWebsiteData: false,

      // Password change dialog
      showPasswordDialog: false,
      changingPassword: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    }
  },

  created() {
    // Initialize password validation rules with i18n
    this.passwordRules = {
      oldPassword: [
        { required: true, message: () => this.$t('user.currentPasswordRequired'), trigger: 'blur' }
      ],
      newPassword: [
        { required: true, message: () => this.$t('user.newPasswordRequired'), trigger: 'blur' },
        { min: 6, message: () => this.$t('user.passwordTooShort'), trigger: 'blur' }
      ],
      confirmPassword: [
        { required: true, message: () => this.$t('user.confirmPasswordRequired'), trigger: 'blur' },
        { validator: this.validateConfirmPassword, trigger: 'blur' }
      ]
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
        'glassmorphism': 'Glassmorphism',
        'neon-tokyo': 'Neon Tokyo',
        'ocean-depth': 'Ocean Depth',
        'aurora': 'Aurora Borealis'
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
        this.$message.success(this.$t('messages.operationSuccess'))
        try { window.dispatchEvent(new Event('enabled-tabs-updated')) } catch (_) {}
      } catch (e) {
        console.error('Failed to save feature tabs setting', e)
        this.$message.error(this.$t('messages.saveFailed'))
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

    // Theme handling
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
    },

    // Password change validation
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.passwordForm.newPassword) {
        callback(new Error(this.$t('user.passwordMismatch')))
      } else {
        callback()
      }
    },

    // Password change handler
    async handleChangePassword() {
      if (this.changingPassword) return

      const form = this.$refs.passwordForm
      if (!form) return

      form.validate(async (valid) => {
        if (!valid) return

        try {
          this.changingPassword = true

          // Build form data as URL-encoded parameters
          const params = new URLSearchParams()
          params.append('oldPassword', this.passwordForm.oldPassword)
          params.append('newPassword', this.passwordForm.newPassword)

          const response = await this.$http.post('/api/upms/user/change-password', params, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          })

          const data = response && response.data
          if (data && (data.code === 0 || data.success === true)) {
            this.$message.success(this.$t('user.passwordChangeSuccess'))
            // Close dialog and reset form
            this.showPasswordDialog = false
            this.resetPasswordForm()
          } else {
            const msg = (data && (data.msg || data.message)) || this.$t('user.passwordChangeFailed')
            this.$message.error(msg)
          }
        } catch (error) {
          console.error('Password change error:', error)
          const errResponse = error && error.response && error.response.data
          const msg = (errResponse && (errResponse.msg || errResponse.message)) ||
                      (error && error.message) ||
                      this.$t('user.passwordChangeFailed')
          this.$message.error(msg)
        } finally {
          this.changingPassword = false
        }
      })
    },

    // Reset password form
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      if (this.$refs.passwordForm) {
        this.$refs.passwordForm.resetFields()
      }
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
        color: #ffffff;
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

// Action buttons - unified styling without !important
.action-button {
  border: none;
  color: #fff;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  transition: var(--transition-normal);
  box-shadow: var(--shadow-sm);
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-hover);
    filter: brightness(1.1);
  }

  &:active {
    transform: translateY(0);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-primary-light-5);
  }
}

.logout-button {
  background: var(--gradient-info);
}

.clear-data-button {
  background: var(--gradient-danger);
}

.change-password-btn {
  background: var(--gradient-primary);
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
  transition: background 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
  position: static;
  overflow: visible;
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
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;

  .stat-card {
    color: white;
    padding: 12px;
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
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 50%;
      transform: translate(30%, -30%);
    }

    .stat-icon {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
      position: relative;
      z-index: 1;
      background: rgba(255, 255, 255, 0.2);

      i {
        font-size: 14px;
      }
    }

    .stat-content {
      position: relative;
      z-index: 1;

      h5 {
        font-size: 18px;
        font-weight: 700;
        margin: 0 0 2px 0;
      }

      p {
        font-size: 11px;
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
    transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, transform 0.3s ease;
    background: var(--bg-container);
    overflow: visible;
    position: relative;
    z-index: 1;

    // When dropdown inside is active, elevate this setting-item
    &:has(.is-active) {
      z-index: 100;
    }

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

// Custom Dropdown Styling
.custom-dropdown {

  .dropdown-trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: var(--spacing-sm) var(--spacing-md);
    color: var(--color-primary);
    font-weight: var(--font-weight-medium);
    font-size: 14px;
    background: var(--bg-container);
    border: 1px solid var(--border-color-light);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: var(--transition-fast);

    i {
      font-size: 12px;
      transition: var(--transition-fast);
    }

    &:hover {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb), 0.1);

      i {
        transform: translateY(2px);
      }
    }
  }
}

// Switch styling is now handled globally in theme-tokens.scss
// Custom switch class kept for backwards compatibility
.custom-switch {
  // Global styles apply automatically
}

// Tag styling is now handled globally in theme-tokens.scss
// Additional tag styles can be added here if needed

// Dropdown menu styling is now handled globally in theme-tokens.scss

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

    .avatar-section {
      width: 100%;
    }

    .user-actions {
      width: 100%;
      flex-direction: column;
      gap: 10px;

      .action-button {
        width: 100%;
        margin: 0;
      }
    }
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
    gap: 10px;

    .stat-card {
      padding: 10px;

      .stat-icon {
        width: 24px;
        height: 24px;
        margin-bottom: 6px;

        i {
          font-size: 12px;
        }
      }

      .stat-content h5 {
        font-size: 16px;
      }

      .stat-content p {
        font-size: 10px;
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
      grid-template-columns: 1fr;
      justify-items: start;
    }

    .setting-label {
      justify-content: flex-start;
      text-align: left;
    }
  }

  .logout-button,
  .change-password-btn,
  .clear-data-button {
    padding: 10px 16px;
    font-size: 14px;
  }

  .section-title {
    font-size: 14px;
    justify-content: center;
    text-align: center;
  }
}

/* Extra small screens */
@media (max-width: 480px) {
  .user-profile-header {
    padding: 12px;
    gap: 12px;

    .user-basic-info h3 {
      font-size: 16px;
    }

    .user-actions {
      gap: 8px;

      .action-button {
        padding: 8px 12px;
        font-size: 13px;

        i {
          margin-right: 4px;
        }
      }
    }
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

/* Note: Removed universal transition rule to prevent z-index/stacking issues */

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

/* Password Change Dialog Styling */
::v-deep .password-dialog {
  border-radius: var(--card-border-radius);
  background: var(--bg-card);

  .el-dialog__header {
    background: var(--gradient-primary);
    border-radius: var(--card-border-radius) var(--card-border-radius) 0 0;
    padding: 16px 20px;

    .el-dialog__title {
      color: var(--text-primary);
      font-weight: 600;
    }

    .el-dialog__headerbtn .el-dialog__close {
      color: var(--text-primary);

      &:hover {
        color: var(--text-secondary);
      }
    }
  }

  .el-dialog__body {
    padding: 24px;
    background: var(--bg-card);
  }

  .el-dialog__footer {
    padding: 12px 20px 20px;
    border-top: 1px solid var(--border-color-light);
    background: var(--bg-card);
  }
}

/* Password Change Form Styling */
.password-change-form {
  ::v-deep .el-form-item {
    margin-bottom: 20px;

    &:last-child {
      margin-bottom: 0;
    }

    .el-form-item__label {
      color: var(--text-primary);
      font-weight: 500;
      padding-bottom: 6px;
    }

    .el-input__inner {
      border-radius: var(--radius-md);
      border: 1px solid var(--border-color);
      background: var(--bg-input);
      color: var(--text-primary);
      transition: var(--transition-normal);

      &:focus {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 2px var(--color-primary-light-9);
      }
    }
  }
}

@media (max-width: 768px) {
  ::v-deep .password-dialog {
    width: 90%;
  }
}

/* Theme Selector Styles */
.theme-option {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  display: inline-block;
  box-shadow: 0 0 8px currentColor;

  &--cyberpunk {
    background: linear-gradient(135deg, #00ffff, #ff00ff);
    box-shadow: 0 0 8px #00ffff;
  }

  &--glass {
    background: linear-gradient(135deg, #667eea, #764ba2);
    box-shadow: 0 0 8px #667eea;
  }

  &--tokyo {
    background: linear-gradient(135deg, #ff4081, #00e5ff);
    box-shadow: 0 0 8px #ff4081;
  }

  &--ocean {
    background: linear-gradient(135deg, #64ffda, #00bfff);
    box-shadow: 0 0 8px #64ffda;
  }

  &--aurora {
    background: linear-gradient(135deg, #48d1cc, #9370db, #98fb98);
    box-shadow: 0 0 8px #48d1cc;
  }
}

.theme-dropdown ::v-deep .el-dropdown-menu__item {
  padding: 12px 20px !important;

  &:hover .theme-dot {
    animation: glow-pulse 1s ease-in-out infinite;
  }
}

@keyframes glow-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.8;
  }
}
</style>
