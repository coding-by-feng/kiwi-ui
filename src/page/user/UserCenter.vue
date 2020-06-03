<script>
import website from '@/const/website'
import { getStore } from '@/util/store'

export default {
  name: 'userCenter',
  data () {
    return {
      user: {
        userName: getStore({ name: 'user_name' })
      }
    }
  },
  mounted () {},
  methods: {
    handleLoginOut () {
      this.$store.dispatch('LogOut').then(() => {
        this.$router.push({ path: website.noAuthPath.detail, query: { active: 'search' } })
        window.location.reload()
      }).catch(e => {
        console.error(e)
      })
    }
  }
}
</script>

<style>
</style>

<template>
    <div>
        <p>{{user.userName}}</p>
        <el-button @click="handleLoginOut">
            <i class="el-icon-switch-button"></i>
        </el-button>
    </div>
</template>

