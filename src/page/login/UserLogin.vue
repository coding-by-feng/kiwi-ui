<template>
  <div class="login-container" @keyup.enter="handleLogin">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-logo">
            <i class="el-icon-reading"></i>
          </div>
          <h1 class="brand-title">{{ website.infoTitle }}</h1>
          <p class="brand-subtitle">智能英语学习平台</p>
          <div class="feature-list">
            <div class="feature-item">
              <i class="el-icon-star-on"></i>
              <span>智能单词记忆</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-headset"></i>
              <span>纯正发音练习</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-trophy"></i>
              <span>个性化学习计划</span>
            </div>
          </div>
        </div>
        <div class="copyright">
          <p>©2025 Kiwi English Learning Platform v2.0</p>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>欢迎回来</h2>
            <p>选择您的登录方式</p>
          </div>

          <!-- Login Tabs -->
          <el-tabs v-model="activeTab" class="login-tabs" @tab-click="handleTabClick">
            <!-- Traditional Login -->
            <el-tab-pane label="账号登录" name="traditional">
              <el-form
                  ref="loginForm"
                  :model="loginForm"
                  :rules="loginRules"
                  class="login-form"
                  size="medium"
                  @submit.native.prevent="handleLogin">

                <el-form-item prop="username">
                  <el-input
                      v-model="loginForm.username"
                      placeholder="请输入用户名或邮箱"
                      prefix-icon="el-icon-user"
                      clearable
                      @focus="handleInputFocus('username')"
                      @blur="handleInputBlur('username')"
                      @input="handleInputChange('username', $event)">
                  </el-input>
                </el-form-item>

                <el-form-item prop="password">
                  <el-input
                      v-model="loginForm.password"
                      :type="passwordVisible ? 'text' : 'password'"
                      placeholder="请输入密码"
                      prefix-icon="el-icon-lock"
                      @focus="handleInputFocus('password')"
                      @blur="handleInputBlur('password')"
                      @input="handleInputChange('password', $event)">
                    <i
                        slot="suffix"
                        :class="passwordVisible ? 'el-icon-view-off' : 'el-icon-view'"
                        class="password-icon"
                        @click="togglePasswordVisibility">
                    </i>
                  </el-input>
                </el-form-item>

                <el-form-item prop="code" v-if="showCaptcha">
                  <el-row :gutter="16">
                    <el-col :span="12">
                      <el-input
                          v-model="loginForm.code"
                          placeholder="验证码"
                          prefix-icon="el-icon-picture-outline"
                          :maxlength="code.len"
                          clearable
                          @focus="handleInputFocus('captcha')"
                          @blur="handleInputBlur('captcha')"
                          @input="handleInputChange('captcha', $event)">
                      </el-input>
                    </el-col>
                    <el-col :span="12">
                      <div class="captcha-container">
                        <img
                            :src="code.src"
                            alt="验证码"
                            class="captcha-image"
                            @click="refreshCode">
                      </div>
                    </el-col>
                  </el-row>
                </el-form-item>

                <div class="login-options">
                  <el-checkbox v-model="rememberMe" @change="handleRememberMeChange">记住我</el-checkbox>
                  <a href="#" class="forgot-password" @click="handleForgotPassword">忘记密码？</a>
                </div>

                <el-button
                    type="primary"
                    class="login-btn"
                    :loading="loginLoading"
                    @click="handleLogin">
                  <span v-if="!loginLoading">登录</span>
                  <span v-else>登录中...</span>
                </el-button>

                <div class="register-section">
                  <span>还没有账号？</span>
                  <el-button
                      type="text"
                      class="register-btn"
                      @click="handleRegister">
                    一键注册
                  </el-button>
                </div>
              </el-form>
            </el-tab-pane>

            <!-- Social Login -->
            <el-tab-pane label="快速登录" name="social">
              <div class="social-login-container">
                <div class="social-login-header">
                  <p>使用第三方账号快速登录</p>
                </div>

                <!-- Google Login -->
                <div class="social-login-button google-login" @click="handleGoogleLogin">
                  <div class="social-icon">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <span>使用 Google 账号登录</span>
                  <div class="loading-spinner" v-if="googleLoading">
                    <i class="el-icon-loading"></i>
                  </div>
                </div>

                <!-- WeChat Login -->
                <div class="social-login-button wechat-login" @click="handleWeChatLogin">
                  <div class="social-icon">
                    <i class="icon-wechat" style="color: #07C160; font-size: 20px;"></i>
                  </div>
                  <span>使用微信账号登录</span>
                </div>

                <!-- QQ Login -->
                <div class="social-login-button qq-login" @click="handleQQLogin">
                  <div class="social-icon">
                    <i class="icon-qq" style="color: #12B7F5; font-size: 20px;"></i>
                  </div>
                  <span>使用QQ账号登录</span>
                </div>

                <div class="social-login-divider">
                  <span>或</span>
                </div>

                <!-- Link Account Section -->
                <div class="link-account-section" v-if="showLinkAccount">
                  <h4>关联现有账号</h4>
                  <p>检测到您已有账号，是否关联到现有账号？</p>
                  <el-form :model="linkForm" ref="linkForm" size="small">
                    <el-form-item>
                      <el-input
                          v-model="linkForm.username"
                          placeholder="现有账号用户名"
                          prefix-icon="el-icon-user"
                          @focus="handleInputFocus('link_username')"
                          @blur="handleInputBlur('link_username')"
                          @input="handleInputChange('link_username', $event)">
                      </el-input>
                    </el-form-item>
                    <el-form-item>
                      <el-input
                          v-model="linkForm.password"
                          type="password"
                          placeholder="现有账号密码"
                          prefix-icon="el-icon-lock"
                          @focus="handleInputFocus('link_password')"
                          @blur="handleInputBlur('link_password')"
                          @input="handleInputChange('link_password', $event)">
                      </el-input>
                    </el-form-item>
                    <div class="link-actions">
                      <el-button size="small" @click="cancelLinkAccount">取消</el-button>
                      <el-button type="primary" size="small" @click="confirmLinkAccount">关联账号</el-button>
                    </div>
                  </el-form>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>

      <!-- Loading Overlay -->
      <div v-if="pageLoading" class="loading-overlay">
        <div class="loading-content">
          <i class="el-icon-loading"></i>
          <p>{{ loadingText }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {randomLenNum} from '@/util/util'
import {mapGetters} from 'vuex'
import {oneClickRegister} from '@/api/login'

export default {
  name: 'EnhancedLogin',
  data() {
    return {
      activeTab: 'traditional',
      passwordVisible: false,
      rememberMe: false,
      loginLoading: false,
      googleLoading: false,
      pageLoading: false,
      loadingText: '正在处理...',
      showCaptcha: true,
      showLinkAccount: false,

      loginForm: {
        username: 'test',
        password: '123456',
        code: '',
        randomStr: ''
      },

      linkForm: {
        username: '',
        password: ''
      },

      code: {
        src: '/code',
        value: '',
        len: 4,
        type: 'image'
      },

      loginRules: {
        username: [
          {required: true, message: '请输入用户名或邮箱', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 6, message: '密码长度至少6位', trigger: 'blur'}
        ],
        code: [
          {required: true, message: '请输入验证码', trigger: 'blur'}
        ]
      },

      // Store Google user info for potential account linking
      pendingGoogleUser: null
    }
  },

  mounted() {
    console.log('🚀 [LOGIN] Component mounted')
    console.log('📊 [LOGIN] Initial state:', {
      activeTab: this.activeTab,
      showCaptcha: this.showCaptcha,
      rememberMe: this.rememberMe,
      website: this.website
    })
    this.refreshCode()
  },

  computed: {
    ...mapGetters(['website'])
  },

  methods: {
    // Event handlers for UI interactions
    handleTabClick(tab) {
      console.log('🔄 [TAB] Tab clicked:', {
        newTab: tab.name,
        previousTab: this.activeTab
      })
      this.activeTab = tab.name
    },

    handleInputFocus(field) {
      console.log('🎯 [INPUT] Focus event:', {
        field: field,
        timestamp: new Date().toISOString()
      })
    },

    handleInputBlur(field) {
      console.log('👋 [INPUT] Blur event:', {
        field: field,
        timestamp: new Date().toISOString()
      })
    },

    handleInputChange(field, value) {
      console.log('✏️ [INPUT] Change event:', {
        field: field,
        valueLength: value ? value.length : 0,
        hasValue: !!value,
        timestamp: new Date().toISOString()
      })
    },

    togglePasswordVisibility() {
      this.passwordVisible = !this.passwordVisible
      console.log('👁️ [PASSWORD] Visibility toggled:', {
        visible: this.passwordVisible,
        timestamp: new Date().toISOString()
      })
    },

    handleRememberMeChange(value) {
      console.log('💾 [REMEMBER] Remember me changed:', {
        value: value,
        timestamp: new Date().toISOString()
      })
    },

    handleForgotPassword(event) {
      event.preventDefault()
      console.log('🔐 [FORGOT] Forgot password clicked')
    },

    // Traditional login methods
    refreshCode() {
      console.log('🔄 [CAPTCHA] Refreshing captcha code')
      const oldRandomStr = this.loginForm.randomStr

      this.loginForm.code = ''
      this.loginForm.randomStr = randomLenNum(this.code.len, true)
      this.code.src = `/code?randomStr=${this.loginForm.randomStr}`

      console.log('✨ [CAPTCHA] Code refreshed:', {
        oldRandomStr: oldRandomStr,
        newRandomStr: this.loginForm.randomStr,
        src: this.code.src
      })
    },

    handleLogin() {
      console.log('🔐 [LOGIN] Login attempt started')
      console.log('📝 [LOGIN] Form data:', {
        username: this.loginForm.username,
        passwordLength: this.loginForm.password ? this.loginForm.password.length : 0,
        codeLength: this.loginForm.code ? this.loginForm.code.length : 0,
        randomStr: this.loginForm.randomStr,
        rememberMe: this.rememberMe
      })

      this.$refs.loginForm.validate(valid => {
        console.log('✅ [VALIDATION] Form validation result:', valid)

        if (valid) {
          this.loginLoading = true
          console.log('⏳ [LOGIN] Setting loading state to true')

          this.$store.dispatch('LoginByUsername', this.loginForm)
              .then((response) => {
                console.log('✅ [LOGIN] Login successful:', response)
                this.redirectAfterLogin()
              })
              .catch(error => {
                console.error('❌ [LOGIN] Login failed:', error)
                this.refreshCode()
                this.$message.error('登录失败，请检查用户名和密码')
              })
              .finally(() => {
                this.loginLoading = false
                console.log('🏁 [LOGIN] Login process completed, loading state set to false')
              })
        } else {
          console.warn('⚠️ [VALIDATION] Form validation failed')
        }
      })
    },

    handleRegister() {
      console.log('📝 [REGISTER] One-click registration started')
      console.log('📊 [REGISTER] Registration data:', {
        code: this.loginForm.code,
        randomStr: this.loginForm.randomStr
      })

      this.loginLoading = true

      oneClickRegister(this.loginForm.code, this.loginForm.randomStr)
          .then(res => {
            console.log('✅ [REGISTER] Registration successful:', res.data)

            this.$message.success({
              duration: 3000,
              message: '注册成功，密码默认123456，请直接登录'
            })

            this.loginForm.username = res.data.data.username
            this.loginForm.password = res.data.data.password
            this.passwordVisible = true

            console.log('🔄 [REGISTER] Auto-filled login form:', {
              username: this.loginForm.username,
              password: this.loginForm.password,
              passwordVisible: this.passwordVisible
            })

            this.refreshCode()
          })
          .catch(error => {
            console.error('❌ [REGISTER] Registration failed:', error)
            this.$message.error('注册失败，请重试')
            this.refreshCode()
          })
          .finally(() => {
            this.loginLoading = false
            console.log('🏁 [REGISTER] Registration process completed')
          })
    },

    // Google OAuth methods
    async handleGoogleLogin() {
      console.log('🔵 [GOOGLE] Google login initiated')

      try {
        this.googleLoading = true
        this.loadingText = '正在连接Google...'
        this.pageLoading = true

        console.log('⏳ [GOOGLE] Setting loading states')

        // Method 1: Using Google API directly
        if (window.gapi && window.gapi.auth2) {
          console.log('📱 [GOOGLE] Using Google API directly')
          const authInstance = window.gapi.auth2.getAuthInstance()
          const googleUser = await authInstance.signIn()

          console.log('✅ [GOOGLE] Google sign-in successful:', googleUser)
          await this.processGoogleUser(googleUser)
        } else {
          console.log('🌐 [GOOGLE] Using backend authorization URL')
          // Method 2: Get authorization URL from backend
          const response = await this.$http.get('/auth/oauth/google/authorize')

          console.log('📡 [GOOGLE] Backend response:', response.data)

          if (response.data.code === 1) {
            console.log('🔀 [GOOGLE] Redirecting to Google OAuth:', response.data.data.authorizationUrl)
            window.location.href = response.data.data.authorizationUrl
          }
        }
      } catch (error) {
        console.error('❌ [GOOGLE] Google login error:', error)
        this.$message.error('Google登录失败，请重试')
      } finally {
        this.googleLoading = false
        this.pageLoading = false
        console.log('🏁 [GOOGLE] Google login process completed')
      }
    },

    async processGoogleUser(googleUser) {
      console.log('🔄 [GOOGLE] Processing Google user:', googleUser)

      try {
        const profile = googleUser.getBasicProfile()
        const authResponse = googleUser.getAuthResponse()

        const userData = {
          id: profile.getId(),
          name: profile.getName(),
          email: profile.getEmail(),
          imageUrl: profile.getImageUrl(),
          accessToken: authResponse.access_token
        }

        console.log('📊 [GOOGLE] Extracted user data:', userData)

        // Attempt to login with Google
        const loginResponse = await this.$http.post('/auth/oauth/google/login', {
          accessToken: userData.accessToken
        })

        console.log('📡 [GOOGLE] Login response:', loginResponse.data)

        if (loginResponse.data.code === 200) {
          console.log('✅ [GOOGLE] Google login successful')
          this.storeAuthTokens(loginResponse.data.data)
          this.redirectAfterLogin()
        } else if (loginResponse.data.code === 404) {
          console.log('🔗 [GOOGLE] Account not found, showing link account option')
          this.pendingGoogleUser = userData
          this.showLinkAccount = true
        }
      } catch (error) {
        console.error('❌ [GOOGLE] Error processing Google user:', error)
        throw error
      }
    },

    // Account linking methods
    async confirmLinkAccount() {
      console.log('🔗 [LINK] Account linking initiated')
      console.log('📊 [LINK] Link form data:', {
        username: this.linkForm.username,
        passwordLength: this.linkForm.password ? this.linkForm.password.length : 0,
        pendingGoogleUser: this.pendingGoogleUser
      })

      if (!this.linkForm.username || !this.linkForm.password) {
        console.warn('⚠️ [LINK] Incomplete form data')
        this.$message.error('请输入完整的账号信息')
        return
      }

      try {
        this.pageLoading = true
        this.loadingText = '正在关联账号...'

        console.log('⏳ [LINK] Setting loading state')

        const linkData = {
          username: this.linkForm.username,
          password: this.linkForm.password,
          ...this.pendingGoogleUser
        }

        console.log('📡 [LINK] Sending link request:', linkData)

        const response = await this.$http.post('/admin/sys/user/google/link', linkData)

        console.log('📡 [LINK] Link response:', response.data)

        if (response.data.code === 1) {
          console.log('✅ [LINK] Account linking successful')
          this.$message.success('账号关联成功')

          // Login with the linked account
          const loginResponse = await this.$http.post('/auth/oauth/google/login', {
            accessToken: this.pendingGoogleUser.accessToken
          })

          console.log('📡 [LINK] Post-link login response:', loginResponse.data)

          if (loginResponse.data.code === 200) {
            console.log('✅ [LINK] Post-link login successful')
            this.storeAuthTokens(loginResponse.data.data)
            this.redirectAfterLogin()
          }
        }
      } catch (error) {
        console.error('❌ [LINK] Account linking failed:', error)
        this.$message.error('账号关联失败，请检查用户名和密码')
      } finally {
        this.pageLoading = false
        console.log('🏁 [LINK] Account linking process completed')
      }
    },

    cancelLinkAccount() {
      console.log('❌ [LINK] Account linking cancelled')

      this.showLinkAccount = false
      this.pendingGoogleUser = null
      this.linkForm.username = ''
      this.linkForm.password = ''

      console.log('🧹 [LINK] Link account data cleared')
    },

    // Other social login methods (placeholder)
    handleWeChatLogin() {
      console.log('💬 [WECHAT] WeChat login clicked')
      this.$message.info('微信登录功能开发中...')
    },

    handleQQLogin() {
      console.log('🐧 [QQ] QQ login clicked')
      this.$message.info('QQ登录功能开发中...')
    },

    // Utility methods
    storeAuthTokens(tokenData) {
      console.log('💾 [AUTH] Storing authentication tokens')
      console.log('📊 [AUTH] Token data:', {
        hasAccessToken: !!tokenData.accessToken,
        hasRefreshToken: !!tokenData.refreshToken,
        hasUserInfo: !!tokenData.userInfo
      })

      // Store authentication tokens
      localStorage.setItem('access_token', tokenData.accessToken)

      if (tokenData.refreshToken) {
        localStorage.setItem('refresh_token', tokenData.refreshToken)
      }

      // Store user info
      if (tokenData.userInfo) {
        localStorage.setItem('user_info', JSON.stringify(tokenData.userInfo))
      }

      console.log('✅ [AUTH] Tokens stored successfully')
    },

    redirectAfterLogin() {
      console.log('🔀 [REDIRECT] Preparing post-login redirect')

      const word = this.$route.query.word
      console.log('📊 [REDIRECT] Route query word:', word)

      let redirectPath, redirectQuery

      if (word) {
        redirectPath = '/index/vocabulary/detail'
        redirectQuery = {active: 'search', word: word}
      } else {
        redirectPath = '/index/vocabulary/detail'
        redirectQuery = {active: 'search'}
      }

      console.log('🎯 [REDIRECT] Redirect destination:', {
        path: redirectPath,
        query: redirectQuery
      })

      this.$router.push({
        path: redirectPath,
        query: redirectQuery
      })

      console.log('🔄 [REDIRECT] Reloading page')
      window.location.reload()
    }
  }
}
</script>

<style lang="scss" scoped>
// Enhanced Login Component - Grey Theme Styles
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 40%, rgba(156, 163, 175, 0.05) 0%, transparent 50%);
    pointer-events: none;
  }
}

