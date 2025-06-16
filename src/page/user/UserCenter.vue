<template>
  <div class="user-center-container">
    <!-- User Profile Header -->
    <div class="user-profile-header">
      <div class="avatar-section">
        <el-avatar :size="80" :src="userInfo.avatar" class="user-avatar">
          <i class="el-icon-user-solid"></i>
        </el-avatar>
        <div class="user-basic-info">
          <h3>{{ userInfo.realName || userInfo.userName }}</h3>
          <p class="user-email">{{ userInfo.email || '未设置邮箱' }}</p>
          <el-tag v-if="userInfo.registerSource" :type="getSourceTagType(userInfo.registerSource)" size="mini">
            {{ getSourceText(userInfo.registerSource) }}
          </el-tag>
        </div>
      </div>
      <div class="user-actions">
        <el-button type="info" size="small" @click="showEditProfile = true">
          <i class="el-icon-edit"></i> 编辑资料
        </el-button>
        <el-button type="info" size="small" @click="handleLoginOut">
          <i class="el-icon-switch-button"></i> 退出登录
        </el-button>
      </div>
    </div>

    <el-divider></el-divider>

    <!-- Account Binding Section -->
    <div class="account-binding-section">
      <h4><i class="el-icon-link"></i> 账号绑定</h4>
      <div class="binding-cards">
        <!-- Google Account -->
        <div class="binding-card">
          <div class="binding-header">
            <div class="binding-icon google">
              <svg viewBox="0 0 24 24" width="20" height="20">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <span class="binding-title">Google 账号</span>
          </div>
          <div class="binding-content">
            <div v-if="userInfo.googleOpenid" class="bound-account">
              <p class="bound-text">已绑定</p>
              <el-button type="text" size="mini" @click="handleUnlinkGoogle">解除绑定</el-button>
            </div>
            <div v-else class="unbound-account">
              <p class="unbound-text">未绑定</p>
              <el-button type="info" size="mini" @click="handleLinkGoogle">立即绑定</el-button>
            </div>
          </div>
        </div>

        <!-- WeChat Account -->
        <div class="binding-card">
          <div class="binding-header">
            <div class="binding-icon wechat">
              <i class="icon-wechat"></i>
            </div>
            <span class="binding-title">微信账号</span>
          </div>
          <div class="binding-content">
            <div v-if="userInfo.wxOpenid" class="bound-account">
              <p class="bound-text">已绑定</p>
              <el-button type="text" size="mini" @click="handleUnlinkWeChat">解除绑定</el-button>
            </div>
            <div v-else class="unbound-account">
              <p class="unbound-text">未绑定</p>
              <el-button type="info" size="mini" @click="handleLinkWeChat">立即绑定</el-button>
            </div>
          </div>
        </div>

        <!-- QQ Account -->
        <div class="binding-card">
          <div class="binding-header">
            <div class="binding-icon qq">
              <i class="icon-qq"></i>
            </div>
            <span class="binding-title">QQ账号</span>
          </div>
          <div class="binding-content">
            <div v-if="userInfo.qqOpenid" class="bound-account">
              <p class="bound-text">已绑定</p>
              <el-button type="text" size="mini" @click="handleUnlinkQQ">解除绑定</el-button>
            </div>
            <div v-else class="unbound-account">
              <p class="unbound-text">未绑定</p>
              <el-button type="info" size="mini" @click="handleLinkQQ">立即绑定</el-button>
            </div>
          </div>
        </div>
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

    <!-- Edit Profile Dialog -->
    <el-dialog
        title="编辑个人资料"
        :visible.sync="showEditProfile"
        width="500px"
        @close="resetEditForm">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.realName" placeholder="请输入真实姓名"></el-input>
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱地址"></el-input>
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号"></el-input>
        </el-form-item>
        <el-form-item label="头像">
          <el-input v-model="editForm.avatar" placeholder="请输入头像URL"></el-input>
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="showEditProfile = false">取消</el-button>
        <el-button type="info" @click="saveProfile">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'
import review from '@/api/review'
import kiwiConst from '@/const/kiwiConsts'
import util from '@/util/util'
import { googleApi, GoogleSignInManager } from '@/api/google-api'

const USER_NAME = 'user_name'

