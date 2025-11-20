<script>
import {getStore} from '@/util/store'
import website from '@/const/website'
import {handleGoogleOAuthCallback} from '@/util/oauth'
import kiwiConst from '@/const/kiwiConsts'

export default {
  data() {
    return {
      tabsWidth: window.innerWidth - 20 + 'px',
      activeName: this.$route.query.active ? this.$route.query.active : 'search',
      query: this.$route.query,
      user: {
        userName: getStore({name: 'user_name'})
      },
      // New: feature tab visibility (persisted)
      enabledTabs: this.loadEnabledTabs(),
      lastSearchRoute: (this.$route.query.active || 'search') === 'search'
        ? { path: this.$route.path, query: { ...this.$route.query } }
        : null,
      // Track if a tab has been visited so we only mount its component after first activation
      visitedTabs: { [this.$route.query.active || 'search']: true }
    }
  },
  watch: {
    $route: function () {
      // Keep a safe fallback so the tab content never disappears
      this.activeName = this.$route.query.active || 'search'
      // Mark visited when route changes
      this.markVisited(this.activeName)
      // Keep local snapshot in sync so comparisons in tabClick remain accurate
      this.query = { ...this.$route.query }
      // Also check for OAuth callback when route changes
      this.checkOAuthCallback()
      if ((this.$route.query.active || 'search') === 'search') {
        this.lastSearchRoute = {
          path: this.$route.path,
          query: { ...this.$route.query }
        }
      }
      // Ensure current active is allowed by settings
      this.ensureActiveTabValid()
    }
  },
  computed: {
    isLogin() {
      let accessToken = getStore({name: 'access_token'})
      return !!accessToken
    },
    isAdmin() {
      // return 'admin' === this.user.userName
      return true
    },
    isMobile() {
      return window.innerWidth <= 768
    }
  },
  mounted() {
    // Check for Google OAuth callback first
    this.checkOAuthCallback()

    // Listen for settings update events to refresh enabledTabs
    try {
      window.addEventListener('enabled-tabs-updated', this.refreshEnabledTabs)
    } catch (_) {}

    // Validate active tab initially against settings
    this.ensureActiveTabValid()
  },
  beforeDestroy() {
    try { window.removeEventListener('enabled-tabs-updated', this.refreshEnabledTabs) } catch (_) {}
  },
  methods: {
    // Load map from storage and merge with defaults to avoid missing keys
    loadEnabledTabs() {
      try {
        const stored = getStore({ name: kiwiConst.CONFIG_KEY.ENABLED_TABS }) || {}
        return { ...kiwiConst.DEFAULT_ENABLED_TABS, ...stored }
      } catch (e) {
        return { ...kiwiConst.DEFAULT_ENABLED_TABS }
      }
    },
    refreshEnabledTabs() {
      this.enabledTabs = this.loadEnabledTabs()
      // After updating, ensure active is still valid
      this.ensureActiveTabValid()
    },
    // Mark a tab as visited (first time user activates it)
    markVisited(tabName) {
      if (!this.visitedTabs[tabName]) this.$set(this.visitedTabs, tabName, true)
    },

    // Add this new method to check for OAuth callback
    checkOAuthCallback() {
      const hasOAuthParams = window.location.search.includes('token=') ||
          window.location.search.includes('error=') ||
          (window.location.hash && window.location.hash.includes('token='))

      if (hasOAuthParams) {
        console.log('🔍 [INDEX] Detected OAuth callback parameters')
        const success = handleGoogleOAuthCallback()

        if (success) {
          console.log('✅ [INDEX] OAuth callback processed successfully')
          
          // Update the user data in component after successful OAuth
          this.$nextTick(() => {
            this.user.userName = getStore({name: 'user_name'})
            this.$forceUpdate()
            console.log('🔄 [INDEX] Component state updated')
            setTimeout(() => {
              if (this.$route.query.token || this.$route.query.user) {
                this.$router.replace({
                  path: website.noAuthPath.detail,
                  query: { active: 'search' }
                })
              }
            }, 500)
          })
        } else {
          console.log('❌ [INDEX] OAuth callback processing failed')
        }
      }
    },

    handleSelectMenu() {},

    ensureActiveTabValid() {
      const act = this.activeName
      // If userCenter requested while not logged in, redirect to login tab
      if (act === 'userCenter' && !this.isLogin) {
        const preservedParams = { ...this.$route.query, active: 'login', now: new Date().getTime() }
        if (this.activeName !== 'login') {
          this.activeName = 'login'
          this.markVisited('login')
          this.$router.replace({ path: website.noAuthPath.detail, query: preservedParams })
          return
        }
      }
      // If login tab requested while already logged in, go to userCenter
      if (act === 'login' && this.isLogin) {
        const preservedParams = { ...this.$route.query, active: 'userCenter', now: new Date().getTime() }
        this.activeName = 'userCenter'
        this.markVisited('userCenter')
        this.$router.replace({ path: website.noAuthPath.detail, query: preservedParams })
        return
      }

      // Tabs governed by enabledTabs
      const governed = ['starList','todo','youtube','about','aiHistory','pdfReader']
      if (governed.includes(act)) {
        const allowed = !!this.enabledTabs[act]
        // Only starList requires login to view; youtube and aiHistory should be visible with hints when logged out
        if (!allowed || (act === 'starList' && !this.isLogin)) {
          const preservedParams = { ...this.$route.query, active: 'search', now: new Date().getTime() }
          if (this.activeName !== 'search') {
            this.activeName = 'search'
            this.markVisited('search')
            this.$router.replace({ path: website.noAuthPath.detail, query: preservedParams })
          }
        }
      }
    },

    tabClick(tab, event) {
      // Mark visited immediately on click
      this.markVisited(tab.name)

      if (tab.name === 'search') {
        const fallbackPath = website.noAuthPath.detail
        const targetRoute = this.lastSearchRoute || { path: fallbackPath, query: { ...this.$route.query, active: 'search' } }
        const preservedQuery = {
          ...(targetRoute.query || {}),
          active: 'search',
          now: new Date().getTime()
        }
        this.$router.replace({
          path: targetRoute.path || fallbackPath,
          query: preservedQuery
        })
        return
      }

      const preservedParams = {
        ...this.$route.query,
        active: tab.name,
        now: new Date().getTime()
      }
      if (!preservedParams.selectedMode && this.$route.query.selectedMode) preservedParams.selectedMode = this.$route.query.selectedMode
      if (!preservedParams.language && this.$route.query.language) preservedParams.language = this.$route.query.language
      if (!preservedParams.ytbMode && this.$route.query.ytbMode) preservedParams.ytbMode = this.$route.query.ytbMode
      if (!preservedParams.videoUrl && this.$route.query.videoUrl) preservedParams.videoUrl = this.$route.query.videoUrl

      let isActiveChange = JSON.stringify(this.query) === JSON.stringify(preservedParams)
      if (!isActiveChange) {
        this.$router.replace({
          path: website.noAuthPath.detail,
          query: preservedParams
        })
      }
    },

    onLanguageChanged(langCode) {
      console.log('Language changed to:', langCode)
      this.$emit('language-changed', langCode)
    }
  }
}
</script>

