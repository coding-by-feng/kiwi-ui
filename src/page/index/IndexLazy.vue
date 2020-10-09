<script>
import { getStore } from '@/util/store'
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
  data () {
    return {
      tabsWidth: window.innerWidth - 20 + 'px',
      query: this.$route.query
    }
  },
  watch: {},
  computed: {
    isLogin () {
      let accessToken = getStore({ name: 'access_token' })
      return !!accessToken
    }
  },
  mounted () {
    // window.onresize = () => {
    //   return (() => {
    //     this.tabsWidth = window.innerWidth - 20 + 'px'
    //   })()
    // }
    if (isSafari()) {
      this.$message({
        type: 'error',
        showClose: true,
        duration: 10000,
        message: '温馨提示：浏览本网站请不要使用苹果自带的safari浏览器，需使用UC浏览器、谷歌浏览器等！'
      })
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
    <el-tabs type="border-card" active-name="search">
      <el-tab-pane name="search">
        <span slot="label"><i class="el-icon-search"></i></span>
        <router-view name="search"></router-view>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>
