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
        <el-button type="info" size="small" @click="handleLoginOut">
          <i class="el-icon-switch-button"></i> 退出登录
        </el-button>
      </div>
    </div>

    <el-divider></el-divider>

    <!-- Statistics Section -->
    <div class="statistics-section">
      <h4><i class="el-icon-data-analysis"></i> 学习统计</h4>
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon remember">
            <i class="el-icon-success"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.rememberCount }}</h5>
            <p>今日已记住</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon review">
            <i class="el-icon-refresh"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.reviewCount }}</h5>
            <p>今日已复习</p>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon master">
            <i class="el-icon-star-on"></i>
          </div>
          <div class="stat-content">
            <h5>{{ user.keepInMindCount }}</h5>
            <p>今日已牢记</p>
          </div>
        </div>
      </div>
    </div>

    <el-divider></el-divider>

    <!-- Settings Section -->
    <div class="settings-section">
      <h4><i class="el-icon-setting"></i> 学习设置</h4>
      <div class="settings-grid">
        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-video-camera"></i>
            <span>发音来源</span>
          </div>
          <el-dropdown @command="pronunciationSourceChange" trigger="click">
            <el-button size="small" type="text">
              {{ user.pronunciationSource || '默认' }} <i class="el-icon-arrow-down el-icon--right"></i>
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
            <span>母语设置</span>
          </div>
          <el-dropdown @command="nativeLangChange" trigger="click">
            <el-button size="small" type="text">
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

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-headset"></i>
            <span>背景音乐</span>
          </div>
          <el-switch
              v-model="bgmEnabled"
              @change="bgmChange">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-edit-outline"></i>
            <span>字母拼写</span>
          </div>
          <el-switch
              v-model="spellEnabled"
              @change="spellTypeChange">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-chat-line-square"></i>
            <span>英文释义</span>
          </div>
          <el-switch
              v-model="enParaEnabled"
              @change="enParaTypeChange">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-bell"></i>
            <span>消息提醒</span>
          </div>
          <el-switch
              v-model="msgHintEnabled"
              @change="enableMsgHintChange">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-reading"></i>
            <span>播放例句</span>
          </div>
          <el-switch
              v-model="playExampleEnabled"
              @change="isPlayExampleChange">
          </el-switch>
        </div>

        <div class="setting-item">
          <div class="setting-label">
            <i class="el-icon-document"></i>
            <span>英英模式</span>
          </div>
          <el-switch
              v-model="enToEnEnabled"
              @change="isEnToEnChange">
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
      const texts = {
        'local': '本地注册',
        'google': 'Google注册',
        'wechat': '微信注册',
        'qq': 'QQ注册'
      }
      return texts[source] || '未知来源'
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
    },

    nativeLangChange(command) {
      setStore({
        name: kiwiConst.CONFIG_KEY.NATIVE_LANG,
        content: command,
        type: 'local'
      })
      this.user.nativeLang = command
    },

    bgmChange(enabled) {
      const value = enabled ? kiwiConst.ENABLE_BGM.ENABLE : kiwiConst.ENABLE_BGM.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.BGM,
        content: value,
        type: 'local'
      })
      this.user.bgm = value
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
    },

    enParaTypeChange(enabled) {
      const value = enabled ? kiwiConst.ENGLISH_PARAPHRASE_TYPE.ENABLE : kiwiConst.ENGLISH_PARAPHRASE_TYPE.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.EN_PARA_TYPE,
        content: value,
        type: 'local'
      })
      this.user.enParaType = value
    },

    enableMsgHintChange(enabled) {
      const value = enabled ? kiwiConst.ENABLE_MSG_HINT.ENABLE : kiwiConst.ENABLE_MSG_HINT.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.ENABLE_MSG_HINT,
        content: value,
        type: 'local'
      })
      this.user.enableMsgHint = value
    },

    isPlayExampleChange(enabled) {
      const value = enabled ? kiwiConst.IS_PLAY_EXAMPLE.ENABLE : kiwiConst.IS_PLAY_EXAMPLE.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_PLAY_EXAMPLE,
        content: value,
        type: 'local'
      })
      this.user.isPlayExample = value
    },

    isEnToEnChange(enabled) {
      const value = enabled ? kiwiConst.IS_EN_TO_EN.ENABLE : kiwiConst.IS_EN_TO_EN.DISABLE
      setStore({
        name: kiwiConst.CONFIG_KEY.IS_EN_TO_EN,
        content: value,
        type: 'local'
      })
      this.user.isEnToEn = value
    },

    tranNativeLang(val) {
      if (util.isEmptyStr(val)) {
        return '默认语言'
      }
      for (const [language, code] of Object.entries(this.languageCodes)) {
        if (code === val) {
          return language.replaceAll('_', ' ')
        }
      }
      return '未知语言'
    },

    refresh() {
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.KEEP_IN_MIND)
          .then(response => {
            if (response.data.data) {
              this.user.keepInMindCount = response.data.data.reviewCount
            }
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REMEMBER)
          .then(response => {
            if (response.data.data) {
              this.user.rememberCount = response.data.data.reviewCount
            }
          })
      review.getReviewCounterVO(kiwiConst.REVIEW_DAILY_COUNTER_TYPE.REVIEW)
          .then(response => {
            if (response.data.data) {
              this.user.reviewCount = response.data.data.reviewCount
            }
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
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.user-profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;

  .avatar-section {
    display: flex;
    align-items: center;
    gap: 16px;

    .user-avatar {
      border: 3px solid #f0f0f0;
    }

    .user-basic-info {
      h3 {
        margin: 0 0 8px 0;
        font-size: 20px;
        font-weight: 600;
        color: #333;
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

.statistics-section,
.settings-section {
  margin-bottom: 32px;

  h4 {
    font-size: 16px;
    font-weight: 600;
    color: #333;
    margin: 0 0 16px 0;
    display: flex;
    align-items: center;
    gap: 8px;

    i {
      color: #4f46e5;
    }
  }
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 16px;

  .stat-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 12px;
    text-align: center;
    position: relative;
    overflow: hidden;

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

      &.remember {
        background: rgba(16, 185, 129, 0.2);
      }

      &.review {
        background: rgba(59, 130, 246, 0.2);
      }

      &.master {
        background: rgba(245, 158, 11, 0.2);
      }

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
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    transition: border-color 0.3s ease;

    &:hover {
      border-color: #d1d5db;
    }

    .setting-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 500;
      color: #374151;

      i {
        color: #6b7280;
        width: 16px;
      }
    }

    .el-dropdown {
      .el-button {
        border: none;
        padding: 0;
        color: #4f46e5;
        font-weight: 500;

        &:hover {
          color: #3730a3;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .user-center-container {
    padding: 16px;
    margin: 16px;
  }

  .user-profile-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .stats-cards,
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>