<script>
export default {
  data () {
    return {
      isLogin: true,
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
  mounted () {
    window.onresize = () => {
      return (() => {
        this.tabsWidth = window.innerWidth - 20 + 'px'
      })()
    }
  },
  methods: {
    handleSelectMenu () {
    },
    tabClick (tab, event) {
      let lazyTmp = {}
      if (this.lazy === 'y') {
        lazyTmp = { lazy: this.lazy }
      }
      let params
      let paramsTmp = {
        ...lazyTmp,
        active: tab.name
      }
      if (this.$route.query.word) {
        params = { ...paramsTmp, word: this.$route.query.word }
      } else {
        params = { ...paramsTmp }
      }
      let isActiveChange = JSON.stringify(this.query) === JSON.stringify(params)
      if (!isActiveChange) {
        this.$router.push({ path: '/index/vocabulary/detail', query: params })
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
            <el-tab-pane name="login">
                <span slot="label"><i class="el-icon-user"></i></span>
                <router-view name="userLogin"></router-view>
            </el-tab-pane>
            <el-tab-pane name="about">
                <span slot="label"><i class="el-icon-postcard"></i></span>
            </el-tab-pane>
        </el-tabs>
    </div>
</template>
