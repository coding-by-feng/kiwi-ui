<template>
    <div class="login-container"
         @keyup.enter.native="handleLogin">
        <div class="login-weaper">
            <div class="login-left">
                <p class="title">{{website.infoTitle}}</p>
                <p>©2020 v1.0</p>
            </div>
            <div class="login-border">
                <div class="login-main">
                    <userLogin v-if="activeName==='user'"></userLogin>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import '@/styles/login.scss'
import UserLogin from './UserLogin'
import { mapGetters } from 'vuex'

export default {
  name: 'login',
  components: {
    userLogin: UserLogin
  },
  data () {
    return {
      activeName: 'user'
    }
  },
  watch: {},
  created () {
  },
  mounted () {
  },
  computed: {
    ...mapGetters(['website'])
  },
  props: [],
  methods: {
    isMobile () {
      let flag = navigator.userAgent.match(/(phone|pad|pod|iPhone|iPod|ios|iPad|Android|Mobile|BlackBerry|IEMobile|MQQBrowser|JUC|Fennec|wOSBrowser|BrowserNG|WebOS|Symbian|Windows Phone)/i)
      return flag
    }
  }
}
</script>