.login-wrapper {
  display: flex;
  width: 100%;
  max-width: 1200px;
  min-height: 600px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
  0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  overflow: hidden;
  position: relative;
}

// Left Panel - Brand Section
.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 60px 50px 40px;
  color: white;
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 70%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
  }
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.brand-section {
  position: relative;
  z-index: 1;
}

.brand-logo {
  font-size: 48px;
  margin-bottom: 30px;
  opacity: 0;
  animation: fadeInUp 1s ease 0.2s forwards;

  i {
    color: rgba(255, 255, 255, 0.9);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 15px;
  opacity: 0;
  animation: fadeInUp 1s ease 0.4s forwards;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 40px;
  font-weight: 300;
  opacity: 0;
  animation: fadeInUp 1s ease 0.6s forwards;
}

.feature-list {
  opacity: 0;
  animation: fadeInUp 1s ease 0.8s forwards;
}

.feature-item {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  font-size: 16px;
  opacity: 0.95;
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    transform: translateX(5px);
  }

  i {
    font-size: 20px;
    margin-right: 15px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.copyright {
  position: relative;
  z-index: 1;
  opacity: 0.7;
  font-size: 14px;
  opacity: 0;
  animation: fadeInUp 1s ease 1s forwards;

  p {
    margin: 0;
  }
}

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

// Right Panel - Login Section
.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: rgba(249, 250, 251, 0.5);
}

.login-card {
  width: 100%;
  max-width: 400px;
  background: white;
  border-radius: 16px;
  padding: 40px 30px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 231, 235, 0.8);
  opacity: 0;
  animation: slideInRight 1s ease 0.5s forwards;
}

