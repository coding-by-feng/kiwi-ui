<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="brand-section">
          <div class="brand-logo">
            <i class="el-icon-reading"></i>
          </div>
          <h1 class="brand-title">{{ website.infoTitle || $t('auth.brand.title') }}</h1>
          <p class="brand-subtitle">{{ $t('auth.brand.subtitle') }}</p>
          <div class="feature-list">
            <div class="feature-item">
              <i class="el-icon-s-opportunity"></i>
              <span>{{ $t('auth.features.aiAssistantModes') }}</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-collection"></i>
              <span>{{ $t('auth.features.bilingualEnEn') }}</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-video-camera"></i>
              <span>{{ $t('auth.features.youtubePlayer') }}</span>
            </div>
            <div class="feature-item">
              <i class="el-icon-date"></i>
              <span>{{ $t('auth.features.todoGamified') }}</span>
            </div>
          </div>
        </div>
        <div class="copyright">
          <p>{{ $t('auth.copyright') }}</p>
        </div>
      </div>

      <div class="login-right">
        <div class="login-card">
          <div class="login-header">
            <h2>{{ $t('auth.welcome') }}</h2>
          </div>

          <!-- Google Login Only -->
          <div class="social-login-container">
            <!-- Google Login -->
            <div
              class="social-login-button google-login"
              :class="{ disabled: googleLoading }"
              @click="!googleLoading && handleGoogleLogin()"
              role="button"
              tabindex="0"
              @keyup.enter="!googleLoading && handleGoogleLogin()"
              @keyup.space="!googleLoading && handleGoogleLogin()"
            >
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
              <span>{{ $t('auth.google') }}</span>
              <div class="loading-spinner" v-if="googleLoading">
                <i class="el-icon-loading"></i>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="or-divider">
            <span>{{ $t('auth.or') || 'OR' }}</span>
          </div>

          <!-- Username / Password Login -->
          <el-form ref="upForm" :model="upForm" :rules="upRules" label-position="top" class="up-login-form" @submit.native.prevent="handleUsernamePasswordLogin">
            <el-form-item prop="username" :label="$t('auth.username') || 'Username'">
              <el-input
                v-model.trim="upForm.username"
                autocomplete="username"
                placeholder="Username"
                clearable
                @keyup.enter.native="handleUsernamePasswordLogin"
              />
            </el-form-item>
            <el-form-item prop="password" :label="$t('auth.password') || 'Password'">
              <el-input
                v-model="upForm.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Password"
                show-password
                @keyup.enter.native="handleUsernamePasswordLogin"
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="upLoading" :disabled="upLoading" class="full-width" @click="handleUsernamePasswordLogin">
                <span v-if="!upLoading">{{ $t('auth.signIn') || 'Sign In' }}</span>
                <span v-else>{{ $t('auth.processing') || 'Processing...' }}</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <!-- Loading Overlay -->
      <!-- Loading Overlay -->
      <StatusOverlay
        :visible="pageLoading"
        status="loading"
        :title="loadingText"
        :backdrop="true"
      />
    </div>
  </div>
</template>

