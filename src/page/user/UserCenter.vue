<script>
import website from '@/const/website'
import { getStore, setStore } from '@/util/store'

export default {
  name: 'userCenter',
  data () {
    return {
      user: {
        userName: getStore({ name: 'user_name' }),
        pronunciationSource: getStore({ name: 'pronunciation_source' })
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
    }
  }
}
</script>

<style>
</style>

<template>
  <div>
    <p>{{ user.userName }}</p>
    <el-dropdown size="mini"
                 split-button type="info" @command="pronunciationSourceChange">
      {{ '发音来源：' + user.pronunciationSource }}
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="Cambridge">Cambridge</el-dropdown-item>
        <el-dropdown-item command="本地">本地</el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    &nbsp;
    <el-button type="info" size="mini" @click="handleLoginOut">
      <i class="el-icon-switch-button"></i>
    </el-button>
  </div>
</template>