<style lang="scss">
.tab_nav {
  position: absolute;
  top: 0px;
  left: 10px;
  width: calc(100% - 20px);
  min-height: 100vh;
}

// Global tab styling overrides for theming
.el-tabs--border-card {
  background: var(--bg-card) !important;
  border: 1px solid var(--border-color) !important;
  box-shadow: var(--shadow-card) !important;

  > .el-tabs__header {
    background-color: var(--bg-header) !important;
    border-bottom: 1px solid var(--border-color) !important;

    .el-tabs__item {
      color: var(--text-secondary) !important;
      border-right: 1px solid var(--border-color-light) !important;
      
      &.is-active {
        background-color: var(--bg-card) !important;
        border-right-color: var(--border-color) !important;
        border-left-color: var(--border-color) !important;
        color: var(--color-primary) !important;
        font-weight: bold;
      }

      &:hover {
        color: var(--color-primary) !important;
      }
    }
  }

  > .el-tabs__content {
    padding: 15px;
    background-color: var(--bg-card) !important;
    color: var(--text-primary) !important;
    min-height: 100vh;
  }
}

.platform-header {
  height: 50px;
  background: var(--bg-header);
  border-bottom: 1px solid var(--border-color);
  width: 100%;
  position: absolute;
  top: 0px;

  .el-menu {
    border-bottom: 1px solid var(--border-color);
    background-color: transparent;

    .el-menu-item {
      height: 50px;
      color: var(--text-primary);

      i {
        margin-top: 20px;
        margin-bottom: -15px;
        font-size: 20px;
        display: block;
        line-height: 10px;
        text-align: center;
        color: var(--icon-color);
      }

      span {
        margin-top: -20px;
        line-height: 20px;
      }
      
      &:hover, &:focus {
        background-color: rgba(0,0,0,0.05);
        color: var(--color-primary);
        i { color: var(--color-primary); }
      }
    }
  }
}

