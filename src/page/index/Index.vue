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
        : null
    }
  },
  watch: {
    $route: function () {
      // Keep a safe fallback so the tab content never disappears
      this.activeName = this.$route.query.active || 'search'
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

    // Your existing mounted logic...
    // window.onresize = () => {
    //   return (() => {
    //     this.tabsWidth = window.innerWidth - 20 + 'px'
    //   })()
    // }
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
            
            // Force reactivity update without full page reload
            this.$forceUpdate()
            
            // Instead of window.location.reload(), just update the component state
            // This is much safer for mobile Safari
            console.log('🔄 [INDEX] Component state updated')
            
            // Optionally navigate to ensure clean state
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

    handleSelectMenu() {
    },

    ensureActiveTabValid() {
      const act = this.activeName
      // Tabs governed by enabledTabs
      const governed = ['starList','todo','youtube','about','aiHistory','pdfReader']
      if (governed.includes(act)) {
        const allowed = !!this.enabledTabs[act]
        // Also consider login-gated tabs
        if (!allowed || ((act === 'starList' || act === 'youtube' || act === 'aiHistory') && !this.isLogin)) {
          const preservedParams = { ...this.$route.query, active: 'search', now: new Date().getTime() }
          if (this.activeName !== 'search') {
            this.activeName = 'search'
            this.$router.replace({ path: website.noAuthPath.detail, query: preservedParams })
          }
        }
      }
    },

    tabClick(tab, event) {
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

      // Preserve ALL existing query parameters when switching tabs
      const preservedParams = {
        ...this.$route.query, // Start with all existing parameters
        active: tab.name,
        now: new Date().getTime()
      }

      // Ensure essential parameters are present with defaults if missing
      if (!preservedParams.selectedMode && this.$route.query.selectedMode) {
        preservedParams.selectedMode = this.$route.query.selectedMode
      }
      if (!preservedParams.language && this.$route.query.language) {
        preservedParams.language = this.$route.query.language
      }
      if (!preservedParams.ytbMode && this.$route.query.ytbMode) {
        preservedParams.ytbMode = this.$route.query.ytbMode
      }
      if (!preservedParams.videoUrl && this.$route.query.videoUrl) {
        preservedParams.videoUrl = this.$route.query.videoUrl
      }

      let isActiveChange = JSON.stringify(this.query) === JSON.stringify(preservedParams)
      if (!isActiveChange) {
        // Always use replace to avoid creating history entries for tab switches
        // and preserve all parameters regardless of which tab we're switching to
        this.$router.replace({
          path: website.noAuthPath.detail,
          query: preservedParams
        })
      }
    },

    onLanguageChanged(langCode) {
      console.log('Language changed to:', langCode)
      // You could emit this to parent or handle globally
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
}

.platform-header {
  height: 50px;
  background: #545c64;
  border-bottom: 1px solid #E2E2E2;
  width: 100%;
  position: absolute;
  top: 0px;

  .el-menu {
    border-bottom: 1px solid #E2E2E2;

    .el-menu-item {
      height: 50px;

      i {
        margin-top: 20px;
        margin-bottom: -15px;
        font-size: 20px;
        display: block;
        line-height: 10px;
        text-align: center;
      }

      span {
        margin-top: -20px;
        line-height: 20px;
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
      <el-tab-pane name="search">
        <span slot="label">
          <i class="el-icon-search"></i>
        </span>
        <router-view name="search"></router-view>
      </el-tab-pane>
      <el-tab-pane name="starList" v-if="isLogin && enabledTabs.starList">
        <span slot="label">
          <i class="el-icon-tickets"></i>
        </span>
        <router-view name="starList" v-if="isAdmin"></router-view>
      </el-tab-pane>
      <el-tab-pane name="todo" lazy v-if="enabledTabs.todo">
        <span slot="label">
          <i class="el-icon-check"></i>
        </span>
        <router-view name="todo" v-if="activeName === 'todo'"></router-view>
      </el-tab-pane>
      <el-tab-pane name="youtube" v-if="isLogin && enabledTabs.youtube">
        <span slot="label">
          <i class="el-icon-video-camera"></i>
        </span>
        <router-view name="youtube" v-if="activeName === 'youtube'"></router-view>
      </el-tab-pane>
      <el-tab-pane name="pdfReader" lazy v-if="enabledTabs.pdfReader">
        <span slot="label">
          <i class="el-icon-document"></i>
        </span>
        <router-view name="pdfReader" v-if="activeName === 'pdfReader'"></router-view>
      </el-tab-pane>
      <!-- New: AI History tab -->
      <el-tab-pane name="aiHistory" v-if="isLogin && enabledTabs.aiHistory">
        <span slot="label">
          <i class="el-icon-time"></i>
        </span>
        <router-view name="aiHistory"></router-view>
      </el-tab-pane>
      <el-tab-pane name="userCenter" v-if="isLogin">
        <span slot="label">
          <i class="el-icon-user"></i>
        </span>
        <router-view name="userCenter"></router-view>
      </el-tab-pane>
      <el-tab-pane name="login" v-if="!isLogin">
        <span slot="label">
          <i class="el-icon-user"></i>
        </span>
        <router-view name="userLogin"></router-view>
      </el-tab-pane>
      <el-tab-pane name="about" v-if="enabledTabs.about">
        <span slot="label">
          <i class="el-icon-postcard"></i>
        </span>
        <router-view name="about"></router-view>
      </el-tab-pane>
      <!-- Removed BGM tab: content now lives under User Center -->
    </el-tabs>
  </div>
</template>
