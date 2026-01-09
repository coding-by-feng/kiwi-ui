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
        <div class="login-card register-card">
          <div class="login-header">
            <h2>{{ $t('auth.createAccount') }}</h2>
            <p>{{ $t('auth.registerSubtitle') }}</p>
          </div>

          <!-- Registration Form -->
          <el-form
            ref="registerForm"
            :model="registerForm"
            :rules="registerRules"
            label-position="top"
            class="register-form"
            @submit.native.prevent="handleRegister"
          >
            <el-form-item prop="username" :label="$t('auth.username')">
              <KiwiInput
                v-model.trim="registerForm.username"
                autocomplete="username"
                :placeholder="$t('auth.usernamePlaceholder')"
                clearable
                @blur="checkUsernameAvailability"
              >
                <template #suffix>
                  <i v-if="usernameChecking" class="el-icon-loading"></i>
                  <i v-else-if="usernameAvailable === true" class="el-icon-success" style="color: #67c23a"></i>
                  <i v-else-if="usernameAvailable === false" class="el-icon-error" style="color: #f56c6c"></i>
                </template>
              </KiwiInput>
              <div v-if="usernameAvailable === false" class="field-error">
                {{ $t('auth.usernameNotAvailable') }}
              </div>
            </el-form-item>

            <el-form-item prop="email" :label="$t('auth.email')">
              <KiwiInput
                v-model.trim="registerForm.email"
                type="email"
                autocomplete="email"
                :placeholder="$t('auth.emailPlaceholder')"
                clearable
                @blur="checkEmailAvailability"
              >
                <template #suffix>
                  <i v-if="emailChecking" class="el-icon-loading"></i>
                  <i v-else-if="emailAvailable === true" class="el-icon-success" style="color: #67c23a"></i>
                  <i v-else-if="emailAvailable === false" class="el-icon-error" style="color: #f56c6c"></i>
                </template>
              </KiwiInput>
              <div v-if="emailAvailable === false" class="field-error">
                {{ $t('auth.emailNotAvailable') }}
              </div>
            </el-form-item>

            <el-form-item prop="password" :label="$t('auth.password')">
              <KiwiInput
                v-model="registerForm.password"
                type="password"
                autocomplete="new-password"
                :placeholder="$t('auth.passwordPlaceholder')"
                show-password
              />
              <div class="password-strength" v-if="registerForm.password">
                <div class="strength-bar">
                  <div
                    class="strength-fill"
                    :class="passwordStrengthClass"
                    :style="{ width: passwordStrengthPercent + '%' }"
                  ></div>
                </div>
                <span class="strength-text" :class="passwordStrengthClass">
                  {{ passwordStrengthText }}
                </span>
              </div>
            </el-form-item>

            <el-form-item prop="confirmPassword" :label="$t('auth.confirmPassword')">
              <KiwiInput
                v-model="registerForm.confirmPassword"
                type="password"
                autocomplete="new-password"
                :placeholder="$t('auth.confirmPasswordPlaceholder')"
                show-password
                @keyup.enter.native="handleRegister"
              />
            </el-form-item>

            <el-form-item prop="realName" :label="$t('auth.realName')">
              <KiwiInput
                v-model.trim="registerForm.realName"
                autocomplete="name"
                :placeholder="$t('auth.realNamePlaceholder')"
                clearable
              />
            </el-form-item>

            <el-form-item>
              <KiwiButton
                type="primary"
                :loading="registerLoading"
                :disabled="registerLoading || !isFormValid"
                class="full-width"
                @click="handleRegister"
              >
                <span v-if="!registerLoading">{{ $t('auth.register') }}</span>
                <span v-else>{{ $t('auth.processing') }}</span>
              </KiwiButton>
            </el-form-item>
          </el-form>

          <!-- Link to Login -->
          <div class="auth-link">
            <span>{{ $t('auth.alreadyHaveAccount') }}</span>
            <a href="javascript:void(0)" @click="goToLogin">{{ $t('auth.signIn') }}</a>
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
import { mapGetters } from 'vuex'
import kiwiConsts from '@/const/kiwiConsts'
import KiwiButton from '@/components/ui/KiwiButton.vue'
import KiwiInput from '@/components/ui/KiwiInput.vue'