.language-switcher-container {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

/* Simple login hint spacing */
.login-hint { padding: 16px; }

/* Mobile responsive adjustments */
@media (max-width: 768px) {
  .tab_nav {
    left: 5px;
    width: calc(100% - 10px);
  }

  .language-switcher-container {
    top: 5px;
    right: 5px;
  }

  .el-tabs__header {
    margin-bottom: 10px;
  }

  .el-tabs__nav-wrap {
    padding-right: 60px; /* Make room for language switcher */
  }
}
</style>

<template>
  <div class="tab_nav" :style="{width: tabsWidth}">
    <el-tabs id="main-tabs" type="border-card" :active-name="activeName" @tab-click="tabClick">
      <el-tab-pane name="search" lazy>
        <span slot="label"><i class="el-icon-search"></i></span>
        <keep-alive>
          <router-view name="search" v-if="visitedTabs.search" v-show="activeName==='search'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="starList" lazy v-if="enabledTabs.starList && isLogin">
        <span slot="label"><i class="el-icon-tickets"></i></span>
        <keep-alive>
          <router-view name="starList" v-if="visitedTabs.starList && isAdmin" v-show="activeName==='starList'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="todo" lazy v-if="enabledTabs.todo">
        <span slot="label"><i class="el-icon-check"></i></span>
        <keep-alive>
          <router-view name="todo" v-if="visitedTabs.todo" v-show="activeName==='todo'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="youtube" lazy v-if="enabledTabs.youtube">
        <span slot="label"><i class="el-icon-video-camera"></i></span>
        <keep-alive>
          <router-view name="youtube" v-if="visitedTabs.youtube && isLogin" v-show="activeName==='youtube'"></router-view>
        </keep-alive>
        <div v-if="activeName==='youtube' && !isLogin" class="login-hint">
          <el-alert type="info" show-icon title="Please log in to use YouTube features." description="Login to load and manage videos and subtitles."></el-alert>
        </div>
      </el-tab-pane>

      <el-tab-pane name="pdfReader" lazy v-if="enabledTabs.pdfReader">
        <span slot="label"><i class="el-icon-document"></i></span>
        <keep-alive>
          <router-view name="pdfReader" v-if="visitedTabs.pdfReader" v-show="activeName==='pdfReader'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="aiHistory" lazy v-if="enabledTabs.aiHistory">
        <span slot="label"><i class="el-icon-time"></i></span>
        <keep-alive>
          <router-view name="aiHistory" v-if="visitedTabs.aiHistory && isLogin" v-show="activeName==='aiHistory'"></router-view>
        </keep-alive>
        <div v-if="activeName==='aiHistory' && !isLogin" class="login-hint">
          <el-alert type="info" show-icon title="Please log in to view AI history." description="Login to review your previous AI calls."></el-alert>
        </div>
      </el-tab-pane>

      <el-tab-pane name="userCenter" lazy v-if="isLogin">
        <span slot="label"><i class="el-icon-user"></i></span>
        <keep-alive>
          <router-view name="userCenter" v-if="visitedTabs.userCenter" v-show="activeName==='userCenter'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="login" lazy v-if="!isLogin">
        <span slot="label"><i class="el-icon-user"></i></span>
        <keep-alive>
          <router-view name="userLogin" v-if="visitedTabs.login" v-show="activeName==='login'"></router-view>
        </keep-alive>
      </el-tab-pane>

      <el-tab-pane name="about" lazy v-if="enabledTabs.about">
        <span slot="label"><i class="el-icon-postcard"></i></span>
        <keep-alive>
          <router-view name="about" v-if="visitedTabs.about" v-show="activeName==='about'"></router-view>
        </keep-alive>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