@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;

  h2 {
    font-size: 24px;
    color: #374151;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    font-size: 14px;
    margin: 0;
  }
}

// Tabs Styling
.login-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 25px;
  }

  :deep(.el-tabs__nav-wrap::after) {
    background-color: #e5e7eb;
  }

  :deep(.el-tabs__item) {
    color: #6b7280;
    font-weight: 500;
    padding: 0 20px;

    &.is-active {
      color: #667eea;
      font-weight: 600;
    }

    &:hover {
      color: #667eea;
    }
  }

  :deep(.el-tabs__active-bar) {
    background-color: #667eea;
  }
}

// Form Styling
.login-form {
  :deep(.el-form-item) {
    margin-bottom: 20px;

    .el-input__inner {
      height: 44px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      }

      &::placeholder {
        color: #9ca3af;
      }
    }

    .el-input__prefix,
    .el-input__suffix {
      color: #6b7280;
    }
  }

  .password-icon {
    cursor: pointer;
    color: #9ca3af;
    transition: color 0.3s ease;

    &:hover {
      color: #667eea;
    }
  }
}

// Captcha Styling
.captcha-container {
  height: 80px; // Default height for large screens
  border: 1px solid #d1d5db;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: #667eea;
  }

  .captcha-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }

  // Tablet and smaller screens
  @media (max-width: 768px) {
    height: 60px;
  }

  // Mobile phones
  @media (max-width: 480px) {
    height: 40px;
  }
}