export default {
  name: 'EnhancedUserCenter',
  data() {
    return {
      showEditProfile: false,
      googleSignInManager: new GoogleSignInManager(),

      userInfo: {
        userName: getStore({ name: USER_NAME }),
        email: '',
        avatar: '',
        realName: '',
        registerSource: '',
        googleOpenid: '',
        wxOpenid: '',
        qqOpenid: ''
      },

      editForm: {
        realName: '',
        email: '',
        phone: '',
        avatar: ''
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
    this.loadUserInfo()
    this.refresh()
    this.initGoogleSignIn()
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
    // Original methods from your UserCenter component
    initializeSettings() {
      if (util.isEmptyStr(this.user.pronunciationSource)) {
        setStore({
          name: kiwiConst.CONFIG_KEY.PRONUNCIATION_SOURCE,
          content: kiwiConst.PRONUNCIATION_SOURCE.LOCAL,
          type: 'local'
        })
      }
      // ... other initialization code
    },

    // User profile methods
    async loadUserInfo() {
      try {
        const response = await this.$http.get('/sys/user/current/info')
        if (response.data.code === 200) {
          const userData = response.data.data.sysUser
          this.userInfo = {
            ...this.userInfo,
            email: userData.email,
            avatar: userData.avatar,
            realName: userData.realName,
            registerSource: userData.registerSource,
            googleOpenid: userData.googleOpenid,
            wxOpenid: userData.wxOpenid,
            qqOpenid: userData.qqOpenid
          }
        }
      } catch (error) {
        console.error('Failed to load user info:', error)
      }
    },

    resetEditForm() {
      this.editForm = {
        realName: this.userInfo.realName || '',
        email: this.userInfo.email || '',
        phone: this.userInfo.phone || '',
        avatar: this.userInfo.avatar || ''
      }
    },

    async saveProfile() {
      try {
        const response = await this.$http.put('/sys/user', this.editForm)
        if (response.data.code === 200) {
          this.$message.success('个人资料更新成功')
          this.showEditProfile = false
          this.loadUserInfo()
        }
      } catch (error) {
        this.$message.error('更新失败，请重试')
      }
    },

    // Google account binding methods
    async initGoogleSignIn() {
      try {
        await this.googleSignInManager.init(process.env.VUE_APP_GOOGLE_CLIENT_ID)
      } catch (error) {
        console.error('Google Sign-In initialization failed:', error)
      }
    },

    async handleLinkGoogle() {
      try {
        const googleUser = await this.googleSignInManager.signIn()
        const linkData = {
          username: this.userInfo.userName,
          password: '', // You might want to ask for password confirmation
          ...googleUser
        }

        // Show password confirmation dialog here
        this.$prompt('请输入当前账号密码以确认绑定', '确认身份', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          inputType: 'password'
        }).then(async ({ value }) => {
          linkData.password = value
          const response = await googleApi.linkGoogleAccount(linkData)
          if (response.data.code === 200) {
            this.$message.success('Google账号绑定成功')
            this.loadUserInfo()
          }
        })
      } catch (error) {
        if (error.message !== '登录已取消') {
          this.$message.error('绑定失败：' + error.message)
        }
      }
    },

    async handleUnlinkGoogle() {
      try {
        await this.$confirm('确定要解除Google账号绑定吗？', '确认操作', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })

        const response = await googleApi.unlinkGoogleAccount(this.userInfo.userId)
        if (response.data.code === 200) {
          this.$message.success('Google账号解绑成功')
          this.userInfo.googleOpenid = ''
        }
      } catch (error) {
        if (error !== 'cancel') {
          this.$message.error('解绑失败，请重试')
        }
      }
    },

    handleLinkWeChat() {
      this.$message.info('微信绑定功能开发中...')
    },

    handleUnlinkWeChat() {
      this.$message.info('微信解绑功能开发中...')
    },

    handleLinkQQ() {
      this.$message.info('QQ绑定功能开发中...')
    },

    handleUnlinkQQ() {
      this.$message.info('QQ解绑功能开发中...')
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

    // Original settings methods
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

.account-binding-section,
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

.binding-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;

  .binding-card {
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    transition: all 0.3s ease;

    &:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .binding-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;

      .binding-icon {
        width: 32px;
        height: 32px;
        border-radius: 6px;
        display: flex;
        align-items: center;
        justify-content: center;

        &.google {
          background: #f8f9ff;
        }

        &.wechat {
          background: #f0f9f0;
          color: #07c160;
        }

        &.qq {
          background: #f0f8ff;
          color: #12b7f5;
        }
      }

      .binding-title {
        font-weight: 500;
        color: #333;
      }
    }

    .binding-content {
      .bound-account {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .bound-text {
          color: #10b981;
          font-size: 14px;
          margin: 0;
        }
      }

      .unbound-account {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .unbound-text {
          color: #9ca3af;
          font-size: 14px;
          margin: 0;
        }
      }
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

  .binding-cards,
  .stats-cards,
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>