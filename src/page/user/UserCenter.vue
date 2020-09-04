<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'

export default {
  name: 'userCenter',
  data () {
    return {
      user: {
        userName: getStore({ name: 'user_name' }),
        pronunciationSource: getStore({ name: 'pronunciation_source' }),
        reviewType: getStore({ name: 'review_type' })
      }
    }
  },
  mounted () {
    if (!this.user.pronunciationSource) {
      setStore({
        name: 'pronunciation_source',
        content: 'Cambridge',
        type: 'local'
      })
    }
    if (!this.user.reviewType) {
      setStore({
        name: 'review_type',
        content: '2',
        type: 'local'
      })
    }
  },
  methods: {
    handleLoginOut () {
      this.$store.dispatch('LogOut').then(() => {
        this.$router.push({ path: website.noAuthPath.detail, query: { active: 'search' } })
        window.location.reload()
      }).catch(e => {
        console.error(e)
      })
    },
    pronunciationSourceChange (command) {
      setStore({
        name: 'pronunciation_source',
        content: command,
        type: 'local'
      })
      this.user.pronunciationSource = command
      window.location.reload()
    },
    reviewTypeChange (command) {
      setStore({
        name: 'review_type',
        content: command,
        type: 'local'
      })
      this.user.reviewType = command
      window.location.reload()
    },
    tranReviewType (val) {
      if (undefined === val) {
        setStore({
          name: 'review_type',
          content: '2',
          type: 'local'
        })
      }
      if (val === '1') {
        return '去除中文导播'
      } else if (val === '2') {
        return '附带中文导播'
      }
      return '异常'
    }
  }
}
</script>

<style>
</style>

<template>
  <div>
    <p>
      {{ user.userName }}
      <el-divider direction="vertical"></el-divider>
      <el-button type="info" size="mini" @click="handleLoginOut">
        <i class="el-icon-switch-button"></i>
      </el-button>
    </p>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="pronunciationSourceChange">
      {{ '发音来源：' + user.pronunciationSource }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
        <el-dropdown-item command="本地">本地</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-divider></el-divider>
    <el-dropdown size="mini"
                 split-button type="info" @command="reviewTypeChange">
      {{ `复习模式：${tranReviewType(user.reviewType)}` }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item :command="'1'">去除中文导播</el-dropdown-item>
        <el-dropdown-item :command="'2'">附带中文导播</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
  </div>
</template>

