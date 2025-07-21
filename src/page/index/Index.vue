<script>
import {getStore} from '@/util/store'
import website from '@/const/website'
import {handleGoogleOAuthCallback} from '@/util/oauth'

export default {
  data() {
    return {
      tabsWidth: window.innerWidth - 20 + 'px',
      activeName: this.$route.query.active ? this.$route.query.active : 'search',
      query: this.$route.query,
      user: {
        userName: getStore({name: 'user_name'})
      }
    }
  },
  watch: {
    $route: function () {
      this.activeName = this.$route.query.active
      // Also check for OAuth callback when route changes
      this.checkOAuthCallback()
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

    // Your existing mounted logic...
    // window.onresize = () => {
    //   return (() => {
    //     this.tabsWidth = window.innerWidth - 20 + 'px'
    //   })()
    // }
  },
  methods: {
    // Add this new method to check for OAuth callback
    checkOAuthCallback() {
      const hasOAuthParams = window.location.search.includes('token=') ||
          window.location.search.includes('error=') ||
          (window.location.hash && window.location.hash.includes('token='))

      if (hasOAuthParams) {
        console.log('Detected OAuth callback parameters')
        const success = handleGoogleOAuthCallback()

        if (success) {
          // Update the user data in component after successful OAuth
          this.$nextTick(() => {
            this.user.userName = getStore({name: 'user_name'})
            // Force reactivity update
            this.$forceUpdate()
            window.location.reload();
          })
        }
      }
    },

    handleSelectMenu() {
    },

    tabClick(tab, event) {
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
    <el-tabs type="border-card" :active-name="activeName" @tab-click="tabClick">
      <el-tab-pane name="search">
        <span slot="label">
          <i class="el-icon-search"></i>
        </span>
        <router-view name="search" :key="$route.fullPath"></router-view>
      </el-tab-pane>
      <el-tab-pane name="starList" v-if="isLogin">
        <span slot="label">
          <i class="el-icon-tickets"></i>
        </span>
        <router-view name="starList" v-if="isAdmin"></router-view>
      </el-tab-pane>
      <el-tab-pane name="youtube" v-if="isLogin">
        <span slot="label">
          <i class="el-icon-video-camera"></i>
        </span>
        <router-view name="youtube"></router-view>
      </el-tab-pane>
<!--
      <el-tab-pane name="documentReader" v-if="isLogin">
        <span slot="label">
          <i class="el-icon-document"></i>
        </span>
        <router-view name="documentReader"></router-view>
      </el-tab-pane>
-->
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
      <el-tab-pane name="about">
        <span slot="label">
          <i class="el-icon-postcard"></i>
        </span>
        <router-view name="about"></router-view>
      </el-tab-pane>
      <el-tab-pane name="bgm">
        <span slot="label">
          <i class="el-icon-headset"></i>
        </span>
        <router-view name="bgm"></router-view>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>