export default {
  name: 'UserRegister',
  components: { KiwiButton, KiwiInput },
  data() {
    const validatePassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error(this.$t('auth.passwordRequired')))
      } else if (value.length < 6) {
        callback(new Error(this.$t('auth.passwordTooShort')))
      } else {
        if (this.registerForm.confirmPassword !== '') {
          this.$refs.registerForm.validateField('confirmPassword')
        }
        callback()
      }
    }

    const validateConfirmPassword = (rule, value, callback) => {
      if (value === '') {
        callback(new Error(this.$t('auth.confirmPasswordRequired')))
      } else if (value !== this.registerForm.password) {
        callback(new Error(this.$t('auth.passwordMismatch')))
      } else {
        callback()
      }
    }

    const validateEmail = (rule, value, callback) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value === '') {
        callback(new Error(this.$t('auth.emailRequired')))
      } else if (!emailRegex.test(value)) {
        callback(new Error(this.$t('auth.emailInvalid')))
      } else {
        callback()
      }
    }

    return {
      registerLoading: false,
      pageLoading: false,
      loadingText: this.$t('auth.processing'),

      // Availability checking
      usernameChecking: false,
      usernameAvailable: null,
      emailChecking: false,
      emailAvailable: null,
      usernameCheckTimeout: null,
      emailCheckTimeout: null,

      // Form data
      registerForm: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        realName: ''
      },

      // Validation rules
      registerRules: {
        username: [
          { required: true, message: this.$t('auth.usernameRequired'), trigger: 'blur' },
          { min: 3, max: 20, message: this.$t('auth.usernameLength'), trigger: 'blur' },
          { pattern: /^[a-zA-Z0-9_]+$/, message: this.$t('auth.usernamePattern'), trigger: 'blur' }
        ],
        email: [
          { required: true, validator: validateEmail, trigger: 'blur' }
        ],
        password: [
          { required: true, validator: validatePassword, trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, validator: validateConfirmPassword, trigger: 'blur' }
        ],
        realName: [
          { max: 50, message: this.$t('auth.realNameTooLong'), trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    ...mapGetters(['website']),

    passwordStrength() {
      const password = this.registerForm.password
      if (!password) return 0

      let strength = 0
      if (password.length >= 6) strength++
      if (password.length >= 8) strength++
      if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
      if (/\d/.test(password)) strength++
      if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++

      return Math.min(strength, 4)
    },

    passwordStrengthPercent() {
      return this.passwordStrength * 25
    },

    passwordStrengthClass() {
      const classes = ['weak', 'fair', 'good', 'strong']
      return classes[this.passwordStrength - 1] || 'weak'
    },

    passwordStrengthText() {
      const texts = [
        this.$t('auth.passwordWeak'),
        this.$t('auth.passwordFair'),
        this.$t('auth.passwordGood'),
        this.$t('auth.passwordStrong')
      ]
      return texts[this.passwordStrength - 1] || ''
    },

    isFormValid() {
      return (
        this.registerForm.username &&
        this.registerForm.email &&
        this.registerForm.password &&
        this.registerForm.confirmPassword &&
        this.registerForm.password === this.registerForm.confirmPassword &&
        this.usernameAvailable !== false &&
        this.emailAvailable !== false
      )
    }
  },

  methods: {
    async checkUsernameAvailability() {
      const username = this.registerForm.username
      if (!username || username.length < 3) {
        this.usernameAvailable = null
        return
      }

      clearTimeout(this.usernameCheckTimeout)
      this.usernameCheckTimeout = setTimeout(async () => {
        try {
          this.usernameChecking = true
          const response = await this.$http.get(
            `${kiwiConsts.API_BASE.AUTH}/check-username`,
            {
              params: { username },
              headers: { isToken: false }
            }
          )
          const data = response && response.data
          if (data && data.code === 0) {
            this.usernameAvailable = data.data === true
          }
        } catch (e) {
          console.error('Username check error:', e)
          this.usernameAvailable = null
        } finally {
          this.usernameChecking = false
        }
      }, 500)
    },

    async checkEmailAvailability() {
      const email = this.registerForm.email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!email || !emailRegex.test(email)) {
        this.emailAvailable = null
        return
      }

      clearTimeout(this.emailCheckTimeout)
      this.emailCheckTimeout = setTimeout(async () => {
        try {
          this.emailChecking = true
          const response = await this.$http.get(
            `${kiwiConsts.API_BASE.AUTH}/check-email`,
            {
              params: { email },
              headers: { isToken: false }
            }
          )
          const data = response && response.data
          if (data && data.code === 0) {
            this.emailAvailable = data.data === true
          }
        } catch (e) {
          console.error('Email check error:', e)
          this.emailAvailable = null
        } finally {
          this.emailChecking = false
        }
      }, 500)
    },

    async handleRegister() {
      if (this.registerLoading) return

      const form = this.$refs.registerForm
      if (!form) return

      form.validate(async (valid) => {
        if (!valid) return

        // Check availability before submitting
        if (this.usernameAvailable === false) {
          this.$message.error(this.$t('auth.usernameNotAvailable'))
          return
        }
        if (this.emailAvailable === false) {
          this.$message.error(this.$t('auth.emailNotAvailable'))
          return
        }

        try {
          this.registerLoading = true
          this.pageLoading = true
          this.loadingText = this.$t('auth.registering')

          const payload = {
            username: this.registerForm.username,
            password: this.registerForm.password,
            email: this.registerForm.email,
            realName: this.registerForm.realName || undefined
          }

          const response = await this.$http.post(
            `${kiwiConsts.API_BASE.AUTH}/register`,
            payload,
            { headers: { isToken: false } }
          )

          const data = response && response.data
          if (data && data.code === 0) {
            this.$message.success(this.$t('auth.registerSuccess'))
            // Redirect to login page
            this.goToLogin()
          } else {
            const msg = (data && data.msg) || this.$t('auth.registerFailed')
            this.$message.error(msg)
          }
        } catch (e) {
          console.error('Registration error:', e)
          const msg = (e.response && e.response.data && e.response.data.msg) ||
                      (e && e.message) ||
                      this.$t('auth.registerFailed')
          this.$message.error(msg)
        } finally {
          this.registerLoading = false
          this.pageLoading = false
        }
      })
    },

    goToLogin() {
      // Emit event to parent to switch to login tab
      this.$emit('switch-to-login')
    }
  },

  beforeDestroy() {
    clearTimeout(this.usernameCheckTimeout)
    clearTimeout(this.emailCheckTimeout)
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  --header-height: 60px;
  position: relative;
  margin-top: var(--header-height);
  min-height: calc(100vh - var(--header-height));
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
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
  height: 100%;
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

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 36px 28px;
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
  font-size: 44px;
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
  font-size: 12px;
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

.login-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(249, 250, 251, 0.5);
  overflow-y: auto;
}

.login-card {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 28px 22px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
  0 4px 6px -2px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(229, 231, 235, 0.8);
  opacity: 0;
  animation: slideInRight 1s ease 0.5s forwards;

  &.register-card {
    max-width: 460px;
    padding: 24px 28px;
  }
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
  margin-bottom: 20px;

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

.register-form {
  .el-form-item {
    margin-bottom: 18px;
  }

  .full-width {
    width: 100%;
  }
}

.field-error {
  color: #f56c6c;
  font-size: 12px;
  margin-top: 4px;
}

.password-strength {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;

  .strength-bar {
    flex: 1;
    height: 4px;
    background: #e5e7eb;
    border-radius: 2px;
    overflow: hidden;

    .strength-fill {
      height: 100%;
      transition: width 0.3s ease, background-color 0.3s ease;
      border-radius: 2px;

      &.weak {
        background-color: #f56c6c;
      }
      &.fair {
        background-color: #e6a23c;
      }
      &.good {
        background-color: #409eff;
      }
      &.strong {
        background-color: #67c23a;
      }
    }
  }

  .strength-text {
    font-size: 12px;
    min-width: 50px;

    &.weak {
      color: #f56c6c;
    }
    &.fair {
      color: #e6a23c;
    }
    &.good {
      color: #409eff;
    }
    &.strong {
      color: #67c23a;
    }
  }
}

.auth-link {
  text-align: center;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
  font-size: 14px;
  color: #6b7280;

  a {
    color: #667eea;
    text-decoration: none;
    font-weight: 500;
    margin-left: 4px;

    &:hover {
      text-decoration: underline;
    }
  }
}

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

// Responsive
@media (max-width: 768px) {
  .login-wrapper {
    flex-direction: column;
    max-width: 100%;
    margin: 0;
    border-radius: 0;
    min-height: calc(100vh - var(--header-height));
  }

  .login-left {
    padding: 24px 20px;
    min-height: auto;
  }

  .login-right {
    padding: 20px;
  }

  .login-card.register-card {
    padding: 20px 16px;
  }
}
</style>
