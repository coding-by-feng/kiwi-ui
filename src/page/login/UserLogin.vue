<template>
  <div class="login-container">
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
          </div>

          <!-- Google Login Only -->
          <div class="social-login-container">
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
              <span>使用Google账号登录</span>
              <div class="loading-spinner" v-if="googleLoading">
                <i class="el-icon-loading"></i>
              </div>
            </div>
          </div>
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
import {mapGetters} from 'vuex'

export default {
  name: 'GoogleLogin',
  data() {
    return {
      googleLoading: false,
      pageLoading: false,
      loadingText: '正在处理...',

      // Store Google user info for potential account linking
      pendingGoogleUser: null
    }
  },

  mounted() {
    console.log('🚀 [LOGIN] Component mounted')
    console.log('📊 [LOGIN] Initial state:', {
      website: this.website
    })
  },

  computed: {
    ...mapGetters(['website'])
  },

  methods: {
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
          console.log('🔗 [GOOGLE] Account not found')
          this.$message.error('账号未找到，请联系管理员')
        }
      } catch (error) {
        console.error('❌ [GOOGLE] Error processing Google user:', error)
        throw error
      }
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
// Google-Only Login Component - Grey Theme Styles
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
  margin-bottom: 40px;

  h2 {
    font-size: 24px;
    color: #374151;
    margin-bottom: 8px;
    font-weight: 600;
  }

  p {
    color: #6b7280;
    font-size: 16px;
    margin: 0;
  }
}

// Social Login Styling
.social-login-container {
  .social-login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px 20px;
    border: 2px solid #d1d5db;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
    min-height: 56px;

    &:hover {
      border-color: #4285f4;
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
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
      font-size: 16px;
      font-weight: 600;
    }

    .loading-spinner {
      position: absolute;
      right: 20px;
      color: #4285f4;
      font-size: 18px;
    }

    &.google-login {
      border-color: #4285f4;
      background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
      color: white;

      span {
        color: white;
      }

      &:hover {
        box-shadow: 0 6px 20px rgba(66, 133, 244, 0.3);
        transform: translateY(-3px);
      }
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
  color: #4285f4;

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
      font-size: 14px;
    }
  }
}
</style>