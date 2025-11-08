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

          <!-- Dev-only: Manual Token Input -->
          <div v-if="isDevEnvironment" class="manual-token-card">
            <div class="manual-token-header">
              <i class="el-icon-key"></i>
              <span>Manual Token (Dev)</span>
            </div>
            <div class="manual-token-body">
              <p class="manual-token-tip">
                Paste your token JSON. Example:
                { "dataType": "string", "content": "YOUR_TOKEN", "type": "local", "datatime": 1761035999863 }
              </p>
              <el-input
                type="textarea"
                :autosize="{ minRows: 3, maxRows: 8 }"
                placeholder='{"dataType":"string","content":"<token>","type":"local","datatime":<ts>}'
                v-model="manualTokenJson"
              />
              <div class="manual-token-actions">
                <el-button type="primary" size="mini" @click="applyManualToken">Use token</el-button>
                <el-button size="mini" @click="clearManualToken">Clear</el-button>
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
import { setStore } from '@/util/store'
import kiwiConsts from '@/const/kiwiConsts'

export default {
  name: 'GoogleLogin',
  data() {
    return {
      googleLoading: false,
      pageLoading: false,
      loadingText: this.$t('auth.processing'),

      // Store Google user info for potential account linking
      pendingGoogleUser: null,

      // Dev manual token
      manualTokenJson: ''
    }
  },

  mounted() {
    console.log('🚀 [LOGIN] Component mounted')
    console.log('📊 [LOGIN] Initial state:', {
      website: this.website
    })
    // Remove any previously stored empty token envelope to avoid confusion
    this.sanitizeStoredToken()
  },

  computed: {
    ...mapGetters(['website']),
    isDevEnvironment() {
      // Visible when:
      // 1) Build env is development or VUE_APP_ENABLE_MANUAL_TOKEN=true
      // 2) Host is localhost/127.0.0.1 OR a private LAN IP OR *.local
      // 3) Running in Electron
      // 4) URL has ?enableManualToken=1 (one-time) or localStorage has 'enable_manual_token'
      try {
        if (process && process.env) {
          if (process.env.NODE_ENV === 'development') return true
          if (String(process.env.VUE_APP_ENABLE_MANUAL_TOKEN || '') === 'true') return true
        }
      } catch (e) {}
      try {
        const loc = window.location || {}
        const { hostname = '', port = '', search = '' } = loc
        const params = new URLSearchParams(search || '')
        if (params.get('enableManualToken') === '1' || params.get('debug') === '1') return true

        const ua = (navigator && navigator.userAgent) || ''
        const isElectron = (window && window.process && window.process.type) || ua.includes('Electron')
        if (isElectron) return true

        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
        const isPrivateIp = /^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/.test(hostname)
        const isDotLocal = /\.local$/.test(hostname)
        if ((isLocalhost || isPrivateIp || isDotLocal) && (port || isElectron)) return true
      } catch (e) {}
      try {
        if (localStorage.getItem('enable_manual_token') === '1' || localStorage.getItem('enable_manual_token') === 'true') return true
      } catch (e) {}
      return false
    }
  },

  methods: {
    // Resolve env var possibly from build-time or Electron preload
    getEnvVar(key) {
      try {
        if (typeof window !== 'undefined' && window.electronAPI && typeof window.electronAPI.getEnvVar === 'function') {
          const v = window.electronAPI.getEnvVar(key)
          if (v !== undefined && v !== null && v !== '') return v
        }
      } catch (_) {}
      try {
        if (process && process.env && process.env[key] !== undefined) return process.env[key]
      } catch (_) {}
      try {
        if (typeof window !== 'undefined' && window[key] !== undefined) return window[key]
      } catch (_) {}
      return undefined
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
          if (code === 1 || code === 200 || code === true) {
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

        if (code === 1 || code === 200) {
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
    },

    // Dev-only: apply manual token
    applyManualToken() {
      try {
        let token = ''
        let refresh = ''
        let expiresIn = ''
        const raw = (this.manualTokenJson || '').trim()
        if (!raw) {
          this.$message.error('Please paste a token JSON or token string.')
          return
        }

        if (raw.startsWith('{')) {
          // Try to parse as JSON
          const obj = JSON.parse(raw)

          // Case A: User pasted a full storage envelope {dataType, content, type, datatime}
          const looksLikeEnvelope = obj && typeof obj === 'object' && 'dataType' in obj && 'content' in obj && 'datatime' in obj
          if (looksLikeEnvelope) {
            const contentStr = (obj.content || '').toString().trim()
            if (!contentStr) {
              // Ensure any existing empty envelope is removed right away
              this.sanitizeStoredToken()
              this.$message.error("The 'content' field is empty. Please paste a token value in 'content'.")
              return
            }

            token = contentStr
            // Also read optional fields if present beside the envelope
            refresh = obj.refresh_token || obj.refreshToken || ''
            expiresIn = obj.expires_in || obj.expiresIn || ''
          } else {
            // Case B: Plain token JSON with common fields
            token = obj.content || obj.token || obj.access_token || obj.accessToken || ''
            refresh = obj.refresh_token || obj.refreshToken || ''
            expiresIn = obj.expires_in || obj.expiresIn || ''
          }
        } else {
          // Case C: Raw token string
          token = raw
        }

        token = (token || '').toString().trim()
        if (!token) {
          // Ensure any existing empty envelope is removed right away
          this.sanitizeStoredToken()
          this.$message.error('Token not found. Provide a token string or JSON with a non-empty "content".')
          return
        }

        // Persist via setStore (prefix-aware) to match axios/getStore consumers
        setStore({ name: 'access_token', content: token, type: 'local' })
        if (refresh) setStore({ name: 'refresh_token', content: refresh, type: 'local' })
        if (expiresIn) setStore({ name: 'expires_in', content: expiresIn, type: 'local' })
        // Also set raw keys for any direct access sites
        try {
          localStorage.setItem('access_token', token)
          if (refresh) localStorage.setItem('refresh_token', refresh)
        } catch (e) {}

        this.$message.success('Token applied. Redirecting...')
        this.redirectAfterLogin()
      } catch (e) {
        console.error('Failed to apply manual token:', e)
        this.$message.error('Invalid JSON/token. Please check the format.')
      }
    },

    clearManualToken() {
      this.manualTokenJson = ''
    },

    sanitizeStoredToken() {
      try {
        const prefix = (this.website && this.website.key) ? this.website.key : 'kason-tools'
        const realKey = `${prefix}-access_token`
        const raw = localStorage.getItem(realKey)
        if (!raw) return
        try {
          const obj = JSON.parse(raw)
          const looksLikeEnvelope = obj && typeof obj === 'object' && 'dataType' in obj && 'content' in obj && 'datatime' in obj
          if (looksLikeEnvelope) {
            const contentStr = (obj.content || '').toString().trim()
            if (!contentStr) {
              console.warn(`[AUTH] Removing empty token envelope at ${realKey}`)
              localStorage.removeItem(realKey)
              try { localStorage.removeItem('access_token') } catch (e) {}
            }
          }
        } catch (e) {
          // not JSON; ignore
        }
      } catch (e) {
        // ignore
      }
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
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
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
  background: rgba(249, 250, 251, 0.5);
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 28px 22px; // tighten
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
  margin-bottom: 20px; // tighter

  h2 {
    font-size: 22px;
    color: #374151;
    margin-bottom: 6px;
    font-weight: 600;
  }

  p {
    color: #6b7280;
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
    border: 2px solid #d1d5db;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    background: white;
    position: relative;
    min-height: 52px;

    &.disabled {
      opacity: 0.6;
      pointer-events: none;
      cursor: not-allowed;
    }

    &:hover {
      border-color: #4285f4;
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.15);
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
      color: #ffffff;
      font-size: 15px;
      font-weight: 600;
    }

    .loading-spinner {
      position: absolute;
      right: 16px;
      color: #ffffff;
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

/* Dev-only manual token styles */
.manual-token-card {
  margin-top: 16px;
  padding: 10px;
  border: 1px dashed #c0c4cc;
  border-radius: 8px;
  background: #fafafa;
}
.manual-token-header {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #606266;
  margin-bottom: 6px;
  i { margin-right: 6px; }
}
.manual-token-body {
  .manual-token-tip {
    font-size: 12px;
    color: #909399;
    margin: 0 0 6px 0;
    word-break: break-all;
  }
  .manual-token-actions {
    margin-top: 6px;
  }
}

// Responsive Design - Small width: hide brand panel to avoid scroll
@media (max-width: 968px) {
  .login-container {
    margin-top: var(--header-height);
    min-height: calc(100vh - var(--header-height));
  }
  .login-wrapper {
    flex-direction: column;
    max-width: 520px;
    height: 100%;
  }

  .login-left {
    display: none; // hide to keep page compact
  }

  .login-right {
    flex: 1;
    padding: 20px;
  }

  .login-card {
    padding: 24px 18px;
    max-width: 460px;
  }
}

// Responsive Design - Short viewport height: hide brand panel and tighten spacings
@media (max-height: 760px) {
  .login-container {
    margin-top: var(--header-height);
    min-height: calc(100vh - var(--header-height));
  }
  .login-left { display: none; }
  .login-right { padding: 16px; }
  .brand-title { font-size: 24px; }
  .brand-subtitle { font-size: 14px; margin-bottom: 16px; }
  .feature-item { margin-bottom: 10px; font-size: 14px; }
  .login-card { padding: 20px 16px; }
}

@media (max-width: 480px) {
  .login-container {
    margin-top: var(--header-height);
    min-height: calc(100vh - var(--header-height));
    padding: 0; // full-bleed
  }

  .login-wrapper {
    margin: 0;
    border-radius: 12px;
  }

  .login-card {
    padding: 18px 14px;
  }

  .social-login-button {
    span {
      font-size: 14px;
    }
  }
}
</style>