<script>
import StatusOverlay from '@/components/common/StatusOverlay.vue'
import {mapGetters} from 'vuex'
import { setStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

export default {
  name: 'GoogleLogin',
  components: { StatusOverlay },
  data() {
    return {
      googleLoading: false,
      pageLoading: false,
      loadingText: this.$t('auth.processing'),

      // Store Google user info for potential account linking
      pendingGoogleUser: null,

      // Username/Password form
      upLoading: false,
      upForm: {
        username: '',
        password: ''
      },
      upRules: {
        username: [
          { required: true, message: 'Username is required', trigger: 'blur' },
          { min: 2, message: 'Too short', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Password is required', trigger: 'blur' },
          { min: 4, message: 'Too short', trigger: 'blur' }
        ]
      },
      showPassword: false
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
    // Resolve env var possibly from build-time or Electron preload
    getEnvVar(key) {
      // Web-only: read from process.env
      try { if (process && process.env && process.env[key] !== undefined) return process.env[key] } catch (_) {}
      return undefined
    },

    // Username/Password login
    handleUsernamePasswordLogin() {
      if (this.upLoading) return
      const form = this.$refs.upForm
      if (form && form.validate) {
        form.validate(async (valid) => {
          if (!valid) return
          try {
            this.upLoading = true
            this.pageLoading = true
            this.loadingText = this.$t('auth.processing') || 'Processing...'

            const payload = {
              username: (this.upForm.username || '').trim(),
              password: this.upForm.password || ''
            }

            const resp = await this.$http.post(`${kiwiConsts.API_BASE.AUTH}/username-password/login`, payload, { headers: { isToken: false } })
            const body = (resp && resp.data) || {}
            const code = body.code
            const tokens = body.data || body.result || body
            const hasTokenFields = !!(tokens && (tokens.access_token || tokens.accessToken || tokens.token))

            if (code === 0 || code === 200 || code === true || hasTokenFields) {
              this.storeAuthTokens(tokens)
              try { this.$message.success(this.$t('auth.loginSuccess') || 'Login successful') } catch (_) {}
              this.redirectAfterLogin()
            } else {
              const msg = (body && (body.msg || body.message)) || this.$t('auth.loginFailed') || 'Login failed'
              this.$message.error(msg)
            }
          } catch (e) {
            console.error('❌ [AUTH] Username/Password login error:', e)
            const msg = (e && e.message) || this.$t('auth.loginFailed') || 'Login failed'
            try { this.$message.error(msg) } catch (_) {}
          } finally {
            this.upLoading = false
            this.pageLoading = false
          }
        })
      }
    },

    // Dynamically ensure gapi.auth2 is available; fallback gracefully
    async ensureGapiAuth2() {
      // Already initialized
      if (window.gapi && window.gapi.auth2) {
        let inst = window.gapi.auth2.getAuthInstance()
        if (inst) return inst
      }

      // Try to load the platform.js script
      const loadScript = () => new Promise((resolve, reject) => {
        try {
          // Prevent duplicate script insertion
          if (document.getElementById('gapi-platform')) {
            return resolve()
          }
          const s = document.createElement('script')
          s.src = 'https://apis.google.com/js/platform.js'
          s.async = true
          s.defer = true
          s.id = 'gapi-platform'
          s.onload = () => resolve()
          s.onerror = () => reject(new Error('Failed to load Google Platform JS'))
          document.head.appendChild(s)
        } catch (e) { reject(e) }
      })

      try {
        await loadScript()
      } catch (e) {
        console.warn('⚠️ [GOOGLE] Could not load gapi script:', e && e.message)
        return null
      }

      // Wait for gapi to be ready and initialize auth2
      const waitForGapi = () => new Promise((resolve) => {
        try {
          window.gapi.load('auth2', () => {
            try {
              const clientId = this.getEnvVar('VUE_APP_GOOGLE_CLIENT_ID') || this.getEnvVar('GOOGLE_CLIENT_ID') || this.getEnvVar('GOOGLE_OAUTH_CLIENT_ID')
              if (!clientId) {
                console.warn('⚠️ [GOOGLE] No Google Client ID configured; skipping gapi auth2 init')
                resolve(null)
                return
              }
              const inst = window.gapi.auth2.init({ client_id: String(clientId) })
              resolve(inst)
            } catch (e) {
              console.error('❌ [GOOGLE] Failed to init gapi auth2:', e)
              resolve(null)
            }
          })
        } catch (e) {
          console.error('❌ [GOOGLE] gapi.load failed:', e)
          resolve(null)
        }
      })

      return await waitForGapi()
    },

    // Centralized backend OAuth starter (fallback)
    async startBackendOAuth() {
      console.log('🌐 [GOOGLE] Using backend authorization URL')
      return this.$http.get(`${kiwiConsts.API_BASE.AUTH}/google/authorize`, { headers: { isToken: false } })
        .then(response => {
          console.log('📡 [GOOGLE] Backend response:', response && response.data)
          const data = response && response.data
          const code = data && (data.code !== undefined ? data.code : data.status)
          if (code === 0 || code === 1 || code === 200 || code === true) {
            const url = data.data && (data.data.authorizationUrl || data.data.url)
            if (url) {
              console.log('🔀 [GOOGLE] Redirecting to Google OAuth:', url)
              window.location.href = url
            } else {
              throw new Error('Authorization URL missing in response')
            }
          } else {
            const msg = (data && (data.msg || data.message)) || this.$t('auth.loginFailed')
            throw new Error(msg)
          }
        })
    },

    // Google OAuth methods
    async handleGoogleLogin() {
      console.log('🔵 [GOOGLE] Google login initiated')

      try {
        this.googleLoading = true
        this.loadingText = this.$t('auth.connecting')
        this.pageLoading = true

        console.log('⏳ [GOOGLE] Setting loading states')

        // Optional: allow forcing backend OAuth via env
        const forceBackend = String(this.getEnvVar('VUE_APP_GOOGLE_FORCE_BACKEND_OAUTH') || this.getEnvVar('GOOGLE_FORCE_BACKEND_OAUTH') || '').toLowerCase() === 'true'
        if (forceBackend) {
          console.log('🧭 [GOOGLE] Force backend OAuth enabled via env, skipping gapi flow')
          await this.startBackendOAuth()
          return
        }

        // Prefer direct Google API if possible; otherwise use backend auth URL
        let authInstance = await this.ensureGapiAuth2()
        if (authInstance) {
          console.log('📱 [GOOGLE] Using Google API directly')
          try {
            const googleUser = await authInstance.signIn()
            console.log('✅ [GOOGLE] Google sign-in successful:', googleUser)
            await this.processGoogleUser(googleUser)
            return
          } catch (e) {
            console.warn('⚠️ [GOOGLE] Direct sign-in failed, falling back to backend OAuth:', e && e.message)
            // fall through to backend flow
          }
        }

        // Fallback to backend OAuth if no auth instance is available or direct sign-in failed
        await this.startBackendOAuth()
      } catch (error) {
        console.error('❌ [GOOGLE] Google login error:', error)
        this.$message.error((error && error.message) || this.$t('auth.loginFailed'))
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
          id: profile && profile.getId && profile.getId(),
          name: profile && profile.getName && profile.getName(),
          email: profile && profile.getEmail && profile.getEmail(),
          imageUrl: profile && profile.getImageUrl && profile.getImageUrl(),
          accessToken: authResponse && (authResponse.access_token || authResponse.accessToken)
        }

        console.log('📊 [GOOGLE] Extracted user data:', userData)

        // Attempt to login with Google
        const loginResponse = await this.$http.post(`${kiwiConsts.API_BASE.AUTH}/google/login`, {
          accessToken: userData.accessToken
        }, { headers: { isToken: false } })

        console.log('📡 [GOOGLE] Login response:', loginResponse && loginResponse.data)
        const res = loginResponse && loginResponse.data
        const code = res && res.code

        if (code === 0 || code === 1 || code === 200) {
          console.log('✅ [GOOGLE] Google login successful')
          this.$message.success(this.$t('auth.loginSuccess'))
          // Support multiple token field names from backend
          this.storeAuthTokens(res && (res.data || res.result || res))
          this.redirectAfterLogin()
        } else if (code === 404) {
          console.log('🔗 [GOOGLE] Account not found')
          this.$message.error(this.$t('auth.accountNotFound'))
        } else {
          const msg = (res && (res.msg || res.message)) || this.$t('auth.loginFailed')
          this.$message.error(msg)
        }
      } catch (error) {
        console.error('❌ [GOOGLE] Error processing Google user:', error)
        throw error
      }
    },

    // Utility methods
    storeAuthTokens(tokenData) {
      console.log('💾 [AUTH] Storing authentication tokens')
      const norm = tokenData || {}
      const accessToken = norm.accessToken || norm.access_token || norm.token || ''
      const refreshToken = norm.refreshToken || norm.refresh_token || ''
      const userInfo = norm.userInfo || norm.user || {}
      const expiresIn = norm.expiresIn || norm.expires_in || ''

      console.log('📊 [AUTH] Token data:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUserInfo: !!userInfo
      })

      if (accessToken) {
        setStore({ name: 'access_token', content: accessToken, type: 'local' })
        try { localStorage.setItem('access_token', accessToken) } catch (e) {}
      }

      if (refreshToken) {
        setStore({ name: 'refresh_token', content: refreshToken, type: 'local' })
        try { localStorage.setItem('refresh_token', refreshToken) } catch (e) {}
      }

      if (expiresIn) {
        setStore({ name: 'expires_in', content: expiresIn, type: 'local' })
      }

      // Store user info / name if provided
      try {
        const userName = userInfo && (userInfo.name || userInfo.username || userInfo.email)
        if (userName) {
          setStore({ name: 'user_name', content: userName, type: 'local' })
          localStorage.setItem('user_info', JSON.stringify(userInfo))
        }
      } catch (e) {}

      console.log('✅ [AUTH] Tokens stored successfully')
    },

    redirectAfterLogin() {
      console.log('🔀 [REDIRECT] Preparing post-login redirect')

      const currentQuery = { ...this.$route.query }
      const word = currentQuery.word
      console.log('📊 [REDIRECT] Route query word:', word)

      // Build destination and preserve all current query params, forcing active=search
      const redirectPath = kiwiConsts.ROUTES.DETAIL
      const redirectQuery = { ...currentQuery, active: 'search' }

      console.log('🎯 [REDIRECT] Redirect destination:', {
        path: redirectPath,
        query: redirectQuery
      })

      // Use replace to avoid extra history entries, and avoid full reload
      this.$router.replace({
        path: redirectPath,
        query: redirectQuery
      })

      // Let Index.vue pick up the new token via getStore without a hard reload
      this.$nextTick(() => {
        try { this.$forceUpdate() } catch (_) {}
      })
    }
  }
}
</script>

<style lang="scss" scoped>
// Google-Only Login Component - Grey Theme Styles
.login-container {
  // Offset below the global header/tabs bar (approx 60px); tweak if header height differs
  --header-height: 60px;
  position: relative;
  margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
  background: var(--bg-body);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  overflow: hidden; // avoid page scroll within this section

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
  height: 100%; // fill available content height (below header)
  max-height: 100%;
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  box-shadow: var(--shadow-card);
  backdrop-filter: var(--backdrop-filter);
  border: 1px solid var(--border-color-light);
  overflow: hidden;
  position: relative;
}

// Left Panel - Brand Section
.login-left {
  flex: 1;
  background: var(--gradient-primary);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 36px 28px; // tighten paddings to reduce height
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
    background-position: 0 50%;
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
  font-size: 44px; // slightly smaller
  margin-bottom: 20px;
  opacity: 0;
  animation: fadeInUp 1s ease 0.2s forwards;

  i {
    color: rgba(255, 255, 255, 0.9);
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  }
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 10px;
  opacity: 0;
  animation: fadeInUp 1s ease 0.4s forwards;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.brand-subtitle {
  font-size: 16px;
  margin-bottom: 24px;
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
  margin-bottom: 14px;
  font-size: 15px;
  opacity: 0.95;
  transition: all 0.3s ease;

  &:hover {
    opacity: 1;
    transform: translateX(5px);
  }

  i {
    font-size: 18px;
    margin-right: 12px;
    color: rgba(255, 255, 255, 0.8);
  }
}

.copyright {
  position: relative;
  z-index: 1;
  font-size: 12px; // smaller to fit
  opacity: 0;
  animation: fadeInUp 1s ease 1s forwards;

  p {
    margin: 0;
    opacity: 0.7;
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
  padding: 24px; // tighten
  background: var(--bg-container);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: var(--bg-card);
  border-radius: var(--card-border-radius);
  padding: 28px 22px; // tighten
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-color-light);
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
  margin-bottom: 20px; // tighter

  h2 {
    font-size: 22px;
    color: var(--text-primary);
    margin-bottom: 6px;
    font-weight: 600;
  }

  p {
    color: var(--text-secondary);
    font-size: 14px;
    margin: 0;
  }
}

// Social Login Styling
.social-login-container {
  .social-login-button {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 14px 18px;
    border: 2px solid var(--border-color);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: var(--bg-card);
    position: relative;
    min-height: 52px;

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
      cursor: not-allowed;
    }

    &:hover {
      border-color: var(--color-primary);
      box-shadow: var(--shadow-hover);
      transform: translateY(-2px);
    }

    &:active {
      transform: translateY(0);
    }

    .social-icon {
      margin-right: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    span {
      flex: 1;
      text-align: center;
      color: var(--text-primary);
      font-size: 15px;
      font-weight: 600;
    }

    .loading-spinner {
      position: absolute;
      right: 16px;
      color: var(--text-primary);
      font-size: 18px;
    }

    &.google-login {
      border-color: var(--color-primary);
      background: var(--gradient-primary);
      color: white;

      span {
        color: white;
      }

      &:hover {
        box-shadow: var(--shadow-hover);
        transform: translateY(-3px);
      }
    }
  }
}

/* OR Divider */
.or-divider {
  display: flex;
  align-items: center;
  margin: 14px 0;
  color: var(--text-secondary);
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  &::before, &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: var(--border-color);
  }
  span {
    margin: 0 10px;
  }
}

/* Username/Password form */
.up-login-form {
  margin-top: 4px;
  .full-width {
    width: 100%;
  }
}

// Loading Overlay
</style>