<script>
import {getStore} from '@/util/store'
import website from '@/const/website'

const isIos = function () {
  if ('iPhone' === navigator.platform || 'iPod' === navigator.platform || 'iPad' === navigator.platform) {
    return true
  }
  return false
}

const isSafari = function () {
  let ua = navigator.userAgent.toLowerCase()
  return ua.indexOf('applewebkit') > -1 && ua.indexOf('safari') > -1 &&
      ua.indexOf('linux') === -1 && ua.indexOf('android') === -1 && ua.indexOf('chrome') === -1 &&
      ua.indexOf('ios') === -1 && ua.indexOf('browser') === -1
}

export default {
  data() {
    return {
      tabsWidth: window.innerWidth - 20 + 'px',
      activeName: this.$route.query.active ? this.$route.query.active : 'search',
      query: this.$route.query,
      bgm: getStore({name: 'bgm'}),
      user: {
        userName: getStore({name: 'user_name'})
      }
    }
  },
  watch: {
    $route: function () {
      this.activeName = this.$route.query.active
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
    // window.onresize = () => {
    //   return (() => {
    //     this.tabsWidth = window.innerWidth - 20 + 'px'
    //   })()
    // }
    // if (isSafari()) {
    //   this.$message({
    //     type: 'error',
    //     showClose: true,
    //     duration: 10000,
    //     message: '温馨提示：浏览本网站请不要使用苹果自带的safari浏览器，需使用UC浏览器、谷歌浏览器等！'
    //   })
    // }
  },
  methods: {
    handleSelectMenu() {
    },
    tabClick(tab, event) {
      let params
      let paramsTmp = {
        active: tab.name,
        now: new Date().getTime()
      }
      if (this.$route.query.word) {
        params = {
          word: this.$route.query.word,
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
        <span v-if="!isAdmin">超级背单词功能升级中，非VIP用户请联系管理员试用，让你不需要看屏幕，不需要手指操作即可背单词的功能</span>
      </el-tab-pane>
      <el-tab-pane name="grammarListener" v-if="isLogin">
        <span slot="label"><i class=el-icon-school></i></span>
        <router-view name="grammarListener"></router-view>
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
        <span v-if="!bgm">背景音乐已关闭，请在个人中心打开</span>
        <el-card class="box-card" v-if="bgm">
          <iframe v-if="bgm===1" frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=450
                  src="https://music.163.com/outchain/player?type=0&id=57330170&auto=1&height=430"></iframe>
          <iframe v-if="bgm===2" frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=450
                  src="https://music.163.com/outchain/player?type=0&id=5295152134&auto=0&height=430"></iframe>
          <iframe v-if="bgm===3" frameborder="no" border="0" marginwidth="0" marginheight="0" width=100% height=450
                  src="https://music.163.com/outchain/player?type=0&id=5131166224&auto=0&height=430"></iframe>
        </el-card>
      </el-tab-pane>
    </el-tabs>
    <el-card class="box-card">
      <a href="https://beian.miit.gov.cn" style="color: #409EFF">粤ICP备2020080500号</a>
      <p>&nbsp;</p>
    </el-card>
  </div>
</template>
