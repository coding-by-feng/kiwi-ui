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
        <el-button type="info" size="small" @click="handleLoginOut" class="logout-button">
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
            <i class="el-icon-video-camera"></i>
            <span>{{ $t('user.pronunciationSource') }}</span>
          </div>
          <el-dropdown @command="pronunciationSourceChange" trigger="click" class="custom-dropdown">
            <el-button size="small" type="text" class="dropdown-button">
              {{ user.pronunciationSource || $t('common.default') }} <i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
              <el-dropdown-item command="Local">Local</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-s-flag"></i>
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
            <i class="el-icon-document-copy"></i>
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
            <i class="el-icon-headset"></i>
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
            <i class="el-icon-edit-outline"></i>
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
            <i class="el-icon-chat-line-square"></i>
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
            <i class="el-icon-bell"></i>
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
            <i class="el-icon-reading"></i>
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
            <i class="el-icon-document"></i>
            <span>{{ $t('user.englishToEnglish') }}</span>
          </div>
          <el-switch
              v-model="enToEnEnabled"
              @change="isEnToEnChange"
              class="custom-switch">
          </el-switch>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import util from '@/util/util'

const USER_NAME = 'user_name'

export default {
  name: 'UserCenter',
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

      languageCodes: kiwiConst.TRANSLATION_LANGUAGE_CODE
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
    }
  },

  mounted() {
    this.initializeSettings()
    this.refresh()
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
      if (util.isEmptyStr(this.user.pronunciationSource)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
          content: kiwiConst.PRONUNCIATION_SOURCE.LOCAL,
          type: 'local'
        })
      }
      if (util.isEmptyStr(this.user.bgm)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.BGM,
          content: kiwiConst.ENABLE_BGM.ENABLE,
          type: 'local'
        })
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
      if (util.isEmptyStr(this.user.clipboardDetection)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.CLIPBOARD_DETECTION,
          content: kiwiConst.CLIPBOARD_DETECTION.ENABLE,
          type: 'local'
        })
        this.user.clipboardDetection = kiwiConst.CLIPBOARD_DETECTION.ENABLE
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
    }
  }
}
</script>

<style lang="scss" scoped>
.user-center-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 24px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid #e4e7ed;
  overflow: hidden;
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
  }
}

/* Logout Button Styling */
.logout-button {
  background: linear-gradient(135deg, #909399 0%, #606266 100%) !important;
  border: none !important;
  color: white !important;
  padding: 12px 20px !important;
  border-radius: 8px !important;
  font-weight: 500 !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;

  &:hover {
    background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
    color: white !important;
    transform: translateY(-1px) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
  }

  &:focus {
    background: linear-gradient(135deg, #82848a 0%, #565a5f 100%) !important;
    color: white !important;
    box-shadow: 0 0 0 2px rgba(144, 147, 153, 0.3) !important;
  }

  &:active {
    transform: translateY(0px) !important;
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

      i {
        color: #409eff;
        width: 16px;
        font-size: 16px;
      }

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

/* Remove the special clipboard detection styling since we're applying to all */

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

.user-center-container {
  animation: fadeInUp 0.6s ease;
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
</style>