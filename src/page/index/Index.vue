<script>
import {getStore} from '@/util/store'
import website from '@/const/website'
import {handleGoogleOAuthCallback} from '@/util/oauth' // Add this import

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
      let params
      let paramsTmp = {
        active: tab.name,
        now: new Date().getTime(),
        selectedLanguage: this.$route.query.originalText,
        selectedMode: this.$route.query.selectedMode,
        ytbMode: this.$route.query.ytbMode,
        videoUrl: this.$route.query.videoUrl
      }
      if (this.$route.query.originalText) {
        params = {
          originalText: this.$route.query.originalText,
          ...paramsTmp
        }
      } else {
        params = {...paramsTmp}
      }
      let isActiveChange = JSON.stringify(this.query) === JSON.stringify(params)
      if (!isActiveChange) {
        this.$router.push({path: website.noAuthPath.detail, query: params})
      }
    }
  }
}
</script>

<style lang="scss">
.tab_nav {
  position: absolute;
  top: 0px;
  left: 10px;
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
</style>

<template>
  <div class="tab_nav" :style="{width: tabsWidth}">
    <el-tabs type="border-card" :active-name="activeName" @tab-click="tabClick">
      <el-tab-pane name="search">
        <span slot="label"><i class="el-icon-search"></i></span>
        <router-view name="search"></router-view>
      </el-tab-pane>
      <el-tab-pane name="starList" v-if="isLogin">
        <span slot="label"><i class="el-icon-tickets"></i></span>
        <router-view name="starList" v-if="isAdmin"></router-view>
      </el-tab-pane>
      <el-tab-pane name="youtube" v-if="isLogin">
        <span slot="label"><i class="el-icon-video-camera"></i></span>
        <router-view name="youtube"></router-view>
      </el-tab-pane>
      <el-tab-pane name="grammarListener" v-if="isLogin">
        <span slot="label"><i class=el-icon-school></i></span>
        <span>该功能暂时关闭</span>
        <!--
                <router-view name="grammarListener"></router-view>
        -->
      </el-tab-pane>
      <el-tab-pane name="userCenter" v-if="isLogin">
        <span slot="label"><i class="el-icon-user"></i></span>
        <router-view name="userCenter"></router-view>
      </el-tab-pane>
      <el-tab-pane name="login" v-if="!isLogin">
        <span slot="label"><i class="el-icon-user"></i></span>
        <router-view name="userLogin"></router-view>
      </el-tab-pane>
      <el-tab-pane name="about">
        <span slot="label"><i class="el-icon-postcard"></i></span>
        <router-view name="about"></router-view>
      </el-tab-pane>
      <el-tab-pane name="bgm">
        <span slot="label"><i class="el-icon-headset"></i></span>
        <router-view name="bgm"></router-view>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