// Login Options
.login-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;

  :deep(.el-checkbox) {
    .el-checkbox__label {
      color: #6b7280;
      font-size: 14px;
    }

    .el-checkbox__input.is-checked {
      .el-checkbox__inner {
        background-color: #667eea;
        border-color: #667eea;
      }
    }
  }

  .forgot-password {
    color: #667eea;
    text-decoration: none;
    font-size: 14px;
    transition: color 0.3s ease;

    &:hover {
      color: #5a67d8;
    }
  }
}

// Login Button
:deep(.login-btn) {
  width: 100%;
  height: 44px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  border: none !important;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 8px 15px rgba(102, 126, 234, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

// Register Section
.register-section {
  text-align: center;
  color: #6b7280;
  font-size: 14px;

  :deep(.register-btn) {
    color: #667eea;
    font-weight: 500;
    padding: 0 8px;

    &:hover {
      color: #5a67d8;
    }
  }
}

// Social Login Styling
.social-login-container {
  .social-login-header {
    text-align: center;
    margin-bottom: 25px;

    p {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
  }

  .social-login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    border: 1px solid #d1d5db;
    border-radius: 8px;
    margin-bottom: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;

    &:hover {
      border-color: #9ca3af;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      transform: translateY(-1px);
    }

    .social-icon {
      margin-right: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    span {
      flex: 1;
      text-align: center;
      color: #374151;
      font-size: 14px;
      font-weight: 500;
    }

    .loading-spinner {
      position: absolute;
      right: 16px;
      color: #667eea;
    }

    &.google-login:hover {
      border-color: #4285f4;
    }

    &.wechat-login:hover {
      border-color: #07c160;
    }

    &.qq-login:hover {
      border-color: #12b7f5;
    }
  }

  .social-login-divider {
    text-align: center;
    margin: 25px 0;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: #e5e7eb;
    }

    span {
      background: white;
      color: #9ca3af;
      padding: 0 15px;
      font-size: 14px;
      position: relative;
    }
  }
}

// Link Account Section
.link-account-section {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;

  h4 {
    color: #374151;
    font-size: 16px;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    font-size: 14px;
    margin-bottom: 20px;
  }

  :deep(.el-form-item) {
    margin-bottom: 15px;

    .el-input__inner {
      height: 36px;
      font-size: 13px;
    }
  }

  .link-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 15px;

    :deep(.el-button) {
      padding: 8px 16px;
      font-size: 13px;
    }
  }
}

// Loading Overlay
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(5px);
  z-index: 1000;
}

.loading-content {
  text-align: center;
  color: #667eea;

  i {
    font-size: 32px;
    margin-bottom: 16px;
    display: block;
  }

  p {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }
}

// Responsive Design
@media (max-width: 968px) {
  .login-wrapper {
    flex-direction: column;
    max-width: 500px;
    margin: 20px;
  }

  .login-left {
    padding: 40px 30px 30px;
    text-align: center;

    .brand-title {
      font-size: 28px;
    }

    .feature-list {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 15px;
    }

    .feature-item {
      margin-bottom: 0;
      flex-direction: column;
      text-align: center;

      i {
        margin-right: 0;
        margin-bottom: 5px;
      }

      span {
        font-size: 12px;
      }
    }
  }

  .login-right {
    padding: 30px 20px;
  }

  .login-card {
    padding: 30px 25px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 10px;
  }

  .login-wrapper {
    margin: 0;
    border-radius: 12px;
  }

  .login-card {
    padding: 25px 20px;
  }

  .social-login-button {
    span {
      font-size: 13px;
    }
  }
}
</style>