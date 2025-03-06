<script>
import { randomLenNum } from '@/util/util'
import { mapGetters } from 'vuex'
import { oneClickRegister } from '@/api/login'

export default {
  name: 'userLogin',
  data () {
    return {
      loginForm: {
        username: 'test',
        password: '123456',
        code: '',
        randomStr: ''
      },
      passwordType: 'password',
      code: {
        src: '/code',
        value: '',
        len: 4,
        type: 'image'
      },
      loginRules: {
        username: [
          { required: true, message: 'Input username', trigger: 'blur' }
        ],
        password: [
          { required: true, message: 'Input password', trigger: 'blur' }
        ],
        code: [
          { required: true, message: 'Input verification code', trigger: 'blur' }
        ]
      },
    }
  },
  mounted () {
    this.refreshCode()
  },
  computed: {
    ...mapGetters(['tagWel'])
  },
  methods: {
    refreshCode () {
      this.loginForm.code = ''
      this.loginForm.randomStr = randomLenNum(this.code.len, true)
      this.code.type === 'text'
          ? (this.code.value = randomLenNum(this.code.len))
          : (this.code.src = `/code?randomStr=${this.loginForm.randomStr}`)
      return this.code.src
    },
    showPassword () {
      this.passwordType === '' ? (this.passwordType = 'password') : (this.passwordType = '')
    },
    handleLogin () {
      const that = this

      this.$refs.loginForm.validate(valid => {
        if (valid) {
          this.$store.dispatch('LoginByUsername', this.loginForm).then(() => {
            // that.$router.push({name: '登录页'});
            let word = this.$route.query.word
            if (word) {
              this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search', word: word } })
            } else {
              this.$router.push({ path: '/index/vocabulary/detail', query: { active: 'search' } })
            }
            window.location.reload()
          }).catch(e => {
            this.refreshCode()
            console.error(e)
          })
        }
      })
    },
    handleRegister () {
      oneClickRegister(this.loginForm.code, this.loginForm.randomStr).then(res => {
        this.$message.success({
          duration: 3000,
          message: '注册成功，密码默认123456,请直接登录'
        })
        this.passwordType = 'text'
        this.loginForm.username = res.data.data.username
        this.loginForm.password = res.data.data.password
        this.refreshCode()
      })
    }
  }
}
</script>

<template>
  <el-form class="login-form"
           status-icon
           ref="loginForm"
           :model="loginForm"
           size="mini"
           label-width="80px">
    <el-form-item prop="username" label="Username:" style="width: 80%">
      <el-input size="small"
                v-model="loginForm.username"
                placeholder="Input username">
        <i class="icon-yonghu"></i>
      </el-input>
      <el-alert
          v-if="loginForm.username==='test'"
          title="Default username 'test' for feature testing, please input verification code to log in."
          type="info">
      </el-alert>
    </el-form-item>
    <el-form-item prop="password" label="Password:" style="width: 80%">
      <el-input size="small"
                :type="passwordType"
                v-model="loginForm.password"
                placeholder="Input password">
      </el-input>
      <el-alert
          v-if="loginForm.username==='test'"
          title="Default passcode '123456' for feature testing."
          type="info">
      </el-alert>
    </el-form-item>
    <el-form-item prop="code" label="Verification:" style="width: 100%">
      <el-row :span="24">
        <el-col :span="10">
          <el-input size="small"
                    @keyup.enter.native="handleLogin"
                    :maxlength="code.len"
                    v-model="loginForm.code"
                    auto-complete="off"
                    placeholder="Input Verification code">
            <i class="icon-yanzhengma"></i>
          </el-input>
        </el-col>
        <el-col :span="10">
          <div class="login-code">
            <img :src="code.src"
                 class="login-code-img"
                 @click="refreshCode" alt="Refresh"/>
          </div>
        </el-col>
      </el-row>
    </el-form-item>
    <el-button type="info" @click="handleLogin">Login</el-button>
    <el-button @click="handleRegister">Once-click Registration</el-button>
  </el-form>
</template>
