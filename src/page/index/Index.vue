<script>
import { getStore } from '@/util/store'
import website from '@/const/website'

export default {
  data () {
    return {
      tabsWidth: window.innerWidth - 20 + 'px',
      activeName: this.$route.query.active ? this.$route.query.active : 'search',
      lazy: this.$route.query.lazy ? this.$route.query.lazy === 'y' : false,
      query: this.$route.query
    }
  },
  watch: {
    $route: function () {
      this.activeName = this.$route.query.active
      this.lazy = this.$route.query.lazy
    }
  },
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
  },
  methods: {
    handleSelectMenu () {
    },
    tabClick (tab, event) {
      console.log(tab.name)
      let lazyTmp = {}
      if (this.lazy === 'y') {
        lazyTmp = { lazy: this.lazy }
      }
      let params
      let paramsTmp = {
        ...lazyTmp,
        active: tab.name,
        now: new Date().getTime()
      }
      if (this.$route.query.word) {
        params = { word: this.$route.query.word, ...paramsTmp }
      } else {
        params = { ...paramsTmp }
      }
      let isActiveChange = JSON.stringify(this.query) === JSON.stringify(params)
      if (!isActiveChange) {
        this.$router.push({ path: website.noAuthPath.detail, query: params })
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
            <el-tab-pane name="starList" v-if="!lazy && isLogin">
                <span slot="label"><i class="el-icon-tickets"></i></span>
                <router-view name="starList"></router-view>
            </el-tab-pane>
            <el-tab-pane name="userCenter" v-if="!lazy && isLogin">
                <span slot="label"><i class="el-icon-user"></i></span>
                <router-view name="userCenter"></router-view>
            </el-tab-pane>
            <el-tab-pane name="login" v-if="!lazy && !isLogin">
                <span slot="label"><i class="el-icon-user"></i></span>
                <router-view name="userLogin"></router-view>
            </el-tab-pane>
            <el-tab-pane name="about" v-if="!lazy">
                <span slot="label"><i class="el-icon-postcard"></i></span>
                <router-view name="about"></router-view>